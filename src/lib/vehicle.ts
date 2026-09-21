/**
 * Catalogo del garaje.
 *
 * El coche ya no se dibuja con paths: son renders 3D reales, separados en
 * capas PNG transparentes que se apilan en el mismo lienzo (public/garaje).
 * Las capas vienen del despiece de los coches originales, asi que apiladas
 * sin tocar reproducen el coche tal cual se genero.
 *
 * Aqui NO hay piezas intercambiables: las capas solo contienen lo que se veia
 * en la imagen original, de modo que quitar una rueda deja el hueco a la
 * vista. Lo que el nino cambia es el COLOR de cada zona.
 *
 * El teñido conserva la luminancia del render (o sea, el volumen y las
 * sombras) y solo toca los pixeles que ya tenian color: los blancos, los
 * grises y los negros se quedan como estan, por eso las franjas siguen
 * blancas y los neumaticos siguen negros.
 */

export type VehicleModel = "f1" | "tuneado";

export type VehicleLayer = {
  /** Identificador de la zona; es la clave dentro de design.colors */
  id: string;
  /** Archivo dentro de /garaje/<modelo>/ */
  file: string;
  /** Si es null, la capa no se puede pintar (neumaticos del F1) */
  label: string | null;
  emoji?: string;
};

export type VehicleSpec = {
  id: VehicleModel;
  label: string;
  emoji: string;
  /** Proporcion del lienzo, para reservar el hueco sin que salte el layout */
  width: number;
  height: number;
  /** De abajo a arriba */
  layers: VehicleLayer[];
};

export const MODELS: Record<VehicleModel, VehicleSpec> = {
  tuneado: {
    id: "tuneado",
    label: "Deportivo tuneado",
    emoji: "🏎️",
    width: 780,
    height: 754,
    layers: [
      { id: "carroceria", file: "carroceria.webp", label: "Carrocería", emoji: "🚗" },
      { id: "ruedas", file: "ruedas.webp", label: "Llantas", emoji: "🛞" },
      { id: "aleron", file: "aleron.webp", label: "Alerón", emoji: "🪁" },
      { id: "cristales", file: "cristales.webp", label: "Cristales", emoji: "🪟" },
    ],
  },
  f1: {
    id: "f1",
    label: "Fórmula 1",
    emoji: "🏁",
    width: 780,
    height: 730,
    layers: [
      { id: "carroceria", file: "carroceria.webp", label: "Carrocería", emoji: "🚗" },
      // Los neumaticos son negros puros: teñirlos no cambiaria nada.
      { id: "ruedas", file: "ruedas.webp", label: null },
      { id: "alerones", file: "alerones.webp", label: "Alerones", emoji: "🪁" },
      { id: "habitaculo", file: "habitaculo.webp", label: "Casco", emoji: "⛑️" },
    ],
  },
};

export const MODEL_ORDER: VehicleModel[] = ["tuneado", "f1"];

export function layerSrc(model: VehicleModel, layer: VehicleLayer): string {
  return `/garaje/${model}/${layer.file}`;
}

/** Zonas que el nino puede pintar en este coche. */
export function paintableLayers(model: VehicleModel): VehicleLayer[] {
  return MODELS[model].layers.filter((l) => l.label !== null);
}

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

export type VehicleDesign = {
  model: VehicleModel;
  /**
   * Solo las zonas que el nino ha pintado. Una zona que no esta aqui se dibuja
   * con su color original, asi que "quitar la pintura" es borrar la clave.
   */
  colors: Record<string, string>;
  matricula: string;
};

export function defaultDesign(gender: "girl" | "boy" | null | undefined): VehicleDesign {
  return {
    model: gender === "boy" ? "f1" : "tuneado",
    colors: {},
    matricula: "",
  };
}

/**
 * Une lo que venga de la base de datos con el diseño por defecto. Tolera
 * diseños del sistema anterior (los que traian "parts"): se ignoran y el nino
 * empieza con el coche de serie, porque aquellas piezas ya no existen.
 */
export function mergeDesign(
  raw: unknown,
  gender: "girl" | "boy" | null | undefined
): VehicleDesign {
  const base = defaultDesign(gender);
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Partial<VehicleDesign>;

  const model: VehicleModel =
    typeof d.model === "string" && d.model in MODELS ? (d.model as VehicleModel) : base.model;

  const colors: Record<string, string> = {};
  if (d.colors && typeof d.colors === "object") {
    const valid = new Set(paintableLayers(model).map((l) => l.id));
    for (const [k, v] of Object.entries(d.colors as Record<string, unknown>)) {
      if (valid.has(k) && typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)) {
        colors[k] = v.toLowerCase();
      }
    }
  }

  return {
    model,
    colors,
    matricula: typeof d.matricula === "string" ? d.matricula.slice(0, 10) : "",
  };
}

/** Cuantas decisiones ha tomado el nino. Cuanto mas trabajado, mas premio. */
export function customCount(design: VehicleDesign, base: VehicleDesign): number {
  let n = Object.keys(design.colors).length;
  if (design.model !== base.model) n++;
  if (design.matricula.trim()) n++;
  return n;
}
