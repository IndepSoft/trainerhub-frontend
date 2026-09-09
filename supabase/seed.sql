-- Semilla de desarrollo. Se carga con `supabase db reset` y `supabase start`.
--
-- Es la traduccion a SQL de los `*Seed.ts` de `shared/infrastructure/fake`,
-- para que trabajar en local contra la base de verdad ofrezca lo mismo que la
-- simulacion: las mismas cuentas, el mismo equipo, la misma contraseña. Crece
-- fase a fase, tabla a tabla, junto a cada migracion.
--
-- LAS CUENTAS SE INSERTAN EN `auth.users` DIRECTAMENTE. Es el unico modo de
-- tener cuentas confirmadas sin pasar por el correo, y la semilla corre como
-- `postgres`, que puede. La contraseña es la misma que usa la suite de
-- Playwright contra la simulacion, para que `signIn` valga contra los dos.
--
-- Los identificadores son fijos y legibles: los mismos que `devIdentity` NO
-- puede dar -aquellos son un hash del correo- pero estables entre reinicios,
-- que es lo que importa para poder escribir una URL en una prueba.

-- ---------------------------------------------------------------------------
-- Cuentas
-- ---------------------------------------------------------------------------

-- El administrador de plataforma va ANTES que su cuenta: el disparador del alta
-- lo busca en `platform_admin_emails` para darle el rol.
insert into public.platform_admin_emails (email) values ('admin@indepsoft.com');

-- Un bloque `DO` y no una funcion en `pg_temp`: la CLI manda la semilla en
-- lotes, y en ese modo el esquema temporal no existe todavia cuando se declara
-- la funcion -medido en la CI con la 2.75.0: «schema "pg_temp" does not
-- exist»-. El bloque no deja nada detras, que es lo que se queria de `pg_temp`.
do $$
declare
  account record;
begin
  for account in
    select * from (values
      ('10000000-0000-4000-8000-000000000001'::uuid, 'entrenador@indepsoft.com', 'Marco', 'Salas', 'trainer'),
      ('10000000-0000-4000-8000-000000000002'::uuid, 'lucia@indepsoft.com', 'Lucía', 'Ferrer', 'trainer'),
      ('10000000-0000-4000-8000-000000000003'::uuid, 'admin@indepsoft.com', 'Ada', 'Plataforma', 'trainer')
    ) as accounts (user_id, user_email, first_name, last_name, intent)
  loop
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      account.user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      account.user_email, crypt('desarrollo123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('intent', account.intent, 'first_name', account.first_name, 'last_name', account.last_name),
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), account.user_id, account.user_id::text,
      jsonb_build_object('sub', account.user_id::text, 'email', account.user_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Equipos y puestos (fase 1)
-- ---------------------------------------------------------------------------
insert into public.crews (id, name, denomination, created_by, join_token, requires_approval, ranking_enabled, subscription_status)
values
  ('20000000-0000-4000-8000-000000000001', 'Hierro y Asfalto', 'Crew', '10000000-0000-4000-8000-000000000001', 'HIERRO24', true, true, 'active'),
  ('20000000-0000-4000-8000-000000000002', 'CREWTEST', 'Crew', '10000000-0000-4000-8000-000000000003', 'CREWTEST', true, true, 'active');

insert into public.crew_staff (crew_id, profile_id, role, extra_capabilities)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'admin', '{}'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'trainer', '{crew.settings}'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', 'admin', '{}');

-- ---------------------------------------------------------------------------
-- Catalogo de sistema (fase 3). Es `catalog.mock.ts`, tal cual.
-- ---------------------------------------------------------------------------
insert into public.muscle_groups (id, name, region) values
  ('pectoral', 'Pectoral', 'tren superior'),
  ('dorsal', 'Dorsal', 'tren superior'),
  ('deltoides', 'Deltoides', 'tren superior'),
  ('trapecio', 'Trapecio', 'tren superior'),
  ('biceps', 'Bíceps', 'tren superior'),
  ('triceps', 'Tríceps', 'tren superior'),
  ('cuadriceps', 'Cuádriceps', 'tren inferior'),
  ('isquiosurales', 'Isquiosurales', 'tren inferior'),
  ('gluteo', 'Glúteo', 'tren inferior'),
  ('aductores', 'Aductores', 'tren inferior'),
  ('gemelos', 'Gemelos', 'tren inferior'),
  ('abdomen', 'Abdomen', 'core'),
  ('lumbar', 'Lumbar', 'core');

insert into public.movement_patterns (id, name) values
  ('empuje-horizontal', 'Empuje horizontal'),
  ('empuje-vertical', 'Empuje vertical'),
  ('traccion-horizontal', 'Tracción horizontal'),
  ('traccion-vertical', 'Tracción vertical'),
  ('dominante-rodilla', 'Dominante de rodilla'),
  ('dominante-cadera', 'Dominante de cadera'),
  ('core-antiextension', 'Core · antiextensión'),
  ('core-antirotacion', 'Core · antirrotación'),
  ('monoarticular', 'Monoarticular');

insert into public.equipment (id, crew_id, name, kind) values
  ('barra', null, 'Barra', 'peso libre'),
  ('mancuerna', null, 'Mancuernas', 'peso libre'),
  ('kettlebell', null, 'Kettlebell', 'peso libre'),
  ('polea', null, 'Polea', 'máquina'),
  ('maquina-guiada', null, 'Máquina guiada', 'máquina'),
  ('multipower', null, 'Multipower', 'máquina'),
  ('banco', null, 'Banco', 'accesorio'),
  ('banda', null, 'Banda elástica', 'accesorio'),
  ('trx', null, 'TRX', 'accesorio'),
  ('peso-corporal', null, 'Peso corporal', 'peso corporal');

insert into public.training_objectives (id, name, description) values
  ('hipertrofia', 'Hipertrofia', 'Aumento de masa muscular. Volumen alto, RIR 1-3.'),
  ('fuerza-maxima', 'Fuerza máxima', 'Cargas altas, pocas repeticiones y descansos largos.'),
  ('resistencia-muscular', 'Resistencia muscular', 'Repeticiones altas y descansos cortos.'),
  ('perdida-grasa', 'Pérdida de grasa', 'Densidad de trabajo alta, con circuitos y superseries.'),
  ('acondicionamiento', 'Acondicionamiento general', 'Base de fuerza y movilidad para quien empieza o vuelve.');

insert into public.training_splits (id, name, description, sessions_per_week) values
  ('full-body', 'Full body', 'Todo el cuerpo en cada sesión. Frecuencia alta por músculo.', 3),
  ('torso-pierna', 'Torso / Pierna', 'Alterna tren superior y tren inferior.', 4),
  ('empuje-traccion-pierna', 'Empuje / Tracción / Pierna', 'Reparte por patrón de movimiento. Conocida como PPL.', 6),
  ('weider', 'Weider', 'Un grupo muscular por sesión. Frecuencia 1.', 5);

-- Los ejercicios de sistema. Es `exercisesSeed.ts`, tal cual.
insert into public.exercises (id, crew_id, name, equipment_id, movement_pattern_id, primary_muscle_group_id, secondary_muscle_group_ids, instructions) values
  ('sentadilla-barra', null, 'Sentadilla con barra', 'barra', 'dominante-rodilla', 'cuadriceps', '{gluteo,isquiosurales,lumbar}',
   array['Barra apoyada sobre el trapecio, pies al ancho de los hombros.', 'Baja controlando hasta que el muslo quede paralelo al suelo.', 'Empuja desde el medio del pie sin dejar caer el pecho.']),
  ('peso-muerto-rumano', null, 'Peso muerto rumano', 'barra', 'dominante-cadera', 'isquiosurales', '{gluteo,lumbar}',
   array['Rodillas ligeramente flexionadas y fijas.', 'Lleva la cadera atrás manteniendo la barra pegada a la pierna.', 'Sube apretando el glúteo, sin hiperextender la espalda.']),
  ('press-banca-barra', null, 'Press de banca con barra', 'barra', 'empuje-horizontal', 'pectoral', '{triceps,deltoides}',
   array['Escápulas retraídas y pies apoyados.', 'Baja la barra al esternón con los codos a unos 45 grados.', 'Empuja sin despegar la zona lumbar del banco.']),
  ('press-inclinado-mancuernas', null, 'Press inclinado con mancuernas', 'mancuerna', 'empuje-horizontal', 'pectoral', '{deltoides,triceps}',
   array['Banco a 30 grados.', 'Baja hasta sentir estiramiento sin forzar el hombro.']),
  ('remo-barra', null, 'Remo con barra', 'barra', 'traccion-horizontal', 'dorsal', '{biceps,trapecio,lumbar}',
   array['Tronco inclinado unos 45 grados.', 'Lleva la barra al ombligo.']),
  ('jalon-polea', null, 'Jalón al pecho en polea', 'polea', 'traccion-vertical', 'dorsal', '{biceps}',
   array['Agarre algo más ancho que los hombros.', 'Lleva los codos hacia las costillas.']),
  ('press-militar-barra', null, 'Press militar con barra', 'barra', 'empuje-vertical', 'deltoides', '{triceps,trapecio}',
   array['De pie, core apretado.', 'Empuja sin arquear la lumbar.']),
  ('curl-biceps-mancuernas', null, 'Curl de bíceps con mancuernas', 'mancuerna', 'monoarticular', 'biceps', '{}',
   array['Codos pegados al tronco.', 'Sube sin balancear.']),
  ('extension-triceps-polea', null, 'Extensión de tríceps en polea', 'polea', 'monoarticular', 'triceps', '{}',
   array['Codos fijos.', 'Extiende sin adelantar los hombros.']),
  ('zancada-mancuernas', null, 'Zancada con mancuernas', 'mancuerna', 'dominante-rodilla', 'cuadriceps', '{gluteo,isquiosurales}',
   array['Paso largo, rodilla trasera cerca del suelo.', 'Tronco vertical.']),
  ('hip-thrust-barra', null, 'Hip thrust con barra', 'barra', 'dominante-cadera', 'gluteo', '{isquiosurales}',
   array['Espalda apoyada en el banco.', 'Sube hasta alinear tronco y muslo.']),
  ('flexiones', null, 'Flexiones', 'peso-corporal', 'empuje-horizontal', 'pectoral', '{triceps,deltoides,abdomen}',
   array['Cuerpo en línea recta.', 'Codos a unos 45 grados.']),
  ('plancha', null, 'Plancha', 'peso-corporal', 'core-antiextension', 'abdomen', '{lumbar,deltoides}',
   array['Antebrazos bajo los hombros.', 'Glúteo apretado, cadera neutra.']),
  ('pallof-press-polea', null, 'Pallof press en polea', 'polea', 'core-antirotacion', 'abdomen', '{gluteo}',
   array['De perfil a la polea.', 'Extiende los brazos resistiendo la rotación.']),
  ('elevacion-gemelos', null, 'Elevación de gemelos', 'maquina-guiada', 'monoarticular', 'gemelos', '{}',
   array['Recorrido completo.', 'Pausa arriba.']);
