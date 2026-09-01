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

**La base de datos está vacía**: `list_tables` devuelve cero tablas. El único
acceso a datos del código apunta a `trainers`, que todavía no existe.

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
