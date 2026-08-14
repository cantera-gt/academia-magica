import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Los SVG que usamos son ilustraciones propias (gemas de color, etc),
    // no contenido subido por usuarios, asi que es seguro permitirlos en
    // el optimizador de imagenes de Next.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
