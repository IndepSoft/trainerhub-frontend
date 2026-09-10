-- Motores de progreso, fase 2: las rutas de desarrollo y la mano del entrenador.
--
-- Cada alumno recorre UNA ruta -Titan, Endurance, Apex, Vitality, Hybrid- con
-- cuatro nodos: Iniciacion, Consolidacion, Dominio, Maestro. Pasar de nodo
-- exige tres cosas a la vez: puntos acumulados en la ruta, semanas seguidas de
-- adherencia, y que el entrenador VALIDE el hito. Los numeros los cuenta la
-- base; la validacion es una fila que solo escribe quien gestiona alumnos.
--
-- Y con la validacion llegan las otras dos manos del entrenador: confirmar
-- las insignias de Platino y Diamante, y revisar una sesion marcada por un
-- salto de carga que no parece real.

-- ---------------------------------------------------------------------------
-- 1. El catalogo de rutas y sus nodos. De sistema: se siembra y no cambia.
-- ---------------------------------------------------------------------------
create table public.progress_routes (
  code text primary key,
  sort_order integer not null
);

insert into public.progress_routes (code, sort_order) values
  ('titan', 10),
  ('endurance', 20),
  ('apex', 30),
  ('vitality', 40),
  ('hybrid', 50);

-- Los nodos 2, 3 y 4 tienen criterio; el 1 es donde nace todo el mundo.
-- `node_position` y no `position`: es palabra clave de SQL y como alias de
-- columna es un error de sintaxis. Los
-- puntos son los acumulados DESDE que se entro en la ruta; las semanas, las
-- seguidas con adherencia de al menos el 85 % terminando en la actual.
create table public.route_nodes (
  route_code text not null references public.progress_routes (code),
  node_position integer not null check (node_position between 1 and 4),
  points_required integer not null check (points_required >= 0),
  weeks_required integer not null check (weeks_required >= 0),
  primary key (route_code, node_position)
);

insert into public.route_nodes (route_code, node_position, points_required, weeks_required)
select r.code, n.node_position, n.points_required, n.weeks_required
from public.progress_routes r
cross join (values
  (1, 0, 0),
  (2, 300, 4),
  (3, 1200, 6),
  (4, 3000, 8)
) as n (node_position, points_required, weeks_required);

-- Que ruta activa cada objetivo del catalogo. Un plan de hipertrofia mete al
-- alumno en Titan sin que nadie elija nada; el entrenador puede cambiarlo.
--
-- SIN clave foranea a `training_objectives`: ese catalogo lo siembra
-- `seed.sql`, que corre DESPUES de las migraciones, y en un Supabase recien
-- levantado la referencia no existiria todavia. Un objetivo que no este en el
-- mapa cae en Hybrid; el mapa no necesita que la base lo vigile.
create table public.route_objectives (
  objective_id text primary key,
  route_code text not null references public.progress_routes (code)
);

insert into public.route_objectives (objective_id, route_code) values
  ('hipertrofia', 'titan'),
  ('fuerza-maxima', 'titan'),
  ('resistencia-muscular', 'endurance'),
  ('perdida-grasa', 'vitality'),
  ('acondicionamiento', 'vitality');

alter table public.progress_routes enable row level security;
alter table public.route_nodes enable row level security;
alter table public.route_objectives enable row level security;
create policy "las rutas las lee cualquiera identificado" on public.progress_routes for select to authenticated using (true);
create policy "los nodos los lee cualquiera identificado" on public.route_nodes for select to authenticated using (true);
create policy "el mapa de objetivos lo lee cualquiera identificado" on public.route_objectives for select to authenticated using (true);
grant select on public.progress_routes, public.route_nodes, public.route_objectives to authenticated;

-- ---------------------------------------------------------------------------
-- 2. La ruta elegida a mano, y las validaciones de hito.
-- ---------------------------------------------------------------------------
create table public.student_routes (
  student_id uuid primary key references public.students (id) on delete cascade,
  route_code text not null references public.progress_routes (code),
  chosen_by uuid references public.profiles (id) on delete set null,
  since timestamptz not null default now()
);

create table public.milestone_validations (
  student_id uuid not null references public.students (id) on delete cascade,
  route_code text not null references public.progress_routes (code),
  node_position integer not null check (node_position between 2 and 4),
  validated_by uuid not null references public.profiles (id) on delete cascade,
  validated_at timestamptz not null default now(),
  notes text not null default '' check (length(notes) <= 300),
  primary key (student_id, route_code, node_position)
);

alter table public.student_routes enable row level security;
alter table public.milestone_validations enable row level security;

create policy "la ruta la lee el equipo tecnico y el propio alumno"
  on public.student_routes for select to authenticated
  using (exists (
    select 1 from public.students t
    where t.id = student_routes.student_id
      and (public.is_crew_staff(t.crew_id) or t.profile_id = (select auth.uid()))
  ));

create policy "las validaciones las lee el equipo tecnico y el propio alumno"
  on public.milestone_validations for select to authenticated
  using (exists (
    select 1 from public.students t
    where t.id = milestone_validations.student_id
      and (public.is_crew_staff(t.crew_id) or t.profile_id = (select auth.uid()))
  ));

-- Sin politicas de escritura: se escribe por las funciones de abajo, que
-- comprueban la capacidad.
grant select on public.student_routes, public.milestone_validations to authenticated;

-- ---------------------------------------------------------------------------
-- 3. La ruta de un alumno: la elegida a mano, o la del objetivo de su ultimo
-- plan asignado, o Hybrid.
-- ---------------------------------------------------------------------------
create or replace function public.route_of_student(student uuid)
returns text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    (select r.route_code from public.student_routes r where r.student_id = student),
    (select o.route_code
     from public.assignments a
     join public.plans p on p.id = a.plan_id
     join public.route_objectives o on o.objective_id = p.objective_id
     where a.student_id = student and a.kind = 'plan'
     order by a.assigned_on desc
     limit 1),
    'hybrid'
  );
$function$;

-- Desde cuando cuentan los puntos de la ruta: desde que se eligio a mano, o
-- desde siempre si se deriva del plan.
create or replace function public.route_since(student uuid)
returns date
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    (select r.since::date from public.student_routes r where r.student_id = student),
    date '1900-01-01'
  );
$function$;

-- ---------------------------------------------------------------------------
-- 4. Semanas seguidas de adherencia, terminando en la semana en curso.
--
-- Una semana es adherente si cerro al menos el 85 % de lo que tenia
-- decidido: cerradas sobre cerradas mas canceladas mas las que quedaron sin
-- hacer y ya pasaron. Una semana sin nada programado no rompe la cadena ni la
-- alarga: no se decidio nada.
-- ---------------------------------------------------------------------------
create or replace function public.adherent_weeks(student uuid, asof date default current_date)
returns integer
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  weeks integer := 0;
  week_start date := date_trunc('week', asof)::date;
  decided integer;
  done integer;
  looked integer := 0;
begin
  loop
    select
      count(*) filter (where s.status in ('completed', 'cancelled') or (s.status in ('pending', 'confirmed') and s.date < asof)),
      count(*) filter (where s.status = 'completed')
    into decided, done
    from public.sessions s
    where s.student_id = student
      and s.date >= week_start and s.date < week_start + 7;

    if decided > 0 then
      if done::numeric / decided >= 0.85 then
        weeks := weeks + 1;
      else
        exit;
      end if;
    end if;

    week_start := week_start - 7;
    looked := looked + 1;
    -- Mas alla de un año no hace falta mirar: el nodo mas alto pide ocho.
    exit when looked >= 60;
  end loop;

  return weeks;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 5. Donde esta cada alumno en su ruta. Calculado, nunca almacenado: un
-- contador guardado se desincroniza al primer cambio.
-- ---------------------------------------------------------------------------
create or replace function public.route_progress(student uuid)
returns table (
  route_code text,
  node_position integer,
  points integer,
  adherent_weeks integer,
  validated_positions integer[]
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  route text;
  earned integer;
  weeks integer;
  validated integer[];
  node integer := 1;
  next_node public.route_nodes%rowtype;
begin
  if not exists (
    select 1 from public.students t
    where t.id = student and (public.is_crew_staff(t.crew_id) or t.profile_id = (select auth.uid()))
  ) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  route := public.route_of_student(student);
  select coalesce(sum(sc.points), 0) into earned
  from public.session_scores sc
  where sc.student_id = student and sc.completed_on >= public.route_since(student);
  weeks := public.adherent_weeks(student);
  select coalesce(array_agg(v.node_position order by v.node_position), '{}') into validated
  from public.milestone_validations v
  where v.student_id = student and v.route_code = route;

  -- Se sube nodo a nodo mientras el siguiente cumpla las tres cosas.
  loop
    select * into next_node from public.route_nodes n where n.route_code = route and n.node_position = node + 1;
    exit when not found;
    exit when earned < next_node.points_required
           or weeks < next_node.weeks_required
           or not (next_node.node_position = any (validated));
    node := node + 1;
  end loop;

  return query select route, node, earned, weeks, validated;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 6. Lo que escribe el entrenador. Cada funcion comprueba la capacidad; no
-- hay politicas de escritura que puedan quedar mas abiertas que esto.
-- ---------------------------------------------------------------------------
create or replace function public.choose_route(student uuid, route text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  crew uuid;
begin
  select t.crew_id into crew from public.students t where t.id = student;
  if crew is null then
    raise exception 'notFound' using errcode = 'no_data_found';
  end if;
  if not public.has_capability(crew, 'students.manage') then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from public.progress_routes r where r.code = route) then
    raise exception 'invalidReference' using errcode = 'foreign_key_violation';
  end if;

  insert into public.student_routes (student_id, route_code, chosen_by, since)
  values (student, route, (select auth.uid()), now())
  on conflict (student_id) do update set
    route_code = excluded.route_code,
    chosen_by = excluded.chosen_by,
    since = now();
end;
$function$;

create or replace function public.validate_milestone(student uuid, route text, node integer, validation_notes text default '')
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  crew uuid;
  validations integer;
begin
  select t.crew_id into crew from public.students t where t.id = student;
  if crew is null then
    raise exception 'notFound' using errcode = 'no_data_found';
  end if;
  if not public.has_capability(crew, 'students.manage') then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  insert into public.milestone_validations (student_id, route_code, node_position, validated_by, notes)
  values (student, route, node, (select auth.uid()), coalesce(validation_notes, ''))
  on conflict (student_id, route_code, node_position) do nothing;

  -- El sello del entrenador: cinco hitos validados, en cualquier ruta.
  select count(*) into validations from public.milestone_validations v where v.student_id = student;
  if validations >= 5 then
    insert into public.student_badges (student_id, badge_code, unlocked_on, session_id)
    values (student, 'coach-seal', current_date, null)
    on conflict (student_id, badge_code) do nothing;
  end if;
end;
$function$;

create or replace function public.validate_badge(student uuid, code text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  crew uuid;
begin
  select t.crew_id into crew from public.students t where t.id = student;
  if crew is null then
    raise exception 'notFound' using errcode = 'no_data_found';
  end if;
  if not public.has_capability(crew, 'students.manage') then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  update public.student_badges b
  set validated_by = (select auth.uid()), validated_at = now()
  where b.student_id = student and b.badge_code = code and b.validated_at is null;
  if not found then
    raise exception 'notFound' using errcode = 'no_data_found';
  end if;
end;
$function$;

grant execute on function public.route_progress(uuid) to authenticated;
grant execute on function public.choose_route(uuid, text) to authenticated;
grant execute on function public.validate_milestone(uuid, text, integer, text) to authenticated;
grant execute on function public.validate_badge(uuid, text) to authenticated;
revoke execute on function public.route_of_student(uuid) from public, anon, authenticated;
revoke execute on function public.route_since(uuid) from public, anon, authenticated;
revoke execute on function public.adherent_weeks(uuid, date) from public, anon, authenticated;

-- El sello del entrenador entra en el catalogo. Platino, y no pide validacion
-- porque LO DA una validacion.
insert into public.badge_definitions (code, rarity, category, requires_validation, sort_order)
values ('coach-seal', 'platinum', 'technique', false, 185);

-- ---------------------------------------------------------------------------
-- 7. El salto de carga. Un 20 % mas que la mediana de cuatro semanas en un
-- ejercicio no parece una progresion: se marca, el progreso se queda en 1,00
-- y el entrenador decide. Si lo acepta, la sesion se repuntua confiando en la
-- carga. Es una heuristica de una linea sobre datos que ya se guardan, y se
-- parece mas a lo que hace un entrenador que un modelo.
-- ---------------------------------------------------------------------------
alter table public.session_scores
  add column flagged_reason text check (flagged_reason in ('load_jump')),
  add column reviewed_by uuid references public.profiles (id) on delete set null,
  add column reviewed_at timestamptz;

create or replace function public.load_jump_in(session uuid)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  target public.sessions%rowtype;
  completed_on date;
  jumped boolean;
begin
  select * into target from public.sessions s where s.id = session;
  if not found or target.result is null or target.student_id is null then
    return false;
  end if;
  completed_on := (target.result ->> 'completedAt')::date;

  with own as (
    select s ->> 'exerciseId' as exercise_id, max((s ->> 'weightKg')::numeric) as weight
    from jsonb_array_elements(coalesce(target.result -> 'sets', '[]'::jsonb)) s
    where s ? 'weightKg'
    group by 1
  ),
  previous as (
    select p.id, ps ->> 'exerciseId' as exercise_id, max((ps ->> 'weightKg')::numeric) as weight
    from public.sessions p, jsonb_array_elements(coalesce(p.result -> 'sets', '[]'::jsonb)) ps
    where p.student_id = target.student_id and p.id <> target.id
      and p.status = 'completed' and p.result is not null
      and (p.result ->> 'completedAt')::date < completed_on
      and (p.result ->> 'completedAt')::date >= completed_on - 28
      and ps ? 'weightKg'
    group by p.id, 2
  ),
  baseline as (
    select exercise_id, percentile_cont(0.5) within group (order by weight) as weight
    from previous group by exercise_id
  )
  select exists (
    select 1 from own o join baseline b on b.exercise_id = o.exercise_id
    where o.weight > b.weight * 1.2
  ) into jumped;

  return jumped;
end;
$function$;

-- `score_session` gana el salto: marcado, el progreso vale 1,00 hasta que el
-- entrenador lo acepte. Aceptar repuntua con `trust_jump`.
create or replace function public.score_session(session uuid, trust_jump boolean default false)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  target public.sessions%rowtype;
  planned numeric;
  done numeric;
  base_value numeric;
  adherence_value numeric;
  progress_value numeric;
  cohort_value numeric;
  points_value integer;
  jumped boolean;
begin
  select * into target from public.sessions s where s.id = session;
  if not found or target.status <> 'completed' or target.result is null or target.student_id is null then
    return;
  end if;

  if target.modality = 'cardio' then
    planned := target.duration_minutes;
    done := (target.result ->> 'elapsedSeconds')::numeric / 60;
    base_value := 20 + least(done, planned) / 5;
  else
    planned := coalesce((target.result ->> 'totalSets')::numeric, 0);
    done := coalesce((target.result ->> 'completedSets')::numeric, 0);
    base_value := 20 + least(done, planned);
  end if;

  adherence_value := case
    when planned > 0 then least(1.10, greatest(0.80, round(done / planned, 2)))
    else 1.00
  end;
  jumped := (not trust_jump) and public.load_jump_in(session);
  progress_value := case when jumped then 1.00 else public.progress_factor(session) end;
  cohort_value := coalesce(public.cohort_factor(target.student_id), 1.00);
  points_value := round(base_value * adherence_value * progress_value * cohort_value)::integer;

  insert into public.session_scores (
    session_id, crew_id, student_id, completed_on,
    base, adherence, progress, cohort, points, rule_version, scored_at,
    flagged_reason, reviewed_by, reviewed_at
  ) values (
    target.id, target.crew_id, target.student_id, (target.result ->> 'completedAt')::date,
    round(base_value, 2), adherence_value, progress_value, cohort_value, points_value, 1, now(),
    case when jumped then 'load_jump' else null end,
    case when trust_jump then (select auth.uid()) else null end,
    case when trust_jump then now() else null end
  )
  on conflict (session_id) do update set
    crew_id = excluded.crew_id,
    student_id = excluded.student_id,
    completed_on = excluded.completed_on,
    base = excluded.base,
    adherence = excluded.adherence,
    progress = excluded.progress,
    cohort = excluded.cohort,
    points = excluded.points,
    rule_version = excluded.rule_version,
    scored_at = now(),
    flagged_reason = excluded.flagged_reason,
    reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at;
end;
$function$;

-- La firma anterior, de un argumento, deja de existir: el disparador y la
-- repuntuacion pasan por esta.
drop function if exists public.score_session(uuid);
revoke execute on function public.score_session(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.load_jump_in(uuid) from public, anon, authenticated;

create or replace function public.score_on_session_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.status = 'completed' and new.result is not null and new.student_id is not null then
    perform public.score_session(new.id, false);
    perform public.evaluate_badges(new.student_id, new.id);
  elsif tg_op = 'UPDATE' and old.status = 'completed' then
    delete from public.session_scores where session_id = new.id;
  end if;
  return new;
end;
$function$;

create or replace function public.accept_load_jump(session uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  crew uuid;
begin
  select s.crew_id into crew from public.sessions s where s.id = session;
  if crew is null then
    raise exception 'notFound' using errcode = 'no_data_found';
  end if;
  if not public.has_capability(crew, 'students.manage') then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  perform public.score_session(session, true);
end;
$function$;

grant execute on function public.accept_load_jump(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Tiempo real para lo que el entrenador escribe y el alumno mira.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.student_routes;
alter publication supabase_realtime add table public.milestone_validations;
alter table public.student_routes replica identity full;
alter table public.milestone_validations replica identity full;
