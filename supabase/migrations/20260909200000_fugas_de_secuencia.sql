-- Fugas de secuencia: dos salidas que el servidor no permitia.
--
-- El analisis de flujos encontro dos sitios donde una persona se quedaba
-- parada sin ninguna accion posible, y en los dos el cliente no podia
-- ofrecerla porque la base no la admitia.

-- ---------------------------------------------------------------------------
-- 1. Un alumno retira su propia solicitud.
--
-- Quien pedia entrar a un equipo con aprobacion se quedaba mirando «tu
-- entrenador tiene que aceptarte» sin poder hacer nada: ni retirarse si se
-- equivoco de codigo, ni pedir entrar a otro sitio. Borrar la ficha era solo
-- de quien tiene `students.manage`.
--
-- SOLO LA PENDIENTE. Una ficha activa tiene historial -sesiones, progreso-
-- y darse de baja de un equipo es otra decision, con otras consecuencias; la
-- pendiente no tiene nada detras todavia.
-- ---------------------------------------------------------------------------
create policy "una solicitud pendiente la retira quien la hizo"
  on public.students for delete to authenticated
  using (profile_id = (select auth.uid()) and membership_status = 'pending');

-- ---------------------------------------------------------------------------
-- 2. El equipo pide la activacion.
--
-- Un equipo nace con la suscripcion pendiente y su entrenador veia «hace
-- falta activar la suscripcion» sin ningun sitio al que ir a pedirla: la
-- activacion es una decision manual desde `/admin`, y quien administra la
-- plataforma no sabia quien estaba esperando de verdad y quien habia creado
-- un equipo para mirar.
--
-- Es una FECHA y no un booleano: dice cuando se pidio, que es lo que ordena
-- la cola de quien administra, y con ella el propio equipo ve que su
-- peticion consta. La escribe quien tiene `crew.settings`, por la politica de
-- actualizacion que ya existe; solo hace falta abrir la columna.
-- ---------------------------------------------------------------------------
alter table public.crews add column activation_requested_at timestamptz;

grant update (activation_requested_at) on public.crews to authenticated;
