-- =====================================================================
-- PORTAL DULLIMP — schema completo (versão consolidada e idempotente)
-- ---------------------------------------------------------------------
-- Recria o backend inteiro num projeto Supabase novo: tabelas, RLS, hook
-- de cadastro, funções de métricas e as três categorias iniciais.
--
-- Como aplicar:
--   Supabase Studio > SQL Editor > cole tudo > Run
--   (ou `supabase db push` se estiver usando a CLI)
--
-- Modelo de acesso, em uma frase: TODO o conteúdo é privado. Só lê quem
-- está autenticado E autorizado (distribuidor na allowlist ou gestor em
-- `editores`). A barreira real é a RLS deste arquivo — o hook de cadastro
-- e o proxy do Next são conveniência de interface.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Categorias (Treinamentos, Artes e Materiais, Produtos — extensíveis)
-- ---------------------------------------------------------------------
create table if not exists public.categorias (
  slug        text primary key,
  nome        text not null,
  descricao   text not null default '',
  cor         text not null default 'cinza',
  icone       text not null default 'estrela',
  ordem       integer not null default 100,
  created_at  timestamptz not null default now()
);

comment on table public.categorias is
  'Categorias do Portal Dullimp. Novas categorias podem ser criadas pelo painel sem deploy.';
comment on column public.categorias.cor is
  'Token de paleta lido por aparenciaCategoria() em src/lib/categorias.ts.';
comment on column public.categorias.icone is
  'Nome do ícone SVG desenhado em src/components/ui/Icones.tsx.';

-- O Tailwind precisa enxergar a classe inteira no código-fonte, então a
-- paleta é finita por natureza. Mantenha estes CHECKs em sincronia com
-- `PALETA` e `ICONES` em src/lib/categorias.ts.
alter table public.categorias drop constraint if exists categorias_cor_valida;
alter table public.categorias add constraint categorias_cor_valida
  check (cor in ('navy', 'verde', 'terracota', 'cinza'));

alter table public.categorias drop constraint if exists categorias_icone_valido;
alter table public.categorias add constraint categorias_icone_valido
  check (icone in ('play', 'imagem', 'frasco', 'documento', 'megafone', 'estrela'));

-- ---------------------------------------------------------------------
-- 2. Links (a unidade de conteúdo: um cartão que leva a uma URL externa)
-- ---------------------------------------------------------------------
create table if not exists public.links (
  id               uuid primary key default gen_random_uuid(),
  titulo           text not null,
  url              text not null,
  categoria        text not null references public.categorias(slug) on update cascade,
  descricao        text not null default '',
  thumb_url        text,
  status           text not null default 'rascunho'
                     check (status in ('rascunho', 'publicado')),
  ordem            integer not null default 100,
  data_publicacao  date not null default current_date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Só links web. Barra `javascript:` e afins já no banco.
  constraint links_url_http check (url ~* '^https?://'),
  constraint links_thumb_http check (thumb_url is null or thumb_url ~* '^https?://')
);

comment on table public.links is
  'Links externos (YouTube, Drive, Canva...) organizados por categoria para os distribuidores.';

create index if not exists links_status_categoria_idx
  on public.links (status, categoria, ordem);
create index if not exists links_data_idx
  on public.links (data_publicacao desc);

create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists links_updated_at on public.links;
create trigger links_updated_at
  before update on public.links
  for each row execute function public.tocar_updated_at();

-- ---------------------------------------------------------------------
-- 3. Eventos de analytics (sem dado pessoal: nem e-mail, nem user_id)
-- ---------------------------------------------------------------------
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  tipo        text not null,  -- pageview | click | busca | filtro_categoria
  alvo        text,           -- nome do botão/elemento ou termo buscado
  link_id     uuid references public.links(id) on delete set null,
  categoria   text,
  path        text,
  session_id  text,           -- UUID aleatório de sessão, sem PII
  referrer    text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

comment on table public.events is
  'Eventos de uso. Nenhum dado pessoal é gravado (sem IP, sem e-mail, sem user_id).';

create index if not exists events_created_idx      on public.events (created_at desc);
create index if not exists events_tipo_created_idx on public.events (tipo, created_at desc);
create index if not exists events_link_idx         on public.events (link_id);
create index if not exists events_alvo_idx         on public.events (alvo);

-- ---------------------------------------------------------------------
-- 4. Allowlist de gestores (quem entra no /admin)
--    A coluna `papel` fica reservada para níveis de permissão futuros.
-- ---------------------------------------------------------------------
create table if not exists public.editores (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  nome       text,
  papel      text not null default 'editor',
  created_at timestamptz not null default now()
);

comment on table public.editores is
  'Allowlist dos gestores Dullimp que acessam o painel /admin.';

create or replace function public.eh_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.editores e where e.user_id = auth.uid());
$$;

-- Não há "primeiro gestor automático": ninguém vira gestor sozinho. Gestor
-- entra só por INSERT nesta tabela, feito por quem já administra o projeto
-- (ver README, "Gestores"). A função de bootstrap das versões anteriores é
-- removida aqui e em 0003_travar_gestores.sql.
drop function if exists public.reivindicar_primeiro_editor();

-- ---------------------------------------------------------------------
-- 5. Allowlist de distribuidores (quem pode criar conta e ler o conteúdo)
-- ---------------------------------------------------------------------
create table if not exists public.distribuidores_autorizados (
  email      text primary key,
  nome       text,
  cnpj       text,
  created_at timestamptz not null default now(),
  -- Guardado sempre em minúsculas: é assim que o JWT e o hook comparam.
  constraint distribuidores_email_minusculo check (email = lower(btrim(email))),
  constraint distribuidores_email_formato check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

comment on table public.distribuidores_autorizados is
  'E-mails que a Dullimp liberou. Só eles conseguem se cadastrar e ler o portal.';

-- Distribuidor autorizado = o e-mail do usuário logado está na allowlist.
-- O e-mail vem do JWT, que só existe depois do login — e o login só acontece
-- depois que o e-mail foi confirmado (mantenha "Confirm email" ligado).
create or replace function public.eh_distribuidor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.distribuidores_autorizados d
    where d.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------
-- 6. Hook "Before User Created" — barra cadastro fora da allowlist
--
-- ATIVE NO DASHBOARD: Authentication > Hooks > Before user created >
-- Postgres > public.hook_restringir_signup.
--
-- É conveniência de UX (a pessoa recebe "e-mail não autorizado" na hora, em
-- vez de criar uma conta que não enxerga nada). A barreira real continua
-- sendo a RLS abaixo: mesmo sem o hook, uma conta fora da allowlist lê zero
-- linhas.
-- ---------------------------------------------------------------------
create or replace function public.hook_restringir_signup(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  endereco text := lower(btrim(coalesce(event -> 'user' ->> 'email', '')));
begin
  if endereco <> '' and (
       exists (select 1 from public.distribuidores_autorizados d where d.email = endereco)
    or exists (select 1 from public.editores e where lower(e.email) = endereco)
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Email não autorizado. Use o email cadastrado na Dullimp.'
    )
  );
end;
$$;

-- =====================================================================
-- 7. Row Level Security
--    Nada é legível para `anon`. Conteúdo só para distribuidor autorizado
--    ou gestor; escrita só para gestor.
-- =====================================================================
alter table public.categorias                 enable row level security;
alter table public.links                      enable row level security;
alter table public.events                     enable row level security;
alter table public.editores                   enable row level security;
alter table public.distribuidores_autorizados enable row level security;

-- Categorias: leitura para quem está logado (não mais `anon`).
drop policy if exists categorias_leitura_publica on public.categorias;
drop policy if exists categorias_leitura_autenticado on public.categorias;
create policy categorias_leitura_autenticado on public.categorias
  for select to authenticated using (true);

drop policy if exists categorias_gestao_editor on public.categorias;
create policy categorias_gestao_editor on public.categorias
  for all to authenticated using (public.eh_editor()) with check (public.eh_editor());

-- Links: distribuidor lê só o publicado; gestor lê tudo (inclusive rascunho).
drop policy if exists links_leitura on public.links;
create policy links_leitura on public.links
  for select to authenticated
  using (
    (status = 'publicado' and public.eh_distribuidor())
    or public.eh_editor()
  );

drop policy if exists links_gestao_editor on public.links;
create policy links_gestao_editor on public.links
  for all to authenticated using (public.eh_editor()) with check (public.eh_editor());

-- Gestores: só gestor enxerga a lista.
drop policy if exists editores_leitura on public.editores;
create policy editores_leitura on public.editores
  for select to authenticated using (public.eh_editor());

-- Distribuidores: leitura e gestão só para gestor.
drop policy if exists distribuidores_gestao_editor on public.distribuidores_autorizados;
create policy distribuidores_gestao_editor on public.distribuidores_autorizados
  for all to authenticated using (public.eh_editor()) with check (public.eh_editor());

-- Eventos: SELECT só para gestor; INSERT para quem está logado, só os tipos
-- conhecidos e com limites de tamanho (a rota /api/eventos também valida).
drop policy if exists events_leitura_editor on public.events;
create policy events_leitura_editor on public.events
  for select to authenticated using (public.eh_editor());

drop policy if exists events_insercao_anonima on public.events;
drop policy if exists events_insercao_autenticado on public.events;
create policy events_insercao_autenticado on public.events
  for insert to authenticated
  with check (
    tipo in ('pageview', 'click', 'busca', 'filtro_categoria')
    and coalesce(length(alvo), 0) <= 120
    and coalesce(length(path), 0) <= 300
    and coalesce(length(session_id), 0) <= 64
  );

-- =====================================================================
-- 8. Funções de métricas (SECURITY INVOKER — passam pela RLS de `events`,
--    então só devolvem dados para gestor)
-- =====================================================================
drop function if exists public.metricas_serie_diaria(integer);
create function public.metricas_serie_diaria(dias integer default 30)
returns table (dia date, pageviews bigint, cliques bigint, visitantes bigint)
language sql stable security invoker set search_path = public
as $$
  select
    d::date                                     as dia,
    count(*) filter (where e.tipo = 'pageview') as pageviews,
    count(*) filter (where e.tipo = 'click')    as cliques,
    count(distinct e.session_id)                as visitantes
  from generate_series(current_date - (greatest(dias, 1) - 1), current_date, interval '1 day') as d
  left join public.events e
    on e.created_at >= d and e.created_at < d + interval '1 day'
  group by d
  order by d;
$$;

-- Totais do período. "visitantes" precisa ser o número de sessões distintas
-- no período inteiro — somar os distintos de cada dia contaria duas vezes
-- quem voltou.
drop function if exists public.metricas_totais(integer);
create function public.metricas_totais(dias integer default 30)
returns table (pageviews bigint, cliques_links bigint, cliques bigint, buscas bigint, visitantes bigint)
language sql stable security invoker set search_path = public
as $$
  select
    count(*) filter (where e.tipo = 'pageview'),
    count(*) filter (where e.tipo = 'click' and e.link_id is not null),
    count(*) filter (where e.tipo = 'click'),
    count(*) filter (where e.tipo = 'busca'),
    count(distinct e.session_id)
  from public.events e
  where e.created_at >= current_date - (greatest(dias, 1) - 1);
$$;

create or replace function public.metricas_top_links(dias integer default 30, limite integer default 10)
returns table (link_id uuid, titulo text, categoria text, url text, cliques bigint)
language sql stable security invoker set search_path = public
as $$
  select l.id, l.titulo, l.categoria, l.url, count(*) as cliques
  from public.events e
  join public.links l on l.id = e.link_id
  where e.tipo = 'click'
    and e.created_at >= current_date - (greatest(dias, 1) - 1)
  group by l.id, l.titulo, l.categoria, l.url
  order by cliques desc, l.titulo
  limit greatest(limite, 1);
$$;

-- Cliques em links agrupados pela categoria registrada no momento do clique
-- (sobrevive à exclusão do link).
create or replace function public.metricas_cliques_por_categoria(dias integer default 30)
returns table (categoria text, nome text, cliques bigint)
language sql stable security invoker set search_path = public
as $$
  select e.categoria, coalesce(c.nome, e.categoria) as nome, count(*) as cliques
  from public.events e
  left join public.categorias c on c.slug = e.categoria
  where e.tipo = 'click'
    and e.link_id is not null
    and e.categoria is not null
    and e.created_at >= current_date - (greatest(dias, 1) - 1)
  group by e.categoria, c.nome
  order by cliques desc;
$$;

create or replace function public.metricas_por_botao(dias integer default 30)
returns table (alvo text, cliques bigint)
language sql stable security invoker set search_path = public
as $$
  select coalesce(e.alvo, '(sem nome)') as alvo, count(*) as cliques
  from public.events e
  where e.tipo = 'click' and e.created_at >= current_date - (greatest(dias, 1) - 1)
  group by 1
  order by cliques desc;
$$;

create or replace function public.metricas_buscas(dias integer default 30, limite integer default 15)
returns table (termo text, ocorrencias bigint)
language sql stable security invoker set search_path = public
as $$
  select e.alvo as termo, count(*) as ocorrencias
  from public.events e
  where e.tipo = 'busca'
    and e.alvo is not null
    and length(trim(e.alvo)) > 0
    and e.created_at >= current_date - (greatest(dias, 1) - 1)
  group by e.alvo
  order by ocorrencias desc
  limit greatest(limite, 1);
$$;

-- ---------------------------------------------------------------------
-- 9. Permissões de execução
--    Nada para `anon`. `authenticated` precisa de EXECUTE em eh_editor() e
--    eh_distribuidor() porque as políticas de RLS as avaliam no contexto de
--    quem consulta. O hook só pode ser chamado pelo servidor de Auth.
-- ---------------------------------------------------------------------
revoke execute on function public.eh_editor()                                 from public, anon;
revoke execute on function public.eh_distribuidor()                           from public, anon;
revoke execute on function public.hook_restringir_signup(jsonb)               from public, anon, authenticated;
revoke execute on function public.metricas_serie_diaria(integer)              from public, anon;
revoke execute on function public.metricas_totais(integer)                    from public, anon;
revoke execute on function public.metricas_top_links(integer, integer)        from public, anon;
revoke execute on function public.metricas_cliques_por_categoria(integer)     from public, anon;
revoke execute on function public.metricas_por_botao(integer)                 from public, anon;
revoke execute on function public.metricas_buscas(integer, integer)           from public, anon;

grant execute on function public.eh_editor()                                 to authenticated;
grant execute on function public.eh_distribuidor()                           to authenticated;
grant execute on function public.hook_restringir_signup(jsonb)               to supabase_auth_admin;
grant execute on function public.metricas_serie_diaria(integer)              to authenticated;
grant execute on function public.metricas_totais(integer)                    to authenticated;
grant execute on function public.metricas_top_links(integer, integer)        to authenticated;
grant execute on function public.metricas_cliques_por_categoria(integer)     to authenticated;
grant execute on function public.metricas_por_botao(integer)                 to authenticated;
grant execute on function public.metricas_buscas(integer, integer)           to authenticated;

-- Defesa em profundidade: `anon` não tem nada a fazer nestas tabelas.
revoke all on public.categorias, public.links, public.events,
              public.editores, public.distribuidores_autorizados from anon;

-- =====================================================================
-- 10. Categorias iniciais da Dullimp
--     Os links de exemplo estão em 0002_dados_de_exemplo.sql.
-- =====================================================================
insert into public.categorias (slug, nome, descricao, cor, icone, ordem) values
  ('treinamentos', 'Treinamentos',
   'Lives e vídeos de treinamento: produto, aplicação, técnica de venda e atendimento.',
   'navy', 'play', 1),
  ('artes-e-materiais', 'Artes e Materiais',
   'Artes de post, stories, catálogos e materiais prontos para divulgar a Dullimp.',
   'terracota', 'imagem', 2),
  ('produtos', 'Produtos',
   'Fichas técnicas, fotos, lançamentos e informações de cada produto da linha.',
   'verde', 'frasco', 3)
on conflict (slug) do update
  set nome      = excluded.nome,
      descricao = excluded.descricao,
      cor       = excluded.cor,
      icone     = excluded.icone,
      ordem     = excluded.ordem;
