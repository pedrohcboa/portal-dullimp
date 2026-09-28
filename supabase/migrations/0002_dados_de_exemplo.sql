-- =====================================================================
-- PORTAL DULLIMP — links de exemplo (opcional; editáveis pelo painel)
-- ---------------------------------------------------------------------
-- Quatro links-modelo para ver o portal com cara de pronto. Todos apontam
-- para example.com: troque pelas URLs reais (YouTube, Drive, Canva...) ou
-- exclua em /admin.
--
-- Este arquivo é a versão SQL de src/lib/seed-data.ts (o mesmo conteúdo que
-- o portal mostra quando o Supabase ainda não está conectado).
-- Requer 0001_schema_completo.sql aplicado antes.
-- =====================================================================

insert into public.links
  (id, titulo, url, categoria, descricao, status, ordem, data_publicacao)
values
  ('00000000-0000-4000-8000-000000000001',
   'Exemplo: live de treinamento — linha de limpeza pesada',
   'https://example.com/treinamento-limpeza-pesada',
   'treinamentos',
   'Gravação completa da live, com demonstração de aplicação e perguntas dos distribuidores.',
   'publicado', 1, date '2026-09-22'),
  ('00000000-0000-4000-8000-000000000002',
   'Exemplo: kit de artes para o feed do mês',
   'https://example.com/artes-feed',
   'artes-e-materiais',
   'Pasta com posts e stories prontos para baixar e publicar nas suas redes.',
   'publicado', 1, date '2026-09-18'),
  ('00000000-0000-4000-8000-000000000003',
   'Exemplo: catálogo de produtos em PDF',
   'https://example.com/catalogo',
   'produtos',
   'Catálogo completo da linha, para enviar a clientes pelo WhatsApp.',
   'publicado', 1, date '2026-09-15'),
  ('00000000-0000-4000-8000-000000000004',
   'Exemplo: ficha técnica de um lançamento',
   'https://example.com/ficha-tecnica',
   'produtos',
   'Diluição, rendimento e modo de uso resumidos em uma página.',
   'publicado', 2, date '2026-09-10')
on conflict (id) do nothing;
