// Limpieza de texto compartida entre el chat del profesor (para lo que se
// muestra en pantalla) y /api/tts (para lo que se lee en voz alta). Vive
// separada porque la necesitan tanto un componente de cliente como una
// ruta de servidor.

// Saca formato tipo markdown (negrita, cursiva, codigo, encabezados,
// vinetas) que a veces el modelo agrega por costumbre aunque se le pida
// texto plano. Sin esto, el alumno ve literalmente "**Guten Morgen**" en
// la burbuja del chat en vez de texto limpio.
export function stripMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/`{1,3}([^`]*)`{1,3}/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/\s+/g, " ")
      .trim();
}
