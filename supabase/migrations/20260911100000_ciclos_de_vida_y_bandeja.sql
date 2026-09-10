-- ===========================================================================
-- Ciclos de vida y bandeja del entrenador
--
-- Sale de la segunda lectura de los flujos (docs/FLUJOS-DEL-SISTEMA.md, §3 y
-- §6): varios ciclos de vida no tenian estado final, el trabajo que espera
-- una decision del entrenador no tenia ninguna cola, y dos escrituras
-- podian cruzar equipos. Seis cosas, todas con prueba de contrato:
--
--   1. `route_progress` dice si la ruta se eligio a mano, para poder avisar
--      al asignar un plan de que la ruta va a cambiar.
--   2. Aprobar una solicitud deja un aviso en la campana del alumno, en la
--      misma transaccion. La promesa «te avisaremos» pasa a ser verdad.
--   3. El alumno tiene baja: `inactive`. La pone quien tiene `crew.members`
--      o el propio alumno al irse, y cancela lo que tenia por hacer.
--   4. Un rechazo se puede retirar: la ficha `rejected` la borra su dueño,
--      igual que la pendiente, para que la pantalla pueda decirselo y
--      dejarle seguir.
--   5. Mover un volcado solo mueve lo que aun no ha pasado: una sesion que
--      no ocurrio no se lleva a la semana siguiente.
--   6. Dos consultas de equipo para la bandeja: hitos listos para validar y
--      cargas por revisar. Y una guardia: una sesion, una asignacion, un
--      aviso o una cuota no pueden apuntar a un alumno de OTRO equipo.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. La ruta dice si la eligio el entrenador.
--
-- Cambia el tipo de retorno, asi que la funcion se recrea entera: Postgres
-- no deja alterar las columnas de una funcion que devuelve tabla.
-- ---------------------------------------------------------------------------
drop function if exists public.route_progress(uuid);

create or replace function public.route_progress(student uuid)
returns table (
  route_code text,
  node_position integer,
  points integer,
  adherent_weeks integer,
  validated_positions integer[],
  chosen boolean
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  route text;
  earned integer;
  weeks integer;
  validated integer[];
  node integer := 1;
  by_hand boolean;
  next_node public.route_nodes%rowtype;
begin
  if not exists (
    select 1 from public.students t
    where t.id = student and (public.is_crew_staff(t.crew_id) or t.profile_id = (select auth.uid()))
  ) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  route := public.route_of_student(student);
  by_hand := exists (select 1 from public.student_routes r where r.student_id = student);
  select coalesce(sum(sc.points), 0) into earned
  from public.session_scores sc
  where sc.student_id = student and sc.completed_on >= public.route_since(student);
  weeks := public.adherent_weeks(student);
  select coalesce(array_agg(v.node_position order by v.node_position), '{}') into validated
  from public.milestone_validations v
  where v.student_id = student and v.route_code = route;

  loop
    select * into next_node from public.route_nodes n where n.route_code = route and n.node_position = node + 1;
    exit when not found;
    exit when earned < next_node.points_required
           or weeks < next_node.weeks_required
           or not (next_node.node_position = any (validated));
    node := node + 1;
  end loop;

  return query select route, node, earned, weeks, validated, by_hand;
end;
$function$;

revoke execute on function public.route_progress(uuid) from public, anon;
grant execute on function public.route_progress(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Aprobar deja un aviso. La clase `membership` la pinta el cliente con su
-- diccionario; el cuerpo lleva el nombre del equipo, que es lo unico que el
-- texto necesita y lo unico que no se traduce.
-- ---------------------------------------------------------------------------
alter table public.notices drop constraint notices_kind_check;
alter table public.notices add constraint notices_kind_check
  check (kind in ('dues', 'general', 'membership'));

create or replace function public.notify_membership_approved()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if old.membership_status = 'pending' and new.membership_status = 'active' and new.profile_id is not null then
    insert into public.notices (crew_id, student_id, kind, body)
    select new.crew_id, new.id, 'membership', c.name
    from public.crews c where c.id = new.crew_id;
  end if;
  return new;
end;
$function$;

create trigger students_notify_membership
  after update of membership_status on public.students
  for each row execute function public.notify_membership_approved();

-- ---------------------------------------------------------------------------
-- 3. La baja. `inactive` no es miembro: `is_crew_member`, `findAll` y el
-- ranking ya filtran por `active`/`invited`, asi que sale de todo sin tocar
-- nada mas. La ficha se queda: sus sesiones la referencian.
-- ---------------------------------------------------------------------------
alter table public.students drop constraint students_membership_status_check;
alter table public.students add constraint students_membership_status_check
  check (membership_status in ('invited', 'pending', 'active', 'rejected', 'inactive'));

create or replace function public.deactivate_student(student uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  target public.students;
  me uuid := (select auth.uid());
begin
  select * into target from public.students t where t.id = student;
  if not found then
    raise exception 'notFound' using errcode = 'no_data_found';
  end if;

  -- Quien gobierna las pertenencias, o el propio alumno mientras este dentro.
  if not (
    public.has_capability(target.crew_id, 'crew.members')
    or (target.profile_id = me and target.membership_status = 'active')
  ) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  if target.membership_status not in ('active', 'invited') then
    raise exception 'invalidReference' using errcode = 'check_violation';
  end if;

  update public.students set membership_status = 'inactive' where id = student;

  -- Lo que tenia por hacer se cancela: una baja con sesiones pendientes
  -- seguiria ocupando huecos de la agenda de alguien que ya no viene. Lo
  -- que ya paso se queda como estaba.
  update public.sessions
  set status = 'cancelled'
  where student_id = student
    and status in ('pending', 'confirmed')
    and date >= current_date;
end;
$function$;

create or replace function public.reactivate_student(student uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  target public.students;
begin
  select * into target from public.students t where t.id = student;
  if not found then
    raise exception 'notFound' using errcode = 'no_data_found';
  end if;
  if not public.has_capability(target.crew_id, 'crew.members') then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  if target.membership_status <> 'inactive' then
    raise exception 'invalidReference' using errcode = 'check_violation';
  end if;

  -- Vuelve a lo que era: con cuenta, activo; sin cuenta, invitado.
  update public.students
  set membership_status = case when target.profile_id is null then 'invited' else 'active' end
  where id = student;
end;
$function$;

revoke execute on function public.deactivate_student(uuid) from public, anon;
revoke execute on function public.reactivate_student(uuid) from public, anon;
grant execute on function public.deactivate_student(uuid) to authenticated;
grant execute on function public.reactivate_student(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Un rechazo se retira como una solicitud: es la forma de que el alumno
-- pueda darse por enterado y seguir. Sin esto la fila `rejected` era
-- invisible para el, y volvia a escanear creyendo que no habia llegado.
-- ---------------------------------------------------------------------------
drop policy "una solicitud pendiente la retira quien la hizo" on public.students;
create policy "una solicitud pendiente o rechazada la retira quien la hizo"
  on public.students for delete to authenticated
  using (profile_id = (select auth.uid()) and membership_status in ('pending', 'rejected'));

-- ---------------------------------------------------------------------------
-- 5. Mover un volcado solo mueve lo que queda por venir.
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
    and status in ('pending', 'confirmed')
    -- Una sesion cuyo dia paso sin cerrarse no ocurrio: llevarla a la semana
    -- siguiente la resucitaria en silencio.
    and date >= current_date;
  get diagnostics moved = row_count;
  return moved;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 6a. La bandeja: lo que espera al entrenador, por equipo y no ficha a ficha.
-- ---------------------------------------------------------------------------
create or replace function public.crew_pending_milestones(crew uuid)
returns table (student_id uuid, route_code text, node_position integer)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  candidate uuid;
  progress record;
  next_node public.route_nodes%rowtype;
begin
  if not public.is_crew_staff(crew) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  for candidate in
    select t.id from public.students t
    where t.crew_id = crew and t.membership_status in ('active', 'invited')
  loop
    select * into progress from public.route_progress(candidate);
    select * into next_node from public.route_nodes n
    where n.route_code = progress.route_code and n.node_position = progress.node_position + 1;
    if found
       and progress.points >= next_node.points_required
       and progress.adherent_weeks >= next_node.weeks_required
       and not (next_node.node_position = any (progress.validated_positions)) then
      student_id := candidate;
      route_code := progress.route_code;
      node_position := next_node.node_position;
      return next;
    end if;
  end loop;
end;
$function$;

create or replace function public.crew_flagged_scores(crew uuid)
returns setof public.session_scores
language sql
stable
security invoker
set search_path to 'public'
as $function$
  select sc.*
  from public.session_scores sc
  join public.students t on t.id = sc.student_id
  where t.crew_id = crew
    and t.membership_status in ('active', 'invited')
    and sc.flagged_reason is not null
    and sc.reviewed_at is null
  order by sc.completed_on desc;
$function$;

revoke execute on function public.crew_pending_milestones(uuid) from public, anon;
revoke execute on function public.crew_flagged_scores(uuid) from public, anon;
grant execute on function public.crew_pending_milestones(uuid) to authenticated;
grant execute on function public.crew_flagged_scores(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6b. Un alumno es de UN equipo, y lo que se le escribe tiene que ser de ese
-- mismo equipo. Las politicas comprobaban la capacidad sobre `crew_id` y
-- nada sobre `student_id`: quien gestiona el equipo A podia agendar, asignar,
-- avisar o cobrar a un alumno del equipo B, que lo veia como suyo.
-- ---------------------------------------------------------------------------
create or replace function public.guard_student_crew()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.student_id is null then
    return new;
  end if;
  if not exists (
    select 1 from public.students t where t.id = new.student_id and t.crew_id = new.crew_id
  ) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$function$;

create trigger sessions_guard_student_crew
  before insert or update of student_id, crew_id on public.sessions
  for each row execute function public.guard_student_crew();
create trigger assignments_guard_student_crew
  before insert or update of student_id, crew_id on public.assignments
  for each row execute function public.guard_student_crew();
create trigger notices_guard_student_crew
  before insert or update of student_id, crew_id on public.notices
  for each row execute function public.guard_student_crew();
create trigger student_subscriptions_guard_student_crew
  before insert or update of student_id, crew_id on public.student_subscriptions
  for each row execute function public.guard_student_crew();
