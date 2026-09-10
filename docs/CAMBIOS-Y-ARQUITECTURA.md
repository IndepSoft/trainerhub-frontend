# Cambios y alcances

Registro de la intervención del **27 de agosto de 2026** sobre
`feature/supabase-integration`. Documenta qué se cambió, por qué, y —tan
importante como lo anterior— **qué no queda resuelto**.

Las reglas de trabajo derivadas de todo esto viven en [`../CLAUDE.md`](../CLAUDE.md).

---

## Resumen

| | |
|---|---|
| Rama | `feature/supabase-integration` |
| Commits | 4 (locales, **sin push** al momento de escribir esto) |
| Alcance | 36 ficheros, +469 / −350 líneas |
| Estado del build | Verde (antes: 16 errores) |
| Estado del lint | 6 errores, todos previos y ajenos (antes: 19) |
| Vulnerabilidades | 16 pendientes en esta rama (ver §6.1) |

```
c1b45d3  refactor(arch): desacoplar el frontend de Supabase con puertos y adaptadores
5517979  fix(lint): eliminar los 14 TS6133 y dejar el build en verde
9700fdd  fix(tsconfig): restringir los tipos ambiente del proyecto node
9f4c2ab  chore(env): añadir .env.example e ignorar .env de verdad
```

---

## 1. Infraestructura de entorno

### 1.1 `.gitignore` no protegía las claves

`.gitignore` cubría `.env.local` y `.env*.local`, pero **no `.env` a secas** —
que es justo el fichero que `supabaseClient.ts` exige para arrancar. Cualquiera
que siguiera el camino natural habría acabado con sus credenciales en un commit.

Ahora se ignoran `.env` y `.env.*`, con excepción explícita para `.env.example`.
Verificado con `git check-ignore` en ambos sentidos.

Se añadió también `*.tsbuildinfo`: `tsconfig.node.json` no fija
`tsBuildInfoFile`, así que `tsc -b` lo escribe en la raíz del repositorio.

### 1.2 No había plantilla de entorno

Creado `.env.example`, documentando las dos variables y dejando constancia de
que la clave **anon/publicable es pública por diseño** —viaja en el bundle del
navegador— y de que la protección real son las políticas RLS. Advierte
explícitamente de no colocar nunca la `service_role` en una variable `VITE_*`.

---

## 2. El build estaba roto

`npm run build` fallaba con 16 errores. Ninguno era de lógica.

### 2.1 Dos errores de configuración (`TS2304`)

`tsconfig.node.json` declaraba `lib: ["ES2023"]` sin DOM y **sin acotar
`types`**. Al no restringirlo, TypeScript cargaba todos los `@types` del
proyecto —incluido `react-dom`, que necesita DOM— y fallaba dentro de
`node_modules`.

Solución: `"types": ["node"]`. El proyecto de Node sólo compila
`vite.config.ts`; no tiene por qué ver los tipos de React.

### 2.2 Catorce variables sin usar (`TS6133`)

El `tsconfig` tiene `noUnusedLocals` y `noUnusedParameters` estrictos. La
distinción que se aplicó importa:

**Imports genuinamente muertos → borrados.** Cinco `React` sobrantes (con
`jsx: react-jsx` no hacen falta), más `Card`, `Input` y `Label` en
`RegisterForm`, y el cálculo `totalDays` / `daysElapsed` de `ChallengeCard`.

**Bindings que revelaban trabajo a medias → conservados con `TODO:`.** Borrarlos
habría silenciado el compilador escondiendo el problema:

| Binding | Qué significa realmente |
|---|---|
| `ChallengeCard.onUpdate` | `PersonalizedChallenges` le pasa `handleUpdateProgress`, un manejador real, y la tarjeta **nunca lo invoca**. Actualizar el progreso de un reto no hace nada. |
| `StreakCounter.size` | `StreakTrackingSystem` la pasa en dos lugares y no tiene efecto. |
| `AchievementBadge.showProgress` | Declarada en su interfaz, sin conectar. |
| `AchievementSystem.studentId` | Los logros salen de datos simulados, sin filtrar por estudiante. |
| `Calendar.handleStatusChange(sessionId)` | La firma la impone `onStatusChange`; el parámetro pasó a `_sessionId`. |

### 2.3 Cambio de configuración de ESLint

Se añadió `argsIgnorePattern: '^_'` a `no-unused-vars`. TypeScript ya ignora los
parámetros con guion bajo vía `noUnusedParameters`; ESLint no lo hacía, así que
las dos herramientas se contradecían.

---

## 3. Desacoplamiento de Supabase

El cambio central. **Objetivo: que migrar a un backend propio no sea doloroso.**

### 3.1 Punto de partida

Cinco ficheros conocían Supabase, con calidad muy desigual:

| Fichero | Estado |
|---|---|
| `shared/lib/supabaseClient.ts` | El cliente. Razonable. |
| `shared/infrastructure/trainerRepository.ts` | Forma correcta, pero devolvía la fila cruda como si fuera la entidad. |
| `auth/infrastructure/authService.ts` | Buena intención; filtraba tipos del SDK y **el login era falso** (§3.5). |
| `shared/hooks/useSupabaseQuery.ts` | La antítesis del objetivo (§3.4). |
| `auth/hooks/useAuthUser.ts` | Consultaba el proveedor desde un hook, exponía `PostgrestError` a los componentes y redeclaraba `Trainer` en línea. |

### 3.2 Estructura resultante

```
src/shared/domain/
  entities/auth.ts        AuthUser, LoginCredentials
  entities/trainer.ts     Trainer, en camelCase
  ports/AuthPort.ts       el contrato de autenticación
  ports/TrainerRepository.ts
  errors.ts               AppError + AppErrorCode

src/shared/infrastructure/supabase/     ← lo único que conoce el proveedor
  client.ts               el cliente
  mappers.ts              fila → entidad
  errorMapper.ts          PostgrestError / AuthError → AppError
  SupabaseAuthAdapter.ts
  SupabaseTrainerRepository.ts

src/app/container.ts      ← raíz de composición
```

### 3.3 Superficie de acoplamiento, medida

| | Antes | Después |
|---|---|---|
| Ficheros que importan `@supabase/supabase-js` | 5 | **1** (`client.ts`) |
| Ficheros que mencionan Supabase fuera del adaptador | 5 | **1** (`container.ts`) |

Migrar consiste en escribir `HttpAuthAdapter` y `HttpTrainerRepository`, y
cambiar dos líneas de `container.ts`.

**El guardia que lo sostiene:** una regla `no-restricted-imports` prohíbe
importar el SDK o el cliente fuera de la carpeta del adaptador. Se verificó
colocando un import desde `domains/dashboard`: el lint falla. Sin esta regla, el
desacoplamiento se erosiona en semanas.

### 3.4 Por qué se eliminó `useSupabaseQuery`

Recibía un nombre de tabla suelto y un `filters: (query) => query`, es decir,
repartía el lenguaje de consulta de PostgREST por toda la aplicación. Un backend
propio no tiene `.eq()`: cada llamada habría sido un punto de migración.

Tenía además un defecto latente: `filters` figuraba en las dependencias del
`useEffect`. Cualquier arrow en línea —la forma natural de usarlo— es una
referencia nueva en cada render, y produce **refetch infinito**. No lo usaba
nadie, así que el defecto nunca llegó a manifestarse.

### 3.5 El login era falso

`AuthService.loginWithEmail` devolvía un usuario `dev-user` fijo, sin validar
nada, con `signInWithPassword` comentado debajo. La cadena completa era:
formulario → `useLogin` → servicio (usuario falso) → `setUser` → `ProtectedRoute`
ve un usuario → **acceso a toda la aplicación escribiendo cualquier cosa**.

Ni siquiera servía como atajo de desarrollo: `getCurrentSession()` sí leía la
sesión real de Supabase, así que al recargar la página el usuario falso
desaparecía.

`SupabaseAuthAdapter` llama de verdad a `signInWithPassword`, con los mensajes
de error traducidos que ya estaban escritos —y comentados— en el fichero
original.

> **Consecuencia operativa:** escribir credenciales arbitrarias ya no permite
> entrar. Hace falta un usuario real en Supabase Auth. Si estorba en desarrollo,
> la solución correcta es un `FakeAuthAdapter` que cumpla `AuthPort`, elegido en
> el container según `import.meta.env.DEV` — precisamente para lo que sirve esta
> arquitectura.

### 3.6 Fuga de suscripción corregida

`onAuthStateChange` devuelve su función de baja; `initializeAuth` la descartaba,
dejando la suscripción viva para siempre. Ahora se conserva y se expone vía
`disposeAuth`.

### 3.7 Verificación

- `npm run build` en verde.
- Arranque comprobado en navegador: sin errores de consola, y `/dashboard`
  redirige a `/authentication` contra la sesión real de Supabase, lo que
  confirma la cadena `container` → adaptador → `ProtectedRoute`.

---

## 4. Proyecto de Supabase

Creado en la organización **IndepSoft**:

| | |
|---|---|
| Nombre | `trainerhub` |
| Referencia | `gntwwopcvmzemlbdbzxs` |
| Región | `sa-east-1` (São Paulo) |
| URL | `https://gntwwopcvmzemlbdbzxs.supabase.co` |
| Plan | free — 0 USD/mes |

Se usa la clave **publicable** (`sb_publishable_...`), recomendada sobre la anon
heredada por permitir rotación independiente.

**Ya no está vacía.** Tiene `profiles` —uno a uno con `auth.users`, creada por
un disparador en el alta— y `platform_admin_emails`. Lo que no tiene ni va a
tener es `trainers`: el código apuntaba ahí y se ha reapuntado a `profiles`. Ver
§25.

Nota operativa: el plan gratuito limita a **dos proyectos activos por usuario**,
contando todas las organizaciones que administra — no por organización.

---

## 5. Arquitectura multi-tenant (analizada, no implementada)

Conclusión del análisis, pendiente de ejecutar.

**Sí hace falta multi-tenencia, en su variante ligera:** tablas compartidas con
columna discriminadora y RLS. Ni un esquema por club ni una base por club:
Supabase está construido alrededor de RLS, y row-level aguanta de sobra la
escala de clubes con decenas o cientos de estudiantes.

**La decisión que más pesa:** no modelar entrenador = club. En cuanto un club
tenga un segundo entrenador, esa identidad se rompe, y para entonces está
grabada en cada clave foránea y cada política. Hoy cuesta una tabla y un join.

Modelo propuesto:

```
auth.users      → gestionado por Supabase
profiles        → 1:1 con auth.users
clubs           → el tenant
club_members    → (club_id, user_id, role)
<tablas de dominio> → cada una con club_id
```

**Trampa de seguridad a evitar:** el rol **no** puede vivir en `user_metadata`,
porque el propio usuario lo puede modificar con `supabase.auth.updateUser()` y
ascenderse solo. Va en `club_members.role`. Además es lo correcto
conceptualmente: el rol es por club, no global.

**Rendimiento de RLS**, contrastado con la documentación de Supabase:

1. Indexar toda columna usada en una política. Su propio *benchmark*: 171 ms →
   menos de 0,1 ms.
2. Envolver las funciones: `(select auth.uid())` en lugar de `auth.uid()`.
   Provoca un `initPlan` y Postgres cachea el resultado por sentencia en vez de
   llamar por cada fila.

**Pendiente de decidir antes de escribir la migración:** quién lee el QR del
estudiante y si la vista del club es pública o autenticada. Si es pública, hace
falta una superficie de sólo lectura para el rol `anon`, y ahí RLS es lo único
que protege los datos. Un QR que codifique el UUID en crudo permitiría
enumeración: mejor un token opaco y rotable.

---

## 6. Qué NO queda resuelto

### 6.1 Vulnerabilidades de dependencias — ✅ RESUELTO

`npm audit fix` aplicado sobre `develop`: de 16 vulnerabilidades (13 altas) a
**cero**. Cambió 44 paquetes, todos dentro de los rangos semver ya declarados —
`package.json` no se tocó.

La que de verdad importaba era `react-router`, por los *open redirect*:
7.8.2 → 7.18.2. Eran irrelevantes mientras las rutas fuesen literales, pero
habrían sido reales en cuanto existiera un `?redirect=` en el flujo de login.
El resto eran ReDoS/DoS en herramientas de compilación.

Verificado tras aplicarlo: build en verde, lint sin cambios, y las rutas de
todos los dominios comprobadas en navegador — el salto de diez minors en el
router era el riesgo real.

### 6.2 Deuda funcional

- Los cinco dominios pintan datos simulados. Sólo existe `TrainerRepository`.
- `navigation.config.ts` declara `/reports`, `/settings` y `/login`; ninguna
  tiene ruta registrada. El sidebar pinta enlaces que caen en el catch-all.
- `GuestRoute` está implementado pero no cableado: falta `withGuestRoute`, y un
  usuario autenticado puede volver al login.
- Las props sin conectar de §2.2, marcadas con `TODO:`.
- Google OAuth: el adaptador lo implementa, pero **el proveedor hay que
  habilitarlo en el panel de Supabase** con credenciales de Google Cloud. No es
  configurable por API.

### 6.3 Inconsistencia estructural

La subestructura difiere entre dominios: `dashboard` tiene ocho subcarpetas,
`students` y `calendar` tres. Conviven `libs/`, `lib/`, `services/` e
`infrastructure/` sin fronteras claras. Falta elegir una convención.

Los tamaños también están desequilibrados: gamification son 2.716 líneas en 23
ficheros; students, 246 en 3.

### 6.4 Lo que no puede desacoplarse

Por honestidad, el desacoplamiento del §3 no es total y no puede serlo:

- **Realtime.** Todavía no se usa. `postgres_changes` es CDC de Postgres; un
  backend propio usaría WebSocket o SSE con semántica distinta. El puerto se
  puede definir, pero las implementaciones se parecerán poco.
- **El modelo de autorización.** Si RLS impone la tenencia, un backend propio
  tiene que reimplementarla. Eso no es acoplamiento del frontend: la
  autorización vive en el servidor, que es su sitio.
- **Almacenamiento del token.** Supabase gestiona el JWT en `localStorage`. Hoy
  queda dentro del adaptador, pero un backend con cookies `httpOnly` obligaría a
  revisarlo.

---

## 7. Rama `refactor-claude`

Existe una rama previa con tres commits contra `main`, creada antes de saber que
los avances vivían en `feature/supabase-integration`:

```
68e3354  fix(entry): corregir ruta del import de authStore en main.tsx
ba48e2b  docs(claude): añadir CLAUDE.md centralizado con esqueleto de refactor
86d20d5  fix(deps): resolver 15 vulnerabilidades vía npm audit fix
```

Sólo el primero conserva valor aquí: **el `npm audit fix`** (§6.1). Los otros dos
describen problemas de `main` —marcadores de conflicto commiteados, duplicación
de `shared/ui` contra `shared/components/ui`, router desconectado— que esta rama
ya resolvió por su cuenta.

---

## 8. El progreso deja de inventarse (1 sep 2026)

### 8.1 La sesión no guardaba lo que había pasado

`Session` sólo tenía estado. La pantalla de ejecución contaba las series
marcadas y el tiempo transcurrido, y al pulsar «terminar» todo eso moría con el
componente: lo único que sobrevivía era `status: 'completed'`.

De ahí salía el problema entero de Progreso. Sin ningún registro de trabajo, no
había de dónde derivar un número, así que estaban escritos a mano: nivel 7, 340
de 500 XP, racha de 12 días, y logros con fecha de desbloqueo de enero de 2024.
Ninguno cambiaba entrenando ni dejando de entrenar.

La sesión gana `result`, y el puerto gana `complete(sessionId, result)`:

```ts
export interface SessionResult {
  completedSets: number
  totalSets: number
  elapsedSeconds: number
  /** Cuándo se cerró, en fecha local. Distinto de `date`, que es cuándo estaba
      agendada: una sesión del martes se puede cerrar el miércoles. */
  completedAt: string
}
```

**Se guarda lo MEDIDO, nunca lo derivado.** Aquí no hay XP ni nivel, que se
calculan con reglas y cambiarían de valor el día que se ajusten: guardar el
resultado del cálculo dejaría historiales que discrepan entre sí.

`complete` es una operación propia y no `updateStatus('completed')` seguido de un
`update`. Serían dos escrituras para un solo hecho, y entre las dos la sesión
queda completada sin resultado, que es justo el estado que el progreso no sabe
leer. Con un backend real, además, es una transacción.

### 8.2 Las reglas, en un fichero puro

`domains/progress/libs/progressRules.ts`. Entran sesiones, salen números.

- **XP** = 20 por sesión terminada + 1 por serie marcada. El fijo existe porque
  el cardio no se programa en series: sin él, salir a correr una hora daría cero.
- **Nivel**: coste lineal, 100 el primero y 50 más cada vez. No exponencial, para
  que la barra siga moviéndose después del nivel 10.
- **Racha**: días seguidos contando hacia atrás desde hoy. **No se rompe por no
  haber entrenado hoy todavía** —el día no ha terminado—; se rompe al pasar un
  día entero en blanco. Contarla desde hoy a secas la pondría a cero cada mañana.
- **Hitos**: escalera acumulativa sobre sesiones cerradas, no por semana. Un hito
  superado no se pierde por saltarse una semana.

Nada de esto se almacena: se recalcula del historial, que es el hecho. Un
contador guardado se desincroniza en cuanto se corrige, se borra o se importa
una sesión, y entonces no hay forma de saber cuál de los dos números miente.

### 8.3 Los logros: condición en código, fecha real

La condición de cada logro era una frase en castellano y al lado una fecha de
desbloqueo escrita a mano. Ahora es una función:

```ts
condition: (sessions: Session[], asOf: Date) => boolean
```

Y la fecha se obtiene **repasando la historia día a día**: para cada día
entrenado se evalúa el catálogo con lo que se sabía al terminar ese día, y el
primero que cumple es la fecha de desbloqueo. Eso da dos cosas a la vez: la fecha
es real, y un logro conseguido no se pierde —quien tuvo una racha de 21 días y
luego enfermó sigue teniendo «Hábito Formado»—.

**Se eliminaron diez de los dieciocho**, los de «métricas» y «desafíos»: no hay
registro corporal, ni fotos, ni sistema de desafíos. Es la misma decisión que se
tomó con el indicador de ingresos del panel —quitar antes que inventar—, y queda
su `TODO` con lo que haría falta para recuperarlos.

Uno era además inalcanzable por construcción: «Madrugador · completa 10 sesiones
antes de las 8:00», cuando el primer tramo que la agenda ofrece SON las 8:00.

### 8.4 El progreso es de alguien

La pantalla enseñaba una racha y un nivel sin decir de quién, y no podían ser del
entrenador —no es él quien entrena—. Con datos escritos a mano la pregunta no se
notaba; en cuanto los números salen de sesiones reales, es la primera que hay que
responder.

El alumno va en la URL, `?student=<id>`, no en estado interno: así «Ver progreso»
desde su ficha lleva al suyo, el enlace se comparte y volver atrás funciona. Es
el mismo patrón que `?agendar` en la ficha del alumno.

### 8.5 Registro: quién eres lo decide tu correo

`AuthPort` no tenía `signUp`, así que «Crear cuenta» no daba de alta a nadie.
Ahora crea la cuenta y **el perfil que va con ella**, en ese orden —al revés
quedarían fichas huérfanas cada vez que fallase el alta de la cuenta, que es el
caso frecuente: correo repetido, contraseña corta—.

Cuál de los dos perfiles lo decide el correo: si ya tiene ficha de alumno, la
cuenta se ata a esa ficha; si no, nace un entrenador. **El rol no se guarda en la
cuenta**, coherente con §5: `user_metadata` lo edita el propio cliente, y un rol
autoasignable no es un rol.

Salió de ahí `FakeTrainerRepository`. Con autenticación simulada, el
identificador de perfil lo inventa el adaptador falso, así que preguntarle por él
a Supabase no encontraba nunca nada: quien entraba en desarrollo se quedaba sin
ficha, y registrarse era imposible. Los dos adaptadores falsos se eligen ahora
con la misma condición en la raíz de composición, para que no puedan
desparejarse.

### 8.6 Duplicaciones eliminadas

- **`toLocalDateKey`, tres copias** —agenda, panel y la semilla de sesiones—.
  Ninguna estaba mal, y eso es lo que hace peligrosa la duplicación: se mantienen
  iguales hasta que una cambia. Vive en `shared/lib/dateKey.ts`, que es donde
  puede usarla también la infraestructura.
- **`ConfirmDeleteDialog`** sube a `shared/components`: lo necesitan dos dominios,
  el mismo criterio que elevó `Routine` y `DeletionResult`.

### 8.7 Dos defectos que sólo aparecieron al medir

**`useCountUp` no volvía a su objetivo.** Animaba siempre desde cero, lo que
estaba bien mientras el número no cambiaba nunca; en cuanto Progreso pudo cambiar
de alumno, cada cambio hacía caer la cifra a cero para volver a subir. Y peor: si
los fotogramas no se entregan —una pestaña en segundo plano no recibe ninguno—,
el número se quedaba **congelado en el valor del alumno anterior**. Medido: la
pantalla decía «7 días de racha» sobre una alumna que no había entrenado nunca.

Ahora arranca desde lo que hay en pantalla y tiene una red de seguridad que fija
el valor pasado el tiempo de la animación. La animación es decoración; la cifra
es dato, y un adorno que no puede ejecutarse no puede impedir que el dato sea
correcto.

**El aspa de cerrar de los diálogos medía 16 × 16 px.** Sin caja propia: era el
icono y nada más. Por debajo de los 44 px de la regla §1.6 y por debajo incluso
del mínimo de 24 de WCAG 2.2 AA, y es el botón de cerrar de TODOS los diálogos de
la aplicación. Se tocó `shared/ui/dialog.tsx` —territorio de shadcn— con esa
justificación; el icono sigue midiendo 16, lo que crece es la zona pulsable.

### 8.8 Pruebas atadas a la semilla

Tres pruebas se rompieron al añadir historial de sesiones cerradas a
`sessionsSeed`, sin que nada de la aplicación fallara: afirmaban «Completadas 0»
y «Confirmadas 2», que eran las cifras exactas de la semilla de entonces.

Se reescribieron en **diferencias**: leer el contador antes y esperar uno más. Y
el localizador de «una sesión que completar» pasó a pedir por el nombre
accesible, `/Confirmada\..*minutos/`, porque coger «la primera» dejó de valer en
cuanto la primera del mes pasó a ser una ya completada.

Regla que sale de ahí: una prueba de comportamiento no debe afirmar un número
absoluto de datos de ejemplo.

---

## 9. El crew: la multi-tenencia, ejecutada (1 sep 2026)

Lo que la §5 dejaba analizado y sin escribir. El nombre cambia —`Crew` en vez de
`clubs`— y el modelo es el mismo.

### 9.1 El entrenador no es el crew

Es la decisión que más pesa, y estaba ya tomada en §5: en cuanto un gimnasio
tenga un segundo entrenador, la identidad «entrenador = club» se rompe, y para
entonces está grabada en cada clave foránea. Por eso `Crew` tiene `ownerId` y
existe `CrewTrainer` aparte, aunque hoy sólo se pueble el primero.

**La denominación la elige quien lo crea** —«equipo», «tribu», «box»—. Es sólo la
etiqueta visible: el tipo se llama `Crew` en código y no cambia, porque el nombre
de una entidad no puede depender del gusto de un usuario.

### 9.2 La ficha ES la pertenencia

No hay tabla de miembros para los alumnos. `Student` gana `crewId` y
`membershipStatus`, y ya era la relación entre un entrenador y un alumno:
desdoblarla obligaría a mantener dos filas sincronizadas para decir lo mismo.

Un alumno en dos crews tiene **dos fichas**. Suena a duplicación y no lo es: la
ficha es la libreta privada de un entrenador —edad, grasa, objetivos—, y las
notas de su entrenador de crossfit no son asunto de su club de running. La
separación sale gratis, por construcción. Lo que comparten es `profileId`.

### 9.3 El ámbito vive en el adaptador

Es lo más invasivo de todo esto, y no es el QR.

La alternativa era añadir `crewId` a `findAll`, a `create`, a `findByDate` y a
los cuarenta sitios que los llaman; el identificador acabaría viajando por los
hooks, las páginas y los componentes, y la multi-tenencia —que es un detalle de
dónde viven los datos— se habría repartido por toda la aplicación.

Con `CrewScope` inyectado en la raíz de composición, `students.findAll()` sigue
significando «los alumnos» y lo que cambia es quién los sirve. **Es el sustituto
de RLS**: con backend, el crew viaja en la sesión y filtra Postgres.

El ámbito dice además **con qué papel** se mira (`asStudent()`). Pertenecer a un
crew no es ver el crew entero: sin eso, un alumno aceptado abría la agenda y veía
las sesiones de todos sus compañeros —con quién entrena el entrenador, a qué hora
y dónde—.

**Los ejercicios NO se acotan.** El catálogo es vocabulario, no contenido: «press
de banca» es el mismo en todos los gimnasios. Es la misma distinción que ya
gobernaba las rutinas —se referencia el vocabulario, se copia la decisión—.

### 9.4 El QR codifica una URL, no un token

La decisión que más simplifica el flujo. Con `…/crew/unirse?codigo=XXXX`, **la
cámara nativa del móvil ya sirve**: apuntas y se abre la aplicación en la pantalla
correcta, con el código puesto. Un lector propio significaría pedir permiso de
cámara, mantener un decodificador y fallar en los navegadores que no lo permiten,
todo para llegar al mismo sitio.

Debajo, **siempre el código escrito**, en dos grupos de cuatro y con un alfabeto
sin `0`/`O` ni `1`/`I`/`L`. Es la salida cuando la cámara no colabora, y evita que
el alta dependa de que un hardware ajeno funcione.

El token es **opaco y rotable**, como pedía §5: el `id` no se puede cambiar y un
token sí, así que un QR fotografiado se invalida en el acto.

**Con aprobación por defecto.** Un QR es un secreto que se enseña en público:
quien lo vea en la pared del gimnasio puede escanearlo. Escanear PIDE entrar, no
entra. Y una solicitud pendiente **no** aparece en las pertenencias, que es una
decisión de seguridad y no de presentación: entrar en esa lista es lo que fija el
ámbito de datos.

Un código que no vale se rechaza **sin decir por qué**: distinguir «nunca existió»
de «existió y se rotó» le confirmaría a quien prueba códigos que acertó alguna
vez.

### 9.5 El rol es por crew, y por fin gobierna

Alguien puede entrenar a su equipo y ser alumno del club de running de al lado.
Un rol global obligaría a elegir. `useViewer` resuelve las pertenencias una vez,
en el layout, y de ahí sale qué navegación se pinta y a dónde lleva la raíz:

| Quién llega | Dónde aterriza |
|---|---|
| Con equipo, entrenando | `/dashboard` |
| Con equipo, como alumno | `/progress` |
| Sin equipo, con ficha de entrenador | `/crew/nuevo` |
| Sin equipo, sin ficha | `/progress`, con la invitación a unirse |

El nombre del entrenador de la barra lateral pasa a ser **el conmutador de
crew**: ese hueco dice «dónde estoy», y desde que los datos pertenecen a un crew,
dónde estoy es en qué crew. Quién soy queda en el menú de usuario. En móvil el
conmutador va en la barra superior, porque la lateral no se abre.

### 9.6 El vacío como demostración

Decisión de producto: un alumno sin equipo **navega y ve Progreso vacío**, no una
pantalla única que le corte el paso. Eso obliga a que el vacío sea aspiracional:
se pinta el registro entero —nivel, racha, los cinco hitos, los ocho logros— a
cero.

La primera versión tenía un `EMPTY_PROFILE` escrito a mano con `milestones: []`,
y la pantalla salía con «Tu camino» sin peldaños y «0 / 0 logros», que se lee como
que algo no ha cargado. Ahora el perfil vacío **se calcula con las mismas reglas
sobre un historial vacío**: un solo camino, y el vacío enseña lo que va a tener.

### 9.7 Tres fallos que sólo aparecieron ejecutando

**Sólo las fichas estaban acotadas.** Medido en el navegador: una cuenta recién
registrada y sin equipo abría el panel y veía «5 sesiones esta semana» y tres
rutinas, que eran de otro. Faltaba acotar sesiones, rutinas, planes y
asignaciones.

**El enlace por correo dejó de funcionar al acotar.** `findByEmail` pasó a mirar
sólo el crew activo, y durante el alta no hay ninguno: no encontraba nunca nada, y
todo el que se registraba acababa siendo entrenador, alumnos invitados incluidos.
Lo cazó una prueba. La operación correcta es `claimByEmail`, sin acotar y
devolviendo **varias**: dos entrenadores pueden haber dado de alta a la misma
persona.

**Una solicitud contaba como alumno.** El panel decía «5 estudiantes» en cuanto
alguien escaneaba el QR, y a un desconocido pendiente de aceptar se le podía
agendar una sesión. `findAll` devuelve alumnos y `findRequests` solicitudes: son
la bandeja de entrada del entrenador, no su padrón.

### 9.8 Lo que falta

La página del equipo tiene miembros, solicitudes y QR. **Faltan el muro de
anuncios con «me gusta», el ranking y los eventos**, en ese orden.

Dos criterios ya decididos para cuando lleguen:

- **El ranking, por periodo.** Uno por experiencia total se congela: quien lleva
  dos años gana siempre y el que entra hoy no puede alcanzarle, así que a las tres
  semanas nadie lo mira. Y desactivable por crew —`rankingEnabled` ya existe—,
  porque en un grupo de rehabilitación comparar el esfuerzo hace daño. Nunca sobre
  métricas corporales.
- **Los entrenamientos grupales NO son una entidad nueva.** `Session` ya tiene
  `kind: 'group'` y `studentId: null`. Reutilizarla les da calendario, ejecución y
  experiencia gratis. Los eventos —una carrera, una quedada— sí son otra cosa.

---

## 10. La suscripción, el super admin y el registro partido (1 sep 2026)

### 10.1 El rol que se elige al registrarse es una declaración

Cualquiera puede decir «soy entrenador»: el formulario no comprueba nada, y no
puede. **Eso es seguro precisamente porque lo que vale está detrás de la
suscripción**: registrarse como entrenador sin serlo da un equipo vacío en el que
no se puede meter a nadie.

El rol de verdad se sigue deduciendo de quién te conoce. Lo que la declaración
decide es qué formulario se ve y qué perfil se crea, no qué se puede hacer.

Y el correo sigue **reclamando** lo que estuviera esperándole, se registre uno
como se registre: si un entrenador ya había creado tu ficha, entras a su equipo
aunque además vengas a montar el tuyo. Las dos cosas pueden ser ciertas —el rol
es por crew— y por eso `claimByEmail` corre en los dos casos.

### 10.2 Qué exige suscripción, y qué no

Un entrenador puede crear su equipo, montar su catálogo, escribir rutinas y
planificar mesociclos **sin pagar nada**: es trabajo suyo y no lo ve nadie más.
Lo que exige activación es **incorporar alumnos** —el QR y el alta de fichas—,
que es cuando el producto empieza a servirle a más de una persona.

La regla vive junto a la entidad, en `canEnrollMembers`, porque la comprueban
tres sitios: el QR, el alta de alumnos y la solicitud de entrada. Una regla
repetida en tres pantallas es una regla que acabará aplicándose en dos.

**Se comprueba también al entrar por el código, no sólo al pintar el QR.** El
código sigue circulando después de suspender —está en un cartel, en una foto, en
el historial de un móvil— y esconder el QR no lo invalida. La puerta tiene que
estar donde se entra, no sólo donde se enseña la llave.

Y el mensaje que ve el alumno **no menciona la suscripción**: quien intenta
entrar no puede resolver el estado del pago de su entrenador, y no es asunto
suyo.

**El estado es por crew, no por entrenador.** Lo que se activa es la capacidad de
meter gente EN UN EQUIPO, así que vive donde está el equipo. Un entrenador con
dos crews puede tener uno activo y otro no, que es lo que pasa cuando abre un
segundo local.

`subscriptionStatus` **no está en `CrewSettings`**: si viajara con los ajustes,
el dueño podría activarse la suscripción desde su propia pantalla.

### 10.3 El super admin no es un rol de crew

`CrewRole` responde «qué eres en este equipo». Esto responde «estás por encima de
los equipos», que es otra pregunta: un administrador puede además entrenar en su
propio crew, y las dos cosas son ciertas a la vez. Meterlo en la misma unión
obligaría a elegir.

`PlatformRepository` está separado de `CrewRepository` porque **es el único
puerto que mira por encima de los crews**. Tenerlo aparte hace que esa excepción
se vea al leer la lista de puertos, en vez de esconderse dentro de uno que
promete lo contrario. Sus dos métodos de lectura sin acotar —`listAll` en crews,
`countMembersOf` en alumnos— tampoco están en ningún puerto: son de la
implementación falsa, y la raíz de composición se los entrega expresamente.

**Esconder la pantalla no es la seguridad.** La ruta comprueba quién entra y eso
evita mostrarla por error; lo que impedirá de verdad que alguien active su propio
equipo es la política del servidor, que todavía no existe. Está anotado en el
puerto.

### 10.4 El agujero del QR que sólo se veía sin cuenta

`ProtectedRoute` desviaba al login **y perdía el destino**. En el caso más
frecuente de todos —alguien sin cuenta escanea el QR de su entrenador— eso
significaba: rebote a identificarse, registro, y aterrizaje en su progreso con el
código perdido. Tenía que volver a pedirle el QR a quien acababa de enseñárselo.

Ahora la ruta viaja en el estado del historial, como texto, y login y registro
vuelven a ella. La ruta guardada se valida —interna, sin `//`— porque el estado
del historial es dato de fuera.

### 10.5 Por qué el registro se parte en dos

El formulario único pedía especialidad, años de experiencia y ubicación a
cualquiera. A quien sólo quiere ver sus entrenamientos le hacía declarar una
profesión que no tiene, que es la forma más rápida de que alguien abandone un
alta. Son siete campos frente a cuatro.

Se pregunta la intención **antes** que nada, y no con una casilla dentro del
mismo formulario: media pantalla apareciendo y desapareciendo se lee peor que dos
formularios distintos. Las dos opciones tienen el mismo peso visual a propósito,
porque empujar hacia la de entrenador haría que los alumnos se registraran mal.

El borrador es uno solo para los dos, y los campos que no le tocan al rol elegido
no se leen. La alternativa —una unión discriminada— obligaba a tirar lo escrito
al cambiar de rol, que es justo lo que hace quien se equivoca y vuelve.

---

## 11. El muro y el ranking (1 sep 2026)

### 11.1 Publica sólo quien entrena

Y eso convierte el muro en un canal de anuncios en vez de en una red social. La
diferencia no es de tono: sin publicaciones de los alumnos **no hay moderación
que construir**, ni denuncias, ni bloqueos, ni el trabajo permanente que eso
arrastra para siempre. Los alumnos participan con el «me gusta», que basta para
saber si algo se ha leído.

`toggleLike` es **una sola operación** y no `like`/`unlike`: el botón es uno y
alterna, así que con dos métodos quien pulsa tendría que saber antes en qué
estado está, y entre saberlo y llamar cabe otro toque. Así pulsar dos veces deja
las cosas como estaban en lugar de duplicar el «me gusta».

El cero no se pinta. «0» junto a un corazón se lee como un reproche, y dice lo
mismo que no decir nada.

### 11.2 `toISOString` aquí sí, y es la misma regla de antes

Las fechas de la agenda tienen prohibido `toISOString` porque convierte a UTC y
desplaza el día en husos negativos: una sesión de las 20:00 del 15 aparecía el 16.

Un anuncio **no ocurre «el día 15», ocurre en un momento**. Un instante no tiene
huso: se guarda absoluto y se pinta en la hora local de quien mira. Lo que estaba
mal era derivar un día del calendario de un instante en UTC, no el formato.

`describePostTime` tampoco reutiliza `describeTimeAgo` del panel: aquello redondea
a días porque una sesión ocurre un día, y un anuncio de hace veinte minutos no
puede leerse como «hoy».

### 11.3 El ranking es un agregado, y por eso tiene puerto propio

**Un alumno no puede leer las sesiones de sus compañeros.** Su ámbito se las
recorta a propósito —con quién entrena el entrenador, a qué hora y dónde—, así
que calcular la clasificación en su navegador exigiría abrírselas: romper el
aislamiento para pintar una tabla.

`RankingRepository` devuelve la clasificación **ya resuelta**, con lo justo para
pintarla. De las sesiones de nadie cruza nada. Hay una prueba que comprueba
exactamente eso: una alumna ve a Juan en el ranking y no ve ni una de sus
sesiones en la agenda.

**Por periodo, y la semana primero.** Un ranking por experiencia total se
congela: quien lleva dos años gana siempre y quien entra hoy no puede alcanzarle,
así que a las tres semanas deja de mirarlo. «Siempre» se queda detrás, donde no
hace daño.

**Sólo esfuerzo**: sesiones completadas y experiencia. Nunca peso ni grasa
corporal. Comparar cuerpos en público hace daño a quien más habría que cuidar, y
además no mide el trabajo de nadie: la experiencia se gana entrenando, el peso
no. Y el crew puede apagarlo entero con `rankingEnabled`.

El desempate por nombre no es decorativo: sin él, dos personas con la misma
experiencia intercambian posiciones en cada recarga y el ranking parece moverse
solo.

### 11.4 La experiencia sube a `shared/domain`

La necesitan dos dominios —el progreso de una persona y el ranking de su equipo—,
que es el criterio de siempre. Y hay un motivo de fondo además del criterio: si
el ranking calculara la experiencia con su propia fórmula, **dos pantallas de la
misma aplicación dirían dos cifras distintas del mismo esfuerzo**.

Se queda en `progress` lo que sólo le incumbe a una persona —nivel, racha, hitos,
logros—; sube lo que se compara. `weekBounds` sube por lo mismo, desde las
utilidades del panel.

### 11.5 El radio de las tarjetas

`--radius-action` son 999 px —píldoras, para botones e insignias— y
`--radius-block` es cero, que es el registro editorial de esta aplicación. Usar
`rounded-action` en superficies grandes dejaba las tarjetas del muro con forma de
elipse. Sólo se veía mirándolo: compilaba, pasaba el lint y las clases parecían
razonables.

---

## 12. Ver no es poder: el administrador observando (1 sep 2026)

### 12.1 Enseñar los módulos vacíos no es enseñarlos

La petición era «como super admin necesito ver todos los módulos». Abrir la
navegación, a secas, no lo habría cumplido: **los datos están acotados al crew
activo**, y un administrador no pertenece a ninguno, así que habría entrado en
Estudiantes y no habría habido nadie. Módulos visibles y vacíos.

Así que además de la navegación, un administrador **alcanza cualquier equipo**
desde el conmutador de crew. Ahí es donde los módulos tienen algo que enseñar.

### 12.2 Los dos ejes

`role` responde **qué se ve**; `canManage`, **qué se puede tocar**. Estaban
fundidos en `role === 'trainer'`, y separarlos es lo que hace seguro un rol de
administración.

Si observar diera `role: 'trainer'` a secas, quien mira podría publicar en el
muro de otro —**firmado con el nombre del entrenador de verdad**—, aceptar
solicitudes, dar de alta alumnos o borrarlos. Eso no es inspeccionar: es
suplantar, y es una decisión distinta que nadie ha tomado.

`Membership.observed` marca la diferencia, y `canManage` es
`role === 'trainer' && !observed`. Las pantallas de gestión se pintan con `role`;
todo control que crea, cambia o borra se apoya en `canManage`.

### 12.3 Decirlo, o parecerá roto

Dentro del equipo de otro, con el padrón y la agenda delante, un administrador es
indistinguible de su entrenador. Sin avisar, quien lo olvide se preguntará por
qué no le dejan pulsar nada —o concluirá que la aplicación falla—.

La cinta va arriba, en Ember, y **no aparece en `/admin`**: ésa es su pantalla y
ahí sí manda. Decirle que no puede modificar nada al lado de un botón de activar
suscripciones sería lo contrario de la verdad.

### 12.4 Un aviso que mentía

Con el botón «Añadir alumno» apagado, la página de alumnos explicaba que **hacía
falta activar la suscripción**. Para un administrador observando, eso era falso:
la suscripción de ese equipo estaba activa, y lo que faltaba era permiso.

Ahora ese aviso sólo lo ve quien de verdad podría dar de alta. El motivo del
administrador se lo da la cinta. Es la misma regla de siempre: un control
desactivado sin explicación es un control roto, y con la explicación equivocada
es peor.

### 12.5 Lo que esto NO es

**No es seguridad.** Que los botones desaparezcan impide equivocarse, no impide
actuar: un cliente modificado sigue pudiendo llamar a los repositorios. Lo que lo
impedirá son las políticas del servidor, que todavía no existen —anotado ya en
`PlatformRepository`—.

Y **no hay registro de quién miró qué**. Un administrador que entra en el equipo
de un cliente ve datos personales de sus alumnos: edad, grasa corporal,
objetivos. En cuanto haya usuarios reales, eso debería quedar registrado.

---

## 13. Tres roles, permisos que sólo suman, y la privacidad recuperada (1 sep 2026)

### 13.1 Dos poderes, no uno

Dentro de un crew hay dos cosas distintas que hasta ahora eran una sola:

- **Entrenar**: asignar rutinas, agendar, llevar fichas, hablarle al equipo.
- **Gobernar**: decidir quién trabaja allí y cómo se llama la casa.

En un entrenador solo los tiene la misma persona. En un gimnasio no: el dueño
gobierna —y puede no entrenar a nadie— y sus entrenadores entrenan sin poder
echarse entre ellos.

De ahí el rango `admin > trainer > student`. **Quien crea un crew nace `admin`**,
así que en el caso corriente la distinción no se nota; el rol separado aparece
cuando hay más de una persona trabajando. Lo que separa a un `admin` de un
`trainer` son exactamente dos capacidades: `crew.settings` y `crew.staff`.

**El rol sale del puesto, no de haber fundado el equipo.** Antes se derivaba de
`Crew.ownerId`, y con eso sólo cabía una persona gestionando. `CrewStaff` —que
estaba modelado y sin poblar desde el principio— es ahora la fuente.

### 13.2 Las capacidades, y por qué sólo suman

`role === 'trainer'` no expresaba el caso del gimnasio, así que cada control
pregunta ahora por lo que necesita: `can('schedule.manage')`, `can('crew.wall')`.

Encima del rol se pueden **conceder** capacidades sueltas, y **sólo conceder**.
Es la decisión que mantiene esto razonable: se conserva el invariante «nunca
puedes menos que tu rol», así que la pregunta «¿qué puede hacer esta persona?»
sigue teniendo respuesta corta —su rol, y como mucho un par de extras—.

Permitir restar por debajo del rol convertiría a cada usuario en un caso único:
con ocho capacidades hay 256 configuraciones por persona, cada pantalla tendría
que ser correcta en todas, y ninguna se probaría. Es el motivo por el que los
sistemas de permisos libres acaban siendo imposibles de auditar.

Al cambiar de rol se limpian las concesiones que el rol nuevo ya trae:
un administrador con «Agenda» concedida aparte sugeriría que sin ella no podría,
que es falso.

### 13.3 El super admin deja de entrar en equipos ajenos

Se revierte lo de la sección 12. Administrar la plataforma es **gestionar cuentas
y accesos**, no leer los datos de los alumnos de un cliente —su edad, su grasa
corporal, sus objetivos— sin que quede constancia. El riesgo estaba anotado en
§12.5 y la decisión es la contraria: los demás equipos son privados.

Para ver la aplicación funcionando tiene **su propio equipo**, `CREWTEST`,
sembrado y activo, donde es `admin` como cualquiera.

La pestaña de cuentas enseña **identidad y acceso**: nombre, correo, equipo y
rol. Nada de lo que esa persona entrena. Esa línea es la que hace que la
privacidad del resto sea real y no una promesa.

### 13.4 Dos regresiones que sólo se vieron mirando

Añadir un rol por encima de `trainer` rompió dos comprobaciones que llevaban
meses siendo correctas:

**`HomeRedirect` preguntaba `role === 'trainer'`**, así que el dueño de un
gimnasio aterrizaba en la pantalla de progreso de un alumno. Ahora pregunta por
«gestiona», que es lo que quería decir.

**`useProgressStudent` preguntaba `role !== 'trainer'`** para decidir si mirabas
tu progreso o el de otro, y con eso un administrador veía la invitación a unirse
a un equipo del que es dueño.

Las dos son el mismo error: comprobar un rol concreto donde se quería comprobar
una capacidad. Es exactamente el motivo de que ahora haya `can`.

### 13.5 Una carrera en el arranque

`useViewer.load` devolvía `[]` cuando todavía no había sesión, y con eso el ciclo
terminaba poniendo `loading: false` **antes de saber quién había entrado**.
Durante ese instante nadie era administrador de nada, y `HomeRedirect` —que sí
espera a `loading`— mandaba al recién identificado a la pantalla equivocada, de
la que ya no volvía.

Ahora devuelve `null`, que significa «todavía no se sabe» y es distinto de «no
pertenece a nada». El fallo sólo aparecía al identificarse, nunca al recargar.

### 13.6 El ámbito iba un tick por detrás

Lo destapó una prueba que llevaba semanas en verde: abrir una sesión con un
enlace directo, recién identificado, decía «sesión no encontrada».

`setActiveCrew` vivía sólo en un efecto, así que `HomeRedirect` navegaba en
cuanto `loading` era falso y el crew activo se guardaba **después**. Una recarga
inmediata sobre una ruta profunda leía el almacenamiento antes de que se hubiera
escrito, se quedaba sin ámbito, y toda consulta devolvía vacío.

Ahora se fija también dentro de `resolve`, que corre fuera del renderizado y por
tanto puede escribir sin ser un efecto secundario. El efecto se queda para lo que
cambia después: el conmutador de equipo, y que te acepten una solicitud.

Sólo se manifestaba en el primer acceso tras identificarse, que es exactamente el
tipo de fallo que un usuario reporta como «a veces no me carga».

### 13.7 Lo que queda fuera

**Ascender a un alumno a la plantilla.** `crewStaff.add` escribe en el crew
activo, que para quien administra la plataforma es el suyo y no el del alumno.
Hasta que el alta de puestos acepte un crew explícito, la operación falla con un
mensaje claro en vez de escribir en el equipo equivocado.

**Sigue sin haber servidor.** Que la pantalla esconda un botón impide
equivocarse, no impide actuar. Quien se ascienda a sí mismo con un cliente
modificado lo conseguirá hasta que existan las políticas.

---

## 14. Los cabos de los permisos, cerrados (2 sep 2026)

Cuatro cosas quedaron abiertas al introducir los roles por crew. Tres se cierran
con código; la cuarta no se puede cerrar sin servidor, y aquí queda dicho qué
haría falta exactamente.

### 14.1 La navegación pregunta por capacidad, no por rango

Conceder «Rutinas y planes» a un alumno se guardaba en su ficha **y la puerta
seguía cerrada**: la navegación filtraba por rango mínimo, y su rango no
cambiaba. No era un permiso de más, era una concesión que no servía para nada —lo
peor de los dos mundos, porque parece que funciona.

Ahora un destino puede declarar `capability` en vez de `minRole`, y entonces se
pregunta con `can()`, que mira el rol **y** lo concedido aparte. El padrón de
alumnos pide `students.manage`; el catálogo, `training.manage`.

`minRole` se queda para el panel y los informes, que son **resúmenes** de
gestión: no autorizan una acción concreta, resumen varias. Pedirles una capacidad
obligaría a inventar una —«ver el resumen»— que no autoriza nada.

De paso, las tres props sueltas que la navegación recibía —rol, concesiones, si
administra la plataforma— pasan a ser un objeto. Eran tres porque crecieron una a
una, y se rompía cada vez que la decisión necesitaba un dato más.

### 14.2 Las dos pantallas que faltaban

`crew.settings` y `crew.staff` no las comprobaba nadie porque no había dónde: se
declaraba un poder que no abría ninguna puerta.

**Ajustes del equipo** (`/crew/ajustes`): nombre, denominación, aprobación de
entradas y ranking. Cada conmutador lleva escrito **qué pasa si se apaga**, no
qué es: «Aprobar quién entra» no le explica a nadie que desactivarlo convierte un
QR fotografiado en una puerta abierta.

**Equipo técnico** (`/crew/equipo`): quién trabaja aquí, con qué rol y con qué
concesiones. Antes esto sólo se podía tocar desde el panel de plataforma, que es
de otra persona y para otra cosa; quien de verdad sabe a quién asciende es quien
gobierna su equipo.

El diálogo de rol y permisos sube a `shared/components` al necesitarlo los dos
—el criterio de elevación de siempre— con una forma propia, `RoleSubject`, en vez
del tipo del panel de plataforma: pedir el de uno obligaría al otro a fabricarlo
con campos que no le incumben.

### 14.3 Un crew no se queda sin administrador

Sin la regla, bajar de rango al último —o borrarlo— dejaba un equipo que **nadie
puede gobernar**: sus ajustes quedan congelados y no hay quien nombre a otro
administrador, porque justamente eso exige serlo. Una puerta que se cierra por
dentro.

`lastAdminBlocker` vive en el dominio y devuelve **el motivo**, no un booleano,
porque quien llama tiene que poder explicarlo. La pantalla lo consulta antes de
ofrecer la acción —el botón sale apagado con su explicación— y el adaptador lo
impone además, porque la misma operación llega desde dos sitios y una regla
repetida en dos sitios acaba aplicándose en uno.

### 14.4 Ascender a un alumno a la plantilla

`crewStaff.add` escribe en el crew activo, que para quien administra la
plataforma es el suyo y no el del alumno. Ahora hay `addToCrew`, que lo nombra —
la excepción declarada, igual que `students.claimMembership`.

Método aparte y no un `crewId` opcional: un parámetro que casi siempre se omite
acaba omitiéndose también donde hacía falta, y ahí el fallo es silencioso —se
escribe en el equipo equivocado—.

**El ascenso conserva la ficha.** Borrarla perdería el historial: sus sesiones la
referencian por identificador. Así que la persona tiene puesto y ficha en el
mismo equipo, y `useViewer` se queda con el rango más alto conservando la ficha.
Sin eso, el rol dependía de cuál de las dos consultas llegara antes.

### 14.5 Lo que NO se cierra, y qué haría falta

**No hay servidor.** Todo lo anterior lo comprueba el navegador: impide
equivocarse, no impide actuar. Un cliente modificado escribe igual.

Cerrarlo de verdad es una lista corta y concreta de políticas, y se deja escrita
para que la migración sea mecánica en vez de arqueológica:

| Qué | Dónde vive hoy | Qué política hace falta |
|---|---|---|
| Aislamiento por crew | `CrewScope` + filtros en los adaptadores falsos | RLS: `crew_id` en cada tabla, política contra la pertenencia del usuario |
| Rol y concesiones | `permissions.can` en el cliente | Función del servidor que resuelva capacidades y las exija en cada escritura |
| Último administrador | `lastAdminBlocker` + `FakeCrewStaffRepository` | Restricción o disparador: un crew no puede quedar con cero administradores |
| Suscripción | `canEnrollMembers` en tres pantallas | Política de escritura sobre altas de miembros |
| Administrador de plataforma | constante en la semilla | Tabla que sólo escribe el rol de servicio |
| Quién miró qué | nada | Registro de auditoría: hoy no existe |

Mientras tanto, lo que sí se ha ganado es que **cada regla tenga una sola
definición**: están en `shared/domain`, las usan la pantalla y el adaptador, y
portarlas es traducir esa función, no buscarla por la aplicación.

---

## 15. «Sólo se agenda una fecha» (2 sep 2026)

Reportado desde el uso: asignar un plan, volcarlo, y que aparezca una sola
sesión. No había ningún fallo de cálculo —hay una prueba que vuelca once y pasa
desde hace semanas—, y ahí estaba el problema: **el comportamiento era correcto y
el motivo, invisible**.

El volcado pide una hora por cada día que el plan usa. Un día sin hora se
descartaba **en silencio**: sin hora no hay sesión que construir. Así que
rellenar una sola —lo más natural cuando hay cuatro selectores idénticos y sólo
uno tiene el foco— producía una fecha por semana, y ninguna pantalla decía dónde
estaban las demás.

Con un plan de una semana, exactamente una fecha. Y el editor de planes **arranca
con una semana**, así que quien no pulsa «Añadir semana» tiene un mesociclo de
uno sin habérselo propuesto.

Dos líneas lo cierran, y las dos responden a preguntas distintas:

- **La forma del plan**, junto a las horas: «El plan tiene 4 semanas y entrena 4
  días distintos». Es de donde sale el total, y sin ella el número del botón
  parece salir de la nada.
- **Lo que queda fuera**, antes de la previa: «Sin hora: miércoles, jueves y
  viernes. Esos días no se agendan». El recuento del botón dice CUÁNTAS salen;
  esto dice por qué no salen más, que es la pregunta que se hace de verdad.

El aviso va **antes** de la lista y no dentro: se refiere a lo que NO está en
ella, y ponerlo debajo obligaría a leerla entera para descubrir que falta algo.

La lección se repite: un descarte silencioso no es un comportamiento neutro. Es
la misma familia que el aviso que mentía en el padrón de alumnos —§12.4— y que
los huecos mudos del panel —§8—.

---

## 16. El progreso deja de ser un módulo del entrenador (2 sep 2026)

El progreso de un alumno vivía en `/progress`, con un selector para elegir a
quién mirar. Eso obligaba a salir de la ficha, ir a otra pantalla y buscar de
nuevo a la misma persona que ya se tenía delante. **Un dato que se consulta de un
vistazo no puede vivir a dos clics.**

Ahora está donde se pregunta por él:

- **En la tarjeta**: nivel, barra de experiencia y sesiones completadas. Es la
  pregunta que un entrenador se hace recorriendo la lista —quién está entrenando
  y quién se ha caído— y ahora se responde sin abrir nada.
- **En la ficha**: el registro entero, racha y sendero de hitos incluidos,
  reutilizando los componentes del dominio `progress`. Son presentación pura, así
  que dicen lo mismo aquí que en la pantalla del alumno; copiarlos habría creado
  dos verdades del mismo esfuerzo.

`/progress` se queda como **el progreso de uno mismo**. Desaparecen el selector
de alumno y `useProgressStudent` entero.

### 16.1 Quién ve el destino

No es una capacidad —no autoriza una acción— ni un rango: un entrenador manda
más que un alumno y aun así no tiene progreso propio en este equipo, porque no es
él quien entrena.

`ownTrainingOnly` lo ve **quien entrena aquí** —tiene ficha en el crew activo— y
también **quien no pertenece a ningún equipo**. Lo segundo salió de probarlo: al
principio bastaba con «tiene ficha», y con eso un recién registrado se quedaba
con una sola entrada de navegación. Su progreso vacío ES la invitación a unirse
—decisión de producto de §9—, así que esconderlo le dejaba sin ninguna razón para
quedarse.

Y quien entrena a otros y además entrena aquí lo ve, que es correcto: es
progreso suyo.

### 16.2 Una consulta para toda la lista

Veinte tarjetas no pueden ser veinte consultas del historial —el N+1 clásico en
cuanto haya servidor—, y no hacía falta ninguna nueva: el esfuerzo agregado del
equipo ya se calculaba para el ranking, y es exactamente el mismo dato.

Por eso el puerto **deja de llamarse `RankingRepository`**: lo que devuelve es
cuánto ha entrenado cada miembro, y ordenar es una de las cosas que se hacen con
eso, no lo que es. Pasa a `CrewProgressRepository`, con `CrewMemberProgress` y
`ProgressPeriod`.

El **nivel** se deriva en el cliente y no viaja en el agregado: cuánto cuesta
cada nivel es una regla de producto que puede cambiar sin tocar lo que el
servidor cuenta. Se guarda el esfuerzo; se interpreta el nivel.

### 16.3 Una barra que mentía

`calculateLevelCompletion` devuelve una **fracción de 0 a 1** y `Progress` espera
un porcentaje. `GamificationHeader` multiplicaba por 100; la franja nueva no, así
que salía vacía con 55 de 200 XP. Compilaba, pasaba el lint, y sólo se vio
midiendo el `transform` del indicador en el navegador.

De paso, la franja usaba el `bg-primary` de shadcn en vez del Cobalt del sistema:
el nivel es azul en todas las demás pantallas.

### 16.4 La celebración devolvía a una pantalla que ya no existía para él

Reportado desde el uso, y consecuencia directa de mudar el progreso: al terminar
una sesión, la celebración volvía **siempre** a `/progress`. Para un entrenador
—o un administrador— eso es una pantalla que su propio menú ya no le ofrece.

La causa de fondo no es el destino, es que **la regla estaba escrita dos veces**.
`matchesViewer` decidía «ve Progreso» con `role === null || trainsHere`, y la
celebración no consultaba nada. Con la regla repetida, una de las dos se queda
atrás — y se quedó.

Ahora hay una sola definición, `useViewer.hasOwnProgress`, y la consultan los dos
sitios que la necesitan: la navegación para ofrecer el destino, y la celebración
para saber a dónde volver. Quien entrena vuelve a su progreso; quien gestiona, a
la agenda, que es de donde salió la sesión y donde está la siguiente.

El texto de la celebración se le sigue enseñando a los dos, y es correcto: está
en tercera persona —«Logro desbloqueado», el nombre, los XP—, así que un
entrenador ve que su alumna acaba de conseguir algo.

### 16.5 En la ficha, la medida; el registro motivacional es del alumno

La sección de la ficha empezó reutilizando `GamificationHeader` y `MilestonePath`
enteros, y traía de paso dos cosas que no le tocan a quien entrena a otros: el
sendero —«Tu camino»— y la racha.

**El sendero es el registro que empuja a seguir, y está escrito para quien lo
recorre.** Al entrenador le sirve la medida: en qué nivel va y cuánto lleva. Se
la damos en la misma forma que en la lista.

Así que la ficha pinta ahora **la misma franja que la tarjeta**, no una copia con
otro tamaño: si las dos pintaran el nivel por su cuenta acabarían discrepando el
día que cambie la regla de cuánto cuesta subir.

De paso desaparece una consulta: la sección usaba `useGamificationProfile`, que
carga el historial completo de esa persona, y ahora sale del mismo agregado del
equipo que ya alimenta las tarjetas. Abrir una ficha dejó de costar una consulta
más, y la deuda que lo anotaba se retira.

`GamificationHeader` es además `sticky`, pensado para quedarse fijo en la
pantalla del alumno; dentro de una sección de la ficha esa fijación no
significaba nada.

---

## 17. La cuota del alumno, los avisos, y Reportes de verdad (2 sep 2026)

### 17.1 Dos suscripciones que no son la misma

`Crew.subscriptionStatus` es la del **equipo con la plataforma**: la activa un
administrador de plataforma y abre la puerta a incorporar gente.
`StudentSubscription` es la del **alumno con su equipo**: lo que paga por
entrenar allí, y lo cobra su entrenador. Comparten palabra y no se parecen en
nada —ni en quién decide ni en qué desbloquean—, así que el comentario que las
distingue está en la entidad, que es donde alguien va a buscarlo.

**Una fecha, no un contador.** `paidThrough` dice hasta qué día está pagado; un
contador de días restantes habría que recalcularlo cada día, y el día que nadie
abriera la aplicación se quedaría parado.

**El periodo se guarda por alumno.** Mensual es lo corriente, pero varía: bonos
trimestrales, un mes de prueba, el que paga el año. Con un valor fijo, cada
excepción obligaría a falsear la fecha de vencimiento para que cuadrara.

**Renovar encadena si va por delante y reinicia si venció.** Quien paga antes de
tiempo no pierde los días que le quedaban; quien lleva dos meses sin pagar no
compra dos meses de pasado. Encadenar siempre regalaría meses vencidos;
reiniciar siempre castigaría al puntual.

### 17.2 Sin importes, y por qué

Poner un precio obliga a elegir moneda, decidir si es por alumno o por tarifa, y
qué pasa cuando cambia —¿retroactivo?—, y nada de eso está decidido. Lo que la
cola de cobros necesita para ser útil es **quién vence y cuándo**, y eso sí está.

Añadir el importe después es un campo. Inventarse ahora un modelo de precios es
arriesgarse a tirarlo.

### 17.3 Un aviso que no llega a ninguna parte no es un aviso

«Que se puedan enviar avisos» exigía el otro extremo del hilo: la campana de la
barra superior era un botón que no hacía nada, y ahora es la bandeja donde
aterrizan.

**No es el muro, y la diferencia importa.** El muro es un tablón que lee el
equipo entero; un recordatorio de cuota es entre dos personas, y publicarlo donde
lo ven sus compañeros sería exponer a alguien por deber dinero. Hay una prueba
que comprueba justamente que el aviso llega a la campana y **no** aparece en el
muro.

El borrador viene escrito y **cambia según el estado**: no es lo mismo avisar de
lo que va a pasar que reclamar lo que ya pasó. Quien manda veinte al mes no va a
redactarlos uno a uno, y con un campo en blanco acaba no mandándolos.

TODO: es una bandeja **dentro** de la aplicación. Correo, WhatsApp o push son
otro trabajo —y otro consentimiento—; hasta entonces, quien no abra la aplicación
no se entera.

### 17.4 Reportes: tres pestañas, tres preguntas

Estaba enteramente inventado: 24 alumnos, 4.800 € de ingresos y un 87 % de
asistencia escritos a mano, más cuatro pestañas vacías bajo el rótulo «Sistema de
Gamificación» —que repetía lo que ya hace Progreso—. Ninguna cifra cambiaba
entrenando ni dejando de entrenar.

El criterio para que algo esté aquí es que **su respuesta cambie una decisión**:

| Pestaña | Pregunta | Por qué importa |
|---|---|---|
| Cobros | ¿a quién llamo hoy? | dinero que entra |
| Retención | ¿quién está dejando de venir? | dinero que se va |
| Actividad | ¿cuánto se entrena, y cuándo? | si cabe más gente |

**La cola de cobros se lee de arriba abajo y se llama.** Lo vencido primero, y
dentro de cada grupo lo que vence antes. Quien no tiene cuota va al final: no
debe nada, es un alta a la que aún no se le ha puesto tarifa, y mezclarla con los
morosos rompería la lectura.

**Retención es la que más dinero mueve, y ninguna pantalla la respondía.** Un
alumno que deja de aparecer no se da de baja: deja de renovar tres semanas
después, y para entonces ya no hay conversación que tener. La cuota vencida llega
tarde; esto llega antes. El umbral son catorce días y no siete porque una semana
sin venir es un viaje o una gripe, y avisar de eso llenaría la lista de falsos
positivos hasta que dejara de mirarse.

**Actividad agrupa por hora y no por día** porque el cuello de botella de un
gimnasio pequeño es el horario, no el calendario: los martes no se llenan, las
siete de la tarde sí.

Se han borrado `SummaryComponent` y `chartData` —gráficas de ingresos sin ninguna
fuente de pagos, distribución de planes sin planes asignados, y un botón de
exportar que no exportaba— y con ellos la dependencia **`chart.js`**, que se
quedó sin un solo uso.

### 17.5 Una hora perdida por una comprobación mal hecha

El diálogo de aviso «no se cerraba». Estuve buscando el fallo en el código —
sondas incluidas— hasta medir `data-state`, que decía `closed`: **el diálogo sí
se cerraba**, y lo que fallaba era mi comprobación, que buscaba el nodo en el DOM
sin contar con que Radix lo deja montado durante la animación de salida.

Antes de eso perdí otro rato con un `describeWeekdays is not defined` que sólo
existía en la caché de transformaciones de Vite: las pruebas, que levantan su
propio servidor, pasaban. `rm -rf node_modules/.vite` lo resolvió.

Las dos son la misma lección: cuando el síntoma no encaja con el código, sospecha
del instrumento antes que del código.

---

## 18. Configuración y el perfil de la cabecera (2 sep 2026)

Dos puertas pintadas en la pared: la barra lateral llevaba a `/settings`, que no
existía como ruta, y el «Perfil» del menú de usuario no tenía ni `onClick` ni
enlace. Cualquiera que las pulsara se daba contra el muro.

### 18.1 El perfil vive en la ficha, porque no hay entidad de persona

`AuthUser` sólo tiene identificador y correo. El nombre y la cara están en la
FICHA que a uno le corresponda: la de entrenador si gestiona, la de alumno si
entrena. Guardar escribe en una o en otra, y la de entrenador manda cuando
existen las dos —es la que se enseña por ahí, firmando los anuncios del muro—.

Quien no está en ningún equipo **no tiene ninguna**, y eso es un estado legítimo:
se le dice, en vez de ofrecerle un formulario que no guardaría en ninguna parte.

**El correo sale de la CUENTA, no de la ficha.** Leerlo de la ficha dejaba un
guion en el sitio del dato de alguien que sí lo tiene. Y no se edita: es la llave
por la que se reconoce a una persona —lo que enlaza su cuenta con la ficha que le
esperaba— y cambiarlo desde aquí la dejaría fuera de su propio historial.

`updateProfile` es una operación aparte de `update`, en los dos puertos, y la
diferencia es de propiedad: la ficha de alumno es la libreta del entrenador
—nivel, objetivos, grasa corporal son SU valoración— y el alumno no debería poder
reescribirla desde sus ajustes. Su nombre y su cara sí son suyos.

### 18.2 Lo que NO se ha puesto, y por qué

La tentación era rellenar los ajustes con lo que suele haber. Cada una habría
sido un control que no controla nada:

- **Tema.** `next-themes` está instalado, su proveedor no se monta, y el bloque
  `.dark` del CSS es el de shadcn por defecto: bone, ink, cobalt y ember no están
  redefinidos ahí. Un conmutador dejaría los componentes de la librería en oscuro
  y el resto de la aplicación en claro. Es trabajo de diseño, no una casilla.
- **Contraseña.** `AuthPort` no expone cambiarla.
- **Notificaciones.** No hay más canal que la campana, y ésa no se apaga.

Los ajustes del EQUIPO siguen en `/crew/ajustes`: son de la casa, no de la
persona, y los cambia quien la gobierna. Mezclarlos haría que un entrenador
buscara su nombre entre las reglas del equipo.

De paso se retira `/login` de `navigation.config`, que se declaraba y no existía
como ruta. Con `/reports` y `/settings` ya reales, esa deuda queda cerrada.

### 18.3 Una clave que se comía el acuse

`ProfileFields` se montaba con `key={nombre-apellidos}` para reinicializar el
borrador cuando llegaban los datos. Guardar cambia esos valores, así que la clave
cambiaba y **el formulario se remontaba**: el «Perfil guardado» desaparecía al
instante y, con dos ediciones seguidas, se habría perdido lo escrito.

La clave es ahora la ficha, no lo escrito en ella. Sólo se vio probándolo: el
nombre se actualizaba correctamente en la cabecera, y era el acuse el que no
llegaba a verse.

---

## 19. El tema oscuro, que no era un interruptor (2 sep 2026)

### 19.1 Por qué no bastaba con montar el proveedor

`next-themes` llevaba instalado desde el principio y su proveedor no se montaba
en ninguna parte: `UIProviders` tenía un comentario —«Aquí irán ThemeProvider,
ToastProvider, etc.»— y nada más. La lectura fácil era que faltaba una línea.

No era eso. El bloque `.dark` del CSS era **el de shadcn de fábrica**: redefinía
`--background`, `--card`, `--muted` y compañía, y no tocaba `--bone`, `--ink`,
`--cobalt` ni `--ember`. Como toda la aplicación está escrita contra los tokens
del proyecto —`bg-bone`, `text-ink`, `border-cobalt-tint-3`—, montar el proveedor
habría puesto en oscuro los componentes de la librería y habría dejado las
cuarenta pantallas propias exactamente igual que estaban. Un interruptor que
enciende media casa es peor que ninguno.

### 19.2 Los nombres pasan a ser papeles

La decisión de fondo: `--bone` y `--ink` **cambian de valor** en `.dark`.

Eso obliga a leer sus nombres como papeles y no como colores. `bone` es «la
superficie de la página» e `ink` «el texto encima»; en claro son hueso y tinta,
en oscuro tinta y hueso. Es lo que hace que las pantallas funcionen sin tocarlas.

La alternativa —dejar los tokens quietos y cambiar sólo `--background`— es más
limpia en abstracto y exigía reescribir esas cuarenta pantallas para que dejaran
de nombrar el color. No es lo que este sistema hace hoy, y el rodeo no compraba
nada.

Lo demás sale de ahí:

- **Cobalt sube** a `215 88% 62%`. Un azul al 42 % de luminosidad sobre un fondo
  casi negro se lee como gris oscuro: el mismo tono no vale para los dos temas.
- **Los tintes suben de opacidad además de tono.** Un 6 % de azul se ve sobre
  papel claro y no se ve sobre casi negro.
- **`--ember-deep` deja de ser «más oscuro» para ser «más claro».** Su papel es
  destacar sobre el fondo, y el fondo cambió de lado.
- **El fondo no es negro puro.** 222 grados conserva el parentesco con Cobalt, y
  un negro absoluto con texto blanco puro produce el halo que cansa la vista en
  pantallas OLED.

### 19.3 `--surface`: diecisiete blancos que no tenían nombre

`bg-white` estaba escrito a mano en diecisiete sitios. En oscuro, cada uno de
ellos habría seguido siendo blanco.

Se añadió `--surface` —la superficie elevada, la de tarjetas y paneles— y se
sustituyeron sistemáticamente. El token responde a «qué es esto» en vez de a «de
qué color es hoy»: en claro vale blanco, en oscuro sube a `222 26% 11%`, porque
en oscuro lo que está más cerca es más claro, no más oscuro.

**Una excepción, deliberada:** `CrewInviteCard`. Los módulos del QR se dibujan en
negro y un lector necesita ese contraste; sobre papel oscuro el código deja de
escanearse. Es la única superficie de la aplicación que no cambia con el tema, y
está anotada en el propio componente.

También cayeron los grises sueltos de Tailwind que quedaban —`text-gray-400` en
los iconos de los campos, `bg-gray-50` en el pie de la barra lateral,
`hover:bg-gray-100` en el menú de usuario—, que en oscuro habrían quedado como
manchas claras.

### 19.4 El destello, y por qué hay un guion en `index.html`

React no llega a tiempo. El fondo del `body` sale de la hoja de estilos y se
pinta en cuanto el navegador la tiene, mucho antes de que se descargue y ejecute
el módulo de la aplicación. El guion que `next-themes` inyecta se ejecuta cuando
React monta, que es tarde.

Sin nada más, abrir con tema oscuro daba **un destello blanco de pantalla
entera** en cada arranque. En una PWA instalada eso se nota más, porque el
arranque es frecuente.

La solución es un guion en línea en el `<head>` que lee la preferencia y pone la
clase antes del primer pintado. Duplica la clave del almacenamiento
—`trainerhub.tema`, que en TypeScript es `THEME_STORAGE_KEY`— porque desde HTML
no se puede importar. Está anotado en los dos lados.

### 19.5 La barra del navegador

`<meta name="theme-color">` estaba fija en el azul primario. En una PWA instalada
esa etiqueta tiñe la barra de estado del sistema operativo: con el tema oscuro
quedaba una franja azul brillante pegada a una aplicación negra.

`BrowserBarColor` la sincroniza con el tema resuelto. Lee `resolvedTheme` y no
`theme` porque con «sistema» elegido `theme` vale literalmente `'system'`, que no
es un color. El valor oscuro es `--bone` del bloque `.dark` convertido a
hexadecimal —la etiqueta no entiende `hsl(var(…))`—, así que si cambia la paleta
hay que cambiarlo ahí también.

### 19.6 Tres opciones, no un interruptor

`system` no es un tema: es la renuncia a elegir uno. Quien lo escoge delega en el
sistema operativo y la aplicación cambia sola cuando el teléfono pasa a modo
noche. Es la opción de fábrica, porque quien tiene el teléfono en modo noche
espera que las aplicaciones lo respeten sin tener que decírselo a cada una.

`useThemePreference` envuelve a la librería y devuelve el tema **tipado**:
`next-themes` devuelve `string | undefined`, y sin esa capa nada impedía escribir
`setTheme('oscuro')` y quedarse sin efecto ni aviso. Es además el único punto que
nombra la librería fuera del proveedor.

Devuelve `null` mientras no se sabe. La preferencia vive en el almacenamiento del
navegador y no está disponible en el primer render: sin ese estado intermedio, el
selector marcaba «claro» durante un instante aunque estuviera guardado «oscuro»,
y el salto se veía.

### 19.7 Lo que se midió, no lo que se leyó

Con el tema oscuro puesto, en las ocho rutas principales a 375 px:

- **Cero desbordamiento horizontal** en todas.
- **Cero pares texto/fondo por debajo de 3:1**, medido calculando la luminancia
  relativa de cada nodo de texto contra el primer ancestro con fondo opaco. Es la
  comprobación que encuentra los colores que no giraron: un `text-gray-600`
  olvidado sobre fondo oscuro sale ahí y no sale leyendo clases.

### 19.8 Lo que queda

El idioma. El conmutador de tema y el de idioma se pidieron juntos; el tema se
podía cerrar entero y el idioma no, porque no hay infraestructura de traducción y
el texto visible ronda las 350 cadenas distintas —unas 500 apariciones— repartidas
en más de sesenta ficheros. Se aborda aparte, y hasta que esté completo no se
ofrece el selector: media aplicación en inglés y media en español es peor que una
aplicación en español.

---

## 20. Tres idiomas, y lo que la traducción destapó (2 sep 2026)

### 20.1 La propiedad que hace esto viable

`dictionaries/es.ts` es la fuente de la verdad de qué claves existen. Los otros
dos se declaran `Record<TranslationKey, string>`, así que **una clave que falte
en inglés o en portugués no compila**.

No es un detalle de tipos: es lo único que impide publicar media traducción sin
enterarse, que es el fallo que convierte una aplicación traducida en una
aplicación rota a medias. Son 782 claves en los tres ficheros, y el compilador
las cuadra en cada `npm run build`.

Las claves nombran **el sitio y la intención**, nunca el texto: `common.save`, no
`common.guardar`. Con el texto como clave, corregir una tilde en español obliga a
tocar los tres ficheros.

### 20.2 Sin librería, y por qué

`react-i18next` no entra. Lo que aporta —carga por espacios de nombres, ICU,
detección— o no hace falta aquí o ya está resuelto:

- **La completitud la da TypeScript**, no la librería. i18next no comprueba nada
  en tiempo de compilación: una clave que falte se ve en pantalla, en producción.
- **Los tres diccionarios juntos pesan unos kilobytes.** Partirlos obligaría a
  que cada pantalla supiera esperar al suyo, y en una PWA que arranca sin
  conexión el idioma guardado tiene que estar disponible ya.
- **El plural de las tres lenguas es el mismo reparto**: uno frente a todo lo
  demás. `plural(unaClave, otraClave, cuenta)` recibe las dos claves explícitas
  para que el compilador compruebe que las dos existen —justo lo que se pierde
  construyendo la clave en tiempo de ejecución—. El día que entre una lengua con
  dual, esto se cambia por `Intl.PluralRules` y las llamadas se quedan igual.

### 20.3 Lo que traduce el navegador mejor que nosotros

Tres sitios donde había texto escrito a mano y ahora hay `Intl`:

- **«Hoy», «ayer», «hace 3 días»** en la actividad reciente. `Intl.RelativeTimeFormat`
  con `numeric: 'auto'` elige la palabra donde el idioma la tiene y el número
  donde no, y cada lengua decide dónde.
- **Los siete días de la semana** de la rejilla del calendario. Eran `['Lun',
  'Mar', 'Mié'…]`; ahora los da `Intl.DateTimeFormat`, que además sabe qué
  abreviatura usa cada idioma.
- **Los diecisiete `'es-ES'`** repartidos por fechas y ordenaciones pasan a
  `activeLocale()`.

### 20.4 `activeLocale`: estado de módulo, con un solo escritor

Las funciones de fecha —`describeWeekRange`, `formatDateKey`, `describePostTime`—
son puras y se llaman desde reductores, desde `map` y desde sitios donde no hay
componente. No pueden usar un hook.

Las dos salidas eran pasar el idioma como parámetro a cada una y desde ahí a cada
una de sus llamadas —correcto en abstracto, y ruido en veinte firmas—, o un valor
de módulo con **un solo escritor** (`LanguageProvider`) y muchos lectores. Se
eligió lo segundo, y vive en su propio fichero para que quien importe `languages.ts`
no se encuentre el escritor de paso.

Para lo que sí compone texto fuera de React —`buildSummary` del panel,
`duesReminderDraft`, los tres validadores de borrador— la traducción **llega por
parámetro**, tipada como `Translate`. Es explícito en la firma y no depende de
ningún ambiente.

### 20.5 Lo que la traducción destapó

Traducir obliga a preguntarse de quién es cada cadena, y ahí aparecieron cosas
que llevaban tiempo en el sitio equivocado:

**Texto dentro del dominio.** `shared/domain/permissions.ts` guardaba
`ROLE_LABEL`, `ROLE_DESCRIPTION` y `CAPABILITY_LABEL` con el castellano dentro;
`subscriptionRules.ts` tenía `describeStanding`, que redacta «vence en 3 días»;
`studentSubscription.ts` llevaba los nombres de los periodos. El dominio no
conoce a nadie por encima suyo, así que para traducirse habría tenido que conocer
al diccionario. Todo eso baja a `shared/i18n/`: el dominio define **qué existe**,
y cómo se dice es presentación.

**Cuatro copias del mismo rótulo.** «Pendiente / Confirmada / Completada /
Cancelada» estaba escrito en el panel, en la agenda, en la ficha del alumno y en
el panel de plataforma, cada uno con su mapa. Los colores sí difieren de verdad
entre pantallas y se quedan donde estaban; las palabras no, y cuatro copias son
cuatro sitios donde olvidarse de traducir una. Ahora hay un
`SESSION_STATUS_LABEL_KEY`.

**Listas de datos con el texto dentro.** El catálogo de onboarding, los logros,
los peldaños del sendero, los tipos de sesión, las especialidades del registro:
constantes de módulo que se evalúan al importar, donde todavía no hay idioma que
consultar. Todas pasan a guardar **la clave**, y traduce quien pinta.

### 20.6 Dónde acaba la traducción, dicho en pantalla

La línea es la que dice el propio selector: **cambia lo que escribe la
aplicación, no lo que escribió una persona.** Sin decirlo, el primer alumno con
la aplicación en inglés esperaría ver sus rutinas traducidas.

Eso deja tres clases de texto que se quedan como están, y cada una por su motivo:

- **Lo que escribe el entrenador** —nombres de rutinas, anuncios del muro, notas
  de una sesión—. Es suyo.
- **Lo que se guarda como identidad.** Un objetivo de alumno se guarda «Perder
  peso» lo marque quien lo marque: si cambiara con el idioma, dos fichas con el
  mismo objetivo dejarían de agruparse. Se guarda el valor y se traduce el
  rótulo, que es lo mismo que se hace con el nivel y con el catálogo de
  referencia.
- **El título y la categoría de una sesión ya creada.** Se escriben al crearla y
  se quedan en el idioma de quien la creó. Traducirlos al leer exigiría guardar
  la clave en vez del texto, y eso es una migración del dato.

El catálogo del entrenador se traduce **por identificador**, no por nombre: el
ejercicio guarda `muscleGroupId`, así que traducir no toca ningún dato. Y lo que
no está en el mapa —el material que da de alta un entrenador— se lee tal cual,
que es exactamente lo que tiene que pasar.

### 20.7 El idioma antes del primer pintado

`lang` en `<html>` no es decoración: de él dependen el lector de pantalla para
elegir la voz y el navegador para partir palabras al final de línea. Estaba fijo
en `es`. Ahora lo pone el mismo guion en línea que ya aplicaba el tema, antes de
que React monte.

La primera vez el idioma **lo dice el navegador**. Preguntarlo sería peor: quien
abre la aplicación con el teléfono en portugués ya respondió a esa pregunta al
configurar el teléfono.

### 20.8 La suite, fijada a español

`playwright.config.ts` pasa a declarar `locale: 'es-ES'`. Sin eso, Playwright
arranca en `en-US`, el proveedor detecta inglés —que es lo que debe hacer— y los
ciento setenta casos fallan a la vez por un motivo que no es el que están
probando. Fijar el idioma ahí es declarar contra qué versión se prueba; el
conmutador tiene sus propias comprobaciones.

---

## 21. La sesión deja de ser una lista de marcadores (3 sep 2026)

### 21.1 Lo que había, y por qué no acompañaba

La pantalla en vivo de fuerza pintaba la rutina entera con una casilla por serie.
Servía para recordar lo que tocaba y para contar cuántas llevabas —que es un dato
que se sabe igual mirando: si hay cuatro y llevas dos, llevas dos—. Lo que no
hacía era acompañar mientras se entrena, que es el momento para el que existe.

Y sólo producía una medida: «series marcadas». Nada sobre cómo salió ninguna.

### 21.2 La unidad es la serie

`buildSetPlan` aplana la rutina a la lista ordenada de series que hay que hacer,
y ésa es la unidad de la sesión. La lista se calcula una vez: lo que cambia es en
cuál se está. Un plan que se recalculara a cada paso podría reordenarse bajo los
pies de quien entrena.

**Respeta el método del bloque, que es lo que el método significa:**

- `simple`: todas las series de un ejercicio y luego el siguiente. Entre series,
  el descanso de la prescripción; al cerrar el ejercicio, el del bloque.
- `superserie`, `triserie`, `circuito`: **por rondas**. Una serie de cada
  ejercicio encadenadas sin descanso, y el descanso al cerrar la ronda. Aplanar
  una superserie en «todas las de uno y luego todas las del otro» la convertiría
  en dos ejercicios sueltos.

Un ejercicio con menos series que el resto deja de aparecer en las últimas
rondas, en vez de bloquearlas.

### 21.3 Dos relojes, y cuál es el grande

La serie en curso tiene **su propio cronómetro**, y es el número grande de la
pantalla. El de la sesión entera baja a la cabecera, pequeño: responde a otra
pregunta, y con los dos en el mismo cuerpo compiten.

Al cerrar la serie arranca el **descanso**, que es una fase de pleno derecho y no
un hueco: cuenta atrás sobre el prescrito, y pasado ése la cifra sigue corriendo
en positivo, en Ember, para que un descanso de más se vea en lugar de esconderse
en un cero.

### 21.4 Los círculos son repeticiones

Era el error de fondo de la pantalla anterior. Las series ya las cuenta la propia
sesión; lo que **sólo sabe quien acaba de hacerla** es cuántas repeticiones le
salieron —una serie prescrita a 8-10 puede salir a 7—.

Tocar el círculo N marca hasta el N, y volver a tocarlo desmarca. Diez toques por
serie serían doscientos en una sesión, y a la tercera nadie los da.

### 21.5 Contra qué se contrasta, y contra qué no

Sólo contra lo que de verdad está prescrito. Un veredicto sobre un número que
nadie fijó no evalúa nada: lo aparenta.

| Medida | Referencia |
|---|---|
| Repeticiones hechas | el rango prescrito, «8-10» |
| Descanso real | `restSeconds` del bloque o de la prescripción |
| Segundos de trabajo | la **cadencia** (`tempo`) cuando la hay: «3-1-1-0» son cinco segundos por repetición |

Sin cadencia se cae a `SECONDS_PER_REP`, la estimación de tres segundos que el
proyecto **ya declaraba** para calcular la duración de una rutina. Se exporta en
vez de escribir otra: con dos constantes, la ficha de la rutina y la sesión
dirían cosas distintas del mismo ejercicio.

**Los márgenes son distintos a propósito.** El del descanso son quince segundos
—por debajo de eso la diferencia es ruido de cronómetro: guardar el móvil,
colocar la barra—. El del ritmo es un 40 %, más ancho, porque sin cadencia
prescrita la referencia es una estimación, y estrechar el margen sobre un
supuesto produce veredictos que suenan a medición.

### 21.6 Cuándo se juzga

Nunca a mitad. La primera versión pintaba «rápida» a los tres segundos de empezar
la serie, y «descanso corto» al segundo uno de un descanso de dos minutos: las
dos cosas eran trivialmente ciertas y se leían como un reproche.

- El **ritmo de la serie** se juzga al cerrarla, en la pantalla de descanso.
- El **descanso** se juzga cuando ha terminado, en la pantalla de la serie
  siguiente: «Anterior: 7 de 6-8 · 117 s de descanso · descanso en su sitio».

Y sólo se enciende lo que se sale de lo pactado. Pintar también de color lo que
salió bien convertiría la pantalla en un semáforo donde lo urgente deja de
destacar; es el mismo criterio que la insignia de cuota.

### 21.7 Lo medido se guarda, lo juzgado no

`SessionResult` gana `sets?: SetRecord[]`, y cada registro guarda **lo prescrito
junto a lo hecho**: `prescribedReps` y `prescribedRestSeconds` además de
`repsDone`, `workSeconds` y `restSeconds`.

Es deliberado. La prescripción se puede editar después: si la rutina pasa de
«8-10» a «6-8» mañana, la serie de ayer tiene que seguir diciendo contra qué se
comparó. Sin eso, el historial cambiaría de significado cada vez que alguien
retoca un bloque.

Y **no lleva veredicto**. Si la serie fue rápida o lenta lo calcula
`setPerformance` a partir de estos números, así que ajustar el criterio no
reescribe lo que ya pasó. Es la misma razón por la que ahí no hay XP.

El campo es opcional, y lo será: las sesiones cerradas con la pantalla anterior
tienen `completedSets` y nada más, y cardio tampoco lo trae porque no se programa
en series. Ausente significa «no se midió», que es distinto de una lista vacía.

`completedSets` y `totalSets` se conservan tal cual: son lo que leen las reglas
de progreso, y cambiarles la forma habría obligado a migrar el historial entero
para no ganar nada.

### 21.8 Lo que queda

- **El descanso no avisa cuando termina.** La cuenta atrás llega a cero y sigue,
  pero nadie mira el teléfono los dos minutos enteros. Un aviso sonoro o una
  vibración es lo que falta, y es trabajo aparte —hay que decidir qué pasa con la
  pantalla apagada—. Anotado con `TODO:` en `useGuidedStrengthSession`.
- **No se puede volver atrás una serie.** Cerrar es definitivo dentro de la
  sesión. Equivocarse es normal, y hoy la única salida es terminar y rehacer.
- **El peso no se registra.** La prescripción no lo lleva —ni `PrescribedExercise`
  ni `SetRecord`—, así que la sesión no puede preguntarlo sin inventarse el
  campo. Es lo siguiente que pide un entrenador de fuerza, y exige decidir antes
  si el peso es del alumno o de la prescripción.

---

## 22. El peso por serie (3 sep 2026)

### 22.1 Sin él, el historial no dice si se avanzó

La sesión guiada medía repeticiones, segundos de trabajo y segundos de descanso.
Faltaba el número que convierte todo eso en una progresión: diez repeticiones a
40 kg y diez a 60 son la misma línea sin el peso.

`SetRecord` gana `weightKg`, **opcional**. Ausente significa «no se anotó», que
no es lo mismo que cero: cero es un peso —una barra vacía, un lastre que se
quita— y confundirlos llenaría el historial de ceros que parecerían mediciones.

### 22.2 Se ofrece siempre, también en peso corporal

La tentación era esconder el campo cuando el ejercicio no lleva carga externa.
Habría sido un error, y en el caso que más lo necesita: **las dominadas y los
fondos son justo donde se añade peso con cinturón**. Adivinar cuándo sobra el
campo se equivoca precisamente ahí, así que se ofrece siempre y se deja en blanco
cuando no aplica.

De paso evita que el dominio de la sesión tenga que saber de qué material es un
ejercicio, que es catálogo de `trainings` y no viaja con la prescripción.

### 22.3 Se ajusta a toques, no se teclea

Entre serie y serie las manos están sudadas y el teclado del móvil tapa media
pantalla. Dos botones de **2,5 kg** —el salto de un par de discos de 1,25, que es
el incremento estándar en una barra— resuelven el caso normal sin abrirlo:
repetir la carga, o subir un disco. El campo sigue ahí para el salto grande o
para el primer día de un ejercicio.

Poner 1 kg obligaría a tres toques para el cambio más común; poner 5 dejaría
fuera la mitad de las progresiones.

### 22.4 El peso llega puesto, y dice de dónde sale

Anotar sin recordar obligaría a escribir la carga desde cero en cada serie de
cada sesión, y lo que se teclea cuatro veces por ejercicio se deja de teclear a
la tercera semana.

El campo arranca con **lo último anotado de ese ejercicio**, en dos saltos:

1. Lo hecho hoy, si ya hay una serie cerrada de ese ejercicio. Del **ejercicio**
   y no de la serie anterior, que en una superserie es otro ejercicio con otra
   carga.
2. Si es la primera del día, lo de la última sesión cerrada. Eso lo resuelve
   `useLastWeights`, que recorre las sesiones del alumno **por `completedAt`** y
   no por la fecha de la agenda: son cosas distintas —una sesión del martes se
   puede cerrar el miércoles— y aquí importa cuándo se levantó ese peso.

Y se dice: «La última vez: 47,5 kg». Un campo que se rellena solo y no explica
por qué se lee como un dato inventado.

`useLastWeights` **no bloquea nada**: devuelve un mapa vacío mientras la consulta
va, y la pantalla se pinta igual. Sin historial —la primera sesión de alguien—
tampoco habría nada que ofrecer, y una pantalla que se abre con el teléfono en la
mano no puede esperar a una consulta.

Llega al hook de la sesión **por parámetro**, no se pide dentro:
`useGuidedStrengthSession` sabe conducir una sesión, no leer el historial.

### 22.5 Dónde se ve, para que no sea un campo de escritura

Un dato que se guarda y no se lee en ninguna parte es un dato que envejece sin
que nadie lo note. El peso aparece en cuatro sitios:

- En el descanso, con lo que acaba de salir: «7 de 6-8 repeticiones a 62,5 kg en
  70 s».
- En la serie siguiente, en el resumen de la anterior.
- En el plan, donde una serie cerrada pasa a decir **lo hecho** en vez de lo que
  tocaba: «7 rep · 62,5 kg» donde antes ponía «Serie 1 de 4 · 6-8». Es la
  diferencia entre un plan y un diario.
- En la sesión siguiente, como valor de partida.

### 22.6 Kilos, y con la coma de cada idioma

`formatKilos` pasa por `Intl.NumberFormat` con la etiqueta activa: «62,5» en
castellano, «62.5» en inglés. La primera versión escribía la coma a mano y
pintaba coma en el campo y punto en el resumen, así que el mismo peso salía
escrito de dos formas **en la misma pantalla**. El campo sigue aceptando las dos
al escribir.

**TODO: sólo kilos.** Ofrecer libras es una preferencia de quien mira —o del
equipo— y esa decisión no está tomada. Media aplicación en kilos y media en
libras sería peor que sólo kilos.

### 22.7 Lo que sigue faltando

- **No se prescribe el peso**, sólo se registra. La prescripción dice RIR, que es
  la instrucción de «elige tú la carga»; fijar un peso absoluto o un porcentaje
  del máximo es otra decisión de producto, y arrastraría al editor de rutinas, al
  borrador de planes y al volcado a la agenda.
- **Nadie mira el histórico de cargas todavía.** El peso se guarda, se arrastra y
  se ve dentro de la sesión, pero no hay ninguna pantalla que enseñe la
  progresión de un ejercicio a lo largo de las semanas. Es lo siguiente que pide
  quien lo anota.

---

## 23. La progresión de cargas, y lo que quedaba de la sesión (4 sep 2026)

### 23.1 El peso ya tiene pantalla

Se anotaba desde que la sesión guiada lo pide, y el único que lo leía era el
campo de la sesión siguiente para dejarlo puesto. Un dato que se escribe y no se
mira envejece sin que nadie lo note, y éste responde a la pregunta por la que
alguien paga a un entrenador: **¿estoy mejorando?**

Va en la **ficha del alumno**, debajo del progreso, por lo mismo que aquél: quien
lo consulta ya está mirando a esa persona. Y debajo y no dentro, porque son cosas
distintas: el progreso es el juego —nivel, racha, hitos— y esto es la medida de
fuerza.

### 23.2 La serie tope del día, no el promedio

`buildLoadProgression` agrupa por ejercicio y por día, y de cada día se queda con
**la serie más pesada**, con SUS repeticiones al lado.

- **No se promedia.** Un calentamiento a 40 y un trabajo a 80 darían 60, un peso
  que no se levantó nunca.
- **No se suma el volumen.** Es otra pregunta, y mezclada con ésta esconde si la
  carga sube.
- **Las repeticiones van con el peso de esa misma serie.** Quedarse con el peso
  máximo de un día y las repeticiones de otra serie sería un par de datos que no
  ocurrió junto.

Con un solo punto no se pinta variación: un «0 kg» ahí se leería como «no ha
subido» cuando lo cierto es que todavía no se sabe.

### 23.3 Una sola definición de «el último peso»

`lastWeightByExercise` sale del mismo historial que pinta la ficha, y de ahí lo
toma `useLastWeights` para dejar el campo puesto en la sesión. Con dos
definiciones, la sesión y la ficha podrían decir cifras distintas del mismo día.

`formatKilos` sube a `shared/lib/routineFormat.ts` por el mismo motivo que subió
`formatPrescription`: lo usan dos dominios y ninguno importa del otro.

### 23.4 Los relojes medían tics, no tiempo

**Es el defecto más grave que salió de verificar en el navegador.** La sesión
sumaba uno por cada `setInterval`, y el navegador estrangula los temporizadores
de una pestaña en segundo plano: medido aquí, **dos segundos contados en dos
minutos reales**. Con el móvil bloqueado entre series —que es lo normal— los
segundos que se guardaban en cada `SetRecord` habrían sido falsos.

Ahora se guarda **cuándo** empezó cada cosa y el tiempo se resta de `Date.now()`.
El intervalo sólo repinta; si se estrangula, la cifra se refresca más tarde pero
nunca se equivoca. Tres consecuencias:

- **Lo que se guarda se mide en el instante de guardarlo**, con `Date.now()` y no
  con el `now` del último repintado. Ahí está la diferencia entre los segundos
  que la pantalla alcanzó a contar y los que la serie duró.
- **Pausar congela** lo corrido y reanudar vuelve a anclar los dos relojes. Sin
  eso, una pausa de diez minutos daría una serie de diez minutos.
- **Al volver de segundo plano la cifra se pone al día** sin esperar al tic:
  quien desbloquea el móvil vería el reloj parado durante un segundo, que es
  justo la sensación que esto venía a quitar.

### 23.5 El aviso al cumplirse el descanso

La cuenta atrás llegaba a cero y seguía, pero nadie mira el teléfono los dos
minutos enteros, que es el problema que la cuenta atrás venía a resolver.

Ahora, al cruzarse el descanso prescrito:

- **Vibra**, si el dispositivo puede. `vibrate` devuelve si hubo respuesta y aquí
  se ignora a propósito: en iOS no existe la Vibration API.
- **La franja entera cambia de color**, no sólo la cifra. Es la mitad del aviso
  que sí llega a todas partes, y se ve de un vistazo desde el banco.

Se dispara **al cruzar** y una sola vez, con una referencia que lo recuerda.
Comparar por igualdad exacta habría sido más corto y estaría mal desde que los
relojes miden tiempo: con la pestaña estrangulada el reloj salta de 118 a 130 y
el aviso no llegaría nunca.

**TODO: falta el sonido**, que es el único aviso que alcanza a quien tiene el
teléfono en el bolsillo y un iPhone en la mano. Exige decidir dónde se apaga: un
pitido que no se puede silenciar en una sala compartida es peor que ninguno, y
esa preferencia vive en Ajustes, con las demás.

### 23.6 Deshacer una serie

Equivocarse contando es lo más normal del mundo, y la única salida era terminar
la sesión y rehacerla entera.

Reabre la última cerrada **con lo que se anotó en ella** —repeticiones, peso— y
con su reloj donde estaba: la serie se hizo y duró eso, y reiniciarlo convertiría
el arreglo de un error de conteo en un dato falso.

El control es secundario y callado, debajo de la acción principal, y **no se
pinta cuando no hay nada que deshacer** en vez de apagarse: un botón desactivado
en la primera serie no le dice nada a nadie.

### 23.7 Dos defectos que aparecieron de paso

**El peso se borraba al deshacer.** El valor de partida se copiaba a un estado
con un efecto —para poder rellenarlo cuando `useLastWeights` resolvía, que es una
consulta y llega después del primer pintado— y ese efecto pisaba el peso
restaurado: al volver a la primera serie su guarda se cumplía otra vez. Ahora el
peso **se deriva** en vez de copiarse, y no hay dos fuentes compitiendo. El
estado guarda sólo lo decidido a mano, donde `undefined` —«nadie lo ha tocado»—
es distinto de `null` —«lo he dejado en blanco»—.

**Seis tintes que no teñían nada.** `bg-cobalt-tint/40` se compila a
`hsl(220 90% 42% / 0.06 / 0.4)`, porque el token YA lleva su propia alfa. No es
un color válido y el navegador pinta transparente sin quejarse. Estaba en el
registro, en el aviso de unirse a un equipo, en el diálogo de permisos y en la
campana. Queda dicho en `index.css`, junto a los tokens.

**Y un botón sin una sola letra.** `AchievementCelebration.dismissLabel` era
opcional con «Seguir» por defecto; al pasar a claves el valor por defecto
desapareció y el único que la monta no la pasaba. Como el tipo la daba por
opcional, nada se quejó. Ahora es obligatoria.

### 23.8 Lo que sigue faltando

- **El peso no se prescribe, sólo se registra.** La prescripción dice RIR, que es
  la instrucción de «elige tú la carga». Fijar un peso absoluto o un porcentaje
  del máximo es otra decisión de producto —y contradictoria con el RIR si se
  ponen las dos—, así que no se toma de rebote.
- **No hay gráfica.** La progresión es una lista, y a propósito: con cinco o seis
  puntos una lista se lee mejor que un dibujo, y añadir una librería de gráficos
  para eso fue exactamente lo que se quitó de Reportes. Con un año de historial
  detrás, esto se revisa.
- **No hay 1RM estimado.** Es la cifra que normaliza peso y repeticiones, y es un
  MODELO —Epley, Brzycki— con su margen de error. Aquí no se ha guardado nunca
  nada calculado, y ésta no va a ser la primera.

---

## 24. Los tres puntos que quedaban abiertos (4 sep 2026)

Los tres estaban escritos en §23.8 y en CLAUDE.md §6 como decisiones pendientes,
no como trabajo por hacer: cada uno esperaba una decisión de producto. Aquí están
las tres tomadas, con lo que cada una obligó a resolver.

### 24.1 El sonido, y el interruptor que era su condición

El aviso de fin de descanso eran dos señales y ninguna llegaba sola: el **color**
no sirve con el teléfono en el bolsillo, y la **vibración** no existe en iOS
—Apple nunca implementó la Vibration API—. Justo la postura normal durante un
descanso de dos minutos se quedaba sin aviso.

No se ponía sonido por una razón concreta: **un pitido que no se puede callar en
una sala compartida es peor que ninguno**. Así que el interruptor de Ajustes no
acompaña a la función, **es su condición**, y por eso se han hecho a la vez.

**Se sintetiza, no se descarga.** `restChime.ts` genera dos tonos —La5 y Re6,
una cuarta ascendente— con la Web Audio API. Un `.mp3` habría que servirlo,
cachearlo para que sonara sin red —esto va a ser una PWA— y versionarlo con el
resto; medio segundo de oscilador no necesita nada de eso. Dos tonos y no uno
porque un pitido suelto se confunde con cualquier notificación del teléfono;
ascendente porque lo que anuncia es volver a empezar.

**El desbloqueo va en el gesto de cerrar la serie**, y ahí está el primero de los
dos detalles que no se ven leyendo el código: los navegadores sólo reanudan un
contexto de audio dentro del manejador de un evento del usuario. Pedirlo desde el
temporizador que mide el descanso se resuelve sin error y **no suena nada**.
Cerrar la serie es el gesto que siempre precede a un descanso —no hay descanso que
no venga de ese toque—, así que cuando toque avisar el audio ya está corriendo.

#### 24.1.1 Y el segundo: el pitido se PROGRAMA, no se dispara

La primera versión lo tocaba desde el mismo efecto que ya vibraba y cambiaba el
color, al cruzarse el descanso prescrito. **Medido en el navegador, con la
pestaña en segundo plano: la cuenta atrás congelada en 0:08 durante quince
segundos.** Los temporizadores de una pestaña oculta se estrangulan a uno por
minuto.

El valor nunca era incorrecto —los relojes miden marcas de tiempo desde §23.4—,
pero lo que se **repinta** llega tarde, y con el repintado llegaba tarde el aviso.
Justo en el caso para el que se puso el sonido: el teléfono guardado en el
bolsillo.

**El reloj de audio es otra cosa.** `AudioContext.currentTime` corre en el hilo de
audio, que no se estrangula. Así que al empezar el descanso se programan los dos
osciladores para dentro de los segundos que falten, y suenan a su hora aunque
nadie haya mirado la pantalla. Comprobado en el navegador: al cerrar una serie
con 120 s de descanso, los tonos quedan programados en +120 s y +120,3 s.

De ahí sale todo lo demás del módulo:

- **`cancelRestChime` en la limpieza del efecto.** Un descanso deja de existir de
  tres formas —empezar la siguiente antes de tiempo, deshacer, pausar— y en las
  tres hay que retirar lo programado. Un pitido a destiempo es peor que no
  avisar, porque enseña a desconfiar del aviso. Comprobado: empezar la siguiente
  detiene los dos tonos, pausar también, y **reanudar los reprograma con lo que
  quedaba** —1:35 en pantalla, +95 s en el reloj de audio—.
- **Una cuenta de generación.** Si el contexto está dormido hay que esperar a que
  reanude para programar, y cancelar durante esa espera no cancelaría nada: la
  promesa seguiría su curso. La generación descarta lo que ya no corresponde a
  ningún descanso.
- **El efecto NO depende de `phaseSeconds`.** Cambia cada segundo y reprogramaría
  el aviso en cada tic. Depende del ancla del reloj, que sólo cambia cuando
  cambia el descanso.

**No es una cura completa**, y queda dicho: con la pantalla apagada iOS suspende
el contexto y ahí no suena nada. Eso ya no es un problema de temporizadores sino
de que la página deja de existir, y su solución son las notificaciones del
sistema, que son otro trabajo y otro consentimiento.

Y explica por qué el color y la vibración se quedan en el efecto de antes: las
dos dependen del hilo principal y no hay forma de adelantarlas. **El sonido es la
única de las tres señales que sobrevive a una pestaña en segundo plano**, que es
una razón más para que sea la que se añadió.

**Encendido de fábrica.** Un aviso apagado por defecto no lo descubre nadie, y el
motivo por el que no se ponía deja de aplicar en cuanto hay dónde callarlo. Por
debajo sigue mandando el silenciador del propio teléfono, que el navegador
respeta.

**Y suena al encenderlo**, en Ajustes. Un aviso sonoro que no se puede oír hasta
que termine un descanso de dos minutos es un ajuste a ciegas.

La preferencia es un **almacén externo** —`soundPreference.ts` con
`useSyncExternalStore`— y no un `useState`: la leen dos sitios que no cuelgan uno
del otro —el interruptor y la sesión en vivo—, y escucha el evento `storage`,
que es lo que llega cuando se cambia en otra pestaña. Apagar un pitido molesto
desde una segunda pestaña es exactamente cómo va a ocurrir.

### 24.2 El peso prescrito, que no contradice al RIR

El argumento para no prescribirlo era que el RIR ya dice «elige tú la carga».
Sigue siendo cierto y por eso **conviven**: el RIR prescribe **esfuerzo** y el
peso prescribe **dónde empezar**. Un entrenador escribe «4×8 a 60 kg, RIR 2»
queriendo decir «empieza en 60 y ajusta hasta que te queden dos». Lo que sí sería
contradictorio es tratar el peso como obligatorio, y por eso es **opcional** y se
llama carga de **referencia**.

Existe porque sin él la primera sesión de un ejercicio no tenía respuesta a
«¿cuánto pongo?»: el arrastre de la sesión anterior sólo funciona a partir de la
segunda.

**EL HISTORIAL VA POR DELANTE DE LA PRESCRIPCIÓN.** Es la decisión que importa de
las tres que toma `carriedWeight`:

1. Lo hecho **hoy** en ese ejercicio. Es lo que hay puesto en la barra.
2. La **última sesión**.
3. Lo **prescrito**, si lo hay.

Al revés, una rutina escrita hace tres meses bajaría a alguien de 80 a 60 cada
vez que la abriera, en silencio y sin que nadie hubiera decidido bajarla. Así la
prescripción hace lo que sí sabe hacer: contestar el primer día. Y **se sigue
viendo siempre** —en la línea de la serie y debajo del campo—, que es lo que
permite seguir una descarga deliberada a mano.

La línea de debajo del campo **se calla si coincide con la última vez**: repetir
la misma cifra con dos nombres distintos hace dudar de si son dos datos.

### 24.3 Un defecto que apareció al tocar el borrador: editar borraba el tempo

`PrescribedExerciseDraft` no tenía `tempo` ni `notes`. `toBlockDraft` no los
copiaba y `toPrescribedExercise` no los devolvía, así que **abrir una rutina con
tempo y volver a guardarla lo borraba**, sin decir nada y sin que nada fallara.

Hoy sólo la semilla los produce, y aun así la sesión los lee: pinta el tempo y lo
usa para estimar lo que debería durar una serie. Una edición no puede destruir un
dato que la aplicación sabe leer. Ahora **se conservan**; darles interfaz es otra
decisión y queda escrita como tal.

Salió justo por hacer bien lo otro: al añadir `weightKg` al borrador había que
recorrer los tres sitios donde un campo nuevo tiene que aparecer, y los dos que
faltaban se vieron solos.

### 24.4 La gráfica, sin librería

Dos puntos de §23.8 caían juntos.

**Sin librería de gráficos.** Una línea con diez puntos es una lista de
coordenadas y un `polyline`. Traer una librería para eso sería repetir
exactamente lo que se quitó de Reportes.

**Dibuja el peso MEDIDO, no el 1RM estimado.** La gráfica es lo que más se mira y
lo que menos se cuestiona, así que enseña hechos: la serie más pesada de cada
día. La estimación va al lado, en cifra y con su nombre.

**El eje horizontal son sesiones, no fechas.** Repartir por fecha real dejaría
cuatro sesiones seguidas amontonadas a la izquierda tras un parón de dos meses, y
la pregunta que se le hace a esto —«¿voy subiendo?»— se responde sesión a sesión.
La fecha de cada punto está en la lista de debajo.

**El eje vertical NO arranca en cero**, y es la decisión discutible de una
gráfica de cargas: desde cero, una progresión de 70 a 77,5 kg sería una línea
plana. Aquí la pregunta no es cuánto levanta —esa la contesta la cifra— sino si
sube. A cambio, **la pendiente no es comparable entre dos ejercicios**, y por eso
queda dicho.

**Los puntos son HTML sobre el SVG**, no círculos dentro. El trazo se estira al
ancho del contenedor con `preserveAspectRatio="none"`, que es lo que le permite
ocupar cualquier ancho sin medir nada, pero esa misma deformación convertiría un
círculo en un óvalo. Colocados por porcentaje quedan redondos a cualquier ancho.

Va **dentro del pliegue**: quien abre el detalle ya ha decidido mirar ese
ejercicio de cerca. Y con un solo punto no se pinta: un punto suelto en un
recuadro vacío ocupa sitio sin decir nada.

### 24.5 El 1RM estimado, con su nombre puesto

`estimatedOneRepMax` aplica Epley —peso × (1 + reps/30)— y es la cifra que
permite comparar 60×8 con 70×4.

- **Se calcula al pintar y no se guarda en ningún sitio**, que es la regla de esa
  capa entera. Cambiar de fórmula mañana no obliga a migrar nada, porque el
  historial son las series.
- **Por encima de diez repeticiones no se da.** Ahí las fórmulas se separan
  mucho del resultado real: una serie de veinte mide resistencia, no fuerza
  máxima. Antes que un número malo, ninguno.
- **A una repetición no se estima**: el máximo es lo que se levantó. La fórmula
  daría un 3 % de más, que es el error de aplicar un modelo al único caso que no
  lo necesita.
- **Redondeado al kilo.** Un decimal fingiría una precisión que el modelo no
  tiene.
- Y lleva **debajo, escrito**, que es una estimación y de qué fórmula sale. Es la
  cifra más fácil de confundir con una medición.

### 24.6 El historial simulado ya lleva pesos

`student-1` tenía diez sesiones cerradas y ninguna con series anotadas, así que
la progresión de cargas se veía **vacía al abrirla por primera vez**: la pantalla
existía y la aplicación se enseñaba a sí misma como si nadie hubiera levantado
nunca nada.

Ahora las series se generan **derivadas de `routine-1`** en vez de escritas otra
vez: editar la rutina y dejar el historial hablando de ejercicios que ya no tiene
daría una progresión de algo que nadie entrena. Se generan tantas como diga
`completedSets`, recorriendo la rutina en orden, así que una sesión cerrada a
medias deja anotado lo que dio tiempo a hacer.

Las cargas suben un disco por lado cada tres sesiones. Y **la plancha se guarda
sin peso**: se mide en segundos, y eso distingue «no se levantó nada» de «se
levantaron cero kilos» —y de paso es el caso que la progresión tiene que saber
descartar—.

### 24.7 Lo que sigue faltando

- **El tempo y las notas del ejercicio se conservan pero no se editan.** No hay
  campo en el editor de rutinas; hoy sólo los trae la semilla. Conservarlos era
  obligatorio, darles interfaz es otra decisión.
- **Los pesos van en kilos.** Ofrecer libras es una preferencia que no está
  decidida, y arrastraría al editor, a la sesión y a la progresión.
- **La gráfica no compara ejercicios entre sí.** Cada una escala a su propio
  rango, así que dos pendientes iguales no significan lo mismo. Un eje común
  aplastaría las progresiones pequeñas, que son las más.

---

## 25. Cablear el alta y el inicio de sesión contra Supabase (5 sep 2026)

Rama `feature/supabese-conection`, salida de `develop`.

### 25.1 Tres cosas no encajaban, y ninguna se veía compilando

El código y la base llevaban tiempo describiendo aplicaciones distintas. Lo que
apareció al mirarlas juntas:

**1. El código pedía una tabla que no existe.** `SupabaseTrainerRepository`
consultaba `trainers`; en esta base lo que hay es `profiles`, uno a uno con
`auth.users`. Cada carga del panel pedía `/rest/v1/trainers` y recibía un 404.
Estaba anotado en el traspaso como «esperado», y lo era mientras la base estuvo
vacía; dejó de serlo cuando `profiles` se creó y nadie apuntó el código hacia
ella.

**2. El alta no mandaba nada de quién se registraba.** `signUp` viajaba sin
`user_metadata`, con este motivo escrito al lado: «el rol NO se guarda ahí, que
lo puede editar el propio cliente». El motivo es bueno. El efecto no: el
disparador `handle_new_user` lee justamente de ahí el nombre y los apellidos, así
que toda cuenta nacía con el perfil en blanco.

**3. El registro daba por identificado a quien no lo estaba.** Llamaba a
`setUser` y navegaba al panel en cuanto la cuenta existía. **La confirmación por
correo está activada en este proyecto** —comprobado contra el endpoint de alta:
la respuesta trae `confirmation_sent_at` y ningún `access_token`—, así que la
cuenta se crea y la sesión no. La aplicación parecía tener a alguien dentro y a
la primera recarga `getCurrentUser` devolvía null y le echaba sin explicar nada.

### 25.2 La confirmación por correo decide el diseño, no la preferencia

Sin sesión después del alta no hay `auth.uid()`, y sin `auth.uid()` las
políticas de fila rechazan cualquier escritura. Dicho de otro modo: **después
del alta ya no hay ningún momento en que el cliente pueda escribir quién es.**

De ahí sale todo lo demás, y conviene leerlo como una consecuencia y no como una
elección de gusto:

- **`SignUpCredentials` lleva el perfil.** Revierte la decisión anterior —«sólo
  la cuenta»—. No cabía otra: o viaja con la cuenta, o no llega nunca.
- **El puerto sigue sin conocer a los dos perfiles del dominio.** Recibe UNA
  forma, `SignUpProfile`, con la intención declarada dentro. Quién decide qué
  significa esa intención está del otro lado.
- **La cuenta y su ficha nacen juntas**, en la misma transacción, dentro del
  disparador. Como efecto secundario desaparece el hueco que el propio registro
  tenía anotado con un `TODO`: si la cuenta se creaba y la ficha fallaba,
  quedaba una cuenta sin ficha y el siguiente intento chocaba con «ya existe ese
  correo».
- **`TrainerRepository.create` desaparece del puerto.** Nadie puede llamarlo: no
  hay sesión con la que hacerlo. Se queda como método concreto de
  `FakeTrainerRepository`, porque la raíz de composición lo usa para que la
  simulación haga lo mismo que el disparador.

### 25.3 «La ficha del entrenador» es la fila de `profiles`

`SupabaseTrainerRepository` va ahora contra `profiles`, y de ahí salen dos
detalles que quedan escritos en los mappers:

- **`Trainer.id` y `Trainer.profileId` son el mismo valor**, porque la clave de
  `profiles` ES el identificador de la cuenta. La entidad conserva los dos
  campos: el dominio distingue la ficha de la cuenta y puede volver a
  distinguirlas; que hoy coincidan es un detalle de este esquema y muere en el
  mapper.
- **Un alumno tiene perfil y no tiene ficha de entrenador.** `findByProfileId`
  devuelve `null` cuando el rol no entrena. Importa más de lo que parece:
  `HomeRedirect` manda a fundar un equipo a quien tiene ficha y no pertenece a
  ninguno, así que devolver la fila de cualquiera pondría a los alumnos recién
  registrados a montar un equipo que no han pedido.

`verified`, `averageRating` y `totalReviews` no tienen columna y se responden
con lo que es cierto: nadie está verificado y no hay reseñas, porque no existe
todavía un sistema de reseñas que las produzca.

### 25.4 El esquema pasa a vivir en el repositorio

`supabase/migrations/` no existía: las dos migraciones aplicadas estaban sólo en
la nube, así que el esquema no se podía revisar en un PR ni reproducir en otro
proyecto. La nueva va como fichero,
`20260905090000_perfil_editable_y_rol_declarado.sql`, y hace dos cosas:

- **Añade `photo_url` y `bio`** a `profiles`, con permiso de actualización por
  columna. Configuración ya guardaba foto y biografía contra `updateProfile` y
  no había dónde escribirlas.
- **El rol se declara al registrarse.** Antes toda cuenta nacía `trainer`, así
  que quien decía «sólo entreno» quedaba marcado como entrenador y aterrizaba en
  la pantalla de gestión de otra persona. Ahora sale de la intención declarada.

**Que la intención venga del cliente no la hace insegura**, y conviene dejarlo
dicho porque parece lo contrario: ni `trainer` ni `student` autorizan nada por sí
mismos —lo que se puede hacer en un equipo sale del puesto que se tenga en él— y
`admin` lo decide el disparador contra `platform_admin_emails`, sin mirar los
metadatos. Un cliente modificado puede mentir sobre a qué viene, no sobre lo que
puede.

El permiso de escritura de `authenticated` sobre `profiles` **va por columna** —
lo dejó así la migración anterior— y `role` no está en la lista. Eso es lo que
impide que alguien se ascienda a administrador con un `update` sobre su propia
fila. La columna nueva se añade a esa lista; `role` sigue fuera.

### 25.5 Lo comprobado, y contra qué

Con `VITE_USE_FAKE_AUTH` apagado, contra el proyecto real:

- **El alta de entrenador llega a Supabase.** La fila aparece en `profiles` con
  el nombre, los apellidos y la especialidad que se escribieron en el
  formulario —«Pérdida de peso»—, puestos por el disparador desde los metadatos.
- **Y no deja entrar a nadie.** La pantalla dice «Revisa tu correo», con la
  dirección a la vista, en vez de navegar al panel con una sesión que no existe.
- **Las credenciales llegan de verdad al proveedor.** Intentar entrar con una
  cuenta sin confirmar devuelve «Por favor confirma tu email», que es el texto
  del traductor de errores del adaptador y no el original en inglés: prueba a la
  vez que la llamada sale y que la frontera traduce lo que vuelve.
- **Y el límite de envíos también se traduce.** Al gastar las altas de prueba,
  Supabase empezó a devolver 429 y la pantalla dijo «Demasiados intentos,
  intenta más tarde». No estaba buscado, y es la comprobación del tercer camino
  de `mapAuthError`.
- **El aviso de confirmar cumple las reglas de 375 px**: sin desbordamiento, sin
  contenedores por debajo de 280 px y sin controles bajo 44. Comprobado
  interceptando la llamada de alta —el límite de envíos impedía crear otra
  cuenta— con la respuesta que da el proveedor de verdad: el usuario creado y
  ninguna sesión.

### 25.6 La migración, aplicada y comprobada

Se aplicó al proyecto. Comprobado después:

- `photo_url` y `bio` existen, y `authenticated` puede escribirlas.
- El permiso de actualización de `authenticated` cubre siete columnas y **`role`
  no está entre ellas**: nadie se asciende a administrador con un `update` sobre
  su propia fila.
- La decisión de rol da lo que debe en los cuatro casos, incluido el que
  importa: un cliente que declara `intent: "admin"` sale **`student`**. La
  intención sólo distingue entrenador de alumno; `admin` se decide contra
  `platform_admin_emails` y nada más.

Las cuentas de prueba se borraron: el proyecto queda con cero usuarios y cero
perfiles.

### 25.7 Lo que NO queda comprobado, y por qué

- **El inicio de sesión completo de una cuenta ya confirmada.** Hace falta abrir
  el enlace del correo, que no llega a esta sesión.
- **El alta de alumno de punta a punta.** La lógica del rol está comprobada
  sobre la base, pero no el recorrido entero por la pantalla: Supabase limita los
  envíos de correo por hora y se agotaron verificando el resto. Es cuestión de
  esperar y repetir el alta eligiendo «Entreno».

### 25.8 Lo que sigue siendo simulado, y por qué importa saberlo

Sólo la autenticación y la ficha de perfil hablan con Supabase. Equipos,
alumnos, rutinas, sesiones, planes y suscripciones siguen en memoria, y sus
datos de semilla están atados a los identificadores que inventa
`FakeAuthAdapter` a partir del correo.

**Consecuencia práctica: con la autenticación real activada, la aplicación se ve
vacía después de entrar.** No es un fallo del cableado: es que el resto de los
repositorios no conocen a un usuario de verdad. Por eso `.env` conserva
`VITE_USE_FAKE_AUTH=true` —quitarlo deja la aplicación sin datos y tumba las 180
pruebas, que se identifican contra el adaptador simulado— y por eso los dos
adaptadores falsos se siguen eligiendo con la misma condición.

El camino es repositorio a repositorio, y el orden natural lo marca quién ata a
quién: equipos y puestos antes que alumnos, y alumnos antes que sesiones.

### 25.9 Deuda que aparece de paso

- **Los mensajes de error no están traducidos.** `errorMapper` devuelve castellano
  a fuego —«Email o contraseña incorrectos»— y `AppError.message` va directo a la
  pantalla. Con la aplicación en tres idiomas, quien la usa en inglés recibe el
  error en castellano. Arreglarlo es que `AppError` lleve una clave en vez de un
  mensaje, y eso toca todos los adaptadores.
- **No se puede reenviar el correo de confirmación.** Si no llega, no hay salida
  desde la aplicación. Exige una operación nueva en `AuthPort`.
- **Las dos primeras migraciones siguen sólo en la nube.** Se recuperan con
  `supabase db pull` y deberían acabar en `supabase/migrations/` con la tercera.

### 25.10 Auditoria del alta y el acceso, antes de abrir el PR

La pregunta era «¿esta cableado con todo lo necesario?». La respuesta corta es
que no, y salieron cuatro cosas. Una estaba causada por este mismo cambio y va
arreglada; las otras tres necesitan una decision o una llave que no esta aqui.

**1. El enlace de confirmacion no tenia donde aterrizar. ARREGLADO.**
`emailRedirectTo` devuelve a `/authentication`, y `supabase-js` recoge la sesion
de la URL al cargar. Sin nada mas, el recien confirmado se quedaba mirando el
formulario de acceso, dentro de la aplicacion y sin saberlo. `GuestRoute` llevaba
escrito y sin cablear desde hace tiempo -estaba en la deuda-; ahora cuelga de la
ruta con `withGuestRoute`, gemelo de `withProtectedRoute`.

Y manda A LA RAIZ, no a `/dashboard` como decia. En la raiz decide
`HomeRedirect` segun el papel; a `/dashboard` un alumno aterrizaba en la
pantalla de gestion de otra persona, que es el defecto que `HomeRedirect` existe
para evitar.

**2. El acceso con Google echa al usuario de la aplicacion.** El proveedor NO
esta habilitado en el proyecto -comprobado: `/auth/v1/settings` devuelve
`external: ['email']`-, asi que pulsar «Continuar con Google» lleva el navegador
a `/auth/v1/authorize?provider=google`, que responde:

```json
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

El usuario sale de la aplicacion y aterriza en un JSON. No es un error que se
pueda traducir desde el cliente porque no vuelve al cliente: la navegacion ya ha
ocurrido. Habilitarlo exige credenciales de un cliente OAuth de Google, que no
estan aqui; esconder el boton exige decidir si se esconde siempre o segun lo que
diga `/auth/v1/settings`.

**3. La lista blanca de redirecciones no se puede ver desde aqui.** Supabase solo
respeta el `emailRedirectTo` si la direccion esta en Authentication → URL
Configuration; si no, ignora el parametro y usa la Site URL. Ese ajuste no lo
expone ninguna API publica ni la herramienta de migraciones, asi que **hay que
mirarlo en el panel**: el origen de desarrollo -`http://localhost:5178/**`- y el
de produccion tienen que estar en la lista, o el correo de confirmacion devuelve
a otro sitio y el alta no se termina nunca.

**4. Con la confirmacion activada, tres pasos del alta ya no ocurren.** Y es la
consecuencia mas importante, porque no se ve leyendo la pantalla:

```
if (session === null) { setAwaitingConfirmation(true); return }
```

Detras de ese `return` se quedan `claimByEmail` -enlazar la ficha que un
entrenador ya habia creado con ese correo-, `joinWithCode` -el codigo de equipo
que se escribe en el propio formulario- y `readIntendedPath` -volver a donde se
queria ir, que es como regresa quien llega por el QR-.

Antes corrian siempre porque el codigo daba por abierta una sesion que no lo
estaba. Ahora no corren nunca contra el proveedor real. **Su sitio ya no es el
alta: es el PRIMER ACCESO**, que es el primer momento en que hay sesion. El
codigo de equipo, ademas, tiene que sobrevivir al viaje por el correo, asi que
habria que guardarlo y consumirlo al entrar.

No se ha movido todavia a proposito: los alumnos siguen siendo un repositorio
simulado, y mover codigo falso de sitio es adivinar. Va con la migracion de
alumnos, y lo natural es que acabe en el servidor -enlazar por correo es
exactamente lo que sabe hacer un disparador-.

**Lo que si esta completo del acceso:** correo y contraseña, la sesion que
sobrevive a la recarga, cerrar sesion, las rutas protegidas y ahora la guardia de
invitado. **Lo que no:** Google, recuperar la contraseña -el boton esta
deshabilitado con su `TODO`, que al menos no miente- y reenviar el correo de
confirmacion.

### 25.11 El boton de Google, apagado

Queda DESHABILITADO mientras el proveedor no exista en el proyecto. No es
prudencia: comprobado, pulsarlo llevaba el navegador a
`/auth/v1/authorize?provider=google`, que responde 400 con «Unsupported
provider: provider is not enabled», y el usuario SALIA de la aplicacion para
aterrizar en un JSON. Eso no se puede traducir ni recuperar desde el cliente,
porque para cuando ocurre la navegacion ya ha pasado.

Un boton apagado es peor experiencia que uno que funciona, y muchisimo mejor que
uno que expulsa. Queda como el de recuperar contraseña, que lleva apagado desde
antes por el mismo criterio: no ofrecer lo que no se puede cumplir.

El manejador se queda puesto a proposito. Encenderlo el dia que el proveedor
exista es quitar un `disabled`: hay que dar de alta un cliente OAuth de Google y
pegar sus credenciales en Authentication → Providers.

### 25.12 Que falta para produccion

El acceso por correo y contraseña funciona contra el proyecto real, pero **la
autenticacion no esta lista para produccion**, y lo que falta no es sobre todo
codigo de esta capa:

1. **El correo transaccional.** El emisor que trae Supabase esta limitado por
   horas y no esta pensado para produccion —medido aqui: al tercer alta seguida
   empezo a devolver «Demasiados intentos»—. Sin un SMTP propio configurado, en
   produccion la gente no recibe el correo de confirmacion.
2. **La lista blanca de redirecciones** tiene que incluir el dominio de
   produccion. Si no, el enlace del correo devuelve a la Site URL y el alta no se
   termina. Solo se ve y se cambia en el panel.
3. **No se puede recuperar la contraseña.** Perderla es perder la cuenta. Exige
   `resetPasswordForEmail` en `AuthPort` y una pantalla para la vuelta.
4. **No se puede reenviar la confirmacion.** Si el correo no llega, no hay salida
   desde la aplicacion.
5. **El alta ya no enlaza fichas ni codigos** —ver §25.10 punto 4—, asi que el
   camino «un entrenador invita por correo» y el del QR estan rotos de punta a
   punta contra el proveedor real.
6. **Los mensajes de error solo estan en castellano**, con la aplicacion en tres
   idiomas.
7. **Nunca se ha visto entrar a una cuenta confirmada.** Falta abrir el enlace de
   un correo de verdad y comprobar que la sesion se abre y el perfil se lee.

Y por encima de todo lo anterior: **detras del acceso no hay aplicacion.** Todo
lo que no sea la cuenta y el perfil sigue en memoria, atado a los identificadores
que inventa el adaptador simulado, asi que quien entre con una cuenta real
encuentra la aplicacion vacia. Preguntarse si la autenticacion esta lista para
produccion es prematuro mientras equipos y alumnos no lo esten.

## 26. El cableado completo: fases 0 a 5 del plan (8 sep 2026)

Rama `feature/supabase-connection`. Ejecuta [`PLAN-CABLEADO.md`](PLAN-CABLEADO.md)
de la fase 0 a la 5 sin pausas. Lo que aquí se cuenta es lo que el plan no
podía saber: lo que cambió al escribirlo, y por qué.

### 26.1 Lo que se puede ejecutar ahora

- `supabase start` levanta la base en local desde `supabase/config.toml`, con
  las siete migraciones y `supabase/seed.sql`. `supabase db reset` la deja como
  nueva. Las claves salen de `supabase status -o env`, no de `.env`: el `.env`
  sigue apuntando a la nube y las pruebas no lo tocan.
- `npm run test:contract` corre las pruebas de contrato con Vitest contra esa
  base local. Son SEIS ficheros en `tests/contract/`: perfiles, equipos,
  alumnos, entrenamiento, sesiones y muro. Cada uno ejercita políticas,
  disparadores y funciones con TRES clientes —anónimo, servicio y una sesión
  real— y borra sus cuentas al terminar.
- `npm run test:e2e` es la suite de Playwright de siempre, contra los
  adaptadores simulados. Siguen existiendo A PROPÓSITO: es la única forma de
  probar pantallas sin una base detrás, y la CI la ejecuta en un job aparte.
- La CI tiene tres trabajos: lint y build, interfaz, y contratos. El de
  contratos levanta Supabase con `supabase/setup-cli` y aplica las migraciones.

### 26.2 Fase 0: los errores viajan como claves

`AppError` ya no lleva un mensaje: lleva un `reason` de un tipo cerrado,
`AppErrorReason`, con veintiuna razones. `describeError(error, t, fallback)` en
`shared/i18n/errorMessages.ts` lo convierte en texto en el idioma de la
persona; `ERROR_REASON_KEY` es la tabla de razón a clave, y las tres
traducciones llevan las veintiuna claves `error.*`. Veintiún hooks pasaron por
ahí.

Lo que el servidor rechaza también viaja así: una función o un disparador hace
`raise exception 'lastAdmin'`, y `mapDataError` reconoce el mensaje en
`SERVER_REASONS` antes de mirar el código SQL. Es la forma de que «no puedes
dejar al equipo sin administrador» se lea igual venga del navegador o de
Postgres, y de que añadir una regla en el servidor no exija tocar el cliente
más que en la tabla y en los diccionarios.

Las dos primeras migraciones, que sólo vivían en la nube, se RECONSTRUYERON a
partir del esquema vivo —`supabase db pull` exige `supabase login` y esta
máquina no lo tiene— y viven en `supabase/migrations/` con su fecha original.
Aplicarlas en local produce la misma base que la de la nube, y es lo que
comprueban las pruebas de contrato.

### 26.3 Fase 1: equipos y puestos

`crews` y `crew_staff`, con las capacidades del puesto en `role_capabilities` y
las extra en la fila. `create_crew` es una función: crea el equipo y sienta al
creador como administrador en la misma transacción, porque una política no
puede permitir «insertar en un equipo del que todavía no eres nadie».

`is_crew_member`, `has_capability`, `is_crew_staff` e `is_platform_admin` son
las cuatro funciones `security definer` que sustituyen a `can`,
`lastAdminBlocker` y `canEnrollMembers` como barrera. El cliente las sigue
teniendo, para no ofrecer lo que va a fallar; la que decide es la base. El
último administrador no se degrada ni se borra: lo corta un disparador con
`lastAdmin`, la misma razón que el cliente ya conocía.

`CrewStaff` deja de copiar nombre y correo: los trae por la relación con
`profiles` —`STAFF_COLUMNS` en el adaptador— y el mapper los aplana. Era la
excepción anotada en la deuda; se cerró cuando existió el perfil.

### 26.4 Fase 2: alumnos, pertenencia, cuotas y avisos

`students` es la ficha, y `profile_id` nulo significa «sin cuenta todavía».
El ENLACE ocurre en el servidor y en dos momentos:

- Al registrarse, `handle_new_user` —el disparador del alta— busca fichas con
  ese correo, sin distinguir mayúsculas, y las enlaza. Si el alta trae
  `join_code` en los metadatos, `claim_membership_as` lo aplica ahí mismo. Por
  eso `SignUpProfile.joinCode` existe y `toSignUpMetadata` lo manda: el código
  del QR sobrevive al viaje por el correo porque va DENTRO de la cuenta.
- Al entrar ya con cuenta, `claim_membership` hace lo mismo con el código que
  se teclea. Es la ruta del QR para quien ya tiene sesión.

Un disparador limita lo que un alumno puede escribir en su propia ficha:
nombre y foto. Nivel, estado de pertenencia y capacidades son del entrenador, y
cambiarlos devuelve `forbidden`. Cuotas y avisos son tablas planas con sus
políticas; la plataforma —`platform_admins`— es una tabla que sólo escribe el
rol de servicio, ya no una constante.

### 26.5 Fase 3: entrenamiento

Dos puertos que no existían, `CatalogRepository` y `BlockLibraryRepository`,
porque el catálogo vivía en un fichero de datos y la biblioteca de bloques en
un almacén de `zustand`, y ninguno de los dos podía tener adaptador real.
`catalog.mock.ts`, `catalogStore.ts` y `blockLibraryStore.ts` desaparecen; los
tipos siguen exportándose desde `trainings/types` para que las importaciones
antiguas no se enteren.

`crew_id` NULO ES EL CATÁLOGO DE SISTEMA. Grupos musculares, patrones, material,
objetivos y divisiones que trae la semilla no tienen equipo, y por eso no se
pueden editar; el material que da de alta un entrenador lleva su `crew_id` y
sólo lo ve su equipo. Una sola tabla por catálogo, sin duplicar el esquema.

Rutinas y planes guardan su documento en JSONB —`blocks` y `weeks`—, con la
misma forma que la entidad. La forma la comprueba la base: `is_valid_blocks`,
`is_valid_weeks` e `is_valid_block` son restricciones CHECK, y una rutina con
series a cero o un método desconocido devuelve `23514` antes de guardarse.
Borrar una rutina asignada lo impide la clave foránea, que es exactamente lo que
`deletion.ts` calculaba en el cliente.

### 26.6 Fase 4: agenda y sesión

`sessions` guarda fecha y hora como `date` y `time`, no como `timestamptz`:
«el martes a las nueve» no cambia de día porque alguien viaje. El resultado es
un documento validado por `is_valid_session_result`, y `complete_session` cierra
estado y resultado en UNA escritura, porque entre las dos que hacía el cliente
cabía una sesión completada sin resultado.

Un alumno ve las suyas y las grupales de su equipo —la política es
`crewScope.asStudent()` escrito en SQL— y sólo puede CERRAR la suya: mover la
fecha o cambiar el título lo corta `guard_session_update` con `forbidden`.
`create_sessions` vuelca un plan en bloque y cada sesión guarda
`assignment_id`: es lo que faltaba para poder mover o cancelar un volcado
entero, y lo que hace que volcar dos veces se pueda detectar.

### 26.7 Fase 5: progreso, ranking y muro

El progreso NO tiene tabla: experiencia, nivel y racha se siguen derivando de
las sesiones en el cliente. Lo único que sube al servidor es el ranking, y sube
por RLS, no por rendimiento: necesita las sesiones de todos y un alumno no puede
leer las de los demás. `crew_ranking(crew, period)` es `security definer`,
comprueba la pertenencia, respeta `ranking_enabled` y repite la fórmula de
`experience.ts` —veinte por sesión, una por serie—. Es la segunda y última
duplicación que el plan acepta, y su prueba de contrato comprueba que las dos
dan lo mismo.

`CrewPost.likedBy` desaparece: hay `crew_post_likes` como tabla, y
`crew_posts_view` —con `security_invoker`— devuelve `likeCount` y `likedByMe`
calculados para quien pregunta. `toggle_post_like` da o quita en una llamada,
sin que el cliente tenga que saber si ya lo había dado. `crew_wall_reads`
guarda cuándo miró cada uno el muro por última vez: es la marca para el contador
de no leídos que la deuda pedía, aunque el contador todavía no se pinta.

### 26.8 La raíz de composición

`container.ts` elige TODOS los repositorios con la misma condición que ya
elegía la autenticación: `import.meta.env.DEV && VITE_USE_FAKE_AUTH === 'true'`.
No hay medias tintas —medio simulado, medio real— porque las semillas falsas
cuelgan de identificadores inventados y una mezcla se ve vacía. `.env` conserva
`VITE_USE_FAKE_AUTH=true` mientras la suite de interfaz dependa de las semillas;
quitarlo es la forma de ver la aplicación contra la base.

### 26.9 Fase 6: la cuenta completa

`AuthPort` gana cuatro operaciones y ninguna conoce al proveedor:
`requestPasswordReset`, `updatePassword`, `resendConfirmation` y
`deleteAccount`.

**Recuperar la contraseña** es un desvío DENTRO de la pestaña de acceso —un
paso y se vuelve— y el correo lleva a `/authentication/nueva-contrasena`, que
no es ruta de invitado ni protegida, y no por descuido: el enlace llega CON
sesión, así que la guardia de invitado la echaría a la raíz antes de poder
cambiar nada; y quien llega con el enlace caducado no tiene sesión y merece
saber por qué. El formulario de la nueva contraseña es el MISMO que el de
Configuración —`PasswordFields`, sobre `useUpdatePassword`—; lo único que
cambia es a dónde se va después.

**Reenviar la confirmación** se permite UNA vez por pantalla: el proveedor
limita los envíos por hora y el segundo reenvío seguido sólo gasta el cupo.

**Darse de baja** es `delete_account()`, en el servidor, porque `auth.users`
no se toca desde la API y porque hay que decidir qué pasa con lo que la
persona deja: un equipo donde es la única con cuenta se va con ella; uno donde
gobierna a otros la retiene con `lastAdmin` hasta que nombre a alguien; en los
demás su puesto y su ficha caen en cascada. `crews.created_by` pasa a otro
administrador, y `guard_last_admin` deja pasar la cascada de un equipo que se
borra entero. El cliente cierra sólo la sesión LOCAL después: la cuenta ya no
existe y pedirle al servidor que la cierre devolvería un error.

Lo que la fase 6 deja PENDIENTE, a propósito: las fotos siguen siendo
direcciones tecleadas —Storage es la primera vez que la aplicación guardaría
ficheros y es una decisión—, el onboarding sigue siendo «visto en este
dispositivo», y Google sigue apagado.

### 26.10 Fase 7: lo que ya se puede hacer sin decidir nada

`audit_log`, escrito por `record_audit` —un disparador genérico— en equipos,
puestos, fichas y cuotas. Quién, qué, cuándo, y la fila antes y después. Lo lee
quien tiene `crew.settings`; nadie lo escribe desde un cliente. No tiene
pantalla todavía.

Lo demás de la fase 7 no es código de este repositorio: dos proyectos de
Supabase, SMTP propio, la lista blanca de redirecciones con
`/authentication/nueva-contrasena`, las copias de seguridad, y aplicar las seis
migraciones nuevas en la nube con copia previa.

## 27. Lo que faltaba del plan, hecho (9 sep 2026)

Rama `feature/supabase-connection`. Cierra los huecos de §10 del plan, el
tiempo real de §1.3, lo que quedaba de la fase 6 y la parte de la fase 7 que
es código. Lo que sigue fuera está al final, y es corto.

### 27.1 Controles que no hacían nada

- **Los filtros filtran**, en alumnos y en rutinas: texto sin tildes ni
  mayúsculas —`normalizeForSearch`— y nivel. EN MEMORIA y no en el puerto: son
  decenas de fichas ya cargadas, y buscar por nombre es escribir y ver. El
  botón «Filtros» se sustituyó por el único filtro que existe, el nivel: un
  botón que abre un panel para elegir una cosa es un paso de más.
- **Tempo e indicaciones** de un ejercicio tienen campo en el editor y se
  leen en la ficha de la rutina. Se conservaban sin poder escribirse.
- **La ficha de una sesión guarda estado y notas** con un solo botón, y
  «Editar» abre el formulario del alta con la sesión puesta. Es el mismo
  formulario porque es la misma decisión, y con `editing` cambia sólo lo que
  pasa al enviar: `update` en vez de `create`, conservando estado y
  resultado. Mover una sesión era el motivo de materializar las de un plan.
- **«Vista previa»** se quitó del menú de rutina: la ficha ya lo es.
- **El muro cuenta lo no leído** sobre la insignia del equipo, que es su
  entrada. `countUnread` y `markAllRead` en el puerto; detrás,
  `crew_wall_reads`. Abrir el muro lo da por leído una vez por visita, al
  montar, y no en cada recarga de la lista: un anuncio que llegue mientras se
  mira no puede quedar leído sin haberse visto.

### 27.2 Lo que un volcado deja, y lo que se hace con ello

`Session.assignmentId` existía en la base y no en la entidad: el volcado
creaba las sesiones una a una con `create` y ninguna sabía de dónde salía.
Ahora `createMany` manda el lote a `create_sessions` —todas o ninguna— y cada
sesión guarda su asignación. Con eso:

- **Volcar dos veces avisa**: el diálogo cuenta las que ya salieron de esa
  asignación y el botón dice «Volcar otra vez». No lo impide, porque un ciclo
  nuevo del mismo plan es legítimo; lo que no puede ser es que duplique en
  silencio.
- **Mover una semana y cancelar las pendientes**, en bloque, desde la lista de
  asignaciones. `shift_sessions` es una función porque sumar días a una fecha
  es aritmética de Postgres; cancelar es un `update` con filtro. Sólo lo que
  está por ocurrir: una completada ya ocurrió y una cancelada ya se decidió.
  Cancelar pide una segunda pulsación en el sitio, no un diálogo: es
  reversible.

### 27.3 Tiempo real, en el orden del plan

`notices`, `crew_posts`, `crew_post_likes` y `sessions` entran en la
publicación de `supabase_realtime`, y los tres adaptadores se suscriben con
`subscribeToTable`, uno por tabla y acotado por crew. RLS decide qué filas
llegan por el canal: un alumno no recibe las sesiones de sus compañeros
aunque escuche la tabla entera. El aviso no lleva la fila —el contrato del
puerto es «algo cambió»— y quien escucha vuelve a leer por el camino de
siempre. El muro combina los oyentes locales con el canal: lo que escribe este
cliente se ve al instante, lo que escriben otros llega por tiempo real.

### 27.4 Fase 6, lo que quedaba

- **Onboarding por cuenta**: `profiles.onboarded_at` detrás de un puerto
  propio, `OnboardingRepository`. Propio y pequeño porque es un dato de la
  CUENTA —lo vio esta persona, en el dispositivo que fuera— y no de la ficha
  de entrenador ni de la de alumno. La guardia del layout espera la respuesta:
  con `null` no manda a nadie a ningún sitio, porque decidir «no lo vio» antes
  de saberlo devolvía al recorrido a quien ya lo terminó. La simulación sigue
  usando la clave del dispositivo, que es lo que la suite de interfaz escribe.
- **Fotos por Storage**: `PhotoStorage`, el primer puerto que guarda
  ficheros. Recibe el fichero y devuelve la dirección con la que `photoUrl` ya
  trabajaba; ni cubos ni rutas cruzan el puerto. Cubo `photos`, público en
  lectura, y cada cuenta escribe sólo en su carpeta —la política compara el
  primer tramo de la ruta con `auth.uid()`—. En Configuración, «Subir foto»
  rellena el campo de la dirección y guardar sigue siendo el botón de abajo.
- **Google, si se enciende**: el disparador del alta lee `full_name` y
  `avatar_url` además de nombre y apellidos separados, y `profiles` gana
  `photo_url`. El botón sigue apagado hasta que exista el cliente OAuth.

### 27.5 Fase 7, lo que es código

- **El token no se adivina a fuerza bruta**: `find_crew_by_join_token` anota
  cada consulta por cuenta en `join_token_lookups` y a la vigésima en una hora
  responde `tooManyAttempts`. Por cuenta y no por IP, porque Postgres no ve la
  IP y la función ya no respondía sin sesión.
- **Un fallo real de camino**: crear un equipo escribía el puesto del fundador
  como segunda operación desde el hook, y `create_crew` ya lo sienta en la
  misma transacción. Contra Supabase, la segunda escritura duplicaba el alta y
  fallaba. `create` sienta al fundador en los dos adaptadores y el hook ya no
  escribe nada después.

### 27.6 La suite de interfaz, en su propio servidor

Levanta el 5179 con `VITE_USE_FAKE_AUTH=true` por variable de entorno. Antes
reutilizaba el 5178 y heredaba el `.env` de quien trabaja: con ese servidor
contra Supabase, las ciento ochenta pruebas fallaban en el login por un motivo
que no era el suyo.

### 27.7 Lo que sigue fuera, y por qué

Decisiones de producto que el plan dejó fuera y que nadie ha tomado: eventos
del equipo, importes en las cuotas, libras, asistencia a sesiones grupales. Y
lo que no es código de este repositorio: SMTP, dos proyectos, copias de
seguridad, el cliente OAuth de Google, la lista blanca de redirecciones, los
iconos de la PWA y un capturador de errores del cliente. El GPS de la sesión
en vivo de cardio sigue simulado: es la otra pantalla que el plan no cableó
porque no hay dato que guardar hasta que exista el recorrido real.

---

## 28. Tiempo real: la mitad que faltaba (9 sep 2026)

Rama `fix/deploy-01`. La petición fue directa: «cada que se cree algo o haya un
cambio de estado el sistema lo escuche y se actualice, sin la recarga de toda la
página».

### 28.1 El diagnóstico: la aplicación ya escuchaba

Lo primero que apareció al medir es que **el trabajo de aplicación estaba
hecho**. Treinta hooks con treinta y siete puntos de suscripción —`useStudents`,
`useCalendar`, `useCrewWall`, `usePlatformUsers`, la campana de avisos, todos—
llamando a `container.<lo que sea>.onChange(...)` y dándose de baja al
desmontar. La arquitectura estaba entera.

Lo que faltaba era la otra mitad, y en dos capas a la vez:

- **En la base**, sólo cuatro tablas estaban en la publicación
  `supabase_realtime`. Una tabla sin publicar no emite nada.
- **En los adaptadores**, trece de dieciséis devolvían `() => undefined` bajo un
  `TODO`.

### 28.2 Por qué no lo detectó nada

Es el punto que merece quedar escrito, porque la misma forma de fallo puede
repetirse con cualquier otro puerto.

**No avisar es una implementación sintácticamente válida del contrato.** El
puerto promete «avísame si cambia»; un adaptador que no avisa nunca cumple la
firma, compila y pasa el lint. La suite de interfaz tampoco lo veía: corre
contra los adaptadores simulados, donde el aviso es una llamada en memoria que
funciona perfectamente. Y las pruebas de contrato de entonces ejercitaban
lecturas y políticas, no canales.

Resultado: un defecto que sólo se manifestaba abriendo la aplicación y pulsando
F5. El caso que lo destapó fue el más básico —un entrenador crea su equipo y su
propia barra lateral sigue diciendo «Sin equipo»—: `useViewer` llevaba desde
siempre suscrito a `crews`, `crew_staff`, `students` y `profiles`, y ninguna de
las cuatro estaba publicada.

### 28.3 Fuera el filtro por equipo

El canal filtraba con `filter: crew_id=eq.<crew activo>`. Se ha quitado, y no
por simplificar: filtraba mal de tres maneras independientes.

1. **Se tragaba los borrados.** El registro de un DELETE llevaba sólo la clave
   primaria, así que no había `crew_id` que comparar y el evento se descartaba
   en silencio.
2. **Se quedaba viejo.** El ámbito se leía UNA VEZ, al suscribirse, y los hooks
   montan su efecto con dependencias vacías. Cambiar de equipo en el conmutador
   dejaba el canal escuchando al anterior.
3. **No sabía expresar lo que más falta.** El aviso que `useViewer` necesita es
   el de un equipo en el que TODAVÍA NO SE ESTÁ: el recién fundado, o aquel cuya
   solicitud acaban de aceptar. Un filtro por el equipo activo es justo el que no
   puede verlo, y sin equipo activo la función ni siquiera se suscribía.

Lo que ocupa su lugar ya estaba y es más fuerte: **RLS decide quién recibe cada
fila**, evaluada por suscriptor, y **el ámbito lo aplica la relectura**, que lee
el crew activo en ese momento. Un aviso de otro equipo propio cuesta una consulta
de más; el filtro costaba pantallas que no se actualizaban.

### 28.4 `replica identity full`, que corrige una fuga

Las cuatro tablas ya publicadas tenían la identidad por defecto, y de ahí salían
dos consecuencias:

- **De corrección:** el filtro por columna descartaba los DELETE, como arriba.
- **De privacidad:** Realtime no puede evaluar RLS sobre una fila que sólo lleva
  su identificador, así que **el evento de borrado se reparte a todos los
  suscriptores de la tabla**. Se filtraba el identificador de una fila que el
  receptor no tenía derecho a leer.

Con la fila vieja entera, RLS se evalúa igual que en un alta. El coste es más
volumen en el registro de escritura, irrelevante a esta escala frente a las dos
cosas que corrige.

### 28.5 Qué se publica y qué no

Quince tablas. Las de **pertenencia e identidad** —`crews`, `crew_staff`,
`students`, `profiles`—, de las que sale quién eres y dónde estás, y las de
**datos del equipo** —`assignments`, `plans`, `routines`, `exercises`,
`equipment`, `saved_blocks`, `student_subscriptions`, más las cuatro que ya
estaban—.

Se cae el argumento con el que la migración anterior las dejó fuera —«los edita
una persona y los lee ella misma»—: describe al autor, no al público. Una rutina
la escribe el entrenador y la esperan sus alumnos; una cuota la marca quien lleva
las altas mientras el alumno mira su ficha.

Fuera quedan, y está escrito en la migración para que no se confunda con un
olvido: la auditoría —es registro, no pantalla—, las marcas de lectura del muro
—el aviso llegaría a quien acaba de provocarlo—, la contabilidad del límite de
tokens, la lista de administradores, las capacidades por rol, y el catálogo de
sistema —grupos, patrones, objetivos, divisiones—, que se siembra y no cambia en
caliente.

`CrewProgressRepository` sigue sin canal, pero ahora por una razón y no por un
pendiente: **el ranking no tiene tabla**. Sale de `crew_ranking`, que agrega
sesiones al vuelo, así que lo que lo mueve es lo que mueve a `sessions`. Sus dos
consumidores ya escuchan `sessions`; abrirle canal propio les haría recargar dos
veces por cada serie anotada.

### 28.6 La prueba que faltaba

`tests/contract/realtime.contract.test.ts`, contra la base y con canales de
verdad, porque lo que hay que afirmar es **que el servidor emite**, no que el
cliente llame bien: fundar un equipo avisa a quien lo funda —que no es evidente,
porque en el instante del INSERT quien funda todavía no es miembro y la política
exige serlo; llega porque `create_crew` escribe equipo y puesto en la misma
transacción—, borrar también avisa, y un extraño no recibe las fichas de un
equipo ajeno.

## 29. Fugas de secuencia (9 sep 2026)

Un informe de UX medido en tres móviles —375 × 667, 390 × 844, 412 × 915—
encontró el registro cortado, y a partir de él se recorrieron **todos** los
flujos de la aplicación con una sola pregunta: ¿hay algún sitio donde una
persona se queda sin acción posible, ve una pantalla que no es suya o recibe un
aviso de algo que no ocurrió? Salieron veintinueve. Todos están cerrados en la
rama `fix/fugas-de-secuencia`, y éstos son los que cambian una decisión.

### 29.1 El registro se desplaza

`Authentication` centraba la tarjeta con `items-center` en un contenedor sin
scroll. Con la pestaña de registro abierta, la tarjeta mide más que un móvil de
667 px y flexbox la centraba **fuera** por arriba y por abajo: la pestaña quedaba
a −150 px y el botón de crear a 726 px, inalcanzables los dos. Ahora el
contenedor desplaza y la tarjeta se centra con márgenes automáticos, que ceden
cuando no hay sitio en vez de recortar.

### 29.2 Una ruta se cierra con la regla que la esconde

`matchesViewer` filtraba la barra lateral: un alumno no veía Estudiantes. Pero
`/students` tecleada a mano se abría, con sus controles, y cada consulta fallaba
por RLS una a una. Se exportó como `viewerMayVisit`, se declaró `AccessRule`
—las cinco condiciones de un destino— y `withRouteAccess` la aplica a las
rutas de gestión. La alternativa era una segunda tabla de permisos por ruta, y
dos tablas que dicen lo mismo se separan al primer cambio.

### 29.3 Nada se celebra antes de escribir

La ficha de la sesión lanzaba «Sesión guardada» y cerraba **antes** de que el
puerto respondiera; el alta de sesión, igual; las acciones del volcado, igual.
Con la base rechazando —sin red, sin permiso—, la agenda celebraba lo que no
había pasado. Ahora todos esperan, el éxito se avisa después y el fallo se dice
en el sitio. Cerrar la sesión en vivo, además, **espera** antes de ir a la
celebración: sin esperar, la celebración releía antes de que la escritura
llegara y no encontraba logro nuevo.

### 29.4 Cardio deja de inventar

`liveSession.mock.ts` entraba en la pantalla con siete minutos, 1,19 km, 80
kcal y un trazado GPS por Lima; un contador los hacía crecer. Con aspecto de
medida y un letrero «GPS», un entrenador que abría una sesión de cardio veía
datos que nadie había tomado. Se quitó todo —mock, métricas, mapa, ritmo—: sin
sensor, la pantalla es un cronómetro que arranca en cero, y el tiempo sí es lo
que se anota al cerrar. La distancia volverá por un puerto cuando haya de dónde
sacarla.

### 29.5 Dos salidas que el servidor no admitía

Quien esperaba aprobación leía «tu entrenador tiene que aceptarte» y nada más;
un entrenador con el equipo pendiente leía «hace falta activar la suscripción»
y tampoco. Las dos salidas necesitaban la base: una política que deja a un
alumno borrar **su** ficha mientras esté `pending` —la activa tiene historial,
y darse de baja es otra decisión—, y una columna `activation_requested_at` que
escribe `crew.settings` y ordena la cola del panel de plataforma. Pedir no es
activar: la suscripción sigue `pending` hasta que alguien decida.

### 29.6 Lo que se quitó

El botón de Google, apagado desde §18, era una puerta pintada: se fue con su
hook y su método del puerto. Las pestañas Desafíos y Rachas con un cartel de
«próximamente» eran dos de cuatro pestañas que no llevaban a nada: se fueron
con `ComingSoon`. Y el «Nombre de equipo vacío» del informe no se reprodujo:
`NewCrew` marca el campo y no envía; se deja anotado por si el informe lo vio
en otra versión. Tampoco se tocó la raíz de quien administra la plataforma: el
análisis proponía mandarle a su panel de equipo cuando lo tiene, pero la
decisión escrita —y probada— es que entra a mirar equipos ajenos, no a
entrenar, y su propio equipo lo alcanza por el conmutador.

### 29.7 Contraste

La rampa `--scale-*` de las insignias de nivel daba 1,96:1, 2,88:1 y 2,92:1
sobre Bone, en texto de 10 px. Se oscureció hasta pasar de 4,5:1 y se añadió
`--scale-*-lift` para las mismas insignias sobre Ink, donde el tono oscuro
desaparece. Los grises de la tarjeta de alumno subieron de `ink/45` a `ink/60`.

## 30. Motores de progreso (10 sep 2026)

Plan completo en el artefacto «Motores de progreso de TrainerHub»; aquí las
decisiones por fase, conforme se ejecutan en `feature/motores-de-progreso`.

### 30.1 Fase 0: los datos antes que las reglas

**Fecha de nacimiento, no edad.** `students.age` era un entero escrito el día
del alta que envejecía solo, y de él iba a salir la cohorte que pondera la
puntuación. Se sustituye por `birth_date` y la edad se deriva al leer con
`ageOf`, que resta partes de fecha y no milisegundos: dividir por 365,25 se
equivoca justo el día del cumpleaños. La fecha la escribe **el propio alumno**
desde Configuración además de quien gestiona: es un dato suyo, como el nombre,
y el entrenador rara vez lo sabe. La guardia de `students` deja de vigilar
`age` y no añade `birth_date` a la lista de `students.manage`. El alta del
entrenador no la exige: pedirla convertiría el alta en una consulta.

**RPE por serie, opcional.** `SetRecord.rpe` de 1 a 10, validado en
`is_valid_session_result`. Se pide durante el descanso y no al cerrar la serie:
cerrar es un toque con la barra aún en la mano, y el descanso es el único rato
en que se puede pensar cuánto costó. Es opcional a propósito; sin él el
progreso se medirá sólo en kilos.

**Volumen planificado.** `plannedWeekVolume(plan, semana, rutinas)` suma
sesiones, series y minutos de una semana de plan. Es la mitad de la adherencia
que no existía como número.

**El ranking regalaba veinte puntos.** `crew_ranking` hacía `left join` y
`sum(20 + …)`: la fila extendida a NULL de quien nunca entrenó sumaba 20. Lo
tapaban dos filtros del cliente. Corregido con un `case` sobre `s.id`, y con
prueba de contrato.

**Suite unitaria.** `vitest.unit.config.ts` y `tests/unit/`, separada de los
contratos porque aquélla exige Docker y una función que calcula una edad no
debería. Corre en la CI junto al lint.

### 30.2 Fase 1: la puntuación y los desbloqueos viven en la base

**La regla, una sola vez y en el servidor.** La experiencia era «20 + series»
escrita en `experience.ts` y otra vez en `crew_ranking`, y los logros se
deducían en el cliente repasando la historia día a día. Ahora un disparador de
`sessions` llama a `score_session` y `evaluate_badges` al cerrar —o al editar
hasta cerrar— y deja escritas `session_scores` y `student_badges`. Cualquier
camino que cierre cuenta; una grupal no puntúa a nadie; reabrir borra la
puntuación. Nadie escribe esas tablas desde la API: no tienen política de
escritura, y la prueba de contrato lo afirma con un `42501`.

**Regla versión 1.** `puntos = base × adherencia × progreso × cohorte`. La
adherencia se acota a 1,10 —y no a 1,20 como proponía el documento— porque
pasarse del plan no puede valer más que cumplirlo. El progreso compara, por
ejercicio con kilos, la mejor carga de la sesión con la mediana de las cuatro
semanas anteriores, y una mejora con RPE mayor que 8 no cuenta: es una serie
forzada. La cohorte sale de la fecha de nacimiento y el nivel; sin fecha es 1.
Cada fila guarda `rule_version`: cambiar la fórmula no reescribe la historia.

**El espejo simulado.** La suite de interfaz vive de las semillas, así que la
misma regla existe en `fake/scoring.ts` y `fake/badgeRules.ts`, derivada de las
sesiones en cada lectura. Es la única duplicación que se acepta, y por eso está
vigilada dos veces: la unitaria afirma que el espejo da los mismos números que
el contrato exige a la base.

**Veinte insignias, seis rarezas.** Las ocho de antes más doce con datos
reales; ninguna que exija GPS, y ningún «+5 % permanente». La regla vive en
SQL, la presentación —nombre, icono, rareza— en `badgeCatalog.ts`, y el
contrato compara ambos catálogos por código. Platino y Diamante nacen con
`validated_at` a NULL: las confirma el entrenador en la fase 2.

**La celebración celebra lo nuevo.** `student_badges.session_id` dice qué
sesión desbloqueó cada insignia, así que la pantalla pide las de ésta y, si no
hay ninguna, celebra igual la puntuación de la sesión y la racha. Antes
enseñaba el último logro de toda la historia.

### 30.3 Fase 2: las rutas y la mano del entrenador

**La ruta se deriva, no se elige.** Un alumno con un plan de hipertrofia está
en Titan sin que nadie lo diga; uno de acondicionamiento, en Vitality; sin
plan, en Hybrid. El mapa objetivo → ruta es un catálogo de sistema
(`route_objectives`) y el entrenador puede cambiar la ruta a mano, lo que
reinicia los puntos de la ruta. Apex no tiene objetivo que la active: es
siempre elección del entrenador.

**Tres criterios, y el tercero es una persona.** Pasar de nodo exige puntos
acumulados en la ruta, semanas seguidas con adherencia de al menos el 85 %
—cerradas sobre lo decidido; una semana sin nada programado ni rompe ni
alarga— y una validación del entrenador. `route_progress` calcula el nodo al
vuelo y nunca lo guarda: un contador almacenado se desincroniza al primer
cambio. La escalera fija de sesiones («Primeros pasos», «Meta del mes»)
desaparece: era igual para todo el mundo y no la abría nadie.

**Confirmar y revisar.** Platino y Diamante se confirman con `validate_badge`;
un salto de carga —más de un 20 % sobre la mediana de cuatro semanas— marca
la sesión, deja el progreso en 1,00 y espera a `accept_load_jump`, que
repuntúa confiando en la carga. Es una heurística de una línea sobre datos que
ya se guardan, y se parece más a lo que hace un entrenador que un modelo.
Cinco hitos validados dan el «Sello del Entrenador», la única insignia que no
nace de una sesión.

**Sin avisos al entrenador todavía.** Los avisos son una bandeja del alumno;
lo que espera confirmación se ve en la ficha del alumno, sección «Ruta de
desarrollo», que sólo pinta quien tiene `students.manage`.
