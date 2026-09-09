/**
 * Catalogo del garaje.
 *
 * El coche NO es una imagen: es un SVG armado por piezas, y cada pieza tiene su
 * propio color. Este archivo es la unica fuente de verdad de:
 *   - que ranuras (slots) tiene un coche y que variantes hay en cada una
 *   - que variantes son gratis de serie y cuales hay que comprar
 *   - la geometria de cada chasis (donde van las ruedas, el techo, la matricula)
 *
 * IMPORTANTE: los identificadores de variante de aqui tienen que coincidir
 * exactamente con store_items.vehicle_slot / store_items.vehicle_variant en la
 * base de datos. Si una variante NO existe en store_items, es gratuita: el RPC
 * save_vehicle_design solo exige compra cuando encuentra la fila en la tienda.
 */

export type VehicleSlot =
  | "chasis"
  | "llantas"
  | "aleron"
  | "faros"
  | "pegatina"
  | "neon"
  | "acabado"
  | "extra";

/** Regiones del coche que se pueden pintar tocandolas. */
export type PaintRegion =
  | "carroceria"
  | "capo"
  | "cristales"
  | "llantas"
  | "aleron"
  | "pegatina"
  | "neon";

export type VehicleDesign = {
  parts: Record<VehicleSlot, string>;
  colors: Record<PaintRegion, string>;
  matricula: string;
};

export type VehicleVariant = {
  id: string;
  label: string;
  emoji: string;
  /** true = viene de serie, no hace falta comprarla */
  free?: boolean;
  /** Si solo aparece para un genero (el resto salen para los dos) */
  onlyFor?: "girl" | "boy";
};

export const SLOT_LABEL: Record<VehicleSlot, { label: string; emoji: string }> = {
  chasis: { label: "Coche", emoji: "🚗" },
  llantas: { label: "Llantas", emoji: "🛞" },
  aleron: { label: "Alerón", emoji: "🪁" },
  faros: { label: "Faros", emoji: "💡" },
  pegatina: { label: "Pegatinas", emoji: "✨" },
  neon: { label: "Neón", emoji: "🌈" },
  acabado: { label: "Pintura", emoji: "🎨" },
  extra: { label: "En el techo", emoji: "🎁" },
};

export const VARIANTS: Record<VehicleSlot, VehicleVariant[]> = {
  chasis: [
    { id: "deportivo", label: "Deportivo", emoji: "🏎️", free: true },
    { id: "descapotable", label: "Descapotable", emoji: "🚙", free: true },
    { id: "todoterreno", label: "Todoterreno 4x4", emoji: "🚜" },
    { id: "furgoneta", label: "Furgoneta camper", emoji: "🚐" },
    { id: "monoplaza", label: "Monoplaza", emoji: "🏁" },
  ],
  llantas: [
    { id: "basica", label: "Básica", emoji: "⚫", free: true },
    { id: "radios", label: "De radios", emoji: "☸️", free: true },
    { id: "estrella", label: "De estrella", emoji: "⭐" },
    { id: "turbina", label: "De turbina", emoji: "🌀" },
    { id: "dorada", label: "Doradas", emoji: "🥇" },
  ],
  aleron: [
    { id: "ninguno", label: "Sin alerón", emoji: "➖", free: true },
    { id: "pequeno", label: "Pequeño", emoji: "▪️" },
    { id: "carreras", label: "De carreras", emoji: "🏁" },
    { id: "alas", label: "De alas", emoji: "🦋" },
  ],
  faros: [
    { id: "redondos", label: "Redondos", emoji: "⭕", free: true },
    { id: "afilados", label: "Afilados", emoji: "🔺" },
    { id: "led", label: "Tira LED", emoji: "➡️" },
  ],
  pegatina: [
    { id: "ninguna", label: "Sin pegatinas", emoji: "➖", free: true },
    { id: "estrellas", label: "Estrellas", emoji: "⭐" },
    { id: "rayo", label: "Rayo", emoji: "⚡" },
    { id: "numero", label: "Número", emoji: "7️⃣" },
    { id: "llamas", label: "Llamas", emoji: "🔥", onlyFor: "boy" },
    { id: "corazones", label: "Corazones", emoji: "💗", onlyFor: "girl" },
  ],
  neon: [
    { id: "ninguno", label: "Sin neón", emoji: "➖", free: true },
    { id: "bajo", label: "Bajo el coche", emoji: "💡" },
    { id: "halo", label: "Halo completo", emoji: "🌟" },
  ],
  acabado: [
    { id: "mate", label: "Mate", emoji: "🎨", free: true },
    { id: "brillante", label: "Brillante", emoji: "✨" },
    { id: "metalizado", label: "Metalizada", emoji: "💠" },
    { id: "perlado", label: "Perlada", emoji: "🫧" },
  ],
  extra: [
    { id: "ninguno", label: "Nada", emoji: "➖", free: true },
    { id: "baca", label: "Baca de techo", emoji: "🧳" },
    { id: "sirena", label: "Sirena", emoji: "🚨" },
    { id: "tabla", label: "Tabla de surf", emoji: "🏄", onlyFor: "boy" },
    { id: "corona", label: "Corona", emoji: "👑", onlyFor: "girl" },
  ],
};

export const SLOT_ORDER: VehicleSlot[] = [
  "chasis",
  "acabado",
  "llantas",
  "aleron",
  "faros",
  "pegatina",
  "neon",
  "extra",
];

/** Colores libres. Ninguno cuesta diamantes: se pinta gratis desde el primer dia. */
export const PALETTE: string[] = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#fde047",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#fb7185",
  "#ffffff",
  "#cbd5e1",
  "#64748b",
  "#1e293b",
];

export const REGION_LABEL: Record<PaintRegion, { label: string; emoji: string }> = {
  carroceria: { label: "Carrocería", emoji: "🚗" },
  capo: { label: "Franja", emoji: "🔲" },
  cristales: { label: "Cristales", emoji: "🪟" },
  llantas: { label: "Llantas", emoji: "🛞" },
  aleron: { label: "Alerón", emoji: "🪁" },
  pegatina: { label: "Pegatinas", emoji: "✨" },
  neon: { label: "Neón", emoji: "🌈" },
};

export const REGION_ORDER: PaintRegion[] = [
  "carroceria",
  "capo",
  "cristales",
  "llantas",
  "aleron",
  "pegatina",
  "neon",
];

/**
 * Diseño de partida. Cambia segun el mundo (chica / chico) para que el primer
 * coche que ve cada niño ya vaya con su onda, sin haber comprado nada.
 */
export function defaultDesign(gender: "girl" | "boy" | null | undefined): VehicleDesign {
  const girl = gender !== "boy";
  return {
    parts: {
      chasis: girl ? "descapotable" : "deportivo",
      llantas: girl ? "radios" : "basica",
      aleron: "ninguno",
      faros: "redondos",
      pegatina: "ninguna",
      neon: "ninguno",
      acabado: "mate",
      extra: "ninguno",
    },
    colors: {
      carroceria: girl ? "#ec4899" : "#3b82f6",
      capo: girl ? "#fb7185" : "#1e293b",
      cristales: "#cbd5e1",
      llantas: "#cbd5e1",
      aleron: girl ? "#ec4899" : "#3b82f6",
      pegatina: "#fde047",
      neon: girl ? "#d946ef" : "#06b6d4",
    },
    matricula: "",
  };
}

/**
 * Une lo que venga de la base de datos con el diseño por defecto. Sirve para que
 * un diseño guardado antes de añadir una ranura nueva no rompa nada: lo que
 * falte se rellena con el valor de serie.
 */
export function mergeDesign(
  raw: unknown,
  gender: "girl" | "boy" | null | undefined
): VehicleDesign {
  const base = defaultDesign(gender);
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Partial<VehicleDesign>;
  const parts = { ...base.parts };
  const colors = { ...base.colors };

  if (d.parts && typeof d.parts === "object") {
    for (const slot of SLOT_ORDER) {
      const v = (d.parts as Record<string, unknown>)[slot];
      if (typeof v === "string" && VARIANTS[slot].some((x) => x.id === v)) {
        parts[slot] = v;
      }
    }
  }
  if (d.colors && typeof d.colors === "object") {
    for (const region of REGION_ORDER) {
      const c = (d.colors as Record<string, unknown>)[region];
      if (typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c)) colors[region] = c;
    }
  }

  return {
    parts,
    colors,
    matricula: typeof d.matricula === "string" ? d.matricula.slice(0, 10) : "",
  };
}

/** Clave con la que el RPC my_garage devuelve las piezas compradas. */
export function ownedKey(slot: VehicleSlot, variant: string): string {
  return `${slot}:${variant}`;
}

export function isVariantAvailable(
  slot: VehicleSlot,
  variant: VehicleVariant,
  owned: Set<string>
): boolean {
  return Boolean(variant.free) || owned.has(ownedKey(slot, variant.id));
}

// ---------------------------------------------------------------------------
// Geometria de los chasis
// ---------------------------------------------------------------------------

export type ChasisSpec = {
  /** Silueta completa de la carroceria (se pinta con colors.carroceria) */
  body: string;
  /** Cristales (colors.cristales). Vacio en el descapotable y el monoplaza. */
  windows: string[];
  /** Franja horizontal de segundo color (colors.capo). Se recorta contra la
   *  silueta, asi que nunca puede sobresalir del coche. */
  stripe: { y: number; h: number };
  wheels: { cx: number; cy: number; r: number }[];
  /** Punto de anclaje del extra del techo */
  roof: { x: number; y: number };
  /** Donde va el alerón */
  spoiler: { x: number; y: number };
  /** Faro delantero */
  lamp: { x: number; y: number };
  /** Centro de la zona de pegatinas */
  decal: { x: number; y: number };
  /** Matricula, entre las dos ruedas para que no la tape ninguna */
  plate: { x: number; y: number };
  /** Contorno inferior para el neón bajo el coche */
  underY: number;
};

export const CHASIS: Record<string, ChasisSpec> = {
  deportivo: {
    body:
      "M26,192 L26,168 Q26,155 44,151 L120,143 L154,110 Q160,103 172,103 L246,103 " +
      "Q259,103 265,110 L300,145 L368,153 Q382,156 382,170 L382,192 Z",
    windows: [
      "M132,141 L162,113 L196,113 L196,141 Z",
      "M206,113 L240,113 L262,141 L206,141 Z",
    ],
    stripe: { y: 160, h: 16 },
    wheels: [
      { cx: 108, cy: 192, r: 31 },
      { cx: 300, cy: 192, r: 31 },
    ],
    roof: { x: 205, y: 103 },
    spoiler: { x: 56, y: 148 },
    lamp: { x: 366, y: 164 },
    decal: { x: 205, y: 168 },
    plate: { x: 205, y: 182 },
    underY: 196,
  },
  descapotable: {
    body:
      "M26,192 L26,166 Q26,153 44,149 L118,143 Q128,127 150,125 L252,125 " +
      "Q272,127 282,143 L368,151 Q382,154 382,168 L382,192 Z",
    windows: [],
    stripe: { y: 158, h: 16 },
    wheels: [
      { cx: 108, cy: 192, r: 31 },
      { cx: 300, cy: 192, r: 31 },
    ],
    roof: { x: 200, y: 125 },
    spoiler: { x: 56, y: 146 },
    lamp: { x: 366, y: 162 },
    decal: { x: 200, y: 168 },
    plate: { x: 205, y: 182 },
    underY: 196,
  },
  todoterreno: {
    body:
      "M28,194 L28,150 Q28,139 44,137 L62,136 L76,86 Q80,77 94,77 L296,77 " +
      "Q311,77 315,86 L330,137 L364,139 Q380,141 380,154 L380,194 Z",
    windows: [
      "M86,133 L98,84 L172,84 L172,133 Z",
      "M182,84 L288,84 L300,133 L182,133 Z",
    ],
    stripe: { y: 150, h: 18 },
    wheels: [
      { cx: 100, cy: 194, r: 36 },
      { cx: 306, cy: 194, r: 36 },
    ],
    roof: { x: 195, y: 77 },
    spoiler: { x: 58, y: 136 },
    lamp: { x: 364, y: 152 },
    decal: { x: 195, y: 162 },
    plate: { x: 203, y: 180 },
    underY: 198,
  },
  furgoneta: {
    body:
      "M28,194 L28,140 Q28,129 42,125 L58,80 Q62,70 78,70 L318,70 " +
      "Q336,70 340,83 L352,127 Q380,131 380,148 L380,194 Z",
    windows: [
      "M66,120 L78,77 L150,77 L150,120 Z",
      "M162,77 L232,77 L232,120 L162,120 Z",
      "M244,77 L312,77 L324,120 L244,120 Z",
    ],
    stripe: { y: 138, h: 20 },
    wheels: [
      { cx: 96, cy: 194, r: 33 },
      { cx: 312, cy: 194, r: 33 },
    ],
    roof: { x: 190, y: 70 },
    spoiler: { x: 56, y: 126 },
    lamp: { x: 366, y: 150 },
    decal: { x: 190, y: 158 },
    plate: { x: 204, y: 180 },
    underY: 198,
  },
  monoplaza: {
    body:
      "M16,190 L30,172 L120,167 L152,148 Q176,140 206,140 L250,142 " +
      "Q263,145 267,156 L302,167 L374,172 L384,190 Z",
    windows: [],
    stripe: { y: 172, h: 12 },
    wheels: [
      { cx: 96, cy: 186, r: 34 },
      { cx: 310, cy: 186, r: 34 },
    ],
    roof: { x: 215, y: 140 },
    spoiler: { x: 48, y: 168 },
    lamp: { x: 372, y: 178 },
    decal: { x: 205, y: 172 },
    plate: { x: 205, y: 180 },
    underY: 192,
  },
};

export function chasisOf(id: string): ChasisSpec {
  return CHASIS[id] ?? CHASIS.deportivo;
}
