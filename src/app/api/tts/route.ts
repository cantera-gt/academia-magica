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

function mathify(text: string): string {
    // Convierte notacion matematica en frases que un motor de voz lee bien.
  // Sin esto, simbolos matematicos, la barra de fracciones o los exponentes
  // se leen literalmente (o se saltean raro) en vez de sonar como una frase.
  let out = text;

  // Exponentes con digitos en superindice (ej "10" + superindice 4 -> "10 a la 4")
  out = out.replace(/(\d)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_m, base: string, sup: string) => {
        const digits = sup.split("").map((ch) => SUPERSCRIPT_DIGITS[ch] ?? "").join("");
        return `${base} a la ${digits}`;
  });

  // Division (simbolo unicode U+00F7): 23 (div) 5 -> 23 dividido por 5
  out = out.replace(/÷/g, " dividido por ");

  // Multiplicacion escrita como "x" entre numeros: 5 x 10 -> 5 por 10
  out = out.replace(/(\d)\s*x\s*(\d)/gi, "$1 por $2");

  // Fracciones simples tipo 1/2, 3/4 -> 1 sobre 2, 3 sobre 4
  out = out.replace(/(\d+)\/(\d+)/g, "$1 sobre $2");

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
  // "leen" en vez de ignorarlos (ej: 🚀 -> "cohete", ** -> "asterisco
  // asterisco", GU-ten -> "GU guion ten"). Tambien recorta espacios
  // extra que quedan despues de sacar todo eso.
  return despellify(mathify(stripMarkdown(text)))
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
}

export async function POST(req: NextRequest) {
    try {
          const { text, voice } = (await req.json()) as { text?: string; voice?: string };

      if (!text || !voice || !ALLOWED_VOICES.has(voice)) {
              return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 });
      }

      const clean = stripUnspeakable(text).slice(0, 600);
          if (!clean) {
                  return NextResponse.json({ error: "Nada para leer" }, { status: 400 });
          }

      const tts = new MsEdgeTTS();
          await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
          const { audioStream } = tts.toStream(clean);

      const chunks: Buffer[] = [];
          for await (const chunk of audioStream as AsyncIterable<Buffer>) {
                  chunks.push(chunk);
          }
          const audio = Buffer.concat(chunks);

      return new NextResponse(audio, {
              status: 200,
              headers: {
                        "Content-Type": "audio/mpeg",
                        "Cache-Control": "no-store",
              },
      });
    } catch (err) {
          console.error("TTS error", err);
          return NextResponse.json({ error: "No se pudo generar el audio" }, { status: 500 });
    }
}
