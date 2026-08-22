const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bazaar-go-loyalty.vercel.app";

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/nearby`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/promo`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/refund`, lastModified: now, changeFrequency: "yearly", priority: 0.3 }
  ];
}
