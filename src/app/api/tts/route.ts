import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { stripMarkdown } from "@/lib/text-sanitize";

// Genera audio con voces neuronales gratuitas (motor "Leer en voz alta" de
// Microsoft Edge, sin necesidad de API key ni registro). Corre en Node.js
// (no en el runtime "edge" de Vercel) porque msedge-tts usa APIs de Node.
export const runtime = "nodejs";
export const maxDuration = 30;

// Lista blanca de voces validas que usamos en la app, para no dejar que
// cualquiera use este endpoint como proxy de texto-a-voz libre.
const ALLOWED_VOICES = new Set([
  "es-ES-ElviraNeural",
  "es-ES-AlvaroNeural",
  "es-ES-XimenaNeural",
  "en-GB-RyanNeural",
  "es-AR-ElenaNeural",
  "es-MX-JorgeNeural",
  "es-US-PalomaNeural",
  "es-GT-MartaNeural",
  "es-CL-LorenzoNeural",
  "de-DE-KatjaNeural",
  "de-DE-ConradNeural",
]);

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
  "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
};

function blankify(text: string): string {
  // Espacios en blanco de ejercicios "completa la palabra/frase/serie"
  // escritos con guiones bajos (ej "El gato ___ (subir) al arbol" o
  // "2, 4, 6, 8, __"): sin este paso el motor de voz los lee como
  // "guion bajo" en vez de marcar la pausa donde va la respuesta.
  // Corre ANTES que stripMarkdown para que su regex de enfasis con "__"
  // no se coma dos espacios en blanco distintos como si fueran un solo
  // bloque en negrita cuando hay mas de un hueco en el mismo texto.
  return text.replace(/_{2,}/g, " espacio en blanco ");
}

function mathify(text: string): string {
  // Convierte notacion matematica en frases que un motor de voz lee bien.
  // Sin esto, simbolos matematicos, la barra de fraccion/division, los
  // numeros decimales o los exponentes se leen literalmente (o se leen
  // mal, ej como una hora) en vez de sonar como una frase.
  let out = text;

  // Exponentes con digitos en superindice (ej "10" + superindice 4 -> "10 a la 4")
  out = out.replace(/(\d)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_m, base: string, sup: string) => {
    const digits = sup.split("").map((ch) => SUPERSCRIPT_DIGITS[ch] ?? "").join("");
    return `${base} a la ${digits}`;
  });

  // Porcentaje ("20%", "10 %", "20,5%") -> "20 por ciento". Va ANTES de las
  // reglas de decimales y division para que el numero no quede partido.
  out = out.replace(/(\d+(?:[.,]\d+)?)\s?%/g, "$1 por ciento");

  // Separador de miles ("1.000.000", "1.500"): se quita el punto para que
  // se lea como un solo numero ("un millon") y no como si fueran decimales.
  // Dos pasadas porque los grupos se solapan (1.000.000).
  out = out.replace(/(\d)\.(\d{3})\b/g, "$1$2");
  out = out.replace(/(\d)\.(\d{3})\b/g, "$1$2");

  // Decimales ("1.20", "1,20", "0.5") -> "1 coma 20", "0 coma 5". Escribir
  // la parte decimal como numero suelto hace que el motor la lea entera
  // ("uno coma veinte"); si se deja pegada a la coma la lee digito a
  // digito ("uno coma dos cero"), que es como sonaba antes.
  out = out.replace(/(\d+)[.,](\d{1,2})\b/g, "$1 coma $2");

  // Division escrita con espacios alrededor de la barra ("56 / 8") -> "56
  // dividido entre 8". Va ANTES que la regla de fracciones de abajo (que
  // no lleva espacios) para no pisarse con ella.
  out = out.replace(/(\d+)\s+\/\s+(\d+)/g, "$1 dividido entre $2");

  // Resta escrita "19 - 10" -> "19 menos 10". Sin esto el motor de voz la
  // lee como un rango ("de 19 a 10").
  out = out.replace(/(\d+)\s+-\s+(\d+)/g, "$1 menos $2");

  // Division (simbolo unicode U+00F7): 23 (div) 5 -> 23 dividido por 5
  out = out.replace(/÷/g, " dividido por ");

  // Multiplicacion escrita como "x" o "×" entre numeros: 5 x 10 -> 5 por 10
  out = out.replace(/(\d)\s*[x×]\s*(\d)/gi, "$1 por $2");

  // Fracciones simples tipo 1/2, 3/4 (sin espacios) -> 1 de 2, 3 de 4
  out = out.replace(/(\d+)\/(\d+)/g, "$1 de $2");

  // Igual: lo hacemos explicito para que no se coma el simbolo
  out = out.replace(/=/g, " igual a ");

  return out;
}

function despellify(text: string): string {
  // Palabras separadas en silabas con guion para mostrar pronunciacion
  // (ej "GU-ten MOR-gen"): un motor de voz lee ese guion literalmente
  // como la palabra "guion", asi que lo cambiamos por un espacio para
  // que suene como una pausa natural entre silabas.
  return text.replace(/([A-Za-zÀ-ÿ])-(?=[A-Za-zÀ-ÿ])/g, "$1 ");
}

function stripUnspeakable(text: string): string {
  // Saca emojis, simbolos raros y markdown: algunos motores de voz los
  // "leen" en vez de ignorarlos (ej: cohete, ** -> "asterisco
  // asterisco", GU-ten -> "GU guion ten"). Tambien recorta espacios
  // extra que quedan despues de sacar todo eso.
  return despellify(mathify(stripMarkdown(blankify(text))))
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface Segment {
  text: string;
  voice: string;
}

// En Ingles y Aleman los enunciados son frases en espanol con la palabra
// extranjera entre comillas (ej: ¿Que animal sabe «swim» (nadar)?). Si se
// lee todo con la voz extranjera, el espanol suena a palabras inventadas;
// si se lee todo con la voz espanola, la palabra extranjera se pronuncia
// mal. Por eso se parte el texto: lo entrecomillado va con la voz del
// idioma que se esta aprendiendo y el resto con la voz en espanol.
function splitByQuotedLanguage(text: string, mainVoice: string, quotedVoice: string): Segment[] {
  const segments: Segment[] = [];
  const re = /«([^»]+)»|"([^"]+)"/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const before = text.slice(last, match.index);
    if (before.trim()) segments.push({ text: before.trim(), voice: mainVoice });
    const inner = match[1] ?? match[2] ?? "";
    if (inner.trim()) segments.push({ text: inner.trim(), voice: quotedVoice });
    last = match.index + match[0].length;
  }

  const rest = text.slice(last);
  if (rest.trim()) segments.push({ text: rest.trim(), voice: mainVoice });

  return segments.length > 0 ? segments : [{ text, voice: mainVoice }];
}

async function synthesize(text: string, voice: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  const chunks: Buffer[] = [];
  for await (const chunk of audioStream as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  try {
    const { text, voice, quotedVoice } = (await req.json()) as {
      text?: string;
      voice?: string;
      quotedVoice?: string;
    };

    if (!text || !voice || !ALLOWED_VOICES.has(voice)) {
      return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 });
    }

    const clean = stripUnspeakable(text).slice(0, 600);
    if (!clean) {
      return NextResponse.json({ error: "Nada para leer" }, { status: 400 });
    }

    // Voz distinta para lo que va entre comillas (palabras del idioma que
    // se esta aprendiendo). Solo se usa si viene en la peticion, esta en la
    // lista blanca y es distinta de la principal.
    const useQuotedVoice =
      typeof quotedVoice === "string" &&
      ALLOWED_VOICES.has(quotedVoice) &&
      quotedVoice !== voice;

    const segments = useQuotedVoice
      ? splitByQuotedLanguage(clean, voice, quotedVoice as string)
      : [{ text: clean, voice }];

    const buffers: Buffer[] = [];
    for (const segment of segments) {
      buffers.push(await synthesize(segment.text, segment.voice));
    }
    const audio = Buffer.concat(buffers);

    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    // Log con detalle para poder diagnosticar desde los Runtime Logs de
    // Vercel sin exponer detalles internos al alumno.
    console.error("TTS error", err);
    return NextResponse.json({ error: "No se pudo generar el audio" }, { status: 500 });
  }
}
