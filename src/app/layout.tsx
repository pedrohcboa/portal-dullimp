import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

/**
 * Tipografia da marca (manual Dullimp).
 * - Satoshi Bold: títulos e nome. Não existe no Google Fonts, então vem
 *   self-hosted de `public/fonts/` (baixado do Fontshare — licença FFL em
 *   `public/fonts/FFL.txt`). O Medium entra para os números do painel.
 * - Inter: texto corrido, botões e labels.
 */
const satoshi = localFont({
  variable: "--font-satoshi",
  src: [
    { path: "../../public/fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Portal Dullimp",
    template: "%s · Portal Dullimp",
  },
  description:
    "Central de conteúdo dos distribuidores Dullimp: treinamentos, artes, materiais e produtos num lugar só.",
  applicationName: "Portal Dullimp",
  // NÃO DIVULGAÇÃO: o conteúdo é privado dos distribuidores. Bloqueamos
  // indexação em todo o site (não há sitemap — ver src/app/robots.ts).
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  referrer: "strict-origin-when-cross-origin",
};

export const viewport: Viewport = {
  themeColor: "#163A5F",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${satoshi.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        {/* Tráfego agregado (visitantes, pageviews, origens). O detalhe por
            link vem da nossa tabela `events` — ver src/lib/analytics.ts. */}
        <Analytics />
      </body>
    </html>
  );
}
