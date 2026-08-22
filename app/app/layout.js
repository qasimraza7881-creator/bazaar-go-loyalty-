import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bazaargo.example.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bazaar Go Loyalty — QR Loyalty Cards & Rewards for Local Shops",
    template: "%s | Bazaar Go Loyalty"
  },
  description:
    "Bazaar Go Loyalty QR-based digital loyalty card system hai jo local shops aur businesses ke liye bana hai. Customer sirf QR scan kare, stamps collect kare aur rewards paye — koi app install ya login zaroori nahi.",
  keywords: [
    "loyalty card app",
    "QR loyalty program",
    "digital stamp card",
    "customer rewards Pakistan",
    "Bazaar Go",
    "shop loyalty system",
    "local business rewards app"
  ],
  applicationName: "Bazaar Go Loyalty",
  authors: [{ name: "Bazaar Go" }],
  category: "business",
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true }
  },
  icons: {
    icon: "/icons/icon.svg",
    shortcut: "/icons/favicon.svg",
    apple: "/icons/icon.svg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bazaar Go"
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Bazaar Go Loyalty",
    title: "Bazaar Go Loyalty — QR Loyalty Cards & Rewards for Local Shops",
    description:
      "Scan. Collect. Reward. Local shops ke liye QR-based digital loyalty aur rewards platform — customer login ke baghair.",
    locale: "en_PK"
  },
  twitter: {
    card: "summary",
    title: "Bazaar Go Loyalty — QR Loyalty Cards & Rewards",
    description: "Scan. Collect. Reward. Local shops ke liye QR-based digital loyalty platform."
  }
};

export const viewport = {
  themeColor: "#a5152f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Bazaar Go Loyalty",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web, Android",
              description:
                "QR-based digital loyalty card and rewards platform for local shops and businesses.",
              offers: [
                { "@type": "Offer", name: "3 Months", price: "5000", priceCurrency: "PKR" },
                { "@type": "Offer", name: "6 Months", price: "12000", priceCurrency: "PKR" },
                { "@type": "Offer", name: "12 Months", price: "20000", priceCurrency: "PKR" }
              ]
            })
          }}
        />
      </body>
    </html>
  );
}
