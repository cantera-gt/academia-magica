import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/alumno/", "/api/", "/login"],
    },
    sitemap: "https://academiamagicaedu.com/sitemap.xml",
    host: "https://academiamagicaedu.com",
  };
}
