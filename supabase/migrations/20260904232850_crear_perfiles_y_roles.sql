-- Perfiles y roles. RECONSTRUIDA desde el esquema vivo.
--
-- Esta migracion se aplico en la nube con la herramienta de migraciones y
-- nunca llego al repositorio. Se ha vuelto a escribir leyendo el esquema
-- resultante -columnas, restricciones, politicas, funciones, permisos-, de modo
-- que `supabase start` reproduzca localmente exactamente lo que hay en el
-- proyecto. La version y el nombre coinciden con los de la nube para que
-- `supabase db push` no intente aplicarla dos veces.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  role text not null default 'student' check (role in ('student', 'trainer', 'admin')),
  specialty text,
  years_of_experience text,
  location text,
  created_at timestamptz not null default now()
);

comment on column public.profiles.role is
  'El rol vive AQUI y no en user_metadata a proposito: el propio usuario puede editar su user_metadata con supabase.auth.updateUser() y se ascenderia solo.';

-- Quien administra la plataforma. La escribe solo el rol de servicio: RLS
-- activada sin ninguna politica es «nadie desde la API».
create table public.platform_admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.platform_admin_emails enable row level security;

create or replace function public.is_platform_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1 from public.profiles where id = user_id and role = 'admin'
  );
$function$;

create policy "leer el perfil propio, o todos si eres administrador"
  on public.profiles for select
  using ((select auth.uid()) = id or public.is_platform_admin((select auth.uid())));

create policy "editar solo el perfil propio"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- La fila de perfil nace con la cuenta, dentro de la misma transaccion.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
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
      else 'trainer'
    end
  );
  return new;
end;
$function$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
