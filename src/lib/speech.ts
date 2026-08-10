"use client";

// Utilidad chica para hablar texto con la Web Speech API del navegador.
// No es un servicio de voces "premium": depende de las voces instaladas en
// el dispositivo/navegador del alumno. Buscamos primero por nombre (hints
// tipo "Mónica", "Google español") y si no hay ninguna, caemos a cualquier
// voz que matchee el idioma, y si no hay ninguna del idioma, a la voz por
// defecto del navegador.
export function speakText(
  text: string,
  lang: string,
  voiceHints: string[],
  onStart?: () => void,
  onEnd?: () => void
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const baseLang = lang.split("-")[0];

  let chosen =
    voices.find((v) => voiceHints.some((h) => v.name.includes(h))) ??
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith(baseLang)) ??
    null;

  if (chosen) utterance.voice = chosen;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
