import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Anuphan, Bai_Jamjuree, IBM_Plex_Mono, IBM_Plex_Sans_Thai, Noto_Serif_Thai, Sarabun, Source_Serif_4 } from "next/font/google";
import { isTheme, THEME_COOKIE } from "@/lib/themes";
import "./globals.css";

// Ledger (default): IBM Plex Sans Thai body, Source Serif 4 / Noto Serif Thai display, IBM Plex Mono figures.
const plex = IBM_Plex_Sans_Thai({ variable: "--font-plex", subsets: ["thai", "latin"], weight: ["300", "400", "500", "600"] });
const serif = Source_Serif_4({ variable: "--font-serif", subsets: ["latin"] });
const serifTh = Noto_Serif_Thai({ variable: "--font-serif-th", subsets: ["thai"] });
const mono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });
// Alternate themes: not preloaded, fetched only when a theme uses them.
const sarabun = Sarabun({ variable: "--font-sarabun", subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"], preload: false });
const anuphan = Anuphan({ variable: "--font-anuphan", subsets: ["thai", "latin"], preload: false });
const bai = Bai_Jamjuree({ variable: "--font-bai", subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"], preload: false });

export const metadata: Metadata = {
  title: "PersonalInvoice",
  description: "Thai invoice and tax-document backoffice",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const saved = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isTheme(saved) ? saved : "ledger";
  const fonts = [plex, serif, serifTh, mono, sarabun, anuphan, bai].map((f) => f.variable).join(" ");
  return (
    <html lang="en" data-theme={theme} className={`${fonts} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
