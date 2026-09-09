-- Tiempo real para todo lo que la aplicacion ya escucha.
--
-- La migracion anterior publico cuatro tablas «en el orden del plan (§1.3)»:
-- avisos, muro y agenda. El resto quedo fuera con el argumento de que «los
-- edita una persona y los lee ella misma».
--
-- Ese argumento no se sostiene, y hay una prueba objetiva de que no: la
-- aplicacion YA ESTA SUSCRITA a las tablas que faltan. `useViewer` escucha
-- `crews`, `crew_staff`, `students` y `profiles`; treinta y siete puntos de
-- suscripcion repartidos por treinta hooks esperan avisos que nunca llegan,
-- porque una tabla que no esta publicada no emite nada. No era una decision de
-- alcance: era la mitad de una funcionalidad.
--
-- El caso que lo destapa es el mas basico de todos. Un entrenador crea su
-- equipo; `crews` no esta publicada, asi que su propia barra lateral sigue
-- diciendo «Sin equipo» hasta que recarga la pagina.

-- ---------------------------------------------------------------------------
-- 1. Las tablas que faltaban.
--
-- Publicar es lo que hace que `postgres_changes` emita. Quien recibe cada fila
-- lo sigue decidiendo RLS, tabla por tabla y suscriptor por suscriptor: aqui no
-- se abre ningun dato, solo se permite avisar de que cambio.
--
-- Van en dos grupos, porque responden a dos preguntas distintas.
-- ---------------------------------------------------------------------------

-- Pertenencia e identidad: de estas sale QUIEN eres y DONDE estas, y son las
-- que `useViewer` resuelve en el arranque. Sin ellas, unirse a un equipo,
-- fundarlo, que te acepten o que te asciendan no se ve hasta recargar.
alter publication supabase_realtime add table public.crews;
alter publication supabase_realtime add table public.crew_staff;
alter publication supabase_realtime add table public.students;
alter publication supabase_realtime add table public.profiles;

-- Datos del equipo: lo que se crea y cambia mientras se trabaja. Que «los
-- edita una persona» describe al autor, no al publico: una rutina la escribe
-- el entrenador y la esperan sus alumnos, y una cuota la marca quien lleva las
-- altas mientras el alumno mira su propia ficha.
alter publication supabase_realtime add table public.assignments;
alter publication supabase_realtime add table public.plans;
alter publication supabase_realtime add table public.routines;
alter publication supabase_realtime add table public.exercises;
alter publication supabase_realtime add table public.equipment;
alter publication supabase_realtime add table public.saved_blocks;
alter publication supabase_realtime add table public.student_subscriptions;

-- Deliberadamente FUERA, para que no se confunda con un olvido:
--
--   audit_log ............... nadie la pinta; es registro, no pantalla.
--   crew_wall_reads ......... marcas de lectura de uno mismo: el aviso llegaria
--                             a quien acaba de provocarlo.
--   join_token_lookups ...... contabilidad del limite de intentos.
--   platform_admin_emails ... se toca una vez por vida del proyecto.
--   role_capabilities ....... configuracion fija del sistema.
--   muscle_groups, movement_patterns,
--   training_objectives, training_splits
--                             catalogo de sistema: se siembra y no se edita en
--                             caliente. Publicarlas seria pagar una suscripcion
--                             abierta por una tabla que no cambia nunca.

-- ---------------------------------------------------------------------------
-- 2. `replica identity full` en todo lo publicado.
--
-- ESTO ARREGLA UN FALLO QUE YA TENIAN LAS CUATRO PRIMERAS, y no es un detalle
-- de afinado: sin esto, BORRAR NO AVISA.
--
-- Con la identidad por defecto, el registro de un DELETE lleva solo la clave
-- primaria. Y de ahi salen dos consecuencias, una de correccion y otra de
-- privacidad:
--
--   - De correccion: cualquier filtro por columna -`crew_id=eq.X`, que es como
--     se venia filtrando- no encuentra esa columna en el registro y descarta el
--     evento en silencio. Cancelar una sesion o dar de baja a un alumno no
--     refrescaba la pantalla de nadie.
--
--   - De privacidad: Realtime no puede evaluar RLS sobre una fila que solo
--     tiene su identificador, asi que el evento de borrado se reparte a TODOS
--     los suscriptores de la tabla. Se filtra el identificador de una fila que
--     el receptor no tenia derecho a leer.
--
-- Con la fila vieja entera, RLS se evalua igual que en un alta y el borrado se
-- comporta como cualquier otro cambio. El coste es mas volumen en el registro
-- de escritura, que a esta escala es irrelevante frente a las dos cosas que
-- corrige.
-- ---------------------------------------------------------------------------
alter table public.notices replica identity full;
alter table public.crew_posts replica identity full;
alter table public.crew_post_likes replica identity full;
alter table public.sessions replica identity full;
alter table public.crews replica identity full;
alter table public.crew_staff replica identity full;
alter table public.students replica identity full;
alter table public.profiles replica identity full;
alter table public.assignments replica identity full;
alter table public.plans replica identity full;
alter table public.routines replica identity full;
alter table public.exercises replica identity full;
alter table public.equipment replica identity full;
alter table public.saved_blocks replica identity full;
alter table public.student_subscriptions replica identity full;
