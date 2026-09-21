"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MODELS, layerSrc, type VehicleModel } from "@/lib/vehicle";

/**
 * Dibuja el coche apilando sus capas PNG y tiñendo las que el nino ha pintado.
 *
 * El teñido NO pinta el color encima: convierte cada pixel a HSL, le pone el
 * tono elegido y conserva su luminancia, que es donde vive el volumen del
 * render. Ademas solo toca los pixeles que ya tenian color (saturacion por
 * encima de SAT_MIN), asi que las franjas blancas, los cromados grises y los
 * neumaticos negros se quedan intactos.
 */

const SAT_MIN = 0.2;

type Hsl = { h: number; s: number; l: number };

function rgbToHsl(r: number, g: number, b: number): Hsl {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (l < 0.5 ? mx + mn : 2 - mx - mn);
  let h: number;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h /= 6;
  if (h < 0) h += 1;
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h * 6;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function hexToHsl(hex: string): Hsl {
  return rgbToHsl(
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  );
}

/** Devuelve un canvas con la capa teñida. Si color es null, la capa tal cual. */
function tintLayer(
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

  const target = hexToHsl(color);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const { h: ph, s: ps, l: pl } = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (ps < SAT_MIN) continue; // blanco, gris o negro: no se tiñe
    const ns = Math.min(1, ps * 0.35 + target.s * 0.75);
    const [r, g, b] = hslToRgb(target.h, ns, pl);
    void ph;
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

export type VehicleCanvasProps = {
  model: VehicleModel;
  colors: Record<string, string>;
  /** Se llama con el id de la zona que el nino ha tocado */
  onPickZone?: (zoneId: string) => void;
  className?: string;
};

export default function VehicleCanvas({
  model,
  colors,
  onPickZone,
  className,
}: VehicleCanvasProps) {
  const spec = MODELS[model];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const tintedRef = useRef<Record<string, HTMLCanvasElement>>({});
  const [ready, setReady] = useState(false);

  // Cargar las capas del modelo actual.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    imagesRef.current = {};
    tintedRef.current = {};
    Promise.all(
      spec.layers.map(
        (layer) =>
          new Promise<[string, HTMLImageElement]>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve([layer.id, img]);
            img.onerror = () => reject(new Error(layer.file));
            img.src = layerSrc(spec.id, layer);
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
  }, [spec]);

  // Redibujar cuando cambian los colores.
  useEffect(() => {
    if (!ready) return;
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    ctx.clearRect(0, 0, spec.width, spec.height);
    for (const layer of spec.layers) {
      const img = imagesRef.current[layer.id];
      if (!img) continue;
      const color = colors[layer.id] ?? null;
      const key = `${layer.id}:${color ?? "base"}`;
      let painted = tintedRef.current[key];
      if (!painted) {
        const made = tintLayer(img, spec.width, spec.height, color);
        if (!made) continue;
        tintedRef.current[key] = made;
        painted = made;
      }
      ctx.drawImage(painted, 0, 0);
    }
  }, [ready, colors, spec]);

  /** Que zona hay bajo el dedo: la capa pintable mas alta con pixel opaco. */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onPickZone || !ready) return;
      const cv = canvasRef.current;
      if (!cv) return;
      const rect = cv.getBoundingClientRect();
      const x = Math.floor(((e.clientX - rect.left) / rect.width) * spec.width);
      const y = Math.floor(((e.clientY - rect.top) / rect.height) * spec.height);
      if (x < 0 || y < 0 || x >= spec.width || y >= spec.height) return;

      for (let i = spec.layers.length - 1; i >= 0; i--) {
        const layer = spec.layers[i];
        if (layer.label === null) continue;
        const key = `${layer.id}:${colors[layer.id] ?? "base"}`;
        const painted = tintedRef.current[key];
        if (!painted) continue;
        const ctx = painted.getContext("2d", { willReadFrequently: true });
        if (!ctx) continue;
        const alpha = ctx.getImageData(x, y, 1, 1).data[3];
        if (alpha > 40) {
          onPickZone(layer.id);
          return;
        }
      }
    },
    [onPickZone, ready, spec, colors]
  );

  return (
    <canvas
      ref={canvasRef}
      width={spec.width}
      height={spec.height}
      onClick={handleClick}
      className={className}
      style={{ width: "100%", height: "auto", cursor: onPickZone ? "pointer" : "default" }}
      aria-label={`Coche ${spec.label}`}
    />
  );
}
