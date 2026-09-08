-- Fases 6 y 7: la baja de la cuenta y el registro de auditoria.
--
-- LA BAJA ES UNA FUNCION y no un `delete` desde el cliente: `auth.users` no se
-- toca desde la API, y ademas hay que decidir que pasa con lo que la persona
-- deja detras. Con datos reales de personas, poder irse es obligatorio.
--
-- LA AUDITORIA ES UN DISPARADOR GENERICO sobre las cuatro tablas donde una
-- escritura cambia lo que alguien puede hacer o pagar: puestos, fichas, cuotas
-- y el propio equipo. Quien, que, cuando, y como estaba antes.

-- ---------------------------------------------------------------------------
-- Auditoria
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  -- Nula cuando escribe el rol de servicio o un disparador sin sesion.
  actor_profile_id uuid,
  crew_id uuid,
  table_name text not null,
  row_id uuid not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  before jsonb,
  after jsonb
);

create index audit_log_crew_at_idx on public.audit_log (crew_id, at desc);

alter table public.audit_log enable row level security;

-- Se lee desde los ajustes del equipo; no se escribe desde ningun cliente.
create policy "la auditoria la lee quien gobierna el equipo"
  on public.audit_log for select to authenticated
  using (crew_id is not null and public.has_capability(crew_id, 'crew.settings'));

grant select on public.audit_log to authenticated;

create or replace function public.record_audit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  before_row jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  after_row jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  affected jsonb := coalesce(after_row, before_row);
begin
  insert into public.audit_log (actor_profile_id, crew_id, table_name, row_id, operation, before, after)
  values (
    (select auth.uid()),
    -- En `crews` el equipo es la propia fila; en las demas, su columna.
    case when tg_table_name = 'crews' then (affected ->> 'id')::uuid else (affected ->> 'crew_id')::uuid end,
    tg_table_name,
    (affected ->> 'id')::uuid,
    tg_op,
    before_row,
    after_row
  );
  return coalesce(new, old);
end;
$function$;

revoke execute on function public.record_audit() from public, anon, authenticated;

create trigger crews_audit after insert or update or delete on public.crews
  for each row execute function public.record_audit();
create trigger crew_staff_audit after insert or update or delete on public.crew_staff
  for each row execute function public.record_audit();
create trigger students_audit after insert or update or delete on public.students
  for each row execute function public.record_audit();
create trigger student_subscriptions_audit after insert or update or delete on public.student_subscriptions
  for each row execute function public.record_audit();

-- ---------------------------------------------------------------------------
-- La baja de la cuenta.
--
-- Lo que la persona deja detras se decide asi:
--  - Un equipo del que es el UNICO miembro con cuenta se borra con ella: no
--    queda nadie a quien dejarselo.
--  - Un equipo donde es el unico administrador pero hay mas gente NO se puede
--    dejar sin gobierno: `lastAdmin`, y que nombre a otro antes.
--  - En los demas, su puesto y su ficha caen en cascada desde `profiles`; las
--    sesiones y el historial de un alumno se van con la ficha.
-- ---------------------------------------------------------------------------
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me uuid := (select auth.uid());
  lonely_crew uuid;
begin
  if me is null then
    raise exception 'sessionExpired' using errcode = 'insufficient_privilege';
  end if;

  -- Los equipos donde soy el unico con cuenta: se van conmigo.
  for lonely_crew in
    select s.crew_id
    from public.crew_staff s
    where s.profile_id = me
      and not exists (
        select 1 from public.crew_staff o where o.crew_id = s.crew_id and o.profile_id <> me
      )
      and not exists (
        select 1 from public.students t
        where t.crew_id = s.crew_id and t.profile_id is not null and t.profile_id <> me
      )
  loop
    delete from public.crews where id = lonely_crew;
  end loop;

  -- Los equipos donde soy el unico administrador y hay mas gente: no.
  if exists (
    select 1 from public.crew_staff s
    where s.profile_id = me and s.role = 'admin'
      and not exists (
        select 1 from public.crew_staff o
        where o.crew_id = s.crew_id and o.role = 'admin' and o.profile_id <> me
      )
  ) then
    raise exception 'lastAdmin' using errcode = 'check_violation';
  end if;

  -- `crews.created_by` no cae en cascada: el equipo sobrevive a quien lo creo,
  -- y pasa a constar como creado por otro de sus administradores.
  update public.crews c
  set created_by = (
    select o.profile_id from public.crew_staff o
    where o.crew_id = c.id and o.role = 'admin' and o.profile_id <> me
    order by o.created_at
    limit 1
  )
  where c.created_by = me;

  delete from auth.users where id = me;
end;
$function$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

-- El guardian del ultimo administrador tiene que dejar pasar el borrado de un
-- equipo entero: cuando la cascada llega a `crew_staff`, la fila de `crews` ya
-- no esta, y no hay equipo que quede sin gobierno.
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
  if not exists (select 1 from public.crews c where c.id = old.crew_id) then
    return coalesce(new, old);
  end if;

  select count(*) into admins
  from public.crew_staff where crew_id = old.crew_id and role = 'admin';

  if admins <= 1 then
    raise exception 'lastAdmin' using errcode = 'check_violation';
  end if;

  return coalesce(new, old);
end;
$function$;
