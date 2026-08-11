import type { MetadataRoute } from "next";

const SITE_URL = "https://academia-magica-oficial.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL + "/", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: SITE_URL + "/matricula", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: SITE_URL + "/condiciones-matricula", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: SITE_URL + "/privacidad", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
