"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { eventos } from "@/lib/analytics";

/**
 * `<Link>` interno que registra um evento de clique antes de navegar.
 *
 * Cada botão relevante do portal passa por aqui com um `alvo` estável (ex.:
 * `hero_cta_primary`, `categoria_card`), que é exatamente o rótulo que
 * aparece no ranking de cliques do painel de métricas.
 */
interface LinkRastreadoProps extends ComponentProps<typeof Link> {
  /** Nome do botão no relatório de métricas. Use snake_case e mantenha estável. */
  alvo: string;
  categoria?: string;
}

export function LinkRastreado({
  alvo,
  categoria,
  onClick,
  ...props
}: LinkRastreadoProps) {
  function aoClicar(e: MouseEvent<HTMLAnchorElement>) {
    eventos.clique(alvo, { categoria: categoria ?? null });
    onClick?.(e);
  }

  return <Link {...props} onClick={aoClicar} />;
}

/**
 * Link para fora do portal (abre em nova aba) — é o clique que importa aqui:
 * cada card de link passa por este componente com o `linkId`, e é isso que
 * alimenta "links mais clicados" e "cliques por categoria" no painel.
 *
 * `sendBeacon` garante que o evento sai mesmo com a navegação imediata.
 */
export function LinkExternoRastreado({
  alvo,
  href,
  linkId,
  categoria,
  children,
  className,
}: {
  alvo: string;
  href: string;
  /** Link do portal associado ao clique (`links.id`). */
  linkId?: string;
  categoria?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      // Botão do meio (nova aba) também é um uso do link.
      onAuxClick={(e) => {
        if (e.button === 1) {
          eventos.clique(alvo, { link_id: linkId ?? null, categoria: categoria ?? null });
        }
      }}
      onClick={() =>
        eventos.clique(alvo, { link_id: linkId ?? null, categoria: categoria ?? null })
      }
    >
      {children}
    </a>
  );
}
