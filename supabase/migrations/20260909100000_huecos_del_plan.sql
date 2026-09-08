-- Lo que quedaba del plan y necesitaba base: mover un volcado, el tiempo real
-- de avisos, muro y agenda, el onboarding por cuenta, lo que Google manda en
-- el alta, y un limite a quien prueba tokens de union.

-- ---------------------------------------------------------------------------
-- Mover un volcado entero. Sumar dias a una fecha es aritmetica de Postgres y
-- PostgREST no la expresa; y va en una transaccion, como el volcado mismo.
-- Solo lo que esta por ocurrir: una completada ya ocurrio, y una cancelada ya
-- se decidio.
-- ---------------------------------------------------------------------------
create or replace function public.shift_sessions(source_assignment uuid, days integer)
returns integer
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  moved integer;
begin
  update public.sessions
  set date = date + make_interval(days => days)
  where assignment_id = source_assignment
    and status in ('pending', 'confirmed');
  get diagnostics moved = row_count;
  return moved;
end;
$function$;

revoke execute on function public.shift_sessions(uuid, integer) from public, anon;
grant execute on function public.shift_sessions(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Tiempo real, por tabla y en el orden del plan (§1.3): avisos, muro, agenda.
-- Publicar la tabla es lo que hace que `postgres_changes` emita; RLS sigue
-- decidiendo quien recibe cada fila. Rutinas, planes o catalogo no lo
-- necesitan: los edita una persona y los lee ella misma.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.notices;
alter publication supabase_realtime add table public.crew_posts;
alter publication supabase_realtime add table public.crew_post_likes;
alter publication supabase_realtime add table public.sessions;

-- ---------------------------------------------------------------------------
-- El onboarding se ve una vez POR CUENTA, no por dispositivo.
-- ---------------------------------------------------------------------------
alter table public.profiles add column onboarded_at timestamptz;

comment on column public.profiles.onboarded_at is
  'Cuando la persona termino el recorrido de bienvenida. Nulo si no lo ha visto. Vivia en localStorage, que es del navegador y no de la cuenta.';

grant update (onboarded_at) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Lo que Google manda en el alta, si algun dia se enciende: `full_name` y
-- `avatar_url` en vez de `first_name`/`last_name`. El disparador lee los dos.
-- Foto de perfil en `profiles` para poder guardar la de Google y la que se
-- suba desde Configuracion.
-- ---------------------------------------------------------------------------
alter table public.profiles add column photo_url text;
grant update (photo_url) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  join_code text := new.raw_user_meta_data ->> 'join_code';
  full_name text := coalesce(new.raw_user_meta_data ->> 'full_name', '');
begin
  insert into public.profiles (
    id, email, first_name, last_name, specialty, years_of_experience, location, role, photo_url
  )
  values (
    new.id,
    new.email,
    -- Con nombre y apellidos separados -el alta propia- se usan; con un
    -- nombre completo -Google- se parte por el primer espacio.
    coalesce(new.raw_user_meta_data ->> 'first_name', split_part(full_name, ' ', 1), ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', nullif(substr(full_name, length(split_part(full_name, ' ', 1)) + 2), ''), ''),
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
    end,
    new.raw_user_meta_data ->> 'avatar_url'
  );

  update public.students
  set profile_id = new.id, membership_status = 'active'
  where lower(email) = lower(new.email)
    and profile_id is null
    and membership_status = 'invited';

  if join_code is not null and length(trim(join_code)) > 0 then
    begin
      perform public.claim_membership_as(new.id, join_code);
    exception when others then
      null;
    end;
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Ocho caracteres se pueden adivinar. Cada consulta de un token se anota por
-- cuenta, y a partir de veinte en una hora la funcion deja de responder con
-- `tooManyAttempts`. No hay IP en Postgres, pero si hay cuenta: sin sesion la
-- funcion ya no devolvia nada.
-- ---------------------------------------------------------------------------
create table public.join_token_lookups (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  at timestamptz not null default now()
);

create index join_token_lookups_profile_at_idx on public.join_token_lookups (profile_id, at desc);

alter table public.join_token_lookups enable row level security;
-- Sin politicas: solo la escribe y la lee la funcion, que es `security definer`.

create or replace function public.find_crew_by_join_token(token text)
returns table (
  id uuid,
  name text,
  denomination text,
  photo_url text,
  requires_approval boolean,
  subscription_status text
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me uuid := (select auth.uid());
  recent integer;
begin
  if me is null then
    return;
  end if;

  select count(*) into recent
  from public.join_token_lookups l
  where l.profile_id = me and l.at > now() - interval '1 hour';
  if recent >= 20 then
    raise exception 'tooManyAttempts' using errcode = 'insufficient_privilege';
  end if;

  insert into public.join_token_lookups (profile_id) values (me);
  delete from public.join_token_lookups l where l.profile_id = me and l.at < now() - interval '1 day';

  return query
  select c.id, c.name, c.denomination, c.photo_url, c.requires_approval, c.subscription_status
  from public.crews c
  where c.join_token = upper(replace(trim(token), '-', ''));
end;
$function$;

-- ---------------------------------------------------------------------------
-- Fotos: el primer cubo de ficheros de la aplicacion.
--
-- PUBLICO EN LECTURA: una foto de perfil se enseña a quien la mire, y firmar
-- cada direccion para algo que se pinta en cada tarjeta seria una llamada mas
-- por foto. La escritura, en cambio, es de cada cuenta en SU carpeta: la ruta
-- es `<cuenta>/<clase>/<uuid>.<ext>` y la politica compara el primer tramo con
-- `auth.uid()`.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "las fotos las ve cualquiera"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "cada cuenta sube fotos a su carpeta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "cada cuenta cambia las fotos de su carpeta"
  on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "cada cuenta borra las fotos de su carpeta"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
