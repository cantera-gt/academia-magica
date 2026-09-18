"use client";

// Efectos de sonido sintetizados con Web Audio API. Nada de archivos de
// audio externos: se generan al vuelo con osciladores simples, asi que no
// dependemos de assets ni de licencias, y el bundle no crece nada.
// Requieren un gesto del usuario (click) antes de sonar en la mayoria de
// navegadores -- se llaman siempre desde un handler de click, asi que va bien.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = "sine",
  peakGain = 0.18
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ac.currentTime + start);
  gain.gain.linearRampToValueAtTime(peakGain, ac.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.03);
}

// Acierto: arpegio corto ascendente. Con mas combo, arpegio mas largo y
// brillante -- el sonido "premia" mas cuanto mejor va la racha.
export function playCorrectSound(combo = 0) {
  const ac = getCtx();
  if (!ac) return;
  const base = 523.25; // Do5
  const notes =
    combo >= 5
      ? [base, base * 1.26, base * 1.5, base * 2]
      : combo >= 2
        ? [base, base * 1.26, base * 1.5]
        : [base, base * 1.5];
  notes.forEach((f, i) => tone(ac, f, i * 0.075, 0.22, "triangle", 0.16));
}

// Incorrecto: dos notas graves y breves, sin ser desagradable ni punitivo.
export function playIncorrectSound() {
  const ac = getCtx();
  if (!ac) return;
  tone(ac, 220, 0, 0.16, "sine", 0.12);
  tone(ac, 174.6, 0.1, 0.22, "sine", 0.1);
}

// Subida de nivel: pequena fanfarria de 4 notas.
export function playLevelUpSound() {
  const ac = getCtx();
  if (!ac) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(ac, f, i * 0.09, 0.28, "triangle", 0.18)
  );
}

// --- Recreo -----------------------------------------------------------
// Los diez minijuegos no sonaban nada, mientras el motor de ejercicios si.
// Para un nino de 4 a 10 anos eso hacia que el recreo se sintiera mas
// muerto que la clase, justo al reves de lo que deberia.

// Toque corto al interactuar: voltear una carta, pisar una casilla, atrapar.
export function playTapSound() {
  const ac = getCtx();
  if (!ac) return;
  tone(ac, 660, 0, 0.07, "triangle", 0.09);
}

// Victoria: fanfarria de cuatro notas, mas larga y brillante que un acierto
// suelto, para que ganar se note distinto de responder bien.
export function playWinSound() {
  const ac = getCtx();
  if (!ac) return;
  const base = 523.25; // Do5
  [base, base * 1.26, base * 1.5, base * 2].forEach((f, i) =>
    tone(ac, f, i * 0.09, 0.3, "triangle", 0.17)
  );
  tone(ac, base * 2, 0.36, 0.45, "sine", 0.12);
}

// Derrota: descendente y breve. Que se entienda que se acabo, sin castigar.
export function playLoseSound() {
  const ac = getCtx();
  if (!ac) return;
  [392, 330, 262].forEach((f, i) => tone(ac, f, i * 0.1, 0.22, "sine", 0.11));
}

// Record batido: campanilla sobre la fanfarria. Suena a logro, no a punto.
export function playRecordSound() {
  const ac = getCtx();
  if (!ac) return;
  [1046.5, 1318.5, 1568].forEach((f, i) =>
    tone(ac, f, 0.45 + i * 0.07, 0.35, "triangle", 0.14)
  );
}
