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
