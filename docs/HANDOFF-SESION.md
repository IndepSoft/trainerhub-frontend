# Traspaso de sesión — 9 sep 2026

Contexto **de sesión**, no de proyecto. Sirve para que la siguiente sesión
retome el trabajo sin volver a deducirlo todo. Las reglas permanentes viven en
[`../CLAUDE.md`](../CLAUDE.md); el registro de arquitectura, en
[`CAMBIOS-Y-ARQUITECTURA.md`](CAMBIOS-Y-ARQUITECTURA.md); la lista de la
adaptación móvil, en [`PWA-SEGUIMIENTO.md`](PWA-SEGUIMIENTO.md).

**Se pone al día cada sesión, y se reescribe cuando hace falta.** Esta versión
sustituye entera a la del 1 de septiembre, que había caducado en casi todo lo
que afirmaba: daba una ruta de proyecto que no es la de esta máquina, «tres
puertos» cuando hay veinte, «no están en CI» cuando la CI tiene tres trabajos, y
credenciales de `FakeAuthAdapter` como si así se entrara en la aplicación
desplegada. **Un traspaso caducado hace más daño que ninguno, porque se lee como
si fuera cierto.**

---

## 🔴 Lo primero: lo que está a medias ahora mismo

La rama **`fix/deploy-01`** está subida a origin (`97ae656`) con el tiempo real
cableado. Su migración **NO está aplicada en la nube**, así que hasta que se
aplique el código está suscrito a tablas que no emiten y no se nota ningún
cambio en la aplicación desplegada.

Los contratos tampoco se pasaron: la sesión que escribió esto corrió en una
máquina **sin Docker y sin la CLI de Supabase**. La máquina del usuario sí los
tiene. El runbook completo está abajo, en «Cerrar `fix/deploy-01`».

---

## Dónde estamos

| Rama | Commit | Estado |
|---|---|---|
| `main` | `3102330` | **al día**: contiene todo lo de `develop` (PR #11) |
| `develop` | `3aeb6b1` | 0 commits por delante de `main` |
| `fix/deploy-01` | `97ae656` | **rama activa**, subida, sin PR abierto |
| `feature/supabase-connection` | — | fusionada (PR #10) |
| `feature/redesign-ui` | `f6ef04e` | fusionada |
| `feature/pwa-adaptation` | `23d110c` | fusionada |
| `feature/supabase-integration` | `cdd2586` | **2 por delante, 110 por detrás — no fusionar** |
| `backup/supabase-test` | `d117d93` | sólo local, sin respaldo en origin |

`main` y `develop` dejaron de estar desalineadas el 9 de septiembre. La época en
que «`main` está 90 commits por detrás y no compila» terminó.

**`feature/supabase-integration` es un callejón sin salida.** Sus dos aportes
—registro por etapas y pestañas con subrayado— están rehechos, y mejor, en lo que
hoy es `main`: `useRegisterForm` allí tiene `REQUIRED_BY_INTENT` para distinguir
alumno de entrenador, cosa que la rama no hace. Fusionarla son 14 ficheros en
conflicto, incluido un modificado-contra-borrado por el renombrado de
`Gamification` a `progress`. La recomendación dada al usuario fue **cerrar el PR
sin fusionar**; no ha respondido.

Verificado el 9 de septiembre, ejecutado y no supuesto, sobre `fix/deploy-01`:
`npm run build` en verde y `npm run lint` limpio. Los contratos y Playwright,
no: ver arriba.

---

## Cerrar `fix/deploy-01` — el runbook

Esto es lo que hay que hacer en una máquina con Docker y la CLI de Supabase.

### 1. Traer la rama

```bash
git fetch origin && git checkout fix/deploy-01 && npm ci
```

`npm ci` y no `npm install`: `.npmrc` lleva `engine-strict=true`, así que si el
Node no llega a 22.12 falla ahí en vez de dejar un árbol a medias. `.nvmrc` pide
la 22.

### 2. Contratos en local

```bash
supabase start -x studio,imgproxy,inbucket,logflare,vector,edge-runtime
```

Es la misma exclusión que usa la CI: arranca bastante antes y `realtime`, que es
lo que aquí se prueba, sigue dentro. Aplica las once migraciones y la semilla
desde cero.

```bash
npm run test:contract
```

Lo nuevo es `tests/contract/realtime.contract.test.ts`, tres casos: que fundar un
equipo avisa a quien lo funda, que borrar también avisa —la regresión de
`replica identity full`— y que un extraño no recibe las fichas de un equipo
ajeno. Si algo se atasca, `npm run db:reset` rehace la base.

La CI clava la CLI en **2.75.0**. Si la local es muy distinta y pasa algo raro,
igualarla antes de sospechar del código.

### 3. Aplicar la migración en la nube

⚠️ **NO usar `supabase db push`.** Las versiones registradas en
`supabase_migrations.schema_migrations` no coinciden con los nombres de fichero
en 8 de las 10 migraciones ya aplicadas:

| fichero local | registrado en la nube |
|---|---|
| `20260905090000_perfil_editable_y_rol_declarado` | `20260905055616` |
| `20260907100000_equipos_y_puestos` | `20260908221414` |
| `20260907110000_alumnos_pertenencia_cuotas_avisos` | `20260908221545` |
| `20260907120000_entrenamiento` | `20260908221649` |
| `20260907130000_agenda_y_sesion` | `20260908221737` |
| `20260907140000_progreso_y_muro` | `20260908221810` |
| `20260908100000_auditoria_y_baja` | `20260908221856` |
| `20260909100000_huecos_del_plan` | `20260908235442` |

Viene de que se aplicaron por herramienta y se reconstruyeron después desde el
esquema vivo. `db push` vería ocho migraciones «pendientes» e intentaría
reejecutarlas enteras sobre una base que ya las tiene.

El camino seguro es el **editor SQL del panel**, pegando el contenido de
`supabase/migrations/20260909170000_tiempo_real_completo.sql`. Son once
`alter publication ... add table` y quince `alter table ... replica identity
full`. No toca ninguna política ni ninguna columna.

**No es reejecutable**: `alter publication add table` falla si la tabla ya está
publicada. Si hay que reintentar tras un corte, quitar del script lo que ya pasó.

Después, para que quede registrada:

```sql
insert into supabase_migrations.schema_migrations (version, name)
values ('20260909170000', 'tiempo_real_completo');
```

### 4. Comprobar

```sql
select
  (select count(*) from pg_publication_tables where pubname = 'supabase_realtime') as publicadas,
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relreplident = 'f') as con_identidad_completa;
```

**15 y 15.** Antes de aplicar son 4 y 0.

Y a mano, que es lo que de verdad importa: dos navegadores, las dos cuentas
reales. Con el administrador activar la suscripción de «Piedras y Palos» desde
`/admin`; en la ventana del entrenador el aviso de suscripción pendiente debe
desaparecer solo, sin recargar.

### 5. PR

`gh` no está instalado en la máquina de la sesión anterior. Si lo está en la
actual:

```bash
gh pr create --base develop --head fix/deploy-01 --title "fix(tiempo-real): las tablas que la aplicacion ya escuchaba"
```

---

## Cómo levantar el entorno

El proyecto está en **`C:\ddd-2\trainerhub-frontend`**. Ojo: el traspaso
anterior afirmaba que vivía en `D:\Develop\zdev-freelancer\` y que el clon de
`C:\ddd-2` no existía. En esta máquina es al revés.

```bash
npm run dev
```

`.claude/launch.json` define `trainerhub-dev` en el 5178 y `trainerhub-preview`
en el 4178.

**Tres suites, y cada una prueba otra cosa:**

| Comando | Contra qué | Necesita |
|---|---|---|
| `npm run test:e2e` | Playwright, adaptadores **simulados** | nada |
| `npm run test:contract` | Vitest contra Supabase **local** | Docker + CLI |
| `npm run build` / `lint` | tipos y estilo | nada |

La CI (`.github/workflows/ci.yml`) tiene los tres como trabajos separados en
cada PR hacia `develop` y `main`: `verify`, `interface` y `contracts`.

**`.env` conserva `VITE_USE_FAKE_AUTH=true` a propósito**: la suite de Playwright
vive de las semillas falsas. Con ese flag no se ve la base — para probar contra
Supabase hay que quitarlo. El interruptor elige el juego **entero** de
adaptadores, nunca una mezcla:

```ts
import.meta.env.DEV && import.meta.env.VITE_USE_FAKE_AUTH === 'true'
```

`import.meta.env.DEV` es literalmente `false` en un build de producción, así que
los adaptadores falsos no entran en el bundle desplegado. En Vercel el flag no
hace nada; ponerlo ahí tampoco tendría efecto, y si lo tuviera sería que
cualquiera puede entrar como cualquiera.

---

## Cuentas y datos REALES en Supabase

Proyecto `gntwwopcvmzemlbdbzxs`. Estas son cuentas de verdad, no la semilla.

| Correo | `profiles.role` | Equipo | Puesto |
|---|---|---|---|
| `zuniganoriegadenzel@gmail.com` | `admin` | ninguno | — |
| `soportedesarrollonext@gmail.com` | `trainer` | Piedras y Palos | `admin` del crew |

- **La tribu «Piedras y Palos»** (`4acb9961-…`) tiene código de unión `BCJXZHWM`,
  aprobación requerida, ranking activo y **`subscription_status = 'pending'`**.
  Mientras esté en `pending` nadie puede unirse: el servidor corta con
  `enrollmentClosed`. La activa el administrador de plataforma desde `/admin`.
- **El rol de plataforma no se pide, se concede por correo.** El disparador
  `handle_new_user` mira `platform_admin_emails` ANTES que el `intent` del
  formulario. Por eso `zuniganoriegadenzel@gmail.com` salió `admin` aunque se
  registrara eligiendo «Entreno»: su correo está en esa lista desde el 8 de
  septiembre. Para probar el alta de entrenador **hace falta otro correo** —el
  truco del `+` de Gmail vale—.
- `profiles.role` = plataforma. `crew_staff.role` = equipo. Son ejes distintos:
  se puede administrar la plataforma y además entrenar en el propio equipo.
  `is_platform_admin()` es la única definición de lo primero, y la usan tanto las
  políticas como `PlatformRepository.isAdmin`.

---

## ⚠️ Estado de Supabase que hay que revertir antes de producción

**La confirmación por correo está APAGADA.** Se apagó el 9 de septiembre a las
15:37 UTC para desbloquear el registro, y funcionó: el alta pasó a abrir sesión
al instante, sin enviar correo. Queda constancia en los logs de Auth
(`reloading api with new configuration`, y un `/signup` posterior sin
`mail.send`).

Con eso, **cualquiera puede registrarse con el correo de otra persona sin
demostrar que es suyo**. Para desarrollo está bien; abrir la aplicación así, no.

Y no basta con volver a encenderla: sin SMTP propio se vuelve al tope del plan
gratuito, que son **2 correos por hora** con el remitente incorporado de
Supabase. Medido: dos envíos a las 14:44:45 y 14:47:36 dejaron el `/signup`
devolviendo `429: email rate limit exceeded` durante la hora siguiente. La
aplicación lo traduce a «Demasiados intentos», que es correcto pero suena a culpa
del usuario cuando es un tope del proyecto entero.

**Las dos cosas van juntas, en la misma tanda**: encender la confirmación y
montar SMTP (Resend o Brevo) con su límite en *Authentication → Rate Limits*.

---

## Qué hizo esta sesión — 9 sep

**Tiempo real, que estaba a medias sin que nada lo delatara.** La aplicación
tenía 37 puntos de suscripción repartidos por 30 hooks; sólo cuatro tablas
estaban publicadas y 13 de 16 adaptadores devolvían `() => undefined` con un
`TODO`. No lo detectaba nada porque **no avisar es una implementación
sintácticamente válida del contrato**: compila, pasa el lint, y las pruebas de
interfaz corren contra los adaptadores simulados, donde el aviso es una llamada
en memoria. Sólo se veía recargando a mano.

El caso que lo destapó: crear un equipo y que la propia barra lateral siguiera
diciendo «Sin equipo». `useViewer` llevaba desde siempre suscrito a `crews`,
`crew_staff`, `students` y `profiles`, y ninguna de las cuatro emitía.

Lo hecho, en `fix/deploy-01`:

- Once tablas más publicadas, quince en total.
- Doce adaptadores suscritos de verdad, cada uno con su motivo escrito.
  `CrewProgressRepository` sigue sin canal, pero ahora por una razón y no por un
  pendiente: el ranking no tiene tabla, sale de agregar sesiones, y sus dos
  consumidores ya escuchan `sessions`.
- **Fuera el `filter=crew_id` del canal.** Filtraba mal de tres maneras: se
  tragaba los borrados —el registro de un DELETE no lleva esa columna—, se
  quedaba viejo al cambiar de equipo —el ámbito se leía una vez, al suscribirse,
  y los hooks montan el efecto con dependencias vacías— y no sabía expresar «un
  equipo en el que todavía no estoy», que es justo el aviso que hace falta al
  fundar uno. En su lugar: RLS decide quién recibe, y el ámbito lo aplica la
  relectura del repositorio, que lee el crew activo EN ESE MOMENTO.
- **`replica identity full` en todo lo publicado.** Arregla un fallo que ya
  tenían las cuatro originales: sin la fila vieja entera, Realtime no puede
  evaluar RLS sobre un borrado y el evento se reparte a **todos** los
  suscriptores.
- Prueba de contrato nueva, y §6 de `CLAUDE.md` actualizada con la regla: una
  tabla nueva con tiempo real se añade a la publicación **y** se le pone la
  identidad completa, en su migración, con su prueba.

Antes de eso, en la misma sesión: se confirmó que la cuenta del usuario ya era
administrador de plataforma —no hizo falta promoverla— y se diagnosticó el
bloqueo del registro como el tope de correos, no como un fallo de la aplicación.

---

## Trampas de este entorno

**El clasificador de permisos bloquea acciones legítimas.** En esta sesión negó
`apply_migration` contra la nube. No es un fallo que se pueda rodear: hay que
parar, decírselo al usuario y dejar que decida. Ya pasó antes con `npm run build`
durante un cambio de la puerta de Vercel.

**Las versiones de las migraciones tienen deriva.** Ver el paso 3 del runbook. Es
la trampa más cara de este repositorio ahora mismo.

**`gh` no está instalado.** Los PR se abren por la URL de `compare`.

**`git mv` falla en Windows con «Permission denied»** por bloqueos de ficheros de
procesos node. Funciona `cp -r` + `rm -rf`; git lo detecta igual como renombrado.

**Comprobar la rama antes de commitear.** Han caído commits en la rama
equivocada más de una vez —siete en una sesión, y tres en otra sobre una
`refactor-claude` que acabó borrada—. `git branch --show-current` cuesta nada.

**Los *heredoc* de bash no sirven para escribir estos documentos.** La
herramienta envuelve el comando en comillas simples y cualquier comilla del
contenido rompe el análisis. Se escriben con la herramienta de escritura.

**`page.goto` recarga la aplicación**, y los adaptadores falsos vuelven a su
semilla. Una prueba que cree algo y luego mire otra pantalla tiene que navegar
POR LA INTERFAZ.

**Una prueba de comportamiento no afirma un número absoluto de datos de
ejemplo.** Tres se rompieron al ampliar `sessionsSeed` sin que nada de la
aplicación fallara. Se reescribieron en diferencias: leer el contador antes y
esperar uno más.

**`getByLabel` sobre un `Select` de Radix devuelve DOS elementos**: el botón
visible y un `<select>` nativo oculto. Hacer clic en el oculto no abre nada **ni
da error**, así que la prueba muere mucho después. Se filtra por rol:
`getByRole('combobox', { name, exact: true })`.

**El panel del navegador ESCALA la página, así que `getBoundingClientRect`
miente**: un control de 44 px devolvía 41,8. Para medir en el panel,
`offsetHeight` / `offsetWidth`. Y arranca a ~568 px, que ya es móvil: fijar el
viewport con `resize_window` y devolverlo a `desktop` al terminar.

**`requestAnimationFrame` no entrega fotogramas en el panel de vista previa**,
aunque `visibilityState` diga `visible`. Lo animado por fotogramas se queda
congelado. Distinguir «no anima» de «no funciona».

**El buffer de consola arrastra errores de sesiones anteriores.** Para leer
errores de verdad, pestaña nueva.

**`shared/ui` trae ~20 clases de Tailwind 4 que aquí no generan nada** —la forma
con paréntesis, `shadow-xs`, `outline-hidden`, `field-sizing-content`—. No es
cosmético siempre: en `select.tsx` la clase muerta era el tope de altura del
panel. Se arreglaron los dos `max-h-`; el resto sigue inerte y sin auditar.

```bash
grep -rn "\-(\-\-\|shadow-xs\|outline-hidden\|field-sizing" src/shared/ui/
```

**Y un apilamiento de Tailwind que no genera CSS:** un variante `data-[...]`
sobre un pseudoelemento. `data-[state=active]:after:bg-primary` llegaba al
elemento y Tailwind no emitía ninguna regla —comprobado recorriendo las hojas de
estilo—, así que el subrayado de la pestaña activa salía transparente. Se
resolvió con `border-b-2`.

---

## Decisiones ya tomadas — no volver a discutirlas

- **Puertos y adaptadores.** El SDK de Supabase sólo se importa en
  `shared/infrastructure/supabase`. Lo impide `no-restricted-imports`, no una
  convención. Migrar de backend = escribir adaptadores y tocar `app/container.ts`.
  **Hay veinte puertos**, y todos tienen adaptador real y gemelo simulado.
- **El rol NUNCA vive en `user_metadata`.** Lo puede editar el propio usuario con
  una llamada. `intent` en el alta es una PETICIÓN; quien decide es el servidor.
  `profiles.role` tiene el `UPDATE` revocado para `authenticated` a propósito.
- **El perfil se crea DENTRO del alta**, por disparador y en la misma
  transacción, no con un INSERT posterior desde el cliente. Sin sesión —que es lo
  que pasa con la confirmación por correo activada— RLS no dejaría escribir la
  fila.
- **Los errores viajan como RAZONES**, no como texto: `AppError.reason` es un
  tipo cerrado y `describeError` lo traduce al pintar. Una razón nueva se añade
  en tres sitios o no compila.
- **TypeScript se queda en 5.9.3.** `typescript-eslint@8` declara
  `typescript: ">=4.8.4 <6.1.0"`; TS 7 dejaría el proyecto sin lint tipado.
- **Interfaz en castellano, código en inglés.** Por eso el dominio es `progress`
  y la etiqueta dice «Progreso».
- **Se referencia el vocabulario, se copia la decisión.** El ejercicio se
  referencia por identificador; el bloque guardado se **copia** al insertarlo,
  porque si se referenciara, editar la biblioteca cambiaría en silencio el
  programa que alguien está haciendo esta semana.
- **De los seis catálogos sólo se editan dos.** Ejercicios y material son del
  entrenador. Grupos, patrones, objetivos y divisiones son vocabulario: abrirlos
  a texto libre rompe el filtrado en cuanto uno escribe «Pecho» y otro
  «Pectoral».
- **Responsive obligatorio, el móvil es el caso base.** Es una regla del proyecto
  porque el objetivo es una PWA instalable. Ver §1.6 de `CLAUDE.md`.

---

## Pendiente

**Del tiempo real:**

- Aplicar la migración y pasar los contratos. Es el paso 2 y 3 del runbook.
- Abrir el PR de `fix/deploy-01` hacia `develop`.

**Del proyecto:**

- Decidir qué se hace con el PR de `feature/supabase-integration`. La
  recomendación es cerrarlo sin fusionar.
- **`backup/supabase-test`**: sigue sólo en local, sin respaldo en origin. Son 10
  commits de otros autores y un dominio `workouts` entero que nunca se fusionó.
  O se empuja o se borra dejándolo escrito; el limbo ya va por la tercera
  sesión.
- Encender la confirmación por correo y montar SMTP. Ver arriba.
- Activar la suscripción de «Piedras y Palos» para poder probar el flujo de unión
  con el QR.
- **El plan no puede expresar progresión.** `PlanDay` sólo guarda un `routineId`
  y la rutina lleva toda la prescripción, así que no hay forma de decir «la misma
  sesión con más volumen la semana 3». Se nota en los datos: hay una semana
  marcada `isDeload: true` que apunta a la misma rutina sin descargar nada. El
  eje que lo arreglaría es **estructura fija / dosis variable** aplicado al par
  plan-semana. Se decidió posponerlo, no hacerlo a medias.
- El chunk `index` pesa 769 kB, por encima del aviso de Vite. Nadie ha decidido
  si merece `manualChunks`.

---

## Preguntas abiertas para el usuario

1. **¿Se cierra el PR de `feature/supabase-integration` sin fusionar?** Preguntado
   y sin respuesta.
2. **¿`backup/supabase-test` se empuja o se borra?** Tercera sesión en el limbo.
3. **Los peldaños de la escalera de hitos y las constantes de XP son una
   propuesta**: 3, 7, 12, 20 y 30 sesiones; 20 XP por sesión y 1 por serie. Están
   juntos y con nombre en `progressRules.ts` para que ajustarlos sea cambiar una
   constante, pero nadie los ha validado como producto.
4. **La lista de especialidades del registro es una propuesta**, no un dato
   validado.
