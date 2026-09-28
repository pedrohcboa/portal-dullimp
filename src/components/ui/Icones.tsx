import type { SVGProps } from "react";

/**
 * Ícones desenhados à mão em SVG inline.
 * Evitamos uma biblioteca de ícones inteira para manter o bundle pequeno —
 * são poucos símbolos e todos ficam aqui.
 */

type Props = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

/** Vídeo / live — Treinamentos. */
export function IconePlay(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9.2 5 2.8-5 2.8Z" />
    </svg>
  );
}

/** Imagem — Artes e Materiais. */
export function IconeImagem(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="9.5" r="1.8" />
      <path d="m21 16-5-5-8 9" />
    </svg>
  );
}

/** Frasco de produto — Produtos. */
export function IconeFrasco(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 2h4v3h-4z" />
      <path d="M9 5h6l1.6 3.2A6 6 0 0 1 17 11v8a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-8a6 6 0 0 1 .4-2.8Z" />
      <path d="M7 14h10" />
    </svg>
  );
}

/** Documento / PDF. */
export function IconeDocumento(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

/** Megafone. */
export function IconeMegafone(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11v2a2 2 0 0 0 2 2h2l7 4V5L7 9H5a2 2 0 0 0-2 2Z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
      <path d="M7 15v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

/** Estrela — fallback de categoria sem ícone escolhido. */
export function IconeEstrela(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
    </svg>
  );
}

export function IconeBusca(props: Props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function IconeSeta(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/** Abre em outro site (nova aba). */
export function IconeExterno(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

export function IconeCadeado(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconeMenu(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconeFechar(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/**
 * Desenha o ícone pelo nome guardado em `categorias.icone`.
 * Nome desconhecido (ou categoria sem escolha) cai na estrela.
 */
export function IconeCategoria({
  icone,
  ...props
}: Props & { icone: string }) {
  switch (icone) {
    case "play":
      return <IconePlay {...props} />;
    case "imagem":
      return <IconeImagem {...props} />;
    case "frasco":
      return <IconeFrasco {...props} />;
    case "documento":
      return <IconeDocumento {...props} />;
    case "megafone":
      return <IconeMegafone {...props} />;
    default:
      return <IconeEstrela {...props} />;
  }
}
