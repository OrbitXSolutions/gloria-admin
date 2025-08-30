import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Dashborad | Eleva Boutique 79",
    template: "%s | Eleva Boutique 79"
  },
  description: "Dashborad administration panel for Eleva Boutique 79.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" }
    ],
    apple: "/favicon.svg"
  },
  openGraph: {
    title: "Dashborad | Eleva Boutique 79",
    description: "Administrative dashboard for Eleva Boutique 79.",
    siteName: "Eleva Boutique 79",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashborad | Eleva Boutique 79",
    description: "Administrative dashboard for Eleva Boutique 79."
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Microsoft Clarity */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "s9rgl6ez1t");
          `}}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-[100dvh] bg-background antialiased`}>
        {children}
        <Toaster closeButton />
      </body>
    </html>
  );
}
