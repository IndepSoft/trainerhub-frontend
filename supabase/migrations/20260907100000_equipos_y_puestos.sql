-- Fase 1: equipos y puestos. La tenencia.
--
-- Sin equipo no hay ambito, y sin ambito la aplicacion esta vacia. Esta
-- migracion crea el equipo, el puesto de quien lo gobierna, y las dos funciones
-- sobre las que se apoyan TODAS las politicas que vienen despues:
-- `is_crew_member` para leer y `has_capability` para escribir.
--
-- Lo que hoy comprueba el navegador -`permissions.can`, `lastAdminBlocker`- pasa
-- a comprobarlo Postgres. El cliente lo sigue comprobando para no dejar pulsar
-- lo que va a fallar; el servidor es el que impide actuar.

-- ---------------------------------------------------------------------------
-- El vocabulario de capacidades, como tabla.
--
-- DUPLICA `CAPABILITIES_BY_ROLE` de `permissions.ts`, y es la unica duplicacion
-- que el plan acepta: una politica RLS no puede importar TypeScript. Va vigilada
-- por una prueba de contrato que compara la tabla con la constante.
-- ---------------------------------------------------------------------------
create table public.role_capabilities (
  role text not null check (role in ('admin', 'trainer', 'student')),
  capability text not null check (capability in (
    'crew.settings', 'crew.staff', 'crew.invite', 'crew.members', 'crew.wall',
    'training.manage', 'schedule.manage', 'students.manage'
  )),
  primary key (role, capability)
);

insert into public.role_capabilities (role, capability) values
  ('admin', 'crew.settings'), ('admin', 'crew.staff'), ('admin', 'crew.invite'),
  ('admin', 'crew.members'), ('admin', 'crew.wall'), ('admin', 'training.manage'),
  ('admin', 'schedule.manage'), ('admin', 'students.manage'),
  ('trainer', 'crew.invite'), ('trainer', 'crew.members'), ('trainer', 'crew.wall'),
  ('trainer', 'training.manage'), ('trainer', 'schedule.manage'), ('trainer', 'students.manage');

alter table public.role_capabilities enable row level security;
create policy "las capacidades por rol las lee cualquiera identificado"
  on public.role_capabilities for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Equipos.
-- ---------------------------------------------------------------------------
create table public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  denomination text not null check (denomination in (
    'Crew', 'Equipo', 'Tribu', 'Box', 'Gimnasio', 'Club', 'Escuela'
  )),
  -- Quien lo fundo. NO es quien lo gobierna: eso lo dicen los puestos.
  created_by uuid not null references public.profiles (id),
  join_token text not null unique,
  requires_approval boolean not null default true,
  ranking_enabled boolean not null default true,
  subscription_status text not null default 'pending'
    check (subscription_status in ('pending', 'active', 'suspended')),
  photo_url text,
  -- Las sesiones se agendan en hora local del gimnasio. Ver fase 4.
  timezone text not null default 'America/Lima',
  created_at timestamptz not null default now()
);

create table public.crew_staff (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('admin', 'trainer', 'student')),
  extra_capabilities text[] not null default '{}'
    check (extra_capabilities <@ array[
      'crew.settings', 'crew.staff', 'crew.invite', 'crew.members', 'crew.wall',
      'training.manage', 'schedule.manage', 'students.manage'
    ]::text[]),
  created_at timestamptz not null default now(),
  unique (crew_id, profile_id)
);

create index crew_staff_profile_id_idx on public.crew_staff (profile_id);

alter table public.crews enable row level security;
alter table public.crew_staff enable row level security;

-- ---------------------------------------------------------------------------
-- Las dos funciones de las que cuelga todo.
--
-- SECURITY DEFINER porque leen `crew_staff` desde dentro de una politica sobre
-- `crew_staff`: sin saltarse RLS entrarian en recursion. `search_path` fijado
-- por lo mismo que en `handle_new_user`.
--
-- En esta fase solo saben de puestos. La fase 2 las REEMPLAZA para que tambien
-- cuenten las fichas de alumno: pertenecer a un equipo es tener un puesto o una
-- ficha activa en el.
-- ---------------------------------------------------------------------------
create or replace function public.is_crew_member(crew uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1 from public.crew_staff s
    where s.crew_id = crew and s.profile_id = (select auth.uid())
  );
$function$;

create or replace function public.has_capability(crew uuid, capability text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.crew_staff s
    where s.crew_id = crew
      and s.profile_id = (select auth.uid())
      and (
        exists (
          select 1 from public.role_capabilities rc
          where rc.role = s.role and rc.capability = has_capability.capability
        )
        or has_capability.capability = any (s.extra_capabilities)
      )
  );
$function$;

revoke execute on function public.is_crew_member(uuid) from public, anon;
revoke execute on function public.has_capability(uuid, text) from public, anon;
grant execute on function public.is_crew_member(uuid) to authenticated;
grant execute on function public.has_capability(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Politicas.
-- ---------------------------------------------------------------------------
create policy "un equipo lo leen sus miembros, y la plataforma"
  on public.crews for select to authenticated
  using (public.is_crew_member(id) or public.is_platform_admin((select auth.uid())));

create policy "los ajustes del equipo los cambia quien tiene crew.settings"
  on public.crews for update to authenticated
  using (public.has_capability(id, 'crew.settings'))
  with check (public.has_capability(id, 'crew.settings'));

-- Crear un equipo NO es un insert: es `create_crew`, que ademas nombra al primer
-- administrador en la misma transaccion. Sin politica de insert, la tabla no
-- admite altas sueltas.

create policy "los puestos los leen los miembros del equipo, y la plataforma"
  on public.crew_staff for select to authenticated
  using (public.is_crew_member(crew_id) or public.is_platform_admin((select auth.uid())));

create policy "los puestos los da quien tiene crew.staff"
  on public.crew_staff for insert to authenticated
  with check (public.has_capability(crew_id, 'crew.staff'));

create policy "los puestos los cambia quien tiene crew.staff"
  on public.crew_staff for update to authenticated
  using (public.has_capability(crew_id, 'crew.staff'))
  with check (public.has_capability(crew_id, 'crew.staff'));

create policy "los puestos los quita quien tiene crew.staff"
  on public.crew_staff for delete to authenticated
  using (public.has_capability(crew_id, 'crew.staff'));

-- Los companeros de equipo se leen el nombre: la pagina de puestos lo necesita,
-- y hasta ahora `profiles` solo dejaba leer la fila propia.
create policy "el perfil de un companero de equipo se lee"
  on public.profiles for select to authenticated
  using (exists (
    select 1 from public.crew_staff s
    where s.profile_id = profiles.id and public.is_crew_member(s.crew_id)
  ));

-- Permisos de tabla. RLS decide QUE filas; esto decide QUE columnas.
grant select, update on public.crews to authenticated;
revoke update on public.crews from authenticated;
grant update (name, denomination, requires_approval, ranking_enabled, photo_url, timezone)
  on public.crews to authenticated;
grant select, insert, update, delete on public.crew_staff to authenticated;
revoke update on public.crew_staff from authenticated;
grant update (role, extra_capabilities) on public.crew_staff to authenticated;

-- ---------------------------------------------------------------------------
-- El ultimo administrador no se va. Es `lastAdminBlocker`, en SQL.
--
-- El mensaje de la excepcion es el MOTIVO tal cual lo conoce `AppError`:
-- `mapDataError` lo reconoce y la pantalla lo traduce. Un texto en castellano
-- aqui volveria a colar el idioma por la puerta de atras.
-- ---------------------------------------------------------------------------
create or replace function public.guard_last_admin()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  admins integer;
begin
  if old.role <> 'admin' then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' and new.role = 'admin' and new.crew_id = old.crew_id then
    return new;
  end if;

  select count(*) into admins
  from public.crew_staff where crew_id = old.crew_id and role = 'admin';

  if admins <= 1 then
    raise exception 'lastAdmin' using errcode = 'check_violation';
  end if;

  return coalesce(new, old);
end;
$function$;

create trigger crew_staff_guard_last_admin
  before update or delete on public.crew_staff
  for each row execute function public.guard_last_admin();

-- ---------------------------------------------------------------------------
-- El token de union. Ocho caracteres sin los que se confunden -0/O, 1/I/L-,
-- que es como lo generaba la simulacion y como lo escribe la gente al dictado.
-- ---------------------------------------------------------------------------
create or replace function public.generate_join_token()
returns text
language plpgsql
volatile
set search_path to 'public'
as $function$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  token text;
begin
  loop
    token := '';
    for i in 1..8 loop
      token := token || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.crews where join_token = token);
  end loop;
  return token;
end;
$function$;

revoke execute on function public.generate_join_token() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Crear el equipo Y nombrar a su primer administrador, en una transaccion.
--
-- Cierra el TODO de `useCrewEditor`: eran dos escrituras desde el cliente y la
-- segunda podia fallar, dejando un equipo sin nadie que lo gobierne.
-- ---------------------------------------------------------------------------
create or replace function public.create_crew(crew_name text, crew_denomination text)
returns public.crews
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  founder uuid := (select auth.uid());
  created public.crews;
begin
  if founder is null then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  insert into public.crews (name, denomination, created_by, join_token)
  values (trim(crew_name), crew_denomination, founder, public.generate_join_token())
  returning * into created;

  insert into public.crew_staff (crew_id, profile_id, role)
  values (created.id, founder, 'admin');

  return created;
end;
$function$;

create or replace function public.rotate_join_token(crew uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  token text;
begin
  if not public.has_capability(crew, 'crew.invite') then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  token := public.generate_join_token();
  update public.crews set join_token = token where id = crew;
  return token;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Encontrar un equipo por su token, desde fuera de el.
--
-- Quien escanea el QR todavia no es miembro y la politica de lectura no le
-- dejaria ver la fila. Tampoco debe: devuelve SOLO lo que la pantalla de unirse
-- enseña. `subscription_status` va porque `canEnrollMembers` lo necesita para
-- decir «este equipo no admite altas» antes de intentarlo.
-- ---------------------------------------------------------------------------
create or replace function public.find_crew_by_join_token(token text)
returns table (
  id uuid,
  name text,
  denomination text,
  photo_url text,
  requires_approval boolean,
  subscription_status text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select c.id, c.name, c.denomination, c.photo_url, c.requires_approval, c.subscription_status
  from public.crews c
  where c.join_token = upper(replace(trim(token), '-', ''))
    and (select auth.uid()) is not null;
$function$;

revoke execute on function public.create_crew(text, text) from public, anon;
revoke execute on function public.rotate_join_token(uuid) from public, anon;
revoke execute on function public.find_crew_by_join_token(text) from public, anon;
grant execute on function public.create_crew(text, text) to authenticated;
grant execute on function public.rotate_join_token(uuid) to authenticated;
grant execute on function public.find_crew_by_join_token(text) to authenticated;
