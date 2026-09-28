import type { MetadataRoute } from "next";

/**
 * O Portal Dullimp é privado dos distribuidores: nada aqui deve ser indexado
 * nem divulgado publicamente. Não existe sitemap — todo o conteúdo fica atrás
 * do login.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
