"use client";

// TTS server-side (voces neuronales de Microsoft Edge, via /api/tts) en vez
// de la Web Speech API del navegador: mas natural, no lee emojis (se sacan
// en el servidor), y siempre es la MISMA voz para el mismo profesor (no
// depende de que voces tenga instaladas el dispositivo del alumno).

let currentAudio: HTMLAudioElement | null = null;

export async function speakText(
  text: string,
  voiceName: string,
  onStart?: () => void,
  onEnd?: () => void
) {
  stopSpeaking();

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: voiceName }),
    });

    if (!res.ok) {
      onEnd?.();
      return;
    }

    const blob = await res.blob();
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
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
