import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Thai, Noto_Serif_Thai, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Body: IBM Plex Sans Thai. Display (engraved feel): Source Serif 4 + Noto Serif Thai. Serials & money: IBM Plex Mono.
const plex = IBM_Plex_Sans_Thai({ variable: "--font-plex", subsets: ["thai", "latin"], weight: ["300", "400", "500", "600"] });
const serif = Source_Serif_4({ variable: "--font-serif", subsets: ["latin"] });
const serifTh = Noto_Serif_Thai({ variable: "--font-serif-th", subsets: ["thai"] });
const mono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Tra · ตรา",
  description: "Thai invoice and tax-document backoffice",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plex.variable} ${serif.variable} ${serifTh.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
