"use client";

// TTS server-side (voces neuronales de Microsoft Edge, via /api/tts) en vez
// de la Web Speech API del navegador: mas natural, no lee emojis (se sacan
// en el servidor), y siempre es la MISMA voz para el mismo profesor (no
// depende de que voces tenga instaladas el dispositivo del alumno).

let currentAudio: HTMLAudioElement | null = null;

// Numero de "ronda" de habla: se incrementa cada vez que se pide hablar
// algo nuevo o que se corta el audio. Si un pedido anterior (todavia
// esperando la respuesta del servidor) termina de resolver DESPUES de que
// arranco uno nuevo, se descarta en vez de reproducirse: sin esto, dos
// toques rapidos del boton de audio (muy comun con chicos impacientes)
// podian terminar con dos audios reproduciendose superpuestos ("eco").
let speechGeneration = 0;

export async function speakText(
  text: string,
  voiceName: string,
  onStart?: () => void,
  onEnd?: () => void
) {
  stopSpeaking();
  const myGeneration = speechGeneration;

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: voiceName }),
    });

    // Ya se pidio hablar otra cosa mientras esperabamos esta respuesta:
    // descartamos este audio para no superponerlo con el nuevo.
    if (myGeneration !== speechGeneration) return;

    if (!res.ok) {
      onEnd?.();
      return;
    }

    const blob = await res.blob();

    if (myGeneration !== speechGeneration) return;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onplay = () => onStart?.();
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      onEnd?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      onEnd?.();
    };

    await audio.play();
  } catch {
    onEnd?.();
  }
}

export function stopSpeaking() {
  speechGeneration++;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
