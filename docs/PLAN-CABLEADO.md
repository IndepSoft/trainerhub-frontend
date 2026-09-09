# Plan de cableado: de la aplicación simulada a la aplicación funcional

Fecha: 6 de septiembre de 2026. Rama de partida: `feature/supabase-connection`.

Este plan sale de un inventario medido sobre el código, no de una lectura por
encima: los quince puertos de repositorio y el ámbito de crew, las doce
entidades, las reglas que hoy
comprueba el navegador, los tres almacenes que no pasan por ningún puerto, y los
cincuenta y cuatro `TODO:` declarados en `src/`. Lo que hay aquí es lo que falta
para que la aplicación funcione de verdad, ordenado por quién depende de quién.

**Regla del plan: cada fase deja la aplicación funcionando.** No hay un momento
de «apagar los fakes y encender Supabase». Cada repositorio se sustituye por
separado, con su migración, su prueba de contrato y su línea en la raíz de
composición, exactamente como se hizo con la autenticación y el perfil.

---

## 0. Dónde estamos

| Capa | Estado | Lo que se ve |
|---|---|---|
| Autenticación y perfil | **Real** (`auth.users` + `profiles`) | Se puede crear cuenta y entrar |
| Equipos, puestos, alumnos, suscripciones, avisos | Simulado, en memoria | Al recargar vuelve la semilla |
| Rutinas, planes, asignaciones, ejercicios | Simulado, en memoria | Ídem |
| Agenda y sesión en vivo | Simulado, en memoria | Ídem; la sesión de cardio es un mock con GPS |
| Catálogo de material y biblioteca de bloques | **Sin puerto**: `zustand` en memoria | Lo que añade el entrenador se pierde al recargar |
| Progreso, logros, ranking | Derivado de sesiones (sin tabla) | Correcto por diseño |
| Plataforma (admin) | Simulado sobre los fakes de crews y alumnos | — |

**Consecuencia:** con la autenticación real activada la aplicación se ve vacía,
porque todos los demás repositorios reconocen sólo los identificadores que
inventa `FakeAuthAdapter`. Por eso `.env` sigue con `VITE_USE_FAKE_AUTH=true`.

Lo que ya está resuelto y se reutiliza tal cual:

- **Los puertos.** Están escritos en operaciones de negocio, no de consulta.
  Ningún hook ni componente cambia en este plan: sólo se escriben adaptadores y
  se cambian líneas en `container.ts`.
- **Cada regla tiene una sola definición** en `shared/domain` —`can`,
  `lastAdminBlocker`, `canEnrollMembers`, `subscriptionStanding`, `experienceOf`—.
  Portarlas al servidor es traducir una función, no buscarla por la aplicación.
- **La receta del adaptador** ya existe (§25 de CAMBIOS): migración, mapper,
  adaptador con `mapDataError`, y la misma condición de elección que la
  autenticación.

---

## 1. Decisiones que condicionan todo lo demás

Se toman antes de escribir el primer adaptador, porque cambiarlas después cuesta
rehacer los que ya existan.

### 1.1 Dónde corren las pruebas

Hoy hay 181 pruebas de Playwright que se identifican contra el adaptador
simulado. Sirven para la interfaz y la lógica de dominio, y **no ejercitan ni un
adaptador real ni una sola política RLS**. Con doce adaptadores nuevos, el error
típico —una política que deja ver de más, o de menos— sería invisible.

| Opción | Qué da | Qué cuesta |
|---|---|---|
| A. Seguir sólo con fakes | Suite rápida | RLS sin probar nunca |
| B. Toda la suite contra Supabase | Todo real | Lenta, frágil, comparte datos |
| **C. Dos suites** | UI rápida + adaptadores reales | Supabase local en CI |

**Recomendación: C.** La suite de Playwright sigue contra los fakes. Se añade
una **suite de contrato por adaptador** —Vitest, en Node, sin navegador— contra
**Supabase local** (`supabase start`, Docker), con la semilla cargada. Cada
contrato prueba las operaciones del puerto **y al menos un caso negativo de
RLS**: «un alumno no lee las sesiones de otro», «un entrenador no escribe en un
equipo ajeno». Esas pruebas negativas son la especificación de cada política.

Cuesta: Docker en CI (`supabase/setup-cli` + `supabase start`, unos dos minutos),
Vitest como dependencia nueva, y una semilla SQL. Es el precio de saber que las
políticas hacen lo que dicen.

### 1.2 Documento o tablas: rutinas, planes y resultados

`Routine.blocks`, `TrainingPlan.weeks` y `SessionResult.sets` son estructuras
anidadas que la aplicación **edita y lee enteras** y nunca consulta por dentro.

**Recomendación: JSONB.** Una columna `blocks jsonb` en `routines`, `weeks jsonb`
en `plans`, `result jsonb` en `sessions`. Normalizarlas serían siete tablas más,
tres mappers de ida y vuelta, y no se ganaría ninguna consulta que la aplicación
haga hoy. La forma se valida con una función `check` en la migración, para que
una escritura malformada falle en la base y no en la pantalla.

El día que haga falta consultar por dentro —«todas las rutinas que usan este
ejercicio», «la progresión de cargas de un ejercicio en dos años»— se extrae esa
parte a una tabla. Ese día no es hoy: la progresión de cargas de un alumno son
unas trescientas sesiones y se reduce en el cliente sin esfuerzo.

### 1.3 Cuándo hace falta tiempo real

Todos los puertos tienen `onChange`, y el contrato admite no avisar nunca. Los
fakes avisan porque escriben en memoria; con Supabase, avisar es
`postgres_changes`, tabla a tabla, con la publicación habilitada y RLS aplicada
al canal.

**Recomendación: no-op al principio, tiempo real después y por tabla**, en este
orden: avisos (la campana), muro, agenda. Rutinas, planes o catálogo no lo
necesitan: los edita una persona y los lee ella misma.

### 1.4 Los errores viajan como claves

`errorMapper` devuelve castellano a fuego y `AppError.message` va directo a la
pantalla. Con la aplicación en tres idiomas y **doce adaptadores por escribir**,
es ahora o nunca: `AppError` pasa a llevar una `TranslationKey`, y quien pinta
traduce. Hacerlo después es tocar doce ficheros.

### 1.5 Supabase local para desarrollo

Hoy hay un solo proyecto en la nube. Desarrollar contra él es compartir datos y
límites de correo entre todo el mundo. **Recomendación:** `supabase start` en
local para desarrollar y probar; el proyecto en la nube queda para pre-producción
y producción, cada uno con su `.env`.

---

## 2. Fase 0 · Cimientos

Sin código de aplicación. Todo lo que viene después lo da por hecho.

**Herramientas**

- Instalar la CLI de Supabase; `supabase init`; `supabase link` al proyecto.
- `supabase db pull`: bajar las dos migraciones que hoy sólo existen en la nube
  (`crear_perfiles_y_roles`, `endurecer_funciones_security_definer`) para que el
  esquema completo viva en `supabase/migrations/`.
- `supabase/seed.sql`: los `*Seed.ts` traducidos a SQL. Es la misma semilla para
  desarrollo local y para las pruebas de contrato.
- Vitest + configuración de contratos contra `supabase start`.
- CI: añadir Playwright (hoy sólo lint y build) y la suite de contratos con
  Supabase local. Migración pendiente = PR rojo: `supabase db diff` sin cambios.

**Proyecto**

- **SMTP propio** (Resend, Postmark, SES). El emisor de Supabase está limitado a
  unos pocos correos por hora y no es para producción; se comprobó al tercer alta.
- **Lista blanca de redirecciones** con los orígenes de desarrollo, pre y
  producción. Sin esto el correo de confirmación devuelve a la Site URL.
- Decidir Google: habilitarlo exige un cliente OAuth. Si se habilita, el
  disparador `handle_new_user` debe leer `full_name` y `avatar_url`, que es como
  Google manda el nombre y la foto.

**Código transversal**

- `AppError` con clave de traducción (§1.4).
- **Al cerrar sesión, borrar `trainerhub.crew.activo`**: hoy `useLogout` no lo
  toca, y en un dispositivo compartido el siguiente en entrar hereda el ámbito
  del anterior. Con datos reales es una fuga, no una molestia.
- `CrewStaff.displayName` y `email` dejan de copiarse: con `profiles` existiendo,
  se referencian. Cierra la deuda que lo dejó escrito.
- `Crew.ownerId` pasa a `createdBy`: el gobierno sale de los puestos desde §14 y
  el campo sólo confunde.

**Tamaño:** 3–4 días.

---

## 3. Fase 1 · Equipos y puestos (la tenencia)

Es la fase que hace que la aplicación **se vea** con una cuenta real: sin equipo
no hay ámbito, y sin ámbito todo está vacío.

### Tablas

```
crews            id, name, denomination, created_by → profiles,
                 join_token (único), requires_approval, ranking_enabled,
                 subscription_status, photo_url, timezone, created_at
crew_staff       id, crew_id, profile_id, role, extra_capabilities text[],
                 único (crew_id, profile_id)
role_capabilities role, capability      ← sembrada desde CAPABILITIES_BY_ROLE
```

### Funciones del servidor

| Función | Por qué existe |
|---|---|
| `create_crew(name, denomination)` | Crea el crew **y** el puesto de administrador en la misma transacción. Cierra el `TODO` de `useCrewEditor`: hoy son dos escrituras y la segunda puede fallar. |
| `rotate_join_token(crew_id)` | Genera y devuelve un token nuevo. Exige `crew.invite`. |
| `find_crew_by_join_token(token)` | **SECURITY DEFINER y devuelve sólo nombre, denominación, foto y si exige aprobación.** Quien escanea el QR todavía no es miembro y RLS no le dejaría leer la fila entera; tampoco debe poder. |
| `is_crew_member(crew_id)` | Base de todas las políticas de lectura. |
| `has_capability(crew_id, capability)` | Base de todas las políticas de escritura: mira el puesto contra `role_capabilities` y, si no, las concesiones extra del puesto o de la ficha de alumno. Es `permissions.can`, en SQL. |

`role_capabilities` duplica `CAPABILITIES_BY_ROLE`. Es la única duplicación
que este plan acepta, y va vigilada: **una prueba de contrato compara la tabla
con la constante** y falla si divergen.

### Políticas

- Leer `crews`: `is_crew_member(id)` o administrador de plataforma.
- Escribir `crews`: `has_capability(id, 'crew.settings')`.
- Leer `crew_staff`: miembros del crew (la página de equipo lista los puestos).
- Escribir `crew_staff`: `has_capability(crew_id, 'crew.staff')`.
- **Último administrador:** disparador `before update or delete` en `crew_staff`
  que rechaza dejar un crew sin ningún `admin`. Es `lastAdminBlocker`, en SQL.

### Adaptadores

`SupabaseCrewRepository`, `SupabaseCrewStaffRepository`. `useViewer` no cambia:
ya compone pertenencias desde los puertos.

### Al terminar

Una cuenta real crea su equipo, ve su QR, nombra a otro administrador y no puede
quedarse sin ninguno. La barra lateral tiene nombre.

**Tamaño:** 4–5 días.

---

## 4. Fase 2 · Alumnos, pertenencia, cuotas y avisos

### Tablas

```
students                id, crew_id, profile_id (nullable), first_name, last_name,
                        email, level, goals text[], age, body_fat_percentage,
                        photo_url, extra_capabilities text[], membership_status,
                        único (crew_id, lower(email))
student_subscriptions   student_id, crew_id, period_days, paid_through
notices                 id, crew_id, student_id, kind, body, created_at, read_at
```

El correo es único **por crew**, no global: la misma persona puede ser alumna en
dos equipos, y eso es una pertenencia por fila.

### El alta que enlaza, en el servidor

Esto cierra el punto 4 de la auditoría (§25.10): con la confirmación por correo,
`claimByEmail`, `joinWithCode` y el retorno al QR ya no corren nunca en el
cliente. Su sitio es el servidor, y ahí caben enteros:

- **`claim_students_by_email`**: disparador `after insert` en `profiles`. Busca
  fichas con ese correo, sin cuenta y en estado `invited`, y las enlaza. Es lo
  que hacía `claimByEmail`, atómico con el nacimiento de la cuenta, sin que el
  cliente tenga que estar dentro.
- **El código de equipo viaja en los metadatos del alta**, como la intención.
  El mismo disparador lo lee y llama a `claim_membership`. Sobrevive al viaje por
  el correo porque ocurre antes de que el correo salga. Y el retorno al QR deja
  de hacer falta: cuando la persona entra, ya pertenece —o ya está en espera— y
  `HomeRedirect` la manda a su progreso.
- **`claim_membership(crew_token)`**: la función del servidor que `StudentRepository`
  ya anuncia en su `TODO`. Comprueba `canEnrollMembers` —suscripción activa— y
  `requires_approval`, y crea o actualiza la ficha. Es la que también usa la
  pantalla de unirse para quien ya tiene cuenta.

### Políticas

- Leer `students`: miembros del crew ven las fichas del crew. **Un alumno ve la
  suya**; ver las de otros no es una necesidad de ninguna pantalla.
- Escribir `students`: `has_capability(crew_id, 'students.manage')`; la propia
  ficha, sólo los campos de perfil (`updateProfile`) mediante permiso por columna,
  como en `profiles`.
- Aprobar solicitudes: `crew.members`.
- `student_subscriptions`: leer y escribir con `students.manage`.
- `notices`: escribe `students.manage`; lee el alumno destinatario y quien
  gestiona.

### Plataforma

`PlatformRepository` pasa a cuatro RPC `SECURITY DEFINER` que empiezan con
`if not is_platform_admin(auth.uid()) then raise`: `platform_list_crews`,
`platform_list_users(page, size, search, role)`, `platform_set_membership`,
`platform_set_subscription`. La lógica de `setMembership` —que hoy vive en el
fake con sus ramas de ascender, degradar y conceder— se traduce tal cual.

### Adaptadores

`SupabaseStudentRepository`, `SupabaseSubscriptionRepository`,
`SupabaseNoticeRepository`, `SupabasePlatformRepository`. Tiempo real en
`notices` (la campana).

### Al terminar

Un entrenador da de alta fichas, invita por correo, y la persona que se registra
con ese correo entra a su equipo sin hacer nada más. Las cuotas y los avisos
persisten. El panel de plataforma gobierna equipos reales.

**Tamaño:** 5–6 días.

---

## 5. Fase 3 · Entrenamiento: catálogo, ejercicios, rutinas, planes

### Dos puertos que no existen

El catálogo de material y la biblioteca de bloques viven en `zustand`, sin puerto
y sin adaptador; lo que añade el entrenador se pierde al recargar y ningún hook
puede pedirlo por un contrato. Antes de escribir sus adaptadores hay que darles
puerto: **`CatalogRepository`** (material) y **`BlockLibraryRepository`**
(bloques guardados). Es el mismo trabajo que ya se hizo con todo lo demás.

### Tablas

```
muscle_groups, movement_patterns, training_objectives, training_splits
                    ← catálogo de sistema: sólo lectura para todos, escribe el rol de servicio
equipment           id, crew_id (nullable: null = de sistema), name, kind
exercises           id, crew_id (nullable), name, description, equipment_id,
                    movement_pattern_id, primary_muscle_group_id,
                    secondary_muscle_group_ids text[], instructions text[]
routines            id, crew_id, title, description, level, blocks jsonb
saved_blocks        id, crew_id, name, block jsonb
plans               id, crew_id, title, description, objective_id, split_id,
                    weekly_frequency, level, weeks jsonb
assignments         id, crew_id, student_id, kind, routine_id, plan_id,
                    start_date, assigned_on, notes
                    check: (kind='routine' and routine_id is not null) or (kind='plan' and plan_id is not null)
```

`crew_id` nulo en material y ejercicios significa «de sistema»: lo ve todo el
mundo y lo escribe sólo el rol de servicio. Con `crew_id`, es del equipo. Es lo
que `exercisesSeed` y `catalog.mock` ya anuncian en sus `TODO`.

### Validación del documento

`blocks` y `weeks` se validan con una función `check` que exige la forma que
`routine.ts` y `plan.ts` declaran: método del bloque en su unión, series mayores
que cero, `tempo` con cuatro tiempos si viene. Una escritura malformada falla en
la base, no en la sesión en vivo tres días después.

### Borrado

`deletion.ts` ya decide qué se puede borrar («una rutina que programa un plan,
no»). En el servidor son claves foráneas con `on delete restrict` y el error
`23503` que `mapDataError` ya traduce.

### Políticas

Leer: miembros. Escribir: `has_capability(crew_id, 'training.manage')`.

### Adaptadores

`SupabaseExerciseRepository`, `SupabaseCatalogRepository`,
`SupabaseRoutineRepository`, `SupabaseBlockLibraryRepository`,
`SupabasePlanRepository`, `SupabaseAssignmentRepository`.

### Lo que se arregla de paso

- `RoutineCard` «Vista previa» sin conectar.
- `TrainingFilters` no filtra. Con datos reales, filtrar en el cliente sobre lo ya
  descargado es suficiente para cientos de rutinas; no hace falta consulta.
- Tempo y notas del ejercicio siguen sin campo en el editor: **darles interfaz
  entra aquí**, porque ya existen en el documento y se validan.

**Tamaño:** 5–6 días.

---

## 6. Fase 4 · Agenda y sesión en vivo

### Tablas

```
sessions            id, crew_id, student_id (nullable), title, kind, modality,
                    category, date (date), time (time), duration_minutes, location,
                    status, notes, routine_id, result jsonb,
                    assignment_id (nullable), created_at
                    índices: (crew_id, date), (student_id, date)
session_attendance  session_id, student_id     ← NUEVA ENTIDAD, ver decisión
```

**Fecha y hora se guardan como `date` y `time`, no como `timestamptz`.** Una
sesión es «el martes a las nueve en el gimnasio»; convertirla a UTC y devolverla
la movería de día en cuanto alguien viaje. `crews.timezone` existe desde la fase
1 para quien lo necesite calcular.

### Funciones del servidor

| Función | Por qué existe |
|---|---|
| `complete_session(id, result)` | Estado y resultado en una escritura. Hoy son dos y la pantalla de la sesión podría quedarse con una. |
| `create_sessions(batch, assignment_id)` | El volcado de un plan a la agenda, atómico. **Guarda de qué volcado salió cada sesión**, que es lo que hoy no se guarda: sin eso no se pueden mover ni cancelar en bloque y volcar dos veces duplica. |

### Lo que RLS resuelve sin código

`crewScope.asStudent()` hoy filtra en el fake para que un alumno vea sólo sus
sesiones y las grupales. Con RLS es la política: `student_id = mi ficha or
student_id is null`, además de la pertenencia. El ámbito del cliente sigue
existiendo para elegir **en qué crew** se trabaja; dejar de ser la barrera de
datos es exactamente lo que estaba escrito en `container.ts`.

### Lo que se arregla de paso

- `SessionDetailsModal`: el estado y las notas no se persisten. Se cablean a
  `updateStatus` y `update`.
- Los choques de horario (`findOverlappingSessions`) siguen en el cliente: son un
  aviso, no una prohibición, y así lo decidió §15.
- Tiempo real en `sessions`: la agenda de un equipo con dos entrenadores se
  actualiza sola.

### Decisión: sesiones grupales

`Session.kind = 'group'` existe y tiene `student_id` nulo. **No hay modelo de
asistencia**, así que una sesión grupal no cuenta para el progreso de nadie: los
logros de la categoría «asistencia» sólo ven sesiones individuales. Cerrarlo es
`session_attendance` y pasar lista al terminar. Es una entidad nueva y una
pantalla nueva; va marcada como decisión, no como obviedad.

### Lo que sigue simulado, a propósito

La sesión de cardio (`liveSession.mock.ts`) dibuja una carrera con GPS y no
guarda nada. Guardar rutas es otro producto —permisos de ubicación, precisión,
privacidad— y no entra en este plan.

**Tamaño:** 4–5 días.

---

## 7. Fase 5 · Progreso, ranking y muro

### Lo que NO necesita tabla

El progreso —experiencia, nivel, racha, logros— se deriva de las sesiones con
`experience.ts` y `achievementEvaluation.ts`, y **se queda así**. Nada calculado
se guarda; corregir una sesión corrige el progreso. Es el mismo criterio que la
progresión de cargas.

### Lo que sí, por RLS

El **ranking** necesita las sesiones de todos los alumnos del crew, y un alumno
no puede leerlas. Así que `crewProgress.ofCrew(period)` pasa a ser
`crew_ranking(crew_id, period)`: `SECURITY DEFINER`, comprueba pertenencia y que
`ranking_enabled` esté puesto, y devuelve **sólo agregados**: experiencia y
sesiones por alumno. La fórmula de la experiencia —veinte por sesión, una por
serie— queda en SQL; es la segunda y última duplicación aceptada, y va con su
prueba de contrato contra `experience.ts`.

### Muro

```
crew_posts        id, crew_id, author_profile_id, body, created_at
crew_post_likes   post_id, profile_id     ← único
crew_posts_view   + like_count, liked_by_me
```

Cierra el `TODO` de `CrewPost.likedBy`: la lista entera de quién dio «me gusta»
no viaja nunca. `toggleLike` es un RPC. Tiempo real en `crew_posts`, y **un
contador de no leídos** en la entrada de navegación del equipo —lo barato que
§6 de CLAUDE.md dejó escrito— con `crew_wall_reads(profile_id, crew_id, read_at)`.

### Adaptadores

`SupabaseCrewProgressRepository`, `SupabaseCrewPostRepository`.

**Tamaño:** 3–4 días.

---

## 8. Fase 6 · Cuenta completa

Lo que quedó abierto en §25.12 y no depende de ningún repositorio.

| Qué | Cómo |
|---|---|
| Recuperar contraseña | `AuthPort.requestPasswordReset(email)` → `resetPasswordForEmail` con `redirectTo`; ruta `/authentication/nueva-contrasena`; `onAuthStateChange` distingue el evento de recuperación; `AuthPort.updatePassword`. Enciende el botón apagado. |
| Cambiar contraseña | El mismo `updatePassword`, desde Configuración. Cierra la deuda. |
| Reenviar confirmación | `AuthPort.resendConfirmation(email)` → `auth.resend`. Un botón en «Revisa tu correo». |
| Google | Si se decide: habilitar el proveedor, y el disparador lee `full_name` / `avatar_url`. Quitar el `disabled`. |
| Fotos | Hoy son direcciones tecleadas. Con Supabase Storage: bucket `avatars`, política «cada uno escribe en su carpeta», y un campo de subida en Configuración y en la ficha. **Decisión**: es la primera vez que la aplicación guarda ficheros. |
| Onboarding | Hoy es «visto en este dispositivo» (`localStorage`). Con cuentas, `profiles.onboarded_at`: quien lo vio, lo vio. Decisión menor. |
| Borrar la cuenta | No existe. Con datos reales de personas es obligatorio tenerlo, y con RLS y `on delete cascade` desde `profiles` es una función corta. |

**Tamaño:** 3–4 días.

---

## 9. Fase 7 · Producción

- **Dos proyectos** —pre y producción— con sus `.env`, y `VITE_USE_FAKE_AUTH`
  ausente en ambos por construcción: ya se elimina del bundle en producción.
- **Auditoría**: tabla `audit_log` escrita por un disparador genérico en
  `crew_staff`, `students`, `student_subscriptions` y `crews`. Quién, qué, cuándo.
  Es barato y hoy no existe.
- **Copias de seguridad**: el plan gratuito de Supabase no guarda copias
  diarias. Antes de tener alumnos de verdad, plan de pago o `pg_dump` programado.
- **Ritmo del token de unión**: ocho caracteres se pueden adivinar. La función
  que lo resuelve devuelve lo mínimo y lleva un límite por IP; y el token se rota
  desde ajustes, que ya existe.
- **PWA**: la caché sigue sin tocar la API —decidido y correcto—; queda la
  instalación en dispositivo real y los iconos definitivos. Escrituras sin
  conexión: **no en esta versión**; una sesión en vivo sin red pierde su
  resultado, y hay que decirlo en pantalla en vez de fingir que se guardó.
- **Observabilidad**: los logs de Supabase valen para empezar; un capturador de
  errores del cliente es decisión aparte.

**Tamaño:** 2–3 días.

---

## 10. Huecos que no son cableado

Están en el código como `TODO` y sin ellos la aplicación no queda «completamente
funcional». Ninguno depende de Supabase; se pueden hacer en cualquier momento, y
conviene repartirlos entre las fases para que cada una entregue pantalla completa.

| Hueco | Dónde | Fase natural |
|---|---|---|
| Cinco acciones de `StudentCard` sin conectar | `students` | 2 |
| `StudentFilters` no filtra | `students` | 2 |
| `TrainingFilters` no filtra; «Vista previa» sin conectar | `trainings` | 3 |
| Tempo y notas sin campo en el editor | `trainings` | 3 |
| Estado y notas de sesión no se persisten | `calendar` | 4 |
| Asistencia a sesiones grupales | `calendar`, `progress` | 4 (decisión) |
| El muro no avisa | `crew` | 5 |
| **Eventos del equipo** —carreras, quedadas— | `crew` | Entidad nueva; fuera de plan hasta decidir |
| Importes en cuotas —moneda, tarifas— | `reports` | Decisión de producto; fuera de plan |
| Libras | `session` | Decisión; fuera de plan |
| Listas fijas: horas, lugares, duraciones, objetivos, especialidades | varios | Pasan a ajustes del crew cuando alguien las pida distintas |
| Subestructura de carpetas distinta por dominio | todo | Cuando se toque cada dominio |

---

## 11. Orden, dependencias y tamaño

```
Fase 0  Cimientos ──────────────┐
                                ▼
Fase 1  Equipos y puestos ──────┐
                                ▼
Fase 2  Alumnos y pertenencia ──┬──────────────┐
                                ▼              ▼
Fase 3  Entrenamiento          Fase 5  Progreso y muro
                                ▼
Fase 4  Agenda y sesión ────────┘
                                ▼
Fase 6  Cuenta completa  (independiente: puede ir en paralelo desde la fase 1)
                                ▼
Fase 7  Producción
```

| Fase | Días | Acumulado |
|---|---|---|
| 0 · Cimientos | 3–4 | 4 |
| 1 · Equipos | 4–5 | 9 |
| 2 · Alumnos | 5–6 | 15 |
| 3 · Entrenamiento | 5–6 | 21 |
| 4 · Agenda | 4–5 | 26 |
| 5 · Progreso y muro | 3–4 | 30 |
| 6 · Cuenta | 3–4 | 34 |
| 7 · Producción | 2–3 | 37 |

**Unas siete u ocho semanas de una persona que conozca el código**, con las
pruebas de contrato incluidas y sin los huecos de producto de §10. Son órdenes de
magnitud, no compromisos: el tamaño de cada fase sale del número de adaptadores
y de si necesita funciones del servidor, y lo que más desvía es lo que se
descubre al escribir la primera política de cada tabla.

**Primer hito visible:** al cerrar la fase 1, una cuenta real entra, crea su
equipo y ve su nombre en la barra. Al cerrar la fase 2, invita a alguien y esa
persona aparece. Ahí la aplicación deja de estar vacía, y a partir de ahí cada
fase añade una pantalla que ya no se olvida al recargar.

---

## 12. La receta de cada adaptador

Para que las fases 1 a 5 sean mecánicas y no arqueológicas:

1. **Migración** en `supabase/migrations/`: tabla, índices, RLS habilitada,
   políticas, funciones. Un fichero por tabla o por función de servidor.
2. **Semilla** en `supabase/seed.sql`, traducida del `*Seed.ts` correspondiente.
3. **Mapper** en `mappers.ts`: `XRow` ↔ entidad. Aquí muere el `snake_case` y los
   nulos de SQL.
4. **Adaptador** `SupabaseXRepository` contra el puerto, con `mapDataError`.
   `onChange` como no-op salvo que §1.3 diga lo contrario.
5. **Prueba de contrato** en Vitest contra Supabase local: cada operación del
   puerto, y **al menos un caso negativo de RLS**.
6. **Raíz de composición**: la misma condición que la autenticación elige el
   fake o el real. El fake se queda: es el doble de la suite de interfaz.
7. **Verificación en navegador a 375 px** de la pantalla que lo usa, que es la
   regla de la casa y no cambia por que los datos sean reales.

---

## 13. Decisiones que necesita el plan

| # | Decisión | Recomendación | Coste de equivocarse |
|---|---|---|---|
| 1 | Estrategia de pruebas (§1.1) | Dos suites, Supabase local en CI | Políticas RLS sin probar |
| 2 | JSONB o tablas para rutinas, planes y resultados (§1.2) | JSONB con validación | Siete tablas y tres mappers que no responden a ninguna consulta |
| 3 | Supabase local para desarrollo (§1.5) | Sí | Datos y límites de correo compartidos entre todos |
| 4 | Proveedor SMTP | Cualquiera con dominio verificado | Sin él no hay altas en producción |
| 5 | Google | Habilitar sólo si hay cliente OAuth | Botón apagado, ya está |
| 6 | Asistencia a sesiones grupales | Sí, con `session_attendance` | Las grupales no cuentan para nadie |
| 7 | Fotos: subida o dirección | Subida a Storage | Direcciones rotas y fotos ajenas |
| 8 | Fecha y hora locales o `timestamptz` (§6) | Locales + zona del crew | Sesiones que cambian de día |
| 9 | Escrituras sin conexión | No en esta versión | Una PWA que finge guardar |
| 10 | Onboarding por cuenta o por dispositivo | Por cuenta | Menor |
| 11 | Importes en cuotas | Fuera de plan | Ninguno hoy |
| 12 | Eventos del equipo | Fuera de plan | Ninguno hoy |

Las tres primeras se deciden antes de la fase 0. Las demás, cada una en su fase.
