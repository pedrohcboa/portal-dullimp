"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { AREAS, type NomeArea } from "@/lib/areas";
import { classesBotao } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/** Encerra a sessão e devolve à tela de login da área. */
export function BotaoSair({
  area = "admin",
  compacto = false,
  claro = false,
}: {
  area?: NomeArea;
  compacto?: boolean;
  /** Versão para fundo navy (header do portal). */
  claro?: boolean;
}) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    try {
      await criarClienteNavegador().auth.signOut();
    } finally {
      router.replace(AREAS[area].login);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={saindo}
      className={
        claro
          ? cn(
              "rounded-lg border border-white/30 font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60",
              compacto ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
            )
          : classesBotao("fantasma", compacto ? "px-3 py-1.5 text-xs" : "")
      }
    >
      {saindo ? "Saindo…" : "Sair"}
    </button>
  );
}
