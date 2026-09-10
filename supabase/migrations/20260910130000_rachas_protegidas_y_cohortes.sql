-- Motores de progreso, fase 3: la racha se protege, y el ranking compara
-- entre iguales.
--
-- Una racha que se pierde por una lesion, un viaje o un dia de descanso que
-- el propio plan programaba no mide constancia: mide mala suerte. Tres reglas
-- la protegen, y el ranking deja de enfrentar a un juvenil con un senior.

-- ---------------------------------------------------------------------------
-- 1. Pausas de racha: lesion o viaje las escribe quien gestiona alumnos; el
-- comodin lo usa el propio alumno, con un limite que cuenta la base.
-- ---------------------------------------------------------------------------
create table public.streak_pauses (
  student_id uuid not null references public.students (id) on delete cascade,
  from_day date not null,
  to_day date not null check (to_day >= from_day),
  reason text not null check (reason in ('injury', 'travel', 'wildcard')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (student_id, from_day)
);

alter table public.streak_pauses enable row level security;

create policy "las pausas las lee el equipo tecnico y el propio alumno"
  on public.streak_pauses for select to authenticated
  using (exists (
    select 1 from public.students t
    where t.id = streak_pauses.student_id
      and (public.is_crew_staff(t.crew_id) or t.profile_id = (select auth.uid()))
  ));

grant select on public.streak_pauses to authenticated;

-- Un comodin cubre UN dia. Se gana uno por cada ocho semanas seguidas con al
-- menos una sesion, hasta dos acumulados, y los gastados en las ultimas
-- dieciseis semanas se descuentan. No hay contador que envejezca: se cuenta
-- cada vez.
create or replace function public.weeks_in_a_row(student uuid, asof date default current_date)
returns integer
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  weeks integer := 0;
  week_start date := date_trunc('week', asof)::date;
begin
  while exists (
    select 1 from public.sessions s
    where s.student_id = student and s.status = 'completed' and s.result is not null
      and (s.result ->> 'completedAt')::date >= week_start
      and (s.result ->> 'completedAt')::date < week_start + 7
  ) loop
    weeks := weeks + 1;
    week_start := week_start - 7;
    exit when weeks >= 104;
  end loop;
  return weeks;
end;
$function$;

create or replace function public.wildcards_available(student uuid)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $function$
  select greatest(0,
    least(2, public.weeks_in_a_row(student) / 8)
    - (select count(*)::integer from public.streak_pauses p
       where p.student_id = student and p.reason = 'wildcard'
         and p.from_day >= current_date - 112)
  );
$function$;

create or replace function public.pause_streak(student uuid, from_day date, to_day date, pause_reason text)
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
  if pause_reason not in ('injury', 'travel') then
    raise exception 'invalidReference' using errcode = 'foreign_key_violation';
  end if;

  insert into public.streak_pauses (student_id, from_day, to_day, reason, created_by)
  values (student, from_day, to_day, pause_reason, (select auth.uid()))
  on conflict (student_id, from_day) do update set
    to_day = excluded.to_day,
    reason = excluded.reason,
    created_by = excluded.created_by,
    created_at = now();
end;
$function$;

create or replace function public.use_streak_wildcard(student uuid, day date)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Solo el propio alumno, y solo para un dia ya pasado: cubrir el futuro
  -- seria pausar, y eso es del entrenador.
  if not exists (
    select 1 from public.students t where t.id = student and t.profile_id = (select auth.uid())
  ) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  if day >= current_date then
    raise exception 'invalidReference' using errcode = 'foreign_key_violation';
  end if;
  if public.wildcards_available(student) <= 0 then
    raise exception 'noWildcards';
  end if;

  insert into public.streak_pauses (student_id, from_day, to_day, reason, created_by)
  values (student, day, day, 'wildcard', (select auth.uid()))
  on conflict (student_id, from_day) do nothing;
end;
$function$;

grant execute on function public.wildcards_available(uuid) to authenticated;
grant execute on function public.pause_streak(uuid, date, date, text) to authenticated;
grant execute on function public.use_streak_wildcard(uuid, date) to authenticated;
revoke execute on function public.weeks_in_a_row(uuid, date) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. La racha protegida, para que las insignias de racha miren la misma que
-- el alumno ve. Un dia sin entrenar no rompe si:
--   a) esta cubierto por una pausa, o
--   b) es descanso programado: no hay sesion ese dia y hay sesiones del
--      mismo volcado de plan antes y despues.
-- Ese dia no suma: se salta. La racha son dias entrenados.
-- ---------------------------------------------------------------------------
create or replace function public.protected_streak(student uuid, asof date)
returns integer
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  run integer := 0;
  cursor_day date := asof;
  looked integer := 0;
begin
  loop
    if exists (
      select 1 from public.sessions s
      where s.student_id = student and s.status = 'completed' and s.result is not null
        and (s.result ->> 'completedAt')::date = cursor_day
    ) then
      run := run + 1;
    elsif exists (
      select 1 from public.streak_pauses p
      where p.student_id = student and cursor_day between p.from_day and p.to_day
    ) then
      null;
    elsif not exists (
      select 1 from public.sessions s where s.student_id = student and s.date = cursor_day
    ) and exists (
      select 1 from public.sessions before_it
      join public.sessions after_it on after_it.assignment_id = before_it.assignment_id
      where before_it.student_id = student and before_it.assignment_id is not null
        and before_it.date < cursor_day and after_it.date > cursor_day
    ) then
      null;
    else
      exit;
    end if;

    cursor_day := cursor_day - 1;
    looked := looked + 1;
    exit when looked >= 400;
  end loop;

  return run;
end;
$function$;

grant execute on function public.protected_streak(uuid, date) to authenticated;

-- `evaluate_badges` mira la racha protegida. Se redefine entera: es la misma
-- funcion con `streak` calculado por `protected_streak`.
create or replace function public.evaluate_badges(student uuid, session uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  asof date;
  total_completed integer;
  total_sets integer;
  total_hours numeric;
  cardio_minutes numeric;
  with_weight integer;
  first_day date;
  in_first_month integer;
  in_last_30 integer;
  early_count integer;
  settled integer;
  settled_completed integer;
  streak integer;
  mondays integer;
  weeks_in_a_row integer;
  overload boolean;
  plan_done boolean;
  came_back boolean;
  cursor_day date;
  cursor_week date;
begin
  select (s.result ->> 'completedAt')::date into asof
  from public.sessions s where s.id = session and s.result is not null;
  if asof is null then
    return;
  end if;

  create temp table if not exists evaluated_days (day date primary key) on commit drop;
  -- `where true` porque la base corre con `pg-safeupdate`: un DELETE sin
  -- WHERE se rechaza aunque sea sobre una tabla temporal.
  delete from evaluated_days where true;
  insert into evaluated_days (day)
  select distinct (s.result ->> 'completedAt')::date
  from public.sessions s
  where s.student_id = student and s.status = 'completed' and s.result is not null
    and (s.result ->> 'completedAt')::date <= asof;

  select
    count(*),
    coalesce(sum((s.result ->> 'completedSets')::integer), 0),
    coalesce(sum((s.result ->> 'elapsedSeconds')::numeric), 0) / 3600,
    coalesce(sum(case when s.modality = 'cardio' then (s.result ->> 'elapsedSeconds')::numeric / 60 else 0 end), 0),
    count(*) filter (where exists (
      select 1 from jsonb_array_elements(coalesce(s.result -> 'sets', '[]'::jsonb)) x where x ? 'weightKg'
    )),
    min((s.result ->> 'completedAt')::date),
    count(*) filter (where (s.result ->> 'completedAt')::date >= asof - 29),
    count(*) filter (where s.time = time '08:00')
  into total_completed, total_sets, total_hours, cardio_minutes, with_weight, first_day, in_last_30, early_count
  from public.sessions s
  where s.student_id = student and s.status = 'completed' and s.result is not null
    and (s.result ->> 'completedAt')::date <= asof;

  select count(*) into in_first_month
  from public.sessions s
  where s.student_id = student and s.status = 'completed' and s.result is not null
    and (s.result ->> 'completedAt')::date between first_day and first_day + 29;

  select count(*), count(*) filter (where s.status = 'completed')
  into settled, settled_completed
  from public.sessions s
  where s.student_id = student and s.status in ('completed', 'cancelled') and s.date <= asof;

  -- LA RACHA PROTEGIDA: pausas y descansos programados no la rompen.
  streak := public.protected_streak(student, asof);

  mondays := 0;
  cursor_day := date_trunc('week', asof)::date;
  while exists (select 1 from evaluated_days d where d.day = cursor_day) loop
    mondays := mondays + 1;
    cursor_day := cursor_day - 7;
  end loop;

  weeks_in_a_row := 0;
  cursor_week := date_trunc('week', asof)::date;
  while exists (select 1 from evaluated_days d where d.day >= cursor_week and d.day < cursor_week + 7) loop
    weeks_in_a_row := weeks_in_a_row + 1;
    cursor_week := cursor_week - 7;
  end loop;

  with weekly as (
    select
      x ->> 'exerciseId' as exercise_id,
      date_trunc('week', (s.result ->> 'completedAt')::date)::date as week,
      max((x ->> 'weightKg')::numeric) as weight
    from public.sessions s,
         jsonb_array_elements(coalesce(s.result -> 'sets', '[]'::jsonb)) x
    where s.student_id = student and s.status = 'completed' and s.result is not null
      and (s.result ->> 'completedAt')::date <= asof
      and x ? 'weightKg'
    group by 1, 2
  ),
  chain as (
    select w.exercise_id, w.week, w.weight,
      lag(w.weight, 1) over (partition by w.exercise_id order by w.week) as w1,
      lag(w.weight, 2) over (partition by w.exercise_id order by w.week) as w2,
      lag(w.weight, 3) over (partition by w.exercise_id order by w.week) as w3,
      lag(w.week, 3) over (partition by w.exercise_id order by w.week) as week3
    from weekly w
  )
  select exists (
    select 1 from chain c
    where c.week = date_trunc('week', asof)::date
      and c.week3 = c.week - 21
      and c.weight > c.w1 and c.w1 > c.w2 and c.w2 > c.w3
  ) into overload;

  select exists (
    select 1 from public.sessions me
    where me.id = session and me.assignment_id is not null
      and not exists (
        select 1 from public.sessions o
        where o.assignment_id = me.assignment_id and o.status in ('pending', 'confirmed')
      )
      and (select count(*) from public.sessions o
           where o.assignment_id = me.assignment_id and o.status = 'completed') >= 8
  ) into plan_done;

  with days as (
    select d.day, lag(d.day) over (order by d.day) as previous_day from evaluated_days d
  ),
  gaps as (
    select day as return_day from days where previous_day is not null and day - previous_day >= 21
  )
  select exists (
    select 1 from gaps g
    where asof between g.return_day and g.return_day + 6
      and (select count(*) from public.sessions s
           where s.student_id = student and s.status = 'completed' and s.result is not null
             and (s.result ->> 'completedAt')::date between g.return_day and asof) >= 3
  ) into came_back;

  insert into public.student_badges (student_id, badge_code, unlocked_on, session_id)
  select student, code, asof, session
  from (values
    ('first-session',      total_completed >= 1),
    ('first-weight',       with_weight >= 1),
    ('iron-foundation',    in_first_month >= 12),
    ('cardio-hour',        cardio_minutes >= 60),
    ('perfect-week',       streak >= 7),
    ('never-miss-monday',  mondays >= 4),
    ('early-bird',         early_count >= 10),
    ('monthly-warrior',    in_last_30 > 20),
    ('habit-former',       streak >= 21),
    ('hundred-sets',       total_sets >= 100),
    ('ten-hours',          total_hours >= 10),
    ('overload-architect', overload),
    ('comeback',           came_back),
    ('iron-will',          case when settled < 10 then false else settled_completed::numeric / settled >= 0.9 end),
    ('eight-weeks',        weeks_in_a_row >= 8),
    ('thousand-sets',      total_sets >= 1000),
    ('full-plan',          plan_done),
    ('unstoppable',        streak >= 50),
    ('legend',             streak >= 100),
    ('persistence',        weeks_in_a_row >= 52)
  ) as rules (code, met)
  where met
  on conflict (student_id, badge_code) do nothing;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. La cohorte con nombre, y el ranking por cohorte.
--
--   youth   < 18 · adult 18-45 · senior > 45 · null sin fecha
--
-- El ranking acepta una cohorte: solo compara entre iguales. Sin ella, todo
-- el equipo, que es lo que ve el entrenador. La edad no sale de aqui: sale
-- el nombre de la cohorte, y solo el propio alumno y el equipo tecnico
-- pueden leer la fecha.
-- ---------------------------------------------------------------------------
create or replace function public.cohort_of(student uuid)
returns text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select case
    when t.birth_date is null then null
    when age(current_date, t.birth_date) < interval '18 years' then 'youth'
    when age(current_date, t.birth_date) > interval '45 years' then 'senior'
    else 'adult'
  end
  from public.students t
  where t.id = student;
$function$;

grant execute on function public.cohort_of(uuid) to authenticated;

drop function if exists public.crew_ranking(uuid, text);

create or replace function public.crew_ranking(crew uuid, period text, cohort text default null)
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
    coalesce(sum(sc.points), 0)::bigint as experience,
    count(sc.session_id)::bigint as completed_sessions
  from public.students t
  left join public.session_scores sc
    on sc.student_id = t.id
   and (since is null or sc.completed_on >= since)
  where t.crew_id = crew
    and t.membership_status in ('active', 'invited')
    and (cohort is null or public.cohort_of(t.id) = cohort)
  group by t.id, t.first_name, t.last_name, t.photo_url
  order by experience desc, t.first_name, t.last_name;
end;
$function$;

grant execute on function public.crew_ranking(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Tiempo real: una pausa cambia la racha que el alumno esta mirando.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.streak_pauses;
alter table public.streak_pauses replica identity full;
