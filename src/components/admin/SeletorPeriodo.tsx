"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/** Períodos oferecidos no painel de métricas. */
export const PERIODOS = [
  { dias: 7, rotulo: "7 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
] as const;

/**
 * Seletor de período. Escreve o recorte na URL (`?dias=30`) para que o
 * relatório possa ser recarregado ou compartilhado internamente sem perder o
 * filtro escolhido.
 */
export function SeletorPeriodo({ atual }: { atual: number }) {
  const router = useRouter();

  return (
    <div
      role="group"
      aria-label="Período do relatório"
      className="inline-flex rounded-lg border border-line bg-surface p-1"
    >
      {PERIODOS.map((periodo) => (
        <button
          key={periodo.dias}
          type="button"
          aria-pressed={atual === periodo.dias}
          onClick={() => router.push(`/admin/metricas?dias=${periodo.dias}`)}
          className={cn(
            "rounded-md px-3.5 py-1.5 text-sm font-bold transition-colors",
            atual === periodo.dias
              ? "bg-brand-navy text-white"
              : "text-ink-muted hover:text-brand-navy",
          )}
        >
          {periodo.rotulo}
        </button>
      ))}
    </div>
  );
}
