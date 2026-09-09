-- Fase 3: entrenamiento. Catalogo, ejercicios, rutinas, biblioteca, planes y
-- asignaciones.
--
-- Dos criterios recorren toda la migracion:
--
-- 1. `crew_id` NULO significa «de sistema»: lo ve todo el mundo y solo lo
--    escribe el rol de servicio. Con `crew_id`, es del equipo. Es lo que
--    `exercisesSeed` y `catalog.mock` ya anunciaban en sus TODO.
-- 2. LO QUE SE EDITA ENTERO SE GUARDA ENTERO. Los bloques de una rutina, las
--    semanas de un plan y el bloque guardado son documentos JSONB, validados
--    por forma en la base. Normalizarlos seria siete tablas y tres mappers de
--    ida y vuelta que no responden a ninguna consulta que la aplicacion haga.
--    Plan, §1.2.

-- ---------------------------------------------------------------------------
-- Catalogo de sistema. Solo lectura desde la API.
-- ---------------------------------------------------------------------------
create table public.muscle_groups (
  id text primary key,
  name text not null,
  region text not null check (region in ('tren superior', 'tren inferior', 'core'))
);

create table public.movement_patterns (
  id text primary key,
  name text not null
);

create table public.training_objectives (
  id text primary key,
  name text not null,
  description text not null default ''
);

create table public.training_splits (
  id text primary key,
  name text not null,
  description text not null default '',
  sessions_per_week integer not null check (sessions_per_week between 1 and 7)
);

-- El material tiene dueño opcional: el de sistema y el que da de alta cada
-- equipo -«Prensa de piernas»- conviven en la misma tabla.
create table public.equipment (
  id text primary key default gen_random_uuid()::text,
  crew_id uuid references public.crews (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  kind text not null check (kind in ('peso libre', 'máquina', 'accesorio', 'peso corporal')),
  created_at timestamptz not null default now()
);

create index equipment_crew_id_idx on public.equipment (crew_id);

create table public.exercises (
  id text primary key default gen_random_uuid()::text,
  crew_id uuid references public.crews (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  description text,
  equipment_id text not null references public.equipment (id) on delete restrict,
  movement_pattern_id text not null references public.movement_patterns (id),
  primary_muscle_group_id text not null references public.muscle_groups (id),
  secondary_muscle_group_ids text[] not null default '{}',
  instructions text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index exercises_crew_id_idx on public.exercises (crew_id);

alter table public.muscle_groups enable row level security;
alter table public.movement_patterns enable row level security;
alter table public.training_objectives enable row level security;
alter table public.training_splits enable row level security;
alter table public.equipment enable row level security;
alter table public.exercises enable row level security;

create policy "el catalogo lo lee cualquiera identificado" on public.muscle_groups for select to authenticated using (true);
create policy "el catalogo lo lee cualquiera identificado" on public.movement_patterns for select to authenticated using (true);
create policy "el catalogo lo lee cualquiera identificado" on public.training_objectives for select to authenticated using (true);
create policy "el catalogo lo lee cualquiera identificado" on public.training_splits for select to authenticated using (true);

-- Material y ejercicios: los de sistema los ve todo el mundo; los del equipo,
-- sus miembros. Los escribe quien tiene `training.manage`, y solo los suyos.
create policy "el material de sistema y el del propio equipo se leen"
  on public.equipment for select to authenticated
  using (crew_id is null or public.is_crew_member(crew_id));
create policy "el material lo da de alta quien gestiona entrenamiento"
  on public.equipment for insert to authenticated
  with check (crew_id is not null and public.has_capability(crew_id, 'training.manage'));
create policy "el material lo edita quien gestiona entrenamiento"
  on public.equipment for update to authenticated
  using (crew_id is not null and public.has_capability(crew_id, 'training.manage'))
  with check (crew_id is not null and public.has_capability(crew_id, 'training.manage'));
create policy "el material lo borra quien gestiona entrenamiento"
  on public.equipment for delete to authenticated
  using (crew_id is not null and public.has_capability(crew_id, 'training.manage'));

create policy "los ejercicios de sistema y los del propio equipo se leen"
  on public.exercises for select to authenticated
  using (crew_id is null or public.is_crew_member(crew_id));
create policy "los ejercicios los da de alta quien gestiona entrenamiento"
  on public.exercises for insert to authenticated
  with check (crew_id is not null and public.has_capability(crew_id, 'training.manage'));
create policy "los ejercicios los edita quien gestiona entrenamiento"
  on public.exercises for update to authenticated
  using (crew_id is not null and public.has_capability(crew_id, 'training.manage'))
  with check (crew_id is not null and public.has_capability(crew_id, 'training.manage'));
create policy "los ejercicios los borra quien gestiona entrenamiento"
  on public.exercises for delete to authenticated
  using (crew_id is not null and public.has_capability(crew_id, 'training.manage'));

grant select on public.muscle_groups, public.movement_patterns, public.training_objectives, public.training_splits to authenticated;
grant select, insert, update, delete on public.equipment, public.exercises to authenticated;

-- ---------------------------------------------------------------------------
-- La forma de un bloque, comprobada en la base.
--
-- Es lo que `routine.ts` declara, en SQL: metodo dentro de su union, al menos
-- un ejercicio, series mayores que cero, repeticiones no vacias. Una escritura
-- malformada falla aqui y no en la sesion en vivo tres dias despues.
-- ---------------------------------------------------------------------------
create or replace function public.is_valid_block(block jsonb)
returns boolean
language sql
immutable
as $function$
  select
    jsonb_typeof(block) = 'object'
    and block ->> 'id' is not null
    and block ->> 'method' in ('simple', 'superserie', 'triserie', 'circuito')
    and jsonb_typeof(block -> 'exercises') = 'array'
    and jsonb_array_length(block -> 'exercises') >= 1
    and (block ->> 'restAfterSeconds')::numeric >= 0
    and not exists (
      select 1 from jsonb_array_elements(block -> 'exercises') e
      where e ->> 'id' is null
         or e ->> 'exerciseId' is null
         or coalesce((e ->> 'sets')::numeric, 0) < 1
         or coalesce(length(trim(e ->> 'reps')), 0) = 0
         or coalesce((e ->> 'restSeconds')::numeric, -1) < 0
         or (e ? 'weightKg' and (e ->> 'weightKg')::numeric < 0)
    );
$function$;

create or replace function public.is_valid_blocks(blocks jsonb)
returns boolean
language sql
immutable
as $function$
  select jsonb_typeof(blocks) = 'array'
    and jsonb_array_length(blocks) >= 1
    and not exists (
      select 1 from jsonb_array_elements(blocks) b where not public.is_valid_block(b)
    );
$function$;

-- Las semanas de un plan: numero, siete dias con su rutina o nada, y si es de
-- descarga.
create or replace function public.is_valid_weeks(weeks jsonb)
returns boolean
language sql
immutable
as $function$
  select jsonb_typeof(weeks) = 'array'
    and jsonb_array_length(weeks) >= 1
    and not exists (
      select 1 from jsonb_array_elements(weeks) w
      where coalesce((w ->> 'number')::numeric, 0) < 1
         or jsonb_typeof(w -> 'days') <> 'array'
         or jsonb_typeof(w -> 'isDeload') <> 'boolean'
         or exists (
           select 1 from jsonb_array_elements(w -> 'days') d
           where coalesce((d ->> 'dayOfWeek')::numeric, -1) not between 0 and 6
         )
    );
$function$;

-- ---------------------------------------------------------------------------
-- Rutinas, biblioteca de bloques, planes y asignaciones. Del equipo.
-- ---------------------------------------------------------------------------
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 120),
  description text not null default '',
  level text not null check (level in ('Principiante', 'Intermedio', 'Avanzado')),
  blocks jsonb not null check (public.is_valid_blocks(blocks)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index routines_crew_id_idx on public.routines (crew_id);

create table public.saved_blocks (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  block jsonb not null check (public.is_valid_block(block)),
  created_at timestamptz not null default now()
);

create index saved_blocks_crew_id_idx on public.saved_blocks (crew_id);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 120),
  description text not null default '',
  objective_id text not null references public.training_objectives (id),
  split_id text not null references public.training_splits (id),
  weekly_frequency integer not null check (weekly_frequency between 1 and 7),
  level text not null check (level in ('Principiante', 'Intermedio', 'Avanzado')),
  weeks jsonb not null check (public.is_valid_weeks(weeks)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plans_crew_id_idx on public.plans (crew_id);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  kind text not null check (kind in ('routine', 'plan')),
  -- `on delete restrict`: es `deletion.ts` en la base. Una rutina asignada no
  -- se borra; primero se retira la asignacion.
  routine_id uuid references public.routines (id) on delete restrict,
  plan_id uuid references public.plans (id) on delete restrict,
  start_date date,
  assigned_on date not null default current_date,
  notes text not null default '',
  check (
    (kind = 'routine' and routine_id is not null and plan_id is null)
    or (kind = 'plan' and plan_id is not null and routine_id is null)
  )
);

create index assignments_student_id_idx on public.assignments (student_id);

alter table public.routines enable row level security;
alter table public.saved_blocks enable row level security;
alter table public.plans enable row level security;
alter table public.assignments enable row level security;

-- Leen los miembros; escribe quien gestiona entrenamiento. Un alumno lee las
-- rutinas y los planes de su equipo porque son lo que va a ejecutar.
create policy "las rutinas las leen los miembros" on public.routines for select to authenticated using (public.is_crew_member(crew_id));
create policy "las rutinas las escribe quien gestiona entrenamiento" on public.routines for all to authenticated
  using (public.has_capability(crew_id, 'training.manage')) with check (public.has_capability(crew_id, 'training.manage'));

create policy "la biblioteca la lee el equipo tecnico" on public.saved_blocks for select to authenticated using (public.is_crew_staff(crew_id));
create policy "la biblioteca la escribe quien gestiona entrenamiento" on public.saved_blocks for all to authenticated
  using (public.has_capability(crew_id, 'training.manage')) with check (public.has_capability(crew_id, 'training.manage'));

create policy "los planes los leen los miembros" on public.plans for select to authenticated using (public.is_crew_member(crew_id));
create policy "los planes los escribe quien gestiona entrenamiento" on public.plans for all to authenticated
  using (public.has_capability(crew_id, 'training.manage')) with check (public.has_capability(crew_id, 'training.manage'));

-- Lo asignado lo ve el equipo tecnico, y cada alumno lo suyo.
create policy "las asignaciones las ve el equipo tecnico y cada alumno la suya"
  on public.assignments for select to authenticated
  using (
    public.is_crew_staff(crew_id)
    or exists (select 1 from public.students t where t.id = student_id and t.profile_id = (select auth.uid()))
  );
create policy "las asignaciones las escribe quien gestiona entrenamiento" on public.assignments for all to authenticated
  using (public.has_capability(crew_id, 'training.manage')) with check (public.has_capability(crew_id, 'training.manage'));

grant select, insert, update, delete on public.routines, public.saved_blocks, public.plans, public.assignments to authenticated;

-- Al editar, `updated_at` se pone solo.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

create trigger routines_touch_updated_at before update on public.routines
  for each row execute function public.touch_updated_at();
create trigger plans_touch_updated_at before update on public.plans
  for each row execute function public.touch_updated_at();
