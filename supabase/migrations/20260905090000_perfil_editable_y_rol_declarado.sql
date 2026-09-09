-- Perfil editable y rol declarado en el alta.
--
-- Contexto: el codigo pedia una tabla `trainers` que en esta base no existe, y
-- devolvia 404 en cada carga. Lo que si existe es `profiles`, uno a uno con
-- `auth.users` y rellenada por el disparador `on_auth_user_created`. Esta
-- migracion termina de cablear las dos cosas que faltaban para que el alta y el
-- inicio de sesion funcionen de verdad.
--
-- Aplicar con:  supabase db push        (o desde el editor SQL del panel)

-- ---------------------------------------------------------------------------
-- 1. Lo que le faltaba al perfil para ser el que edita Configuracion.
--
-- La pantalla de ajustes ya guarda foto y biografia contra
-- `TrainerRepository.updateProfile`, y no habia columna donde escribirlas.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists photo_url text,
  add column if not exists bio text;

comment on column public.profiles.photo_url is
  'Foto de perfil, por URL. La edita su dueno desde Configuracion.';
comment on column public.profiles.bio is
  'Lo que uno cuenta de si mismo. La edita su dueno desde Configuracion.';

-- El permiso va por COLUMNA y no por tabla, siguiendo lo que ya hacia la
-- migracion anterior. Es lo que impide que alguien se ascienda a `admin` con un
-- update sobre su propia fila: `role` no esta en la lista y no puede estarlo.
grant update (photo_url, bio) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 2. El rol se DECLARA al registrarse; 'admin' no se declara nunca.
--
-- Antes todo el mundo nacia 'trainer', asi que quien se registraba diciendo
-- «solo entreno» quedaba marcado como entrenador y aterrizaba en la pantalla de
-- gestion de otra persona.
--
-- La intencion viaja en los metadatos del alta, que es el UNICO momento en que
-- el cliente puede decir algo del perfil: con la confirmacion por correo
-- activada no hay sesion despues del alta, y sin sesion RLS no deja escribir la
-- fila. Por eso la cuenta y su perfil nacen juntos, aqui dentro.
--
-- QUE VENGA DEL CLIENTE NO LO HACE INSEGURO, y conviene dejarlo escrito: ni
-- 'trainer' ni 'student' autorizan nada por si mismos -lo que se puede hacer en
-- un equipo sale del puesto que se tenga en el- y 'admin' se decide aqui contra
-- `platform_admin_emails`, sin mirar los metadatos. Un cliente modificado puede
-- mentir sobre a que viene, no sobre lo que puede.
--
-- Sin intencion declarada -un alta federada con Google, que no pasa por el
-- formulario- se queda en 'student', que es lo que menos afirma.
-- ---------------------------------------------------------------------------
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
      when new.raw_user_meta_data ->> 'intent' = 'trainer' then 'trainer'
      else 'student'
    end
  );
  return new;
end;
$function$;
