-- Fase 4: la agenda y la sesion en vivo.
--
-- FECHA Y HORA SE GUARDAN COMO `date` Y `time`, NO COMO `timestamptz`. Una
-- sesion es «el martes a las nueve en el gimnasio»; convertirla a UTC y
-- devolverla la moveria de dia en cuanto alguien viajara. `crews.timezone`
-- existe desde la fase 1 para quien lo necesite calcular.
--
-- EL RESULTADO ES UN DOCUMENTO. `result` lleva las series medidas con la misma
-- forma que `SessionResult`; la progresion de cargas se reduce en el cliente a
-- partir de ahi, y ninguna consulta mira dentro. Plan, §1.2.

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  -- Nula en una sesion grupal.
  student_id uuid references public.students (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 120),
  kind text not null check (kind in ('individual', 'group')),
  modality text not null check (modality in ('strength', 'cardio')),
  category text not null default '',
  date date not null,
  time time not null,
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  location text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text not null default '',
  -- Si la rutina desaparece, la sesion se queda con lo que hizo: el historial
  -- no se borra porque cambie el programa.
  routine_id uuid references public.routines (id) on delete set null,
  -- La forma se comprueba con `is_valid_session_result`, declarada mas abajo y
  -- atada a la tabla con un `alter table`: la funcion tiene que existir antes
  -- que la restriccion que la usa.
  result jsonb,
  -- De que volcado de plan salio. Es lo que hoy no se guarda: sin esto no se
  -- pueden mover ni cancelar en bloque, y volcar dos veces duplica.
  assignment_id uuid references public.assignments (id) on delete set null,
  created_at timestamptz not null default now()
);

create index sessions_crew_date_idx on public.sessions (crew_id, date);
create index sessions_student_date_idx on public.sessions (student_id, date);
create index sessions_assignment_idx on public.sessions (assignment_id);

-- La forma de `SessionResult`: contadores, segundos, la fecha en que se cerro,
-- y opcionalmente las series medidas. Se comprueba lo que la entidad exige.
create or replace function public.is_valid_session_result(result jsonb)
returns boolean
language sql
immutable
as $function$
  select
    jsonb_typeof(result) = 'object'
    and coalesce((result ->> 'completedSets')::numeric, -1) >= 0
    and coalesce((result ->> 'totalSets')::numeric, -1) >= 0
    and coalesce((result ->> 'elapsedSeconds')::numeric, -1) >= 0
    and (result ->> 'completedAt') ~ '^\d{4}-\d{2}-\d{2}$'
    and (
      not (result ? 'sets')
      or (
        jsonb_typeof(result -> 'sets') = 'array'
        and not exists (
          select 1 from jsonb_array_elements(result -> 'sets') s
          where s ->> 'exerciseId' is null
             or coalesce((s ->> 'repsDone')::numeric, -1) < 0
             or coalesce((s ->> 'workSeconds')::numeric, -1) < 0
             or (s ? 'weightKg' and (s ->> 'weightKg')::numeric < 0)
        )
      )
    );
$function$;

alter table public.sessions
  add constraint sessions_result_valid
  check (result is null or public.is_valid_session_result(result));

alter table public.sessions enable row level security;

-- Las ve el equipo tecnico; cada alumno las suyas y las grupales de su equipo.
-- Es `crewScope.asStudent()`, como politica: dejar de ser la barrera de datos
-- es exactamente lo que estaba escrito en `container.ts`.
create policy "las sesiones las ve el equipo tecnico; el alumno, las suyas y las grupales"
  on public.sessions for select to authenticated
  using (
    public.is_crew_staff(crew_id)
    or (student_id is null and public.is_crew_member(crew_id))
    or exists (select 1 from public.students t where t.id = student_id and t.profile_id = (select auth.uid()))
  );

create policy "las sesiones las agenda quien tiene schedule.manage"
  on public.sessions for insert to authenticated
  with check (public.has_capability(crew_id, 'schedule.manage'));

-- Editar: quien lleva la agenda, o el alumno sobre la suya -que solo puede
-- cerrarla, ver el disparador-.
create policy "las sesiones las edita quien lleva la agenda; el alumno cierra la suya"
  on public.sessions for update to authenticated
  using (
    public.has_capability(crew_id, 'schedule.manage')
    or exists (select 1 from public.students t where t.id = student_id and t.profile_id = (select auth.uid()))
  )
  with check (
    public.has_capability(crew_id, 'schedule.manage')
    or exists (select 1 from public.students t where t.id = student_id and t.profile_id = (select auth.uid()))
  );

create policy "las sesiones las borra quien tiene schedule.manage"
  on public.sessions for delete to authenticated
  using (public.has_capability(crew_id, 'schedule.manage'));

-- Un alumno cierra su sesion y nada mas: estado a `completed` y su resultado.
-- Mover la fecha, cambiar el titulo o la rutina es cosa de quien lleva la
-- agenda.
create or replace function public.guard_session_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if public.has_capability(old.crew_id, 'schedule.manage') then
    return new;
  end if;

  if new.crew_id <> old.crew_id
     or new.student_id is distinct from old.student_id
     or new.title <> old.title
     or new.kind <> old.kind
     or new.modality <> old.modality
     or new.category <> old.category
     or new.date <> old.date
     or new.time <> old.time
     or new.duration_minutes <> old.duration_minutes
     or new.location <> old.location
     or new.notes <> old.notes
     or new.routine_id is distinct from old.routine_id
     or new.assignment_id is distinct from old.assignment_id
     or new.status <> 'completed' then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$function$;

create trigger sessions_guard_update
  before update on public.sessions
  for each row execute function public.guard_session_update();

grant select, insert, update, delete on public.sessions to authenticated;

-- ---------------------------------------------------------------------------
-- Cerrar una sesion: estado y resultado en UNA escritura.
--
-- Eran dos desde el cliente, y entre las dos cabia que la pantalla de la sesion
-- se quedara con una: completada sin resultado, o con resultado y pendiente.
-- ---------------------------------------------------------------------------
create or replace function public.complete_session(session uuid, session_result jsonb)
returns void
language plpgsql
security invoker
set search_path to 'public'
as $function$
begin
  update public.sessions
  set status = 'completed', result = session_result
  where id = session;

  if not found then
    raise exception 'notFound' using errcode = 'no_data_found';
  end if;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Volcar un plan a la agenda: todas las sesiones o ninguna, y cada una sabe de
-- que volcado salio.
-- ---------------------------------------------------------------------------
create or replace function public.create_sessions(batch jsonb, source_assignment uuid)
returns setof public.sessions
language plpgsql
security invoker
set search_path to 'public'
as $function$
begin
  return query
  insert into public.sessions (
    crew_id, student_id, title, kind, modality, category, date, time,
    duration_minutes, location, status, notes, routine_id, assignment_id
  )
  select
    (s ->> 'crew_id')::uuid,
    (s ->> 'student_id')::uuid,
    s ->> 'title',
    s ->> 'kind',
    s ->> 'modality',
    coalesce(s ->> 'category', ''),
    (s ->> 'date')::date,
    (s ->> 'time')::time,
    (s ->> 'duration_minutes')::integer,
    coalesce(s ->> 'location', ''),
    coalesce(s ->> 'status', 'pending'),
    coalesce(s ->> 'notes', ''),
    (s ->> 'routine_id')::uuid,
    source_assignment
  from jsonb_array_elements(batch) s
  returning *;
end;
$function$;

revoke execute on function public.complete_session(uuid, jsonb) from public, anon;
revoke execute on function public.create_sessions(jsonb, uuid) from public, anon;
grant execute on function public.complete_session(uuid, jsonb) to authenticated;
grant execute on function public.create_sessions(jsonb, uuid) to authenticated;
