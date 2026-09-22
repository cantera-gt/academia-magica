/**
 * Catalogo de Mundo Magico: los personajes que el alumno viste y pinta.
 *
 * Mismo principio que el garaje, pero con una diferencia importante a favor:
 * los personajes traen capas NEUTRAS en escala de grises que conservan luces y
 * sombras. Teñir es entonces una multiplicacion RGB por el color elegido, que
 * es exacta, en vez del apaño en HSL que hubo que hacer con los coches.
 *
 * El color de fabrica de cada pieza (campo `color`) se calculo comparando la
 * capa neutra con la capa de color original: reconstruye el personaje tal como
 * se genero, con un error medio de entre 1 y 17 sobre 255. Gracias a eso no
 * hace falta guardar las capas de color y el peso se queda en la mitad.
 *
 * Igual que en el garaje, NO se mezclan piezas sueltas: las capas solo
 * contienen lo visible, asi que se cambia el vestuario entero (clasico o
 * armadura) y se pintan las piezas, pero no se quita una pieza esperando
 * encontrar algo debajo.
 *
 * Las cabezas y la piel no se pintan (label: null), salvo en Prisma, que es de
 * cristal y su cabeza si es pintable.
 */

export type HeroId = "heroe" | "heroina" | "prisma" | "bruma" | "voltio";
export type OutfitId = "clasico" | "alterno";

export type HeroLayer = {
  id: string;
  file: string;
  /** null = pieza fija, no se pinta */
  label: string | null;
  emoji?: string;
  /** Color de fabrica; solo en piezas pintables */
  color?: string;
};

export type HeroOutfit = {
  label: string;
  width: number;
  height: number;
  /** De abajo a arriba */
  layers: HeroLayer[];
};

export type HeroSpec = {
  id: HeroId;
  label: string;
  emoji: string;
  outfits: Record<OutfitId, HeroOutfit>;
};

export const HEROES: Record<HeroId, HeroSpec> = {
  heroe: {
    id: "heroe",
    label: "Superhéroe",
    emoji: "🦸‍♂️",
    outfits: {
      clasico: {
        label: "Clásico",
        width: 612,
        height: 620,
        layers: [
          { id: "base-cabeza", file: "base-cabeza.webp", label: null },
          { id: "capa", file: "capa.webp", label: "Capa", emoji: "🦸", color: "#ff1711" },
          { id: "traje", file: "traje.webp", label: "Traje", emoji: "👕", color: "#005aff" },
          { id: "guantes", file: "guantes.webp", label: "Guantes", emoji: "🧤", color: "#ff2420" },
          { id: "botas", file: "botas.webp", label: "Botas", emoji: "👢", color: "#ff231f" },
          { id: "cinturon", file: "cinturon.webp", label: "Cinturón", emoji: "🎀", color: "#ffbf0d" },
          { id: "emblema", file: "emblema.webp", label: "Emblema", emoji: "⭐", color: "#ffd421" },
        ],
      },
      alterno: {
        label: "Armadura",
        width: 629,
        height: 620,
        layers: [
          { id: "base-cabeza", file: "base-cabeza.webp", label: null },
          { id: "capa", file: "capa.webp", label: "Capa", emoji: "🦸", color: "#ff120e" },
          { id: "traje", file: "traje.webp", label: "Traje", emoji: "👕", color: "#0159ff" },
          { id: "guantes", file: "guantes.webp", label: "Guantes", emoji: "🧤", color: "#ff211d" },
          { id: "botas", file: "botas.webp", label: "Botas", emoji: "👢", color: "#ff1f1a" },
          { id: "cinturon", file: "cinturon.webp", label: "Cinturón", emoji: "🎀", color: "#ffbd0d" },
          { id: "emblema", file: "emblema.webp", label: "Emblema", emoji: "⭐", color: "#ffce28" },
        ],
      },
    },
  },
  heroina: {
    id: "heroina",
    label: "Superheroína",
    emoji: "🦸‍♀️",
    outfits: {
      clasico: {
        label: "Clásico",
        width: 411,
        height: 620,
        layers: [
          { id: "base-cabeza-manos", file: "base-cabeza-manos.webp", label: null },
          { id: "capa", file: "capa.webp", label: "Capa", emoji: "🦸", color: "#ff2328" },
          { id: "traje", file: "traje.webp", label: "Traje", emoji: "👕", color: "#1e6eff" },
          { id: "botas", file: "botas.webp", label: "Botas", emoji: "👢", color: "#ff2929" },
          { id: "accesorios-dorados", file: "accesorios-dorados.webp", label: "Dorados", emoji: "🥇", color: "#ffad4b" },
        ],
      },
      alterno: {
        label: "Armadura",
        width: 411,
        height: 620,
        layers: [
          { id: "base-cabeza-manos", file: "base-cabeza-manos.webp", label: null },
          { id: "capa", file: "capa.webp", label: "Capa", emoji: "🦸", color: "#ff2527" },
          { id: "traje", file: "traje.webp", label: "Traje", emoji: "👕", color: "#2270ff" },
          { id: "botas", file: "botas.webp", label: "Botas", emoji: "👢", color: "#ff2b29" },
          { id: "accesorios-dorados", file: "accesorios-dorados.webp", label: "Dorados", emoji: "🥇", color: "#ffb463" },
        ],
      },
    },
  },
  prisma: {
    id: "prisma",
    label: "Prisma",
    emoji: "💎",
    outfits: {
      clasico: {
        label: "Clásico",
        width: 585,
        height: 620,
        layers: [
          { id: "cabeza", file: "cabeza.webp", label: "Cabeza", emoji: "🙂", color: "#19fbff" },
          { id: "traje", file: "traje.webp", label: "Traje", emoji: "👕", color: "#376cff" },
          { id: "placas-cristal", file: "placas-cristal.webp", label: "Cristales", emoji: "💎", color: "#0dfcff" },
          { id: "guantes", file: "guantes.webp", label: "Guantes", emoji: "🧤", color: "#9944ff" },
          { id: "botas", file: "botas.webp", label: "Botas", emoji: "👢", color: "#9741ff" },
          { id: "cinturon", file: "cinturon.webp", label: "Cinturón", emoji: "🎀", color: "#ffb730" },
          { id: "broche", file: "broche.webp", label: "Broche", emoji: "✨", color: "#ffcd43" },
        ],
      },
      alterno: {
        label: "Armadura",
        width: 595,
        height: 620,
        layers: [
          { id: "cabeza", file: "cabeza.webp", label: "Cabeza", emoji: "🙂", color: "#21faff" },
          { id: "traje", file: "traje.webp", label: "Traje", emoji: "👕", color: "#406eff" },
          { id: "placas-cristal", file: "placas-cristal.webp", label: "Cristales", emoji: "💎", color: "#20f8ff" },
          { id: "guantes", file: "guantes.webp", label: "Guantes", emoji: "🧤", color: "#a03aff" },
          { id: "botas", file: "botas.webp", label: "Botas", emoji: "👢", color: "#9f39ff" },
          { id: "cinturon", file: "cinturon.webp", label: "Cinturón", emoji: "🎀", color: "#ffb231" },
          { id: "broche", file: "broche.webp", label: "Broche", emoji: "✨", color: "#ffc43c" },
        ],
      },
    },
  },
  bruma: {
    id: "bruma",
    label: "Bruma",
    emoji: "🌫️",
    outfits: {
      clasico: {
        label: "Clásico",
        width: 572,
        height: 620,
        layers: [
          { id: "cabeza", file: "cabeza.webp", label: null },
          { id: "capa", file: "capa.webp", label: "Capa", emoji: "🦸", color: "#02d4ff" },
          { id: "traje", file: "traje.webp", label: "Traje", emoji: "👕", color: "#a957ff" },
          { id: "guantes", file: "guantes.webp", label: "Guantes", emoji: "🧤", color: "#01efff" },
          { id: "botas", file: "botas.webp", label: "Botas", emoji: "👢", color: "#02f0ff" },
          { id: "cinturon", file: "cinturon.webp", label: "Cinturón", emoji: "🎀", color: "#ffbb4d" },
          { id: "broches", file: "broches.webp", label: "Broches", emoji: "✨", color: "#ffbe50" },
        ],
      },
      alterno: {
        label: "Armadura",
        width: 595,
        height: 620,
        layers: [
          { id: "cabeza", file: "cabeza.webp", label: null },
          { id: "capa", file: "capa.webp", label: "Capa", emoji: "🦸", color: "#03ceff" },
          { id: "traje", file: "traje.webp", label: "Traje", emoji: "👕", color: "#ba63ff" },
          { id: "guantes", file: "guantes.webp", label: "Guantes", emoji: "🧤", color: "#02ecff" },
          { id: "botas", file: "botas.webp", label: "Botas", emoji: "👢", color: "#02ecff" },
          { id: "cinturon", file: "cinturon.webp", label: "Cinturón", emoji: "🎀", color: "#ffb949" },
          { id: "broches", file: "broches.webp", label: "Broches", emoji: "✨", color: "#ffba4b" },
        ],
      },
    },
  },
  voltio: {
    id: "voltio",
    label: "Voltio",
    emoji: "⚡",
    outfits: {
      clasico: {
        label: "Clásico",
        width: 605,
        height: 620,
        layers: [
          { id: "cabeza", file: "cabeza.webp", label: null },
          { id: "mochila-correas", file: "mochila-correas.webp", label: "Mochila", emoji: "🎒", color: "#0558ff" },
          { id: "traje", file: "traje.webp", label: "Traje", emoji: "👕", color: "#ff6c15" },
          { id: "guantes", file: "guantes.webp", label: "Guantes", emoji: "🧤", color: "#035eff" },
          { id: "botas", file: "botas.webp", label: "Botas", emoji: "👢", color: "#0259ff" },
          { id: "cinturon", file: "cinturon.webp", label: "Cinturón", emoji: "🎀", color: "#09e5ff" },
          { id: "gafas", file: "gafas.webp", label: "Gafas", emoji: "🥽", color: "#1baaff" },
          { id: "detalles", file: "detalles.webp", label: "Detalles", emoji: "🔧", color: "#14e7ff" },
        ],
      },
      alterno: {
        label: "Armadura",
        width: 592,
        height: 620,
        layers: [
          { id: "cabeza", file: "cabeza.webp", label: null },
          { id: "mochila-correas", file: "mochila-correas.webp", label: "Mochila", emoji: "🎒", color: "#0456ff" },
          { id: "traje", file: "traje.webp", label: "Traje", emoji: "👕", color: "#ff5d07" },
          { id: "guantes", file: "guantes.webp", label: "Guantes", emoji: "🧤", color: "#0154ff" },
          { id: "botas", file: "botas.webp", label: "Botas", emoji: "👢", color: "#0155ff" },
          { id: "cinturon", file: "cinturon.webp", label: "Cinturón", emoji: "🎀", color: "#01ddff" },
          { id: "gafas", file: "gafas.webp", label: "Gafas", emoji: "🥽", color: "#0f9fff" },
          { id: "detalles", file: "detalles.webp", label: "Detalles", emoji: "🔧", color: "#01d8ff" },
        ],
      },
    },
  },};

export const HERO_ORDER: HeroId[] = ["heroe", "heroina", "prisma", "bruma", "voltio"];
export const OUTFIT_ORDER: OutfitId[] = ["clasico", "alterno"];

export function layerSrc(hero: HeroId, outfit: OutfitId, file: string): string {
  return `/mundo/${hero}/${outfit}/${file}`;
}

export function paintableLayers(hero: HeroId, outfit: OutfitId): HeroLayer[] {
  return HEROES[hero].outfits[outfit].layers.filter((l) => l.label !== null);
}

/** Colores libres. Pintar no cuesta diamantes. */
export const PALETTE: string[] = [
  "#ef4444", "#f97316", "#f59e0b", "#fde047", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef",
  "#ec4899", "#fb7185", "#ffffff", "#cbd5e1", "#64748b", "#1e293b",
];

export type HeroDesign = {
  hero: HeroId;
  outfit: OutfitId;
  /** Solo las piezas repintadas; lo que no este aqui usa su color de fabrica */
  colors: Record<string, string>;
  nombre: string;
};

export function defaultDesign(gender: "girl" | "boy" | null | undefined): HeroDesign {
  return { hero: gender === "boy" ? "heroe" : "heroina", outfit: "clasico", colors: {}, nombre: "" };
}

export function mergeDesign(
  raw: unknown,
  gender: "girl" | "boy" | null | undefined
): HeroDesign {
  const base = defaultDesign(gender);
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Partial<HeroDesign>;

  const hero: HeroId =
    typeof d.hero === "string" && d.hero in HEROES ? (d.hero as HeroId) : base.hero;
  const outfit: OutfitId =
    d.outfit === "clasico" || d.outfit === "alterno" ? d.outfit : "clasico";

  const colors: Record<string, string> = {};
  if (d.colors && typeof d.colors === "object") {
    const valid = new Set(paintableLayers(hero, outfit).map((l) => l.id));
    for (const [k, v] of Object.entries(d.colors as Record<string, unknown>)) {
      if (valid.has(k) && typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)) {
        colors[k] = v.toLowerCase();
      }
    }
  }

  return {
    hero,
    outfit,
    colors,
    nombre: typeof d.nombre === "string" ? d.nombre.slice(0, 14) : "",
  };
}

/** Cuantas decisiones ha tomado el nino: a mas trabajado, mas premio. */
export function customCount(design: HeroDesign, base: HeroDesign): number {
  let n = Object.keys(design.colors).length;
  if (design.hero !== base.hero) n++;
  if (design.outfit !== base.outfit) n++;
  if (design.nombre.trim()) n++;
  return n;
}
