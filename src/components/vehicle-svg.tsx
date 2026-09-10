"use client";

import { motion } from "framer-motion";
import {
  chasisOf,
  type PaintRegion,
  type VehicleDesign,
} from "@/lib/vehicle";

/**
 * El coche del garaje, dibujado por piezas en SVG.
 *
 * No es una imagen: cada region es una forma vectorial propia con su color, y
 * al tocarla avisa al padre con onSelectRegion para que abra la paleta. Por eso
 * se puede pintar pieza a pieza sin necesidad de un PNG por cada combinacion.
 *
 * Las regiones pequeñas (aleron, pegatina, neon, faros) llevan ademas un
 * circulo invisible de radio generoso encima: un dedo de 4 años no acierta un
 * trazo de 6 px, pero si un area de 50 px.
 */

const HIT_RADIUS = 26;

export default function VehicleSvg({
  design,
  selectedRegion,
  onSelectRegion,
  driving = false,
}: {
  design: VehicleDesign;
  selectedRegion?: PaintRegion | null;
  onSelectRegion?: (region: PaintRegion) => void;
  driving?: boolean;
}) {
  const spec = chasisOf(design.parts.chasis);
  const c = design.colors;
  const p = design.parts;

  const pick = (region: PaintRegion) => (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onSelectRegion?.(region);
  };

  // Borde blanco grueso sobre la region elegida, para que se vea cual se esta
  // pintando sin cambiarle el color.
  const sel = (region: PaintRegion) =>
    selectedRegion === region
      ? { stroke: "#ffffff", strokeWidth: 5, strokeDasharray: "10 6" }
      : { stroke: "#0f172a", strokeWidth: 3 };

  const clickable = onSelectRegion ? "cursor-pointer" : "";

  return (
    <svg viewBox="0 0 400 240" className="w-full select-none" role="img" aria-label="Mi coche">
      <defs>
        {/* Acabados de pintura: se superponen a la carroceria sin taparla */}
        <linearGradient id="acabadoBrillante" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="acabadoMetalizado" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="75%" stopColor="#000000" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="acabadoPerlado" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.6" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="65%" stopColor="#f5d0fe" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0.45" />
        </linearGradient>

        <filter id="neonBlur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="haloBlur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <radialGradient id="lampGlow">
          <stop offset="0%" stopColor="#fffbe6" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>

        <clipPath id="bodyClip">
          <path d={spec.body} />
        </clipPath>
      </defs>

      {/* Suelo */}
      <ellipse cx="205" cy={spec.underY + 14} rx="176" ry="12" fill="#0f172a" opacity="0.12" />

      {/* ---------------- NEON (detras de todo) ---------------- */}
      {p.neon === "bajo" && (
        <g className={clickable} onClick={pick("neon")}>
          <ellipse
            cx="205"
            cy={spec.underY + 8}
            rx="150"
            ry="16"
            fill={c.neon}
            opacity="0.85"
            filter="url(#neonBlur)"
          />
          <rect
            x="55"
            y={spec.underY - 12}
            width="300"
            height={40}
            fill="transparent"
            pointerEvents="all"
          />
        </g>
      )}
      {p.neon === "halo" && (
        <g className={clickable} onClick={pick("neon")}>
          <path
            d={spec.body}
            fill="none"
            stroke={c.neon}
            strokeWidth="14"
            opacity="0.9"
            filter="url(#haloBlur)"
          />
          <ellipse
            cx="205"
            cy={spec.underY + 8}
            rx="140"
            ry="13"
            fill={c.neon}
            opacity="0.6"
            filter="url(#neonBlur)"
          />
          <path d={spec.body} fill="none" stroke="transparent" strokeWidth="26" pointerEvents="stroke" />
        </g>
      )}

      <motion.g
        animate={driving ? { y: [0, -3, 0, -2, 0] } : { y: 0 }}
        transition={driving ? { duration: 0.35, repeat: Infinity } : { duration: 0.2 }}
      >
        {/* ---------------- ALERON (detras de la carroceria) ---------------- */}
        {p.aleron !== "ninguno" && (
          <g className={clickable} onClick={pick("aleron")}>
            {p.aleron === "pequeno" && (
              <path
                d={`M${spec.spoiler.x - 4},${spec.spoiler.y} l30,0 l0,-13 l-30,0 z`}
                fill={c.aleron}
                {...sel("aleron")}
                strokeLinejoin="round"
              />
            )}
            {p.aleron === "carreras" && (
              <>
                <rect
                  x={spec.spoiler.x - 12}
                  y={spec.spoiler.y - 30}
                  width="52"
                  height="10"
                  rx="4"
                  fill={c.aleron}
                  {...sel("aleron")}
                />
                <rect
                  x={spec.spoiler.x + 4}
                  y={spec.spoiler.y - 27}
                  width="7"
                  height="29"
                  fill={c.aleron}
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />
                <rect
                  x={spec.spoiler.x + 30}
                  y={spec.spoiler.y - 27}
                  width="7"
                  height="29"
                  fill={c.aleron}
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />
              </>
            )}
            {p.aleron === "alas" && (
              <>
                <rect
                  x={spec.spoiler.x - 10}
                  y={spec.spoiler.y - 38}
                  width="56"
                  height="9"
                  rx="4"
                  fill={c.aleron}
                  {...sel("aleron")}
                />
                <rect
                  x={spec.spoiler.x - 4}
                  y={spec.spoiler.y - 22}
                  width="46"
                  height="9"
                  rx="4"
                  fill={c.aleron}
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />
                <rect
                  x={spec.spoiler.x + 4}
                  y={spec.spoiler.y - 35}
                  width="7"
                  height="37"
                  fill={c.aleron}
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />
                <rect
                  x={spec.spoiler.x + 28}
                  y={spec.spoiler.y - 35}
                  width="7"
                  height="37"
                  fill={c.aleron}
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />
              </>
            )}
            <circle
              cx={spec.spoiler.x + 14}
              cy={spec.spoiler.y - 18}
              r={HIT_RADIUS}
              fill="transparent"
              pointerEvents="all"
            />
          </g>
        )}

        {/* ---------------- CARROCERIA ---------------- */}
        <path
          d={spec.body}
          fill={c.carroceria}
          {...sel("carroceria")}
          strokeLinejoin="round"
          className={clickable}
          onClick={pick("carroceria")}
        />

        {/* Acabado de la pintura: capa decorativa, no intercepta clics */}
        {p.acabado !== "mate" && (
          <path
            d={spec.body}
            fill={
              p.acabado === "metalizado"
                ? "url(#acabadoMetalizado)"
                : p.acabado === "perlado"
                  ? "url(#acabadoPerlado)"
                  : "url(#acabadoBrillante)"
            }
            pointerEvents="none"
          />
        )}

        {/* ---------------- FRANJA (segundo tono) ----------------
            Va recortada contra la silueta, asi que por muy ancha que sea
            nunca puede salirse del coche. */}
        <g clipPath="url(#bodyClip)" className={clickable} onClick={pick("capo")}>
          <rect x="0" y={spec.stripe.y} width="400" height={spec.stripe.h} fill={c.capo} />
          {selectedRegion === "capo" && (
            <rect
              x="0"
              y={spec.stripe.y}
              width="400"
              height={spec.stripe.h}
              fill="none"
              stroke="#ffffff"
              strokeWidth="5"
              strokeDasharray="10 6"
            />
          )}
        </g>

        {/* ---------------- CRISTALES ---------------- */}
        {spec.windows.length > 0 ? (
          <g className={clickable} onClick={pick("cristales")}>
            {spec.windows.map((w, i) => (
              <path key={i} d={w} fill={c.cristales} {...sel("cristales")} strokeLinejoin="round" />
            ))}
          </g>
        ) : (
          // Descapotable y monoplaza: no hay ventanas, se pinta el habitaculo
          <g className={clickable} onClick={pick("cristales")}>
            <path
              d={`M${spec.roof.x + 14},${spec.roof.y + 18} l10,-22 q14,-3 16,4 l4,18 z`}
              fill={c.cristales}
              {...sel("cristales")}
              strokeLinejoin="round"
            />
            <ellipse
              cx={spec.roof.x - 10}
              cy={spec.roof.y + 18}
              rx="34"
              ry="11"
              fill={c.cristales}
              {...sel("cristales")}
            />
            <path
              d={`M${spec.roof.x - 34},${spec.roof.y + 16} l6,-16 q10,-3 12,3 l2,13 z`}
              fill="#0f172a"
              opacity="0.35"
              pointerEvents="none"
            />
          </g>
        )}

        {/* ---------------- PEGATINAS ---------------- */}
        {p.pegatina !== "ninguna" && (
          <g className={clickable} onClick={pick("pegatina")} clipPath="url(#bodyClip)">
            {p.pegatina === "estrellas" &&
              [-58, -18, 22, 62].map((dx, i) => (
                <Star
                  key={i}
                  x={spec.decal.x + dx}
                  y={spec.decal.y + (i % 2 === 0 ? -6 : 8)}
                  r={i % 2 === 0 ? 11 : 8}
                  fill={c.pegatina}
                  selected={selectedRegion === "pegatina"}
                />
              ))}
            {p.pegatina === "rayo" && (
              <path
                d={`M${spec.decal.x - 54},${spec.decal.y - 12}
                    l34,4 l-14,10 l40,6 l-52,12 l16,-14 l-30,-6 z`}
                fill={c.pegatina}
                stroke={selectedRegion === "pegatina" ? "#ffffff" : "#0f172a"}
                strokeWidth={selectedRegion === "pegatina" ? 4 : 2}
                strokeLinejoin="round"
              />
            )}
            {p.pegatina === "numero" && (
              <>
                <circle
                  cx={spec.decal.x}
                  cy={spec.decal.y}
                  r="20"
                  fill={c.pegatina}
                  stroke={selectedRegion === "pegatina" ? "#ffffff" : "#0f172a"}
                  strokeWidth={selectedRegion === "pegatina" ? 4 : 2.5}
                />
                <text
                  x={spec.decal.x}
                  y={spec.decal.y + 8}
                  textAnchor="middle"
                  fontSize="24"
                  fontWeight="bold"
                  fill="#0f172a"
                  pointerEvents="none"
                >
                  7
                </text>
              </>
            )}
            {p.pegatina === "llamas" && (
              <path
                d={`M${spec.decal.x + 70},${spec.decal.y + 4}
                    q-30,-22 -58,-4 q-24,16 -52,6
                    q26,18 56,8 q26,-8 54,-10 z`}
                fill={c.pegatina}
                stroke={selectedRegion === "pegatina" ? "#ffffff" : "#0f172a"}
                strokeWidth={selectedRegion === "pegatina" ? 4 : 2}
                strokeLinejoin="round"
              />
            )}
            {p.pegatina === "corazones" &&
              [-52, -8, 36].map((dx, i) => (
                <Heart
                  key={i}
                  x={spec.decal.x + dx}
                  y={spec.decal.y + (i === 1 ? -8 : 6)}
                  s={i === 1 ? 1.15 : 0.9}
                  fill={c.pegatina}
                  selected={selectedRegion === "pegatina"}
                />
              ))}
          </g>
        )}

        {/* Area de toque de las pegatinas, por encima del recorte */}
        {p.pegatina !== "ninguna" && (
          <rect
            x={spec.decal.x - 80}
            y={spec.decal.y - 26}
            width="160"
            height="52"
            fill="transparent"
            pointerEvents="all"
            className={clickable}
            onClick={pick("pegatina")}
          />
        )}

        {/* ---------------- FAROS ---------------- */}
        <g pointerEvents="none">
          <circle cx={spec.lamp.x - 4} cy={spec.lamp.y} r="20" fill="url(#lampGlow)" />
          {p.faros === "redondos" && (
            <circle cx={spec.lamp.x - 6} cy={spec.lamp.y} r="8" fill="#fef9c3" stroke="#0f172a" strokeWidth="2.5" />
          )}
          {p.faros === "afilados" && (
            <path
              d={`M${spec.lamp.x - 20},${spec.lamp.y - 7} l16,2 l0,9 l-16,1 z`}
              fill="#fef9c3"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          )}
          {p.faros === "led" && (
            <rect
              x={spec.lamp.x - 26}
              y={spec.lamp.y - 4}
              width="24"
              height="6"
              rx="3"
              fill="#e0f2fe"
              stroke="#0f172a"
              strokeWidth="2"
            />
          )}
        </g>

        {/* ---------------- MATRICULA ---------------- */}
        {design.matricula.trim().length > 0 && (
          <g pointerEvents="none" clipPath="url(#bodyClip)">
            <rect
              x={spec.plate.x - 28}
              y={spec.plate.y - 9}
              width="56"
              height="17"
              rx="4"
              fill="#f8fafc"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <text
              x={spec.plate.x}
              y={spec.plate.y + 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#0f172a"
            >
              {design.matricula.trim().slice(0, 8)}
            </text>
          </g>
        )}

        {/* ---------------- RUEDAS Y LLANTAS ---------------- */}
        {spec.wheels.map((w, i) => (
          <g key={i} className={clickable} onClick={pick("llantas")}>
            <circle cx={w.cx} cy={w.cy} r={w.r} fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
            <motion.g
              animate={driving ? { rotate: 360 } : { rotate: 0 }}
              transition={
                driving
                  ? { duration: 0.55, repeat: Infinity, ease: "linear" }
                  : { duration: 0.3 }
              }
              style={{ originX: `${w.cx}px`, originY: `${w.cy}px` }}
            >
              <Rim variant={p.llantas} cx={w.cx} cy={w.cy} r={w.r} fill={c.llantas} selected={selectedRegion === "llantas"} />
            </motion.g>
            <circle cx={w.cx} cy={w.cy} r={w.r + 4} fill="transparent" pointerEvents="all" />
          </g>
        ))}

        {/* ---------------- EXTRA EN EL TECHO ---------------- */}
        {p.extra !== "ninguno" && (
          <g pointerEvents="none">
            {p.extra === "baca" && (
              <>
                <rect
                  x={spec.roof.x - 46}
                  y={spec.roof.y - 12}
                  width="92"
                  height="8"
                  rx="3"
                  fill="#475569"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                {[-36, -12, 12, 36].map((dx) => (
                  <rect
                    key={dx}
                    x={spec.roof.x + dx}
                    y={spec.roof.y - 10}
                    width="5"
                    height="10"
                    fill="#334155"
                  />
                ))}
              </>
            )}
            {p.extra === "sirena" && (
              <>
                <rect
                  x={spec.roof.x - 16}
                  y={spec.roof.y - 14}
                  width="32"
                  height="12"
                  rx="5"
                  fill="#dc2626"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <motion.rect
                  x={spec.roof.x - 16}
                  y={spec.roof.y - 14}
                  width="16"
                  height="12"
                  rx="5"
                  fill="#2563eb"
                  animate={{ opacity: [1, 0.15, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                />
              </>
            )}
            {p.extra === "tabla" && (
              <path
                d={`M${spec.roof.x - 62},${spec.roof.y - 8}
                    q62,-16 124,0 q-62,14 -124,0 z`}
                fill="#fbbf24"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            )}
            {p.extra === "corona" && (
              <path
                d={`M${spec.roof.x - 26},${spec.roof.y - 4}
                    l4,-22 l10,10 l8,-16 l8,16 l10,-10 l4,22 z`}
                fill="#facc15"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            )}
          </g>
        )}
      </motion.g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Piezas auxiliares
// ---------------------------------------------------------------------------

function Rim({
  variant,
  cx,
  cy,
  r,
  fill,
  selected,
}: {
  variant: string;
  cx: number;
  cy: number;
  r: number;
  fill: string;
  selected: boolean;
}) {
  const stroke = selected ? "#ffffff" : "#0f172a";
  const sw = selected ? 3.5 : 2;
  const inner = r * 0.62;

  if (variant === "radios") {
    return (
      <g>
        <circle cx={cx} cy={cy} r={inner} fill={fill} stroke={stroke} strokeWidth={sw} />
        {[0, 45, 90, 135].map((a) => {
          const rad = (a * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={cx - Math.cos(rad) * inner * 0.85}
              y1={cy - Math.sin(rad) * inner * 0.85}
              x2={cx + Math.cos(rad) * inner * 0.85}
              y2={cy + Math.sin(rad) * inner * 0.85}
              stroke="#0f172a"
              strokeWidth="2.5"
            />
          );
        })}
        <circle cx={cx} cy={cy} r={inner * 0.24} fill="#0f172a" />
      </g>
    );
  }

  if (variant === "estrella") {
    return (
      <g>
        <circle cx={cx} cy={cy} r={inner} fill={fill} stroke={stroke} strokeWidth={sw} />
        <Star x={cx} y={cy} r={inner * 0.82} fill="#0f172a" selected={false} />
      </g>
    );
  }

  if (variant === "turbina") {
    return (
      <g>
        <circle cx={cx} cy={cy} r={inner} fill={fill} stroke={stroke} strokeWidth={sw} />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <path
            key={a}
            d={`M${cx},${cy} q${inner * 0.5},${-inner * 0.2} ${inner * 0.9},${-inner * 0.5}
                q${-inner * 0.15},${inner * 0.55} ${-inner * 0.9},${inner * 0.5} z`}
            fill="#0f172a"
            opacity="0.75"
            transform={`rotate(${a} ${cx} ${cy})`}
          />
        ))}
        <circle cx={cx} cy={cy} r={inner * 0.2} fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
      </g>
    );
  }

  if (variant === "dorada") {
    return (
      <g>
        <circle cx={cx} cy={cy} r={inner} fill="#facc15" stroke={stroke} strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={inner * 0.72} fill="none" stroke="#a16207" strokeWidth="2.5" />
        {[0, 72, 144, 216, 288].map((a) => {
          const rad = (a * Math.PI) / 180;
          return (
            <circle
              key={a}
              cx={cx + Math.cos(rad) * inner * 0.46}
              cy={cy + Math.sin(rad) * inner * 0.46}
              r={inner * 0.15}
              fill="#a16207"
            />
          );
        })}
        <circle cx={cx} cy={cy} r={inner * 0.2} fill="#fef08a" stroke="#a16207" strokeWidth="1.5" />
      </g>
    );
  }

  // basica
  return (
    <g>
      <circle cx={cx} cy={cy} r={inner} fill={fill} stroke={stroke} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={inner * 0.3} fill="#0f172a" />
    </g>
  );
}

function Star({
  x,
  y,
  r,
  fill,
  selected,
}: {
  x: number;
  y: number;
  r: number;
  fill: string;
  selected: boolean;
}) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${x + Math.cos(rad) * rr},${y + Math.sin(rad) * rr}`);
  }
  return (
    <polygon
      points={pts.join(" ")}
      fill={fill}
      stroke={selected ? "#ffffff" : "#0f172a"}
      strokeWidth={selected ? 3 : 1.5}
      strokeLinejoin="round"
    />
  );
}

function Heart({
  x,
  y,
  s,
  fill,
  selected,
}: {
  x: number;
  y: number;
  s: number;
  fill: string;
  selected: boolean;
}) {
  return (
    <path
      d={`M${x},${y + 9 * s}
          c${-11 * s},${-8 * s} ${-13 * s},${-18 * s} ${-4 * s},${-21 * s}
          c${4 * s},${-1 * s} ${4 * s},${3 * s} ${4 * s},${3 * s}
          c0,0 0,${-4 * s} ${4 * s},${-3 * s}
          c${9 * s},${3 * s} ${7 * s},${13 * s} ${-4 * s},${21 * s} z`}
      fill={fill}
      stroke={selected ? "#ffffff" : "#0f172a"}
      strokeWidth={selected ? 3 : 1.6}
      strokeLinejoin="round"
    />
  );
}
