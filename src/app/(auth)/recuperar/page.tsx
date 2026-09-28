import type { Metadata } from "next";
import { FormularioRecuperacao } from "@/components/auth/FormularioRecuperacao";

export const metadata: Metadata = { title: "Recuperar acesso" };

export default function PaginaRecuperar() {
  return <FormularioRecuperacao area="distribuidor" />;
}
