import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://doost.tech",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://doost.tech/sign-in",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://doost.tech/sign-up",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
