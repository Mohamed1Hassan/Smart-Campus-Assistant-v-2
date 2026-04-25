import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/admin/"],
    },
    sitemap: "https://thebes-academy-portal.vercel.app/sitemap.xml",
  };
}
