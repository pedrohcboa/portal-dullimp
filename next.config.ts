import type { NextConfig } from "next";

/**
 * Não há `images.remotePatterns`: as miniaturas dos links vêm de qualquer host
 * (YouTube, Drive, Canva...) e são exibidas com `<img>` simples, sem passar
 * pelo otimizador do `next/image`.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Reforça a não divulgação também no nível de cabeçalho, para
          // crawlers que ignoram o robots.txt.
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
