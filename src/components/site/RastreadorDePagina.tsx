"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { eventos } from "@/lib/analytics";

/**
 * Registra um `pageview` a cada mudança de rota.
 *
 * É o que alimenta os cartões de "visitantes" e "páginas vistas" do painel de
 * métricas — o Vercel Web Analytics mede a mesma coisa, mas não expõe os dados
 * para dentro do nosso dashboard.
 */
export function RastreadorDePagina() {
  const pathname = usePathname();
  const ultimo = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || ultimo.current === pathname) return;
    ultimo.current = pathname;
    eventos.pageview(pathname);
  }, [pathname]);

  return null;
}
