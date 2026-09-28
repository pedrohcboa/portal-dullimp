"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Seções da página de Administrador. "Links" fica ativa também em
 * `/admin/nova` e `/admin/editar/...`, que são partes dela.
 */
const ABAS = [
  { rotulo: "Links", href: "/admin", tambem: ["/admin/nova", "/admin/editar"] },
  { rotulo: "Categorias", href: "/admin/categorias", tambem: [] },
  { rotulo: "Distribuidores", href: "/admin/distribuidores", tambem: [] },
  { rotulo: "Métricas", href: "/admin/metricas", tambem: [] },
] as const;

export function NavegacaoPainel() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções do painel" className="-mb-px flex gap-1 overflow-x-auto">
      {ABAS.map((aba) => {
        const ativa =
          pathname === aba.href ||
          (aba.href !== "/admin" && pathname.startsWith(`${aba.href}/`)) ||
          aba.tambem.some((p) => pathname.startsWith(p));

        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? "page" : undefined}
            className={cn(
              "border-b-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors",
              ativa
                ? "border-brand-terracotta text-brand-navy"
                : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
