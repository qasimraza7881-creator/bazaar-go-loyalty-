const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bazaargo.example.com";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/nearby"],
        disallow: ["/login", "/dashboard", "/scan", "/card", "/api"]
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
