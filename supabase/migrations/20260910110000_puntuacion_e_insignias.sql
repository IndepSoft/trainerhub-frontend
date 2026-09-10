-- Motores de progreso, fase 1: la puntuacion y los desbloqueos viven en la base.
--
-- Hasta aqui todo el progreso se recalculaba en el cliente a partir de
-- `sessions.result`, sesion por sesion, en cada render: la experiencia (20 +
-- series) estaba escrita dos veces -TypeScript y `crew_ranking`-, los logros se
-- deducian repasando la historia dia a dia, y la celebracion enseñaba el ultimo
-- logro de siempre porque no habia con que comparar.
--
-- Ahora, igual que los permisos, LAS REGLAS LAS DECIDE LA BASE: cerrar una
-- sesion puntua y evalua insignias en la misma transaccion, por disparador, y
-- lo deja escrito. El cliente pinta. Un cliente modificado no se puntua a si
-- mismo, y cambiar la formula no reescribe la historia: cada puntuacion lleva
-- la version de la regla con la que se calculo.

-- ---------------------------------------------------------------------------
-- 1. El catalogo de insignias: metadatos, no reglas.
--
-- La REGLA de cada insignia vive en `evaluate_badges`, mas abajo, en codigo.
-- Esta tabla lleva lo que hace falta para que el cliente no pueda inventarse
-- una insignia que el servidor no conoce, y para que una prueba de contrato
-- compare este catalogo con el de presentacion de TypeScript por codigo.
-- ---------------------------------------------------------------------------
create table public.badge_definitions (
  code text primary key,
  rarity text not null check (rarity in ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'mythic')),
  category text not null check (category in ('streak', 'performance', 'technique', 'longevity', 'community')),
  -- Platino y Diamante nacen pendientes y las confirma el entrenador.
  requires_validation boolean not null default false,
  sort_order integer not null
);

alter table public.badge_definitions enable row level security;
create policy "el catalogo de insignias lo lee cualquiera identificado"
  on public.badge_definitions for select to authenticated using (true);
grant select on public.badge_definitions to authenticated;

insert into public.badge_definitions (code, rarity, category, requires_validation, sort_order) values
  ('first-session',      'bronze',   'performance', false, 10),
  ('first-weight',       'bronze',   'technique',   false, 20),
  ('iron-foundation',    'bronze',   'streak',      false, 30),
  ('cardio-hour',        'bronze',   'performance', false, 40),
  ('perfect-week',       'bronze',   'streak',      false, 50),
  ('never-miss-monday',  'bronze',   'streak',      false, 60),
  ('early-bird',         'silver',   'streak',      false, 70),
  ('monthly-warrior',    'silver',   'streak',      false, 80),
  ('habit-former',       'silver',   'streak',      false, 90),
  ('hundred-sets',       'silver',   'performance', false, 100),
  ('ten-hours',          'silver',   'longevity',   false, 110),
  ('overload-architect', 'silver',   'technique',   false, 120),
  ('comeback',           'silver',   'longevity',   false, 130),
  ('iron-will',          'gold',     'streak',      false, 140),
  ('eight-weeks',        'gold',     'longevity',   false, 150),
  ('thousand-sets',      'gold',     'performance', false, 160),
  ('full-plan',          'gold',     'technique',   false, 170),
  ('unstoppable',        'gold',     'streak',      false, 180),
  ('legend',             'platinum', 'streak',      true,  190),
  ('persistence',        'diamond',  'longevity',   true,  200);

-- ---------------------------------------------------------------------------
-- 2. La puntuacion de cada sesion, con su desglose.
--
-- Una fila por sesion cerrada con resultado. Los cuatro factores se guardan
-- ademas de los puntos para que la celebracion pueda explicar de donde salen
-- y para poder repuntuar a proposito. Nadie la escribe desde la API: la
-- escribe el disparador, con los privilegios de su dueño.
-- ---------------------------------------------------------------------------
create table public.session_scores (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  crew_id uuid not null references public.crews (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  -- El dia en que se entreno, `result.completedAt`, que es lo que ordena todo.
  completed_on date not null,
  base numeric(6, 2) not null check (base >= 0),
  adherence numeric(4, 2) not null check (adherence between 0.8 and 1.1),
  progress numeric(4, 2) not null check (progress between 1.0 and 1.15),
  cohort numeric(4, 2) not null check (cohort between 0.5 and 1.5),
  points integer not null check (points >= 0),
  rule_version integer not null,
  scored_at timestamptz not null default now()
);

create index session_scores_student_idx on public.session_scores (student_id, completed_on);
create index session_scores_crew_idx on public.session_scores (crew_id, completed_on);

alter table public.session_scores enable row level security;

create policy "la puntuacion la lee el equipo tecnico, cada alumno la suya, y la plataforma"
  on public.session_scores for select to authenticated
  using (
    public.is_crew_staff(crew_id)
    or exists (
      select 1 from public.students t
      where t.id = session_scores.student_id and t.profile_id = (select auth.uid())
    )
    or public.is_platform_admin((select auth.uid()))
  );

grant select on public.session_scores to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Las insignias conseguidas.
--
-- Persistidas, y es lo que hace que la celebracion sepa que es NUEVO: la
-- sesion que desbloqueo cada una queda escrita. Platino y Diamante nacen con
-- `validated_at` a NULL y las confirma quien gestiona alumnos (fase 2).
-- ---------------------------------------------------------------------------
create table public.student_badges (
  student_id uuid not null references public.students (id) on delete cascade,
  badge_code text not null references public.badge_definitions (code),
  unlocked_on date not null,
  session_id uuid references public.sessions (id) on delete set null,
  validated_by uuid references public.profiles (id) on delete set null,
  validated_at timestamptz,
  primary key (student_id, badge_code)
);

create index student_badges_session_idx on public.student_badges (session_id);

alter table public.student_badges enable row level security;

create policy "las insignias las lee el equipo tecnico, cada alumno las suyas, y la plataforma"
  on public.student_badges for select to authenticated
  using (
    exists (
      select 1 from public.students t
      where t.id = student_badges.student_id
        and (public.is_crew_staff(t.crew_id) or t.profile_id = (select auth.uid()))
    )
    or public.is_platform_admin((select auth.uid()))
  );

grant select on public.student_badges to authenticated;

-- ---------------------------------------------------------------------------
-- 4. La cohorte: de la fecha de nacimiento y el nivel, nunca de la edad suelta.
--
--   juvenil (< 18)             1,15  sensibilidad alta
--   adulto (18-45)             1,00
--   adulto avanzado (18-45)    0,85  nivel manual «Avanzado»
--   senior (> 45)              1,20  constancia y recuperacion
--
-- Sin fecha de nacimiento es 1,00: no se supone nada.
-- ---------------------------------------------------------------------------
create or replace function public.cohort_factor(student uuid)
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $function$
  select case
    when t.birth_date is null then 1.00
    when age(current_date, t.birth_date) < interval '18 years' then 1.15
    when age(current_date, t.birth_date) > interval '45 years' then 1.20
    when t.level = 'Avanzado' then 0.85
    else 1.00
  end
  from public.students t
  where t.id = student;
$function$;

-- ---------------------------------------------------------------------------
-- 5. La puntuacion. Regla version 1.
--
--   puntos     = base × adherencia × progreso × cohorte, redondeado
--   base       = 20 + min(series hechas, series previstas)         fuerza
--              = 20 + min(minutos, duracion prevista) / 5           cardio
--   adherencia = hecho / previsto, acotado a [0,80, 1,10]
--   progreso   = 1 + 0,15 × (ejercicios mejorados / ejercicios con referencia)
--   cohorte    = `cohort_factor`
--
-- LA ADHERENCIA SE ACOTA A 1,10 Y NO A 1,20: hacer mas series de las prescritas
-- no da mas puntos que cumplir el plan. Es la unica parte de la propuesta que
-- se reformula, y por su propio principio anti-burnout.
--
-- EL PROGRESO compara, por ejercicio con peso anotado, la mejor carga de esta
-- sesion con la mediana de las mejores cargas de las cuatro semanas anteriores.
-- Una mejora con RPE mayor que 8 en la serie que la logro no cuenta: es una
-- serie forzada, no una progresion. Sin referencia -primer mes, ejercicio
-- nuevo, sin kilos- el factor es 1,00: ni premia ni castiga.
-- ---------------------------------------------------------------------------
create or replace function public.progress_factor(session uuid)
returns numeric
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  target public.sessions%rowtype;
  completed_on date;
  with_baseline integer := 0;
  improved integer := 0;
begin
  select * into target from public.sessions s where s.id = session;
  if not found or target.result is null or target.student_id is null then
    return 1.00;
  end if;
  completed_on := (target.result ->> 'completedAt')::date;

  with own_sets as (
    select
      s ->> 'exerciseId' as exercise_id,
      (s ->> 'weightKg')::numeric as weight,
      (s ->> 'rpe')::numeric as rpe
    from jsonb_array_elements(coalesce(target.result -> 'sets', '[]'::jsonb)) s
    where s ? 'weightKg'
  ),
  maxima as (
    select exercise_id, max(weight) as weight from own_sets group by exercise_id
  ),
  best as (
    -- La mejor carga de la sesion por ejercicio, y si alguna de las series que
    -- la levantaron fue «limpia»: sin RPE anotado, o con RPE de 8 o menos.
    select m.exercise_id, m.weight, bool_or(o.rpe is null or o.rpe <= 8) as clean
    from maxima m
    join own_sets o on o.exercise_id = m.exercise_id and o.weight = m.weight
    group by m.exercise_id, m.weight
  ),
  previous as (
    -- Por sesion anterior del mismo alumno, la mejor carga de cada ejercicio,
    -- en las cuatro semanas previas al dia de esta sesion.
    select
      p.id as session_id,
      ps ->> 'exerciseId' as exercise_id,
      max((ps ->> 'weightKg')::numeric) as weight
    from public.sessions p,
         jsonb_array_elements(coalesce(p.result -> 'sets', '[]'::jsonb)) ps
    where p.student_id = target.student_id
      and p.id <> target.id
      and p.status = 'completed'
      and p.result is not null
      and (p.result ->> 'completedAt')::date < completed_on
      and (p.result ->> 'completedAt')::date >= completed_on - 28
      and ps ? 'weightKg'
    group by p.id, ps ->> 'exerciseId'
  ),
  baseline as (
    select exercise_id, percentile_cont(0.5) within group (order by weight) as weight
    from previous
    group by exercise_id
  )
  select
    count(*) filter (where b.weight is not null),
    count(*) filter (where b.weight is not null and best.weight > b.weight and best.clean)
  into with_baseline, improved
  from best
  left join baseline b on b.exercise_id = best.exercise_id;

  if with_baseline = 0 then
    return 1.00;
  end if;
  return round(1 + 0.15 * improved::numeric / with_baseline, 2);
end;
$function$;

create or replace function public.score_session(session uuid)
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
  progress_value := public.progress_factor(session);
  cohort_value := coalesce(public.cohort_factor(target.student_id), 1.00);
  points_value := round(base_value * adherence_value * progress_value * cohort_value)::integer;

  insert into public.session_scores (
    session_id, crew_id, student_id, completed_on,
    base, adherence, progress, cohort, points, rule_version, scored_at
  ) values (
    target.id, target.crew_id, target.student_id, (target.result ->> 'completedAt')::date,
    round(base_value, 2), adherence_value, progress_value, cohort_value, points_value, 1, now()
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
    scored_at = now();
end;
$function$;

-- ---------------------------------------------------------------------------
-- 6. Las insignias. Se evaluan al cerrar una sesion, con la historia hasta ese
-- dia; lo que ya esta desbloqueado no se vuelve a mirar.
--
-- Todo sale de `sessions` y `session_scores` del propio alumno: ninguna regla
-- mira a otra persona. `asof` es el dia de la sesion que se cierra, para que
-- la repuntuacion de la historia -al final de esta migracion- desbloquee cada
-- insignia el dia en que se consiguio, no hoy.
-- ---------------------------------------------------------------------------
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

  -- La historia hasta ese dia, una sola vez.
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

  -- Lo decidido hasta ese dia: cerradas y canceladas, no las pendientes.
  select count(*), count(*) filter (where s.status = 'completed')
  into settled, settled_completed
  from public.sessions s
  where s.student_id = student and s.status in ('completed', 'cancelled') and s.date <= asof;

  -- Racha que termina el dia de la sesion.
  streak := 0;
  cursor_day := asof;
  while exists (select 1 from evaluated_days d where d.day = cursor_day) loop
    streak := streak + 1;
    cursor_day := cursor_day - 1;
  end loop;

  -- Lunes seguidos, contando desde el ultimo lunes hasta ese dia.
  mondays := 0;
  cursor_day := date_trunc('week', asof)::date;
  while exists (select 1 from evaluated_days d where d.day = cursor_day) loop
    mondays := mondays + 1;
    cursor_day := cursor_day - 7;
  end loop;

  -- Semanas seguidas con al menos una sesion, terminando en la semana de asof.
  weeks_in_a_row := 0;
  cursor_week := date_trunc('week', asof)::date;
  while exists (select 1 from evaluated_days d where d.day >= cursor_week and d.day < cursor_week + 7) loop
    weeks_in_a_row := weeks_in_a_row + 1;
    cursor_week := cursor_week - 7;
  end loop;

  -- Sobrecarga: algun ejercicio cuya mejor carga semanal sube cuatro semanas
  -- seguidas, terminando en la semana de asof.
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

  -- Plan entero: la sesion cerrada viene de un volcado y no queda ninguna de
  -- ese volcado sin decidir, con al menos ocho cerradas.
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

  -- Regreso: un hueco de 21 dias o mas antes de esta vuelta, y desde el primer
  -- dia de la vuelta ya van tres sesiones en siete dias, contando esta.
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
-- 7. El disparador: cerrar una sesion puntua y evalua; reabrirla borra la
-- puntuacion. Se cuelga de `sessions` y no de `complete_session` para que
-- cualquier camino que cierre -la funcion, o un entrenador editando- cuente.
-- Una sesion grupal, sin alumno, no puntua a nadie.
-- ---------------------------------------------------------------------------
create or replace function public.score_on_session_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.status = 'completed' and new.result is not null and new.student_id is not null then
    perform public.score_session(new.id);
    perform public.evaluate_badges(new.student_id, new.id);
  elsif tg_op = 'UPDATE' and old.status = 'completed' then
    delete from public.session_scores where session_id = new.id;
  end if;
  return new;
end;
$function$;

create trigger sessions_score
  after insert or update of status, result, student_id on public.sessions
  for each row execute function public.score_on_session_change();

-- Solo los disparadores y la repuntuacion llaman a estas funciones.
revoke execute on function public.score_session(uuid) from public, anon, authenticated;
revoke execute on function public.evaluate_badges(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.progress_factor(uuid) from public, anon, authenticated;
revoke execute on function public.cohort_factor(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. El ranking suma puntos y deja de conocer la formula.
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
    coalesce(sum(sc.points), 0)::bigint as experience,
    count(sc.session_id)::bigint as completed_sessions
  from public.students t
  left join public.session_scores sc
    on sc.student_id = t.id
   and (since is null or sc.completed_on >= since)
  where t.crew_id = crew
    and t.membership_status in ('active', 'invited')
  group by t.id, t.first_name, t.last_name, t.photo_url
  order by experience desc, t.first_name, t.last_name;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 9. Tiempo real: la celebracion y el ranking escuchan lo que el servidor
-- escribe. Con identidad completa, como todo lo publicado.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.session_scores;
alter publication supabase_realtime add table public.student_badges;
alter table public.session_scores replica identity full;
alter table public.student_badges replica identity full;

-- ---------------------------------------------------------------------------
-- 10. La historia, puntuada con la regla 1, en orden: cada insignia se
-- desbloquea el dia en que se consiguio.
-- ---------------------------------------------------------------------------
do $$
declare
  row_record record;
begin
  for row_record in
    select s.id, s.student_id
    from public.sessions s
    where s.status = 'completed' and s.result is not null and s.student_id is not null
    order by (s.result ->> 'completedAt')::date, s.created_at, s.id
  loop
    perform public.score_session(row_record.id);
    perform public.evaluate_badges(row_record.student_id, row_record.id);
  end loop;
end
$$;
