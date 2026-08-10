"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { SPRING_UI } from "@/lib/motion";

// Música ambiente estilo "Los Sims": un arpegio de marimba en escala
// pentatónica mayor + un pad suave de acordes, generados 100% por código
// con Tone.js (sin ninguna pista con derechos de autor, gratis, sin
// registro). Los navegadores bloquean el audio automático, así que el
// motor de sonido recién se arma cuando el usuario toca el botón.
export default function AmbientMusicToggle() {
  const [playing, setPlaying] = useState(false);
  const initializedRef = useRef(false);

  async function ensureInitialized() {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const Tone = await import("tone");

    const reverb = new Tone.Reverb({ decay: 3, wet: 0.35 }).toDestination();

    const marimba = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.05, release: 0.6 },
      volume: -14,
    }).connect(reverb);

    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 1.2, decay: 0.5, sustain: 0.6, release: 2 },
      volume: -24,
    }).connect(reverb);

    // Escala pentatónica mayor de Do: siempre suena alegre, no tiene
    // notas "tristes" sin importar el orden en que caigan.
    const scale = ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5"];
    const chords: string[][] = [
      ["C3", "E3", "G3"],
      ["A2", "C3", "E3"],
      ["F2", "A2", "C3"],
      ["G2", "B2", "D3"],
    ];
    let chordIndex = 0;

    new Tone.Loop((time) => {
      pad.triggerAttackRelease(chords[chordIndex % chords.length], "2n", time);
      chordIndex += 1;
    }, "2n").start(0);

    new Tone.Loop((time) => {
      if (Math.random() < 0.72) {
        const note = scale[Math.floor(Math.random() * scale.length)];
        marimba.triggerAttackRelease(note, "8n", time);
      }
    }, "4n").start("2n");

    Tone.getTransport().bpm.value = 92;
  }

  async function toggle() {
    const Tone = await import("tone");
    if (Tone.getContext().state !== "running") await Tone.start();
    await ensureInitialized();

    if (playing) {
      Tone.getTransport().pause();
      setPlaying(false);
    } else {
      Tone.getTransport().start();
      setPlaying(true);
    }
  }

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={SPRING_UI}
      aria-label={playing ? "Pausar música" : "Reproducir música"}
      title={playing ? "Pausar música" : "Reproducir música"}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 text-xl text-white backdrop-blur-md transition-colors hover:bg-white/35"
    >
      {playing ? "🎵" : "🔇"}
    </motion.button>
  );
}
