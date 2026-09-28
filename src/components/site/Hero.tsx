import { LinkRastreado } from "./LinkRastreado";
import { IconeSeta } from "@/components/ui/Icones";

/**
 * Hero da home: o que é o portal em uma frase e dois CTAs nomeados
 * (rastreados como `hero_cta_primary` / `hero_cta_secondary`).
 * Tom do manual: limpo, técnico e direto.
 */
export function Hero() {
  return (
    <section className="on-navy relative overflow-hidden bg-brand-navy text-white">
      {/* Profundidade sutil no bloco navy, sem competir com o texto. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 size-[26rem] rounded-full bg-brand-green/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 size-[22rem] rounded-full bg-white/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-white/80 uppercase">
          <span aria-hidden className="size-2 rounded-full bg-brand-green" />
          Portal do Distribuidor
        </p>

        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.08] sm:text-5xl">
          Tudo o que a Dullimp preparou para você vender mais, num lugar só.
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
          Treinamentos, artes para as redes, catálogos e informações de produto.
          Escolha a categoria e abra o material direto na fonte.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <LinkRastreado
            href="/#categorias"
            alvo="hero_cta_primary"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-terracotta-deep px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-brand-terracotta-dark"
          >
            Ver categorias
            <IconeSeta className="size-4" />
          </LinkRastreado>

          <LinkRastreado
            href="/#todos"
            alvo="hero_cta_secondary"
            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/35 px-6 py-3.5 text-base font-bold text-white transition-colors hover:border-white hover:bg-white/10"
          >
            Buscar material
          </LinkRastreado>
        </div>
      </div>
    </section>
  );
}
