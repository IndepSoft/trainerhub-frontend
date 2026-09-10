-- Motores de progreso, fase 0: los datos que las reglas van a necesitar.
--
-- Antes de puntuar, evaluar insignias o abrir rutas hacen falta tres cosas que
-- la base no tenia: de que edad es cada alumno -de verdad, no un numero que
-- envejece solo-, como de duro fue cada serie, y un ranking que no regale
-- puntos a quien no entrena.

-- ---------------------------------------------------------------------------
-- 1. Fecha de nacimiento, en vez de edad.
--
-- `age` era un entero escrito a mano el dia del alta. Un año despues seguia
-- diciendo lo mismo, y con el la cohorte que va a ponderar la puntuacion. La
-- fecha se guarda una vez y la edad se calcula al leer.
--
-- LA CAMBIA EL PROPIO ALUMNO ademas de quien gestiona: es un dato suyo, como
-- su nombre y su foto, y el entrenador rara vez lo sabe. Por eso sale de la
-- lista de columnas que la guardia reserva a `students.manage`.
-- ---------------------------------------------------------------------------
alter table public.students
  add column birth_date date check (birth_date > date '1900-01-01');

comment on column public.students.birth_date is
  'La edad se deriva al leer. La escribe el alumno o quien gestiona alumnos; nunca se enseña a otros alumnos.';

create or replace function public.guard_student_update()
returns trigger
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  manages boolean;
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  manages := public.has_capability(old.crew_id, 'students.manage');

  if new.crew_id <> old.crew_id then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  if new.membership_status is distinct from old.membership_status
     and not public.has_capability(old.crew_id, 'crew.members') then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  if new.extra_capabilities is distinct from old.extra_capabilities
     and not public.has_capability(old.crew_id, 'crew.staff') then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  -- Sin `age`: ya no existe. `birth_date` no esta en la lista a proposito: es
  -- del alumno, como el nombre y la foto.
  if not manages and (
       new.email is distinct from old.email
    or new.level is distinct from old.level
    or new.goals is distinct from old.goals
    or new.body_fat_percentage is distinct from old.body_fat_percentage
    or new.profile_id is distinct from old.profile_id
  ) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$function$;

alter table public.students drop column age;

-- ---------------------------------------------------------------------------
-- 2. RPE por serie, opcional.
--
-- El esfuerzo percibido -1 a 10, 10 es el fallo- es lo que distingue una
-- mejora de carga real de una serie forzada. Es OPCIONAL: obligarlo encarece
-- cada serie y es lo que hace que se deje de anotar a la tercera semana. Sin
-- el, el progreso se mide solo con kilos.
-- ---------------------------------------------------------------------------
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
    -- `coalesce` porque una clave ausente da NULL, y NULL en un CHECK no es
    -- «falso»: es «no se sabe», y Postgres deja pasar la fila.
    and coalesce(result ->> 'completedAt', '') ~ '^\d{4}-\d{2}-\d{2}$'
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
             or (s ? 'rpe' and ((s ->> 'rpe')::numeric < 1 or (s ->> 'rpe')::numeric > 10))
        )
      )
    );
$function$;

-- ---------------------------------------------------------------------------
-- 3. El ranking no regala veinte puntos.
--
-- Con `left join` y `sum(20 + ...)`, un alumno sin ninguna sesion cerrada
-- salia con 20 puntos y 0 sesiones: la fila extendida a NULL entraba en la
-- suma. Dos componentes lo tapaban filtrando `completedSessions > 0`. Un motor
-- que lea `experience` directamente arrastraria 20 puntos por miembro ocioso.
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
    coalesce(sum(
      case when s.id is null then 0
           else 20 + coalesce((s.result ->> 'completedSets')::integer, 0)
      end
    ), 0)::bigint as experience,
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
