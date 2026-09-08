-- Fase 2: alumnos, pertenencia, cuotas y avisos.
--
-- Con esto una cuenta real puede invitar, ser invitada, entrar por QR y llevar
-- las cuotas. Y el alta que enlaza -las fichas que esperaban un correo, el
-- codigo de equipo escrito en el formulario- pasa a ocurrir en el servidor, en
-- la misma transaccion que la cuenta, que es el unico sitio donde puede ocurrir
-- con la confirmacion por correo activada.

-- ---------------------------------------------------------------------------
-- Fichas de alumno. La libreta del entrenador: nivel, objetivos, grasa corporal
-- son SU valoracion. Nombre y foto son de la persona.
-- ---------------------------------------------------------------------------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  -- Nula hasta que la persona reclama la ficha con su cuenta.
  profile_id uuid references public.profiles (id) on delete set null,
  first_name text not null default '',
  last_name text not null default '',
  email text not null check (length(trim(email)) > 0),
  level text not null default 'Principiante'
    check (level in ('Principiante', 'Intermedio', 'Avanzado')),
  goals text[] not null default '{}',
  age integer not null default 0 check (age between 0 and 120),
  body_fat_percentage numeric(4, 1) not null default 0 check (body_fat_percentage between 0 and 100),
  photo_url text,
  extra_capabilities text[] not null default '{}'
    check (extra_capabilities <@ array[
      'crew.settings', 'crew.staff', 'crew.invite', 'crew.members', 'crew.wall',
      'training.manage', 'schedule.manage', 'students.manage'
    ]::text[]),
  membership_status text not null default 'invited'
    check (membership_status in ('invited', 'pending', 'active', 'rejected')),
  created_at timestamptz not null default now()
);

-- El correo es unico POR CREW, no global: la misma persona puede ser alumna en
-- dos equipos, y eso es una ficha por equipo.
create unique index students_crew_email_idx on public.students (crew_id, lower(email));
create index students_profile_id_idx on public.students (profile_id);

create table public.student_subscriptions (
  student_id uuid primary key references public.students (id) on delete cascade,
  crew_id uuid not null references public.crews (id) on delete cascade,
  period_days integer not null default 30 check (period_days in (30, 90, 180, 365)),
  paid_through date,
  updated_at timestamptz not null default now()
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  kind text not null check (kind in ('dues', 'general')),
  body text not null check (length(body) between 1 and 300),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notices_student_idx on public.notices (student_id, created_at desc);

alter table public.students enable row level security;
alter table public.student_subscriptions enable row level security;
alter table public.notices enable row level security;

-- ---------------------------------------------------------------------------
-- Pertenecer a un equipo es tener un puesto O una ficha activa en el.
--
-- Se REEMPLAZAN las funciones de la fase 1. Una solicitud pendiente NO es
-- pertenencia, y es una decision de seguridad y no de presentacion: entrar en
-- esta lista es lo que abre el ambito de datos, y darselo a quien todavia
-- espera aprobacion seria darle acceso por haber escaneado un QR.
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
  ) or exists (
    select 1 from public.students t
    where t.crew_id = crew
      and t.profile_id = (select auth.uid())
      and t.membership_status in ('active', 'invited')
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
  ) or exists (
    -- Una concesion a un alumno: «este puede llevar la agenda». Es
    -- `permissions.can` con las extras de la ficha.
    select 1 from public.students t
    where t.crew_id = crew
      and t.profile_id = (select auth.uid())
      and t.membership_status in ('active', 'invited')
      and has_capability.capability = any (t.extra_capabilities)
  );
$function$;

/** Si quien pregunta tiene un PUESTO en el equipo, del rango que sea. */
create or replace function public.is_crew_staff(crew uuid)
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

revoke execute on function public.is_crew_staff(uuid) from public, anon;
grant execute on function public.is_crew_staff(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Politicas de alumnos.
--
-- LAS FICHAS LAS VE EL EQUIPO TECNICO, y cada alumno la suya. Un alumno no lee
-- las de los demas -edad, grasa corporal- y ninguna pantalla lo necesita: el
-- ranking, que si necesita nombres, es una funcion aparte que devuelve solo
-- agregados.
-- ---------------------------------------------------------------------------
create policy "las fichas las lee el equipo tecnico, cada alumno la suya, y la plataforma"
  on public.students for select to authenticated
  using (
    public.is_crew_staff(crew_id)
    or profile_id = (select auth.uid())
    or public.is_platform_admin((select auth.uid()))
  );

create policy "las fichas las crea quien tiene students.manage"
  on public.students for insert to authenticated
  with check (public.has_capability(crew_id, 'students.manage'));

create policy "las fichas las edita quien gestiona, y cada alumno la suya"
  on public.students for update to authenticated
  using (public.has_capability(crew_id, 'students.manage') or profile_id = (select auth.uid()))
  with check (public.has_capability(crew_id, 'students.manage') or profile_id = (select auth.uid()));

create policy "las fichas las borra quien tiene students.manage"
  on public.students for delete to authenticated
  using (public.has_capability(crew_id, 'students.manage'));

-- Un alumno cambia SU nombre y SU foto, y nada mas. La politica de arriba le
-- deja tocar su fila; este disparador decide que columnas. Aprobar una
-- solicitud pide `crew.members`; conceder capacidades, `crew.staff`.
create or replace function public.guard_student_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  manages boolean := public.has_capability(old.crew_id, 'students.manage');
begin
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

  if not manages and (
       new.email is distinct from old.email
    or new.level is distinct from old.level
    or new.goals is distinct from old.goals
    or new.age is distinct from old.age
    or new.body_fat_percentage is distinct from old.body_fat_percentage
    or new.profile_id is distinct from old.profile_id
  ) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$function$;

create trigger students_guard_update
  before update on public.students
  for each row execute function public.guard_student_update();

grant select, insert, update, delete on public.students to authenticated;

-- ---------------------------------------------------------------------------
-- Cuotas y avisos.
-- ---------------------------------------------------------------------------
create policy "las cuotas las lleva quien gestiona alumnos; cada uno ve la suya"
  on public.student_subscriptions for select to authenticated
  using (
    public.has_capability(crew_id, 'students.manage')
    or exists (
      select 1 from public.students t
      where t.id = student_id and t.profile_id = (select auth.uid())
    )
  );

create policy "las cuotas las escribe quien tiene students.manage"
  on public.student_subscriptions for all to authenticated
  using (public.has_capability(crew_id, 'students.manage'))
  with check (public.has_capability(crew_id, 'students.manage'));

grant select, insert, update, delete on public.student_subscriptions to authenticated;

create policy "un aviso lo lee su destinatario y quien gestiona alumnos"
  on public.notices for select to authenticated
  using (
    public.has_capability(crew_id, 'students.manage')
    or exists (
      select 1 from public.students t
      where t.id = student_id and t.profile_id = (select auth.uid())
    )
  );

create policy "los avisos los manda quien tiene students.manage"
  on public.notices for insert to authenticated
  with check (public.has_capability(crew_id, 'students.manage'));

-- Marcar como leido: solo el destinatario, y solo esa columna.
create policy "un aviso lo marca como leido su destinatario"
  on public.notices for update to authenticated
  using (exists (
    select 1 from public.students t where t.id = student_id and t.profile_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.students t where t.id = student_id and t.profile_id = (select auth.uid())
  ));

grant select, insert on public.notices to authenticated;
grant update (read_at) on public.notices to authenticated;

-- ---------------------------------------------------------------------------
-- El alta que enlaza, en el servidor.
-- ---------------------------------------------------------------------------

-- Reclama la pertenencia a un equipo por su token. Es `claimMembership`, en
-- SQL, y cierra el TODO del puerto: el token se valida en la misma transaccion
-- que la escritura, asi que entre leer el equipo y escribir la ficha ya no cabe
-- una rotacion.
--
-- BUSCA ANTES DE CREAR: si el entrenador ya habia hecho la ficha con este
-- correo, se reclama ESA -con su historial- en vez de abrir otra.
create or replace function public.claim_membership_as(person uuid, crew_token text)
returns public.students
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  target public.crews;
  me public.profiles;
  claimed public.students;
  wanted text;
begin
  select * into target from public.crews
  where join_token = upper(replace(trim(crew_token), '-', ''));
  if not found then
    raise exception 'notFound' using errcode = 'no_data_found';
  end if;
  if target.subscription_status <> 'active' then
    raise exception 'enrollmentClosed' using errcode = 'check_violation';
  end if;

  select * into me from public.profiles where id = person;
  wanted := case when target.requires_approval then 'pending' else 'active' end;

  select * into claimed from public.students
  where crew_id = target.id
    and (profile_id = person or lower(email) = lower(me.email))
  limit 1;

  if found then
    update public.students
    set profile_id = person,
        -- Quien ya estaba dentro no vuelve a la cola por escanear otra vez.
        membership_status = case
          when claimed.membership_status in ('active', 'invited') then 'active'
          else wanted
        end
    where id = claimed.id
    returning * into claimed;
  else
    insert into public.students (crew_id, profile_id, first_name, last_name, email, membership_status)
    values (target.id, person, me.first_name, me.last_name, me.email, wanted)
    returning * into claimed;
  end if;

  return claimed;
end;
$function$;

/** La misma operacion, para quien ya tiene sesion: la pantalla de unirse. */
create or replace function public.claim_membership(crew_token text)
returns public.students
language sql
security definer
set search_path to 'public'
as $function$
  select public.claim_membership_as((select auth.uid()), crew_token);
$function$;

revoke execute on function public.claim_membership_as(uuid, text) from public, anon, authenticated;
revoke execute on function public.claim_membership(text) from public, anon;
grant execute on function public.claim_membership(text) to authenticated;

-- La cuenta nace, y con ella: el perfil, las fichas que esperaban su correo, y
-- el equipo cuyo codigo se escribio en el alta. Todo en una transaccion.
--
-- El codigo de equipo viaja en los metadatos como la intencion, y por lo
-- mismo: es el unico momento en que el cliente puede decir algo, porque
-- despues del alta no hay sesion hasta confirmar el correo. Un codigo que no
-- vale NO tumba el alta -la cuenta es lo importante-: se ignora, y quien lo
-- escribio lo reintenta desde la pantalla de unirse, que es donde el error se
-- explica.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  join_code text := new.raw_user_meta_data ->> 'join_code';
begin
  insert into public.profiles (
    id, email, first_name, last_name, specialty, years_of_experience, location, role
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.raw_user_meta_data ->> 'specialty',
    new.raw_user_meta_data ->> 'years_of_experience',
    new.raw_user_meta_data ->> 'location',
    case
      when exists (
        select 1 from public.platform_admin_emails a
        where lower(a.email) = lower(new.email)
      ) then 'admin'
      when new.raw_user_meta_data ->> 'intent' = 'trainer' then 'trainer'
      else 'student'
    end
  );

  -- Las fichas que esperaban este correo, en CUALQUIER equipo. Solo las que
  -- esperan dueño: una ya enlazada a otra cuenta no se reclama por escribir el
  -- mismo correo, seria suplantar a alguien.
  update public.students
  set profile_id = new.id, membership_status = 'active'
  where lower(email) = lower(new.email)
    and profile_id is null
    and membership_status = 'invited';

  if join_code is not null and length(trim(join_code)) > 0 then
    begin
      perform public.claim_membership_as(new.id, join_code);
    exception when others then
      -- Un codigo que no vale no tumba el alta.
      null;
    end;
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Plataforma: cuatro funciones que solo corren si quien pregunta administra.
-- ---------------------------------------------------------------------------
create or replace function public.assert_platform_admin()
returns void
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_platform_admin((select auth.uid())) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
end;
$function$;

create or replace function public.platform_list_crews()
returns table (
  crew jsonb,
  member_count bigint,
  owner_name text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select public.assert_platform_admin();
  select
    to_jsonb(c) as crew,
    (select count(*) from public.students t where t.crew_id = c.id and t.membership_status in ('active', 'invited'))
      + (select count(*) from public.crew_staff s where s.crew_id = c.id) as member_count,
    (select nullif(trim(p.first_name || ' ' || p.last_name), '') from public.profiles p where p.id = c.created_by) as owner_name
  from public.crews c
  order by c.created_at;
$function$;

-- Las cuentas de todos los equipos, paginadas: puestos y fichas en una sola
-- lista, que es como las mira quien administra. `total` viaja en cada fila
-- porque una funcion devuelve una forma, y la pagina necesita las dos cosas.
create or replace function public.platform_list_users(
  page integer,
  page_size integer,
  search text,
  role_filter text
)
returns table (
  membership_id uuid,
  profile_id uuid,
  display_name text,
  email text,
  crew_id uuid,
  crew_name text,
  role text,
  extra_capabilities text[],
  total bigint
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select public.assert_platform_admin();
  with everyone as (
    select s.id as membership_id, s.profile_id,
           trim(p.first_name || ' ' || p.last_name) as display_name, p.email,
           s.crew_id, c.name as crew_name, s.role, s.extra_capabilities
    from public.crew_staff s
    join public.profiles p on p.id = s.profile_id
    join public.crews c on c.id = s.crew_id
    union all
    select t.id, t.profile_id,
           trim(t.first_name || ' ' || t.last_name), t.email,
           t.crew_id, c.name, 'student', t.extra_capabilities
    from public.students t
    join public.crews c on c.id = t.crew_id
    where t.membership_status in ('active', 'invited')
  ),
  filtered as (
    select * from everyone e
    where (role_filter is null or e.role = role_filter)
      and (
        search is null or length(trim(search)) = 0
        or e.display_name ilike '%' || trim(search) || '%'
        or e.email ilike '%' || trim(search) || '%'
        or e.crew_name ilike '%' || trim(search) || '%'
      )
  )
  select f.*, (select count(*) from filtered) as total
  from filtered f
  order by f.crew_name, f.display_name
  offset greatest(page - 1, 0) * page_size
  limit page_size;
$function$;

-- Cambiar el papel de alguien en su equipo. Es `FakePlatformRepository.setMembership`
-- con sus ramas: ascender a un alumno le crea el puesto y le CONSERVA la ficha
-- -sus sesiones la referencian-; degradar a un miembro del equipo tecnico a
-- alumno le quita el puesto.
create or replace function public.platform_set_membership(
  membership_id uuid,
  new_role text,
  new_extra_capabilities text[]
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  post public.crew_staff;
  ficha public.students;
begin
  perform public.assert_platform_admin();

  select * into post from public.crew_staff where id = membership_id;
  if found then
    if new_role = 'student' then
      delete from public.crew_staff where id = membership_id;
    else
      update public.crew_staff
      set role = new_role, extra_capabilities = new_extra_capabilities
      where id = membership_id;
    end if;
    return;
  end if;

  select * into ficha from public.students where id = membership_id;
  if not found then
    raise exception 'personNotInAnyCrew' using errcode = 'no_data_found';
  end if;

  if new_role = 'student' then
    update public.students set extra_capabilities = new_extra_capabilities where id = membership_id;
    return;
  end if;

  if ficha.profile_id is null then
    raise exception 'accountNotClaimed' using errcode = 'check_violation';
  end if;

  insert into public.crew_staff (crew_id, profile_id, role, extra_capabilities)
  values (ficha.crew_id, ficha.profile_id, new_role, new_extra_capabilities)
  on conflict (crew_id, profile_id) do update
    set role = excluded.role, extra_capabilities = excluded.extra_capabilities;
end;
$function$;

create or replace function public.platform_set_subscription(crew uuid, new_status text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  perform public.assert_platform_admin();
  update public.crews set subscription_status = new_status where id = crew;
end;
$function$;

revoke execute on function public.assert_platform_admin() from public, anon;
revoke execute on function public.platform_list_crews() from public, anon;
revoke execute on function public.platform_list_users(integer, integer, text, text) from public, anon;
revoke execute on function public.platform_set_membership(uuid, text, text[]) from public, anon;
revoke execute on function public.platform_set_subscription(uuid, text) from public, anon;
grant execute on function public.assert_platform_admin() to authenticated;
grant execute on function public.platform_list_crews() to authenticated;
grant execute on function public.platform_list_users(integer, integer, text, text) to authenticated;
grant execute on function public.platform_set_membership(uuid, text, text[]) to authenticated;
grant execute on function public.platform_set_subscription(uuid, text) to authenticated;
