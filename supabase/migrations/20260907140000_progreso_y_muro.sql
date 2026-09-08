-- Fase 5: progreso, ranking y muro.
--
-- EL PROGRESO NO TIENE TABLA. Experiencia, nivel, racha y logros se derivan de
-- las sesiones en el cliente, y se quedan asi: nada calculado se guarda, y
-- corregir una sesion corrige el progreso. Lo unico que sube al servidor es el
-- RANKING, y sube por RLS, no por rendimiento: necesita las sesiones de todos
-- los alumnos del equipo, y un alumno no puede leer las de los demas.

-- ---------------------------------------------------------------------------
-- Muro: anuncios y «me gusta», como tabla aparte.
--
-- Cierra el TODO de `CrewPost.likedBy`: la lista de quien dio «me gusta» no
-- viaja nunca. Al cliente le llegan dos campos calculados para quien pregunta:
-- cuantos, y si esta el.
-- ---------------------------------------------------------------------------
create table public.crew_posts (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  author_profile_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index crew_posts_crew_idx on public.crew_posts (crew_id, created_at desc);

create table public.crew_post_likes (
  post_id uuid not null references public.crew_posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

-- Cuando miro el muro por ultima vez, para el contador de no leidos en la
-- entrada de navegacion del equipo -lo barato que la deuda dejo escrito-.
create table public.crew_wall_reads (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  crew_id uuid not null references public.crews (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (profile_id, crew_id)
);

alter table public.crew_posts enable row level security;
alter table public.crew_post_likes enable row level security;
alter table public.crew_wall_reads enable row level security;

create policy "el muro lo leen los miembros" on public.crew_posts for select to authenticated
  using (public.is_crew_member(crew_id));
create policy "publica quien tiene crew.wall" on public.crew_posts for insert to authenticated
  with check (public.has_capability(crew_id, 'crew.wall') and author_profile_id = (select auth.uid()));
create policy "un anuncio lo borra quien tiene crew.wall" on public.crew_posts for delete to authenticated
  using (public.has_capability(crew_id, 'crew.wall'));

create policy "los me gusta los ven los miembros" on public.crew_post_likes for select to authenticated
  using (exists (select 1 from public.crew_posts p where p.id = post_id and public.is_crew_member(p.crew_id)));
create policy "cada uno da y quita su me gusta" on public.crew_post_likes for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (
    profile_id = (select auth.uid())
    and exists (select 1 from public.crew_posts p where p.id = post_id and public.is_crew_member(p.crew_id))
  );

create policy "cada uno lleva su propia marca de leido" on public.crew_wall_reads for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and public.is_crew_member(crew_id));

grant select, insert, delete on public.crew_posts to authenticated;
grant select, insert, delete on public.crew_post_likes to authenticated;
grant select, insert, update, delete on public.crew_wall_reads to authenticated;

-- Lo que viaja al cliente. `security_invoker`: la vista respeta las politicas
-- de las tablas de debajo, asi que un no miembro no ve nada por aqui.
create view public.crew_posts_view
with (security_invoker = true)
as
select
  p.id, p.crew_id, p.author_profile_id, p.body, p.created_at,
  (select count(*) from public.crew_post_likes l where l.post_id = p.id) as like_count,
  exists (
    select 1 from public.crew_post_likes l
    where l.post_id = p.id and l.profile_id = (select auth.uid())
  ) as liked_by_me
from public.crew_posts p;

grant select on public.crew_posts_view to authenticated;

-- Dar o quitar el «me gusta» en una sola llamada: quien mira no tiene por que
-- saber si ya lo dio.
create or replace function public.toggle_post_like(post uuid)
returns boolean
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  me uuid := (select auth.uid());
  liked boolean;
begin
  delete from public.crew_post_likes where post_id = post and profile_id = me;
  if found then
    return false;
  end if;
  insert into public.crew_post_likes (post_id, profile_id) values (post, me);
  liked := true;
  return liked;
end;
$function$;

revoke execute on function public.toggle_post_like(uuid) from public, anon;
grant execute on function public.toggle_post_like(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- El ranking del equipo. Solo agregados, y solo para quien pertenece.
--
-- La formula de la experiencia -veinte por sesion, una por serie hecha- es
-- `experience.ts`, en SQL. Es la segunda y ultima duplicacion que el plan
-- acepta, y va con su prueba de contrato.
-- ---------------------------------------------------------------------------
create or replace function public.crew_ranking(crew uuid, period text)
returns table (
  student_id uuid,
  first_name text,
  last_name text,
  photo_url text,
  experience bigint,
  completed_sessions bigint
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  since date;
begin
  if not public.is_crew_member(crew) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from public.crews c where c.id = crew and c.ranking_enabled) then
    return;
  end if;

  since := case period
    when 'week' then date_trunc('week', current_date)::date
    when 'month' then date_trunc('month', current_date)::date
    else null
  end;

  return query
  select
    t.id,
    t.first_name,
    t.last_name,
    t.photo_url,
    coalesce(sum(20 + coalesce((s.result ->> 'completedSets')::integer, 0)), 0)::bigint as experience,
    count(s.id)::bigint as completed_sessions
  from public.students t
  left join public.sessions s
    on s.student_id = t.id
   and s.status = 'completed'
   and s.result is not null
   and (since is null or (s.result ->> 'completedAt')::date >= since)
  where t.crew_id = crew
    and t.membership_status in ('active', 'invited')
  group by t.id, t.first_name, t.last_name, t.photo_url
  order by experience desc, t.first_name, t.last_name;
end;
$function$;

revoke execute on function public.crew_ranking(uuid, text) from public, anon;
grant execute on function public.crew_ranking(uuid, text) to authenticated;
