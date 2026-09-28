"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";
import { BotaoSair } from "@/components/auth/BotaoSair";
import { LinkRastreado } from "./LinkRastreado";
import { IconeFechar, IconeMenu } from "@/components/ui/Icones";
import { cn } from "@/lib/utils";
import type { Categoria } from "@/lib/types";

/**
 * Header fixo da área do distribuidor.
 *
 * Fundo navy com texto branco. A navegação é a própria lista de categorias
 * (são poucas — cabem no menu). À direita, quem está logado e o "Sair"; o
 * gestor vê também o atalho para o painel de administração.
 */
export function Header({
  categorias,
  email,
  ehGestor = false,
}: {
  categorias: Categoria[];
  /** Ausente no modo demonstração (sem login). */
  email?: string;
  ehGestor?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  const navegacao = [
    { rotulo: "Início", href: "/", alvo: "nav_inicio" },
    ...categorias.map((c) => ({
      rotulo: c.nome,
      href: `/categorias/${c.slug}`,
      alvo: `nav_categoria_${c.slug}`,
    })),
  ];

  return (
    <header className="on-navy sticky top-0 z-50 bg-brand-navy text-white shadow-[0_1px_0_rgba(255,255,255,0.12)]">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-brand-navy"
      >
        Pular para o conteúdo
      </a>

      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:h-[4.5rem]">
        <Wordmark tom="claro" tamanho="sm" comoLink />

        <nav aria-label="Navegação principal" className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-1">
            {navegacao.map((item) => {
              const ativo = pathname === item.href;
              return (
                <li key={item.href}>
                  <LinkRastreado
                    href={item.href}
                    alvo={item.alvo}
                    aria-current={ativo ? "page" : undefined}
                    className={cn(
                      "relative block rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                      ativo ? "text-white" : "text-white/80 hover:text-white",
                    )}
                  >
                    {item.rotulo}
                    {ativo && (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-terracotta"
                      />
                    )}
                  </LinkRastreado>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {ehGestor && (
            <Link
              href="/admin"
              className="rounded-md px-2 py-1.5 text-sm font-semibold text-white/85 hover:text-white"
            >
              Administrador
            </Link>
          )}
          {email && (
            <>
              <span className="max-w-48 truncate text-xs text-white/70" title={email}>
                {email}
              </span>
              <BotaoSair area="distribuidor" compacto claro />
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls="menu-movel"
          className="ml-auto inline-flex size-10 items-center justify-center rounded-lg border border-white/25 lg:hidden"
        >
          <span className="sr-only">{aberto ? "Fechar menu" : "Abrir menu"}</span>
          {aberto ? <IconeFechar className="size-5" /> : <IconeMenu className="size-5" />}
        </button>
      </div>

      {/* Menu móvel */}
      <div
        id="menu-movel"
        hidden={!aberto}
        className="border-t border-white/15 bg-brand-navy-deep lg:hidden"
      >
        <nav aria-label="Navegação principal (móvel)">
          <ul className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            {navegacao.map((item) => (
              <li key={item.href}>
                <LinkRastreado
                  href={item.href}
                  alvo={`${item.alvo}_mobile`}
                  onClick={() => setAberto(false)}
                  className="block border-b border-white/10 px-2 py-3 text-base font-semibold text-white"
                >
                  {item.rotulo}
                </LinkRastreado>
              </li>
            ))}
            {ehGestor && (
              <li>
                <Link
                  href="/admin"
                  className="block border-b border-white/10 px-2 py-3 text-base font-semibold text-white"
                >
                  Administrador
                </Link>
              </li>
            )}
            {email && (
              <li className="flex items-center justify-between gap-3 px-2 pt-4 pb-2">
                <span className="truncate text-sm text-white/70">{email}</span>
                <BotaoSair area="distribuidor" compacto claro />
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
