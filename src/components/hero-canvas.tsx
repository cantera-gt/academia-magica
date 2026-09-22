"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HEROES, layerSrc, type HeroId, type OutfitId } from "@/lib/heroes";

/**
 * Dibuja el personaje apilando sus capas y tiñendo cada prenda.
 *
 * Las capas pintables son neutras (grises con luces y sombras), asi que teñir
 * es multiplicar cada canal por el color elegido. Eso conserva el modelado y
 * mantiene los brillos, que es justo lo que se pierde al pintar por encima.
 *
 * Las capas fijas (cabeza, piel) se dibujan tal cual.
 */

function multiply(
  source: HTMLImageElement,
  w: number,
  h: number,
  color: string | null
): HTMLCanvasElement | null {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);
  if (!color) return cv;

  const cr = parseInt(color.slice(1, 3), 16) / 255;
  const cg = parseInt(color.slice(3, 5), 16) / 255;
  const cb = parseInt(color.slice(5, 7), 16) / 255;

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    d[i] = d[i] * cr;
    d[i + 1] = d[i + 1] * cg;
    d[i + 2] = d[i + 2] * cb;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

export type HeroCanvasProps = {
  hero: HeroId;
  outfit: OutfitId;
  colors: Record<string, string>;
  onPickPiece?: (pieceId: string) => void;
  className?: string;
};

export default function HeroCanvas({
  hero,
  outfit,
  colors,
  onPickPiece,
  className,
}: HeroCanvasProps) {
  const spec = HEROES[hero].outfits[outfit];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const paintedRef = useRef<Record<string, HTMLCanvasElement>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    imagesRef.current = {};
    paintedRef.current = {};
    Promise.all(
      spec.layers.map(
        (layer) =>
          new Promise<[string, HTMLImageElement]>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve([layer.id, img]);
            img.onerror = () => reject(new Error(layer.file));
            img.src = layerSrc(hero, outfit, layer.file);
          })
      )
    )
      .then((pairs) => {
        if (cancelled) return;
        imagesRef.current = Object.fromEntries(pairs);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hero, outfit, spec]);

  useEffect(() => {
    if (!ready) return;
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    ctx.clearRect(0, 0, spec.width, spec.height);
    for (const layer of spec.layers) {
      const img = imagesRef.current[layer.id];
      if (!img) continue;
      const color = layer.label === null ? null : colors[layer.id] ?? layer.color ?? null;
      const key = `${layer.id}:${color ?? "base"}`;
      let painted = paintedRef.current[key];
      if (!painted) {
        const made = multiply(img, spec.width, spec.height, color);
        if (!made) continue;
        paintedRef.current[key] = made;
        painted = made;
      }
      ctx.drawImage(painted, 0, 0);
    }
  }, [ready, colors, spec]);

  /** Que prenda hay bajo el dedo: la capa pintable mas alta con pixel opaco. */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onPickPiece || !ready) return;
      const cv = canvasRef.current;
      if (!cv) return;
      const rect = cv.getBoundingClientRect();
      const x = Math.floor(((e.clientX - rect.left) / rect.width) * spec.width);
      const y = Math.floor(((e.clientY - rect.top) / rect.height) * spec.height);
      if (x < 0 || y < 0 || x >= spec.width || y >= spec.height) return;

      for (let i = spec.layers.length - 1; i >= 0; i--) {
        const layer = spec.layers[i];
        if (layer.label === null) continue;
        const color = colors[layer.id] ?? layer.color ?? null;
        const painted = paintedRef.current[`${layer.id}:${color ?? "base"}`];
        if (!painted) continue;
        const ctx = painted.getContext("2d", { willReadFrequently: true });
        if (!ctx) continue;
        if (ctx.getImageData(x, y, 1, 1).data[3] > 40) {
          onPickPiece(layer.id);
          return;
        }
      }
    },
    [onPickPiece, ready, spec, colors]
  );

  return (
    <canvas
      ref={canvasRef}
      width={spec.width}
      height={spec.height}
      onClick={handleClick}
      className={className}
      style={{ height: "100%", width: "auto", cursor: onPickPiece ? "pointer" : "default" }}
      aria-label={`Personaje ${HEROES[hero].label}`}
    />
  );
}
