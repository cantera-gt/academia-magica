import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/alumno/", "/api/", "/login"],
    },
    sitemap: "https://academia-magica-oficial.vercel.app/sitemap.xml",
    host: "https://academia-magica-oficial.vercel.app",
  };
}
