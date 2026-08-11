/**
 * Ningun store_item tiene todavia una foto real (image_url). Mientras tanto,
 * en vez de mostrar el mismo icono de categoria para los 6-8 items de esa
 * categoria (todo "Muebles" con el mismo sillon, por ejemplo), este resolver
 * busca palabras clave en el NOMBRE del producto para elegir un emoji mas
 * especifico y reconocible. Si en el futuro se carga un image_url de verdad,
 * la UI lo usa a el primero — esto es solo el respaldo.
 */

const KEYWORD_ICONS: Array<[RegExp, string]> = [
  // Habitacion
  [/unicornio/i, "🦄"],
  [/robot/i, "🤖"],
  [/cama/i, "🛏️"],
  [/cuartel|tecnol[oó]gic/i, "🛏️"],
  [/vestido/i, "👗"],
  [/traje blindado|blindad/i, "🛡️"],
  [/corona/i, "👑"],
  [/gorro de fiesta/i, "🎉"],
  [/capa/i, "🦸"],
  [/castillo/i, "🏰"],
  [/ciudad nocturna/i, "🌃"],
  [/trofeos/i, "🏆"],
  // Libros / extras (biblioteca)
  [/diploma/i, "🎓"],
  [/sticker/i, "🌟"],
  [/libro/i, "📖"],
  // Estudio
  [/l[aá]mpara/i, "💡"],
  [/globo terr[aá]queo/i, "🌍"],
  [/pizarra/i, "🪄"],
  [/planta/i, "🪴"],
  [/escritorio/i, "🖥️"],
  [/silla/i, "🪑"],
  [/estanter[ií]a/i, "🥇"],
  // Jardin
  [/set de flores|flores/i, "💐"],
  [/casita del [aá]rbol/i, "🏡"],
  [/pelota/i, "⚽"],
  [/columpio/i, "🛝"],
  [/bicicleta/i, "🚲"],
  [/trampol[ií]n/i, "🤸"],
];

export function resolveItemIcon(name: string, fallback: string): string {
  for (const [pattern, icon] of KEYWORD_ICONS) {
    if (pattern.test(name)) return icon;
  }
  return fallback;
}
