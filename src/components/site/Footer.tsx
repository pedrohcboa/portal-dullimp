import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import type { Categoria } from "@/lib/types";

/**
 * Footer em colunas: marca, categorias e o aviso de uso restrito.
 */
export function Footer({ categorias }: { categorias: Categoria[] }) {
  const ano = new Date().getFullYear();

  return (
    <footer className="on-navy mt-24 bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Wordmark tom="claro" tamanho="md" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
              Central de conteúdo dos distribuidores Dullimp: treinamentos,
              artes, materiais e informações de produto, sempre atualizados
              pela Dullimp.
            </p>
          </div>

          <nav aria-labelledby="rodape-categorias">
            <h2
              id="rodape-categorias"
              className="text-xs font-bold tracking-[0.14em] text-white/60 uppercase"
            >
              Categorias
            </h2>
            <ul className="mt-4 space-y-2.5">
              {categorias.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/categorias/${c.slug}`}
                    className="text-sm text-white/85 transition-colors hover:text-white hover:underline"
                  >
                    {c.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 rounded-xl border border-white/20 bg-white/5 p-4 text-sm text-white/80">
          <strong className="font-semibold text-white">Uso exclusivo de distribuidores.</strong>{" "}
          O acesso é pessoal e ligado ao e-mail cadastrado na Dullimp. Não
          compartilhe sua senha nem o conteúdo interno do portal.
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {ano} Dullimp. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
