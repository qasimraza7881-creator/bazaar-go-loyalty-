const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bazaargo.example.com";

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/nearby`, lastModified: now, changeFrequency: "daily", priority: 0.8 }
  ];
}
