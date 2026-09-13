# Traspaso de sesión — 13 sep 2026

Contexto **de sesión**, no de proyecto. Sirve para que la siguiente sesión
retome el trabajo sin volver a deducirlo todo. Las reglas permanentes viven en
[`../CLAUDE.md`](../CLAUDE.md); el registro de arquitectura, en
[`CAMBIOS-Y-ARQUITECTURA.md`](CAMBIOS-Y-ARQUITECTURA.md); el mapa de procesos,
en [`FLUJOS-DEL-SISTEMA.md`](FLUJOS-DEL-SISTEMA.md); la adaptación móvil, en
[`PWA-SEGUIMIENTO.md`](PWA-SEGUIMIENTO.md).

**Se pone al día cada sesión, y se reescribe cuando hace falta.** Esta versión
sustituye entera a la del 9 de septiembre, que había caducado en lo que más se
consulta: daba `main` en un commit de hace cuatro días, una rama activa con un
PR abierto que ya se fusionó, una ruta de proyecto que no es la de esta máquina,
«veinte puertos» cuando hay veintitrés y «`gh` no está instalado» cuando sí lo
está. **Un traspaso caducado hace más daño que ninguno, porque se lee como si
fuera cierto.**

Todo lo que afirma este documento se comprobó el 13 de septiembre, ejecutando o
consultando. Donde no se pudo comprobar, se dice.

---

## 🔴 Lo primero: qué está a medias

**Nada.** No hay ninguna rama con trabajo sin terminar, ningún PR abierto y
ninguna migración pendiente de aplicar.

`develop` y `main` tienen el mismo contenido, las diecisiete migraciones del
repositorio son las diecisiete aplicadas en la nube, y la CI está en verde en
las dos ramas.

Lo que sí hay es una lista de pendientes que nadie ha decidido todavía: está
abajo, en [Pendiente](#pendiente). Lo más urgente de esa lista es que **la
confirmación por correo sigue apagada en Supabase**.

---

## Dónde estamos

| Rama | Commit | Estado |
|---|---|---|
| `main` | `6c31962` | al día; contiene todo lo de `develop` (PR #20) |
| `develop` | `9964bfb` | 0 por delante de `main`; CI en verde |

Los dos commits que `main` tiene y `develop` no son los propios merges de
`develop` hacia `main` (#18 y #20). No es desalineación.

**Ramas de trabajo: todas fusionadas y ninguna viva.** Ninguna tiene commits que
`develop` no tenga:

| Rama | Por delante de `develop` |
|---|---|
| `feature/redesign-auth` | 0 — fusionada (PR #19) |
| `fix/ajustes-de-flujo` | 0 — fusionada (PR #17) |
| `feature/motores-de-progreso` | 0 — fusionada (PR #15) |
| `fix/fugas-de-secuencia`, `fix/deploy-01`, `feature/redesign-ui`, `feature/pwa-adaptation`, `feature/supabase-connection` | 0 — fusionadas |
| `feature/supabase-integration` | **2 por delante, 138 por detrás** |

**`feature/supabase-integration` sigue siendo un callejón sin salida**, ahora
más que antes: 138 commits por detrás. Sus dos aportes —registro por etapas y
pestañas con subrayado— están rehechos y superados en `develop`, y el rediseño
del acceso del 12 de septiembre volvió a tocar exactamente esos ficheros. No
tiene PR abierto. La recomendación sigue siendo **borrarla**; el historial la
conserva si alguien la quiere mirar.

**`backup/supabase-test` (`d117d93`) sigue sólo en local, sin respaldo en
`origin`.** Cuarta sesión en el limbo. Son commits de otros autores y un dominio
`workouts` entero que nunca se fusionó. O se empuja o se borra, pero dejarlo en
una sola máquina es perderlo el día que se formatee.

### Verificado hoy, ejecutado y no supuesto

| Comprobación | Resultado |
|---|---|
| `npm run build` | verde, `built in 14.98s` |
| `npm run test:unit` | 31 pruebas, 6 ficheros, en verde |
| CI de `develop` (`9964bfb`) | los tres trabajos en verde |
| CI de `main` (`6c31962`) | los tres trabajos en verde |
| Migraciones repo / nube | 17 / 17 |
| Árbol de trabajo | limpio |

La suite de interfaz **no** se ejecutó en esta sesión: son 212 pruebas y unos
quince minutos. Corrió en la CI del último merge y pasó.

---

## Cómo levantar el entorno

El proyecto está en **`D:\Develop\zdev-freelancer\trainerhub-frontend`**. El
traspaso anterior decía `C:\ddd-2\trainerhub-frontend`, que era cierto en la
máquina de aquella sesión y no en ésta. **Compruébalo con `pwd` antes de
fiarte de cualquiera de los dos.**

```bash
npm ci        # y no `npm install`: `.npmrc` lleva engine-strict
npm run dev
```

`.nvmrc` pide Node 22; aquí corre la 22.14.0 con npm 11.4.1.
`.claude/launch.json` define `trainerhub-dev` en el **5178** y
`trainerhub-preview` en el **4178**.

**Cuatro suites, y cada una prueba otra cosa:**

| Comando | Contra qué | Necesita |
|---|---|---|
| `npm run test:unit` | funciones puras del dominio, sin navegador | nada |
| `npm run test:e2e` | Playwright, adaptadores **simulados** | nada |
| `npm run test:contract` | Vitest contra Supabase **local** | Docker + CLI |
| `npm run build` / `npm run lint` | tipos y estilo | nada |

La CI (`.github/workflows/ci.yml`) tiene tres trabajos en cada PR hacia
`develop` y `main`: **`verify`** («Lint y build», que además corre las
unitarias), **`interface`** («Pruebas de interfaz») y **`contracts`** («Pruebas
de contrato»). La CLI de Supabase está clavada en **2.75.0**; si la local es muy
distinta y pasa algo raro, igualarla antes de sospechar del código.

**`.env` conserva `VITE_USE_FAKE_AUTH=true` a propósito**: la suite de Playwright
vive de las semillas falsas. Con ese flag no se ve la base. El interruptor elige
el juego **entero** de adaptadores, nunca una mezcla:

```ts
import.meta.env.DEV && import.meta.env.VITE_USE_FAKE_AUTH === 'true'
```

`import.meta.env.DEV` es literalmente `false` en un build de producción, así que
los adaptadores falsos no entran en el bundle desplegado. En Vercel el flag no
hace nada.

---

## La nube: cuentas y datos REALES

Proyecto `gntwwopcvmzemlbdbzxs`. Esto es lo que había el 13 de septiembre, no la
semilla. **Cambia solo, porque la gente usa la aplicación**: dos de estas cuentas
y uno de estos equipos no existían el 9 de septiembre.

| Correo | `profiles.role` | Dónde está |
|---|---|---|
| `zuniganoriegadenzel@gmail.com` | `admin` | sin equipo |
| `soportedesarrollonext@gmail.com` | `trainer` | Piedras y Palos, `admin` del crew |
| `pedroperez@gmail.com` | `student` | Piedras y Palos, ficha activa |
| `dzn@gmail.com` | `trainer` | Puras piñas, `admin` del crew |
| `alichi@lichi.com` | `student` | sin equipo |

| Equipo | Código | Suscripción | Miembros |
|---|---|---|---|
| Piedras y Palos (Tribu) | `BCJXZHWM` | **`active`** | 2 |
| Puras piñas (Box) | `6F447VEC` | `pending` | 0 |

Dos cosas que han cambiado desde el traspaso anterior y conviene no arrastrar
mal:

- **«Piedras y Palos» ya está activa.** El traspaso viejo decía `pending` y
  pedía activarla para poder probar el flujo del QR. Ya está hecho: con la
  suscripción activa, el QR y el alta de fichas funcionan.
- **Hay un segundo equipo**, «Puras piñas», fundado el 12 de septiembre y en
  `pending`. Sirve como caso de prueba del aviso de suscripción sin tocar el
  equipo que ya funciona. Ninguno de los dos ha pedido la activación
  (`activation_requested_at` a nulo en los dos).

**El rol de plataforma no se pide, se concede por correo.** El disparador
`handle_new_user` mira `platform_admin_emails` ANTES que el `intent` del
formulario. La lista tiene dos direcciones: `zuniganoriegadenzel@gmail.com` y
`admin@indepsoft.com` —la segunda no se ha registrado todavía—. Para probar el
alta de entrenador **hace falta otro correo**; el truco del `+` de Gmail vale.

`profiles.role` = plataforma. `crew_staff.role` = equipo. Son ejes distintos: se
puede administrar la plataforma y además entrenar en el propio equipo.
`is_platform_admin()` es la única definición de lo primero.

---

## ⚠️ Estado de Supabase que hay que revertir antes de producción

**La confirmación por correo sigue APAGADA**, cuatro días después de que se
apagara para desbloquear el registro. No es una suposición: de las cinco cuentas,
las cuatro últimas tienen `email_confirmed_at` **exactamente igual a
`created_at`**, al décimo de segundo. Eso sólo pasa con el auto-confirmado.

```sql
select email, round(extract(epoch from (email_confirmed_at - created_at))::numeric, 1)
from auth.users order by created_at;
```

La última cuenta así es de **hoy**, y su dirección —`alichi@lichi.com`— es la
demostración de lo que esto permite: **cualquiera puede registrarse con el correo
de otra persona sin demostrar que es suyo**. Para desarrollo está bien; abrir la
aplicación así, no.

Y no basta con volver a encenderla: sin SMTP propio se vuelve al tope del plan
gratuito, **2 correos por hora**, que fue lo que llevó a apagarla. Cuando pasa,
`/signup` devuelve `429` y la aplicación lo traduce a «Demasiados intentos», que
suena a culpa del usuario cuando es un tope del proyecto entero.

**Las dos cosas van juntas, en la misma tanda**: encender la confirmación y
montar SMTP (Resend o Brevo) con su límite en *Authentication → Rate Limits*.

---

## Auditoría de seguridad del 13 sep

Pasada con el linter de Supabase y **comprobada a mano**, porque el linter avisa
de mucho que es intencionado. Lo que queda después de filtrar:

### 1. Tres funciones responden a quien no ha entrado

Diez funciones `security definer` son ejecutables por el rol `anon`. Siete fallan
cerradas —comprueban `has_capability` o la pertenencia, y sin sesión `auth.uid()`
es nulo—; se comprobó que `crew_ranking` levanta `forbidden` como debe.

**Tres responden sin comprobar nada**, llamadas como `anon`:

| Función | Qué devuelve a un desconocido |
|---|---|
| `cohort_of(student)` | la franja de edad de esa ficha |
| `protected_streak(student, asof)` | su racha |
| `wildcards_available(student)` | sus comodines |

Hace falta conocer el UUID de la ficha, que no es enumerable, así que la
gravedad es baja. Pero **contradice la regla del propio proyecto** —«cada regla
del servidor comprueba la capacidad»— y ya hay una migración dedicada a esto,
`endurecer_funciones_security_definer`. El arreglo son tres `revoke execute …
from anon` en una migración, con su prueba de contrato.

### 2. Cinco funciones con `search_path` mutable

`is_valid_block`, `is_valid_blocks`, `is_valid_weeks`, `is_valid_session_result`
y `touch_updated_at`. Ninguna es `security definer`, así que el riesgo es menor,
pero son las cinco que quedaron fuera de aquella migración de endurecimiento.
Cuesta una línea por función.

### 3. Protección de contraseñas filtradas, apagada

Supabase puede comprobar las contraseñas contra HaveIBeenPwned. Está desactivada.
Es un interruptor del panel, en *Authentication → Password security*.

### Lo que el linter avisa y NO hay que tocar

`join_token_lookups` y `platform_admin_emails` tienen RLS activado y ninguna
política. **Es deliberado y está escrito en su migración**: sólo las escribe y
las lee una función `security definer`, así que una política las abriría más de
lo que están. Si el linter vuelve a marcarlas, es ruido.

---

## La deriva de versiones de las migraciones

⚠️ **NUNCA usar `supabase db push` contra la nube.**

De las diecisiete migraciones, **quince tienen en la nube una versión distinta
del nombre del fichero**. Sólo coinciden las dos primeras.

| fichero local | registrado en la nube |
|---|---|
| `20260905090000_perfil_editable_y_rol_declarado` | `20260905055616` |
| `20260907100000_equipos_y_puestos` | `20260908221414` |
| `20260909170000_tiempo_real_completo` | `20260909184523` |
| `20260910100000_datos_de_progreso` | `20260910055512` |
| `20260911100000_ciclos_de_vida_y_bandeja` | `20260910201939` |
| …y diez más | |

**La causa ya no es histórica, es el método de aplicación.** Las primeras se
aplicaron por herramienta y se reconstruyeron desde el esquema vivo; las
recientes se aplican con `apply_migration` del MCP de Supabase, **que registra la
migración con su propia marca de tiempo y no con la del fichero**. Mientras se
aplique así, cada migración nueva añade una fila más a la deriva.

`db push` vería quince migraciones «pendientes» e intentaría reejecutarlas
enteras sobre una base que ya las tiene. Varias no son reejecutables:
`alter publication … add table` falla si la tabla ya está publicada, y
`create trigger` si el disparador existe.

**El camino que funciona** —y el que se usó para las cuatro últimas— es
`apply_migration` del MCP, o pegar el fichero en el editor SQL del panel. En los
dos casos, la regla del proyecto: **primero los contratos en la CI, después la
nube**.

Comprobación rápida del estado de tiempo real, que es lo que más se ha roto
históricamente:

```sql
select
  (select count(*) from pg_publication_tables where pubname = 'supabase_realtime') as publicadas,
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relreplident = 'f') as con_identidad_completa;
```

**20 y 20** el 13 de septiembre. Eran 15 y 15 antes de los motores de progreso,
que publicaron cinco tablas más. Si no coinciden entre sí, falta la identidad
completa en alguna: sin ella, RLS no se puede evaluar sobre un borrado y el
evento se reparte a **todos** los suscriptores.

---

## Qué pasó del 10 al 12 de septiembre

**Segunda lectura de los flujos, y sus veintiún arreglos** (PR #17, `CAMBIOS`
§31, documento en `FLUJOS-DEL-SISTEMA.md`). La primera lectura del mapa de
procesos se contrastó contra el código: de dieciséis afirmaciones, tres eran
falsas y diez estaban a medias. De ahí salió un plan en cuatro bloques, ejecutado
entero:

- **Defectos de una función**: la fecha por defecto de asignar, ocho diálogos que
  escribían sin decir si fallaban, el código del QR que se perdía al confirmar el
  correo, dieciséis cadenas sin traducir.
- **Decir lo que ya se sabía**: el aviso de que asignar un plan cambia la ruta,
  «sin cuenta» en la tarjeta del alumno, el borrador de rutina que sobrevive a
  salir al catálogo.
- **La bandeja del entrenador**: `usePendingWork` junta solicitudes, hitos,
  insignias, cargas, cuotas y fichas sin cuenta; se pinta en el panel y cuenta en
  la barra. Aprobar una solicitud deja un aviso en la campana del alumno.
- **Ciclos de vida**: la baja del alumno (`inactive`), «no ocurrió» derivado del
  día, el rechazo visible y retirable, el repertorio del alumno.

Y una corrección de seguridad que salió de auditar las políticas: **nada que
apunte a un alumno puede ser de otro equipo**. Las políticas comprobaban la
capacidad sobre `crew_id` y nada sobre `student_id`, así que quien gestionaba un
equipo podía agendar, asignar, avisar o cobrar a un alumno de otro.
`guard_student_crew` lo cierra en las cuatro tablas.

**Rediseño de la puerta** (PR #19). La pantalla de acceso dejó de tener el
aspecto de fábrica de la librería: fuera la tarjeta y las pestañas, y la vista
—identificarse o darse de alta— **viaja en la dirección** con el parámetro
`vista`, así que son dos URL enlazables y el botón de atrás vuelve donde debe.
Entran `AuthScreen`, `AuthHero`, `AuthHeroBackdrop` y `StepIndicator`, y el alta
de entrenador pasa a dos pasos. Los bocetos quedaron en `docs/design/auth`. Sin
dependencias nuevas.

---

## Trampas de este entorno

**Verificar la ruta del proyecto.** Dos traspasos seguidos han dado rutas
distintas porque las sesiones corrieron en máquinas distintas. `pwd` cuesta nada.

**La deriva de versiones de las migraciones.** Ver arriba. Sigue siendo la
trampa más cara de este repositorio.

**`gh` SÍ está instalado** (2.100.0). El traspaso anterior decía que no y mandaba
abrir los PR por la URL de `compare`. Se abren con `gh pr create`.

**El clasificador de permisos bloquea acciones legítimas.** Ha pasado con
`apply_migration` contra la nube y con `npm run build`. No es un fallo que se
pueda rodear: hay que parar, decírselo al usuario y dejar que decida.

**Los *heredoc* de bash rompen con comillas dentro.** Un `python - <<'EOF'` con
apóstrofos en el contenido muere con «unexpected EOF». Para textos largos o
guiones con comillas, escribir el fichero con la herramienta de escritura y
ejecutarlo después. Para mensajes de commit sí funcionan.

**`git mv` funciona aquí.** El traspaso anterior decía que fallaba en Windows por
bloqueos de node; en esta máquina movió dos ficheros sin queja. Si falla, la
salida es `cp -r` + `rm -rf`, que git detecta igual como renombrado.

**Comprobar la rama antes de commitear.** Han caído commits en la rama
equivocada más de una vez. `git branch --show-current` cuesta nada.

**`page.goto` recarga la aplicación**, y los adaptadores falsos vuelven a su
semilla. Una prueba que cree algo y luego mire otra pantalla tiene que navegar
POR LA INTERFAZ.

**Una prueba de comportamiento no afirma un número absoluto de datos de
ejemplo.** Volvió a pasar el 11 de septiembre: añadir a `sessionsSeed` una sesión
sin cerrar rompió una prueba que esperaba «una sesión» en la ficha de un alumno,
sin que nada de la aplicación fallara. Se escriben en diferencias, o se ajusta la
cifra dejando escrito de dónde sale.

**Una prueba que pulsa por coordenadas se rompe cuando el componente crece.** La
de la tarjeta de alumno pulsaba a 30 px del borde inferior; al añadirle la línea
de «sin cuenta», ese punto cayó sobre la barra de navegación. Se arregló
desplazando la tarjeta con `block: 'end'` antes de medir.

**`getByLabel` sobre un `Select` de Radix devuelve DOS elementos**: el botón
visible y un `<select>` nativo oculto. Hacer clic en el oculto no abre nada **ni
da error**, así que la prueba muere mucho después. Se filtra por rol:
`getByRole('combobox', { name, exact: true })`.

**El panel del navegador ESCALA la página, así que `getBoundingClientRect`
miente**: un control de 44 px devolvía 41,8. Para medir en el panel,
`offsetHeight` / `offsetWidth`. Y arranca a ~568 px, que ya es móvil: fijar el
viewport y devolverlo a `desktop` al terminar.

**`requestAnimationFrame` no entrega fotogramas en el panel de vista previa**,
aunque `visibilityState` diga `visible`. Distinguir «no anima» de «no funciona».

**El buffer de consola arrastra errores de sesiones anteriores.** Para leer
errores de verdad, pestaña nueva.

**`shared/ui` trae clases de Tailwind 4 que aquí no generan nada** —`shadow-xs`,
`outline-hidden`, `field-sizing-content`—: quedan **once** repartidas por la
carpeta, con Tailwind 3.4. No siempre es cosmético: en `select.tsx` la clase
muerta era el tope de altura del panel. Se arreglaron los dos `max-h-`; el resto
sigue inerte y sin auditar.

```bash
grep -rnoE "shadow-xs|outline-hidden|field-sizing-content" src/shared/ui/
```

---

## Decisiones ya tomadas — no volver a discutirlas

- **Puertos y adaptadores.** El SDK de Supabase sólo se importa en
  `shared/infrastructure/supabase`. Lo impide `no-restricted-imports`, no una
  convención. Migrar de backend = escribir adaptadores y tocar `app/container.ts`.
  **Hay veintitrés puertos**, y todos tienen adaptador real y gemelo simulado.
- **El rol NUNCA vive en `user_metadata`.** Lo puede editar el propio usuario con
  una llamada. `intent` en el alta es una PETICIÓN; quien decide es el servidor.
- **El perfil se crea DENTRO del alta**, por disparador y en la misma
  transacción. Sin sesión —que es lo que pasa con la confirmación por correo
  activada— RLS no dejaría escribir la fila.
- **Lo que la base garantiza se prueba CONTRA la base.** Una regla del servidor
  sin prueba de contrato no está terminada. Y la migración se aplica en la nube
  DESPUÉS de que los contratos pasen, nunca antes.
- **Los errores viajan como RAZONES**, no como texto: `AppError.reason` es un
  tipo cerrado y `describeError` lo traduce al pintar. Una razón nueva se añade
  en tres sitios o no compila.
- **Toda cadena nueva va a los TRES diccionarios.** `Dictionary` es
  `Record<TranslationKey, string>`: una clave que falte no compila.
- **TypeScript se queda en 5.9.3.** `typescript-eslint@8` declara
  `typescript: ">=4.8.4 <6.1.0"`; TS 7 dejaría el proyecto sin lint tipado.
- **Interfaz en castellano, código en inglés.** Por eso el dominio es `progress`
  y la etiqueta dice «Progreso».
- **Se referencia el vocabulario, se copia la decisión.** El ejercicio se
  referencia por identificador; el bloque guardado se **copia** al insertarlo,
  porque si se referenciara, editar la biblioteca cambiaría en silencio el
  programa que alguien está haciendo esta semana.
- **De los seis catálogos sólo se editan dos.** Ejercicios y material son del
  entrenador. Grupos, patrones, objetivos y divisiones son vocabulario.
- **Responsive obligatorio, el móvil es el caso base.** Ver §1.6 de `CLAUDE.md`.
- **Ningún aviso antes de escribir.** El acuse de éxito va después de que el
  puerto resuelva, y el fallo se dice donde se hizo la acción. Es la regla que
  el bloque A de la segunda lectura terminó de aplicar.

---

## Pendiente

Ordenado por lo que cuesta frente a lo que arregla. Nada de esto está empezado.

**De la nube, y es lo primero:**

1. **Encender la confirmación por correo y montar SMTP**, en la misma tanda. Ver
   arriba. Mientras no se haga, cualquiera se registra con el correo de otro.
2. **Revocar `anon` de `cohort_of`, `protected_streak` y `wildcards_available`**,
   con su prueba de contrato. Una migración corta.
3. **`set search_path` en las cinco funciones** que quedaron fuera del
   endurecimiento.
4. **Encender la protección de contraseñas filtradas.** Un interruptor del panel.

**De higiene del repositorio:**

5. **Decidir qué se hace con `backup/supabase-test`**: se empuja a `origin` o se
   borra. Cuarta sesión en el limbo.
6. **Borrar `feature/supabase-integration`**, 138 commits por detrás y sin nada
   que rescatar. Y las ramas ya fusionadas, que son ocho.

**De producto, decidido posponer y no olvidar:**

7. **El plan no puede expresar progresión.** `PlanDay` sólo guarda un `routineId`
   y la rutina lleva toda la prescripción, así que no hay forma de decir «la
   misma sesión con más volumen la semana 3». Se ve en la semilla: la semana
   marcada `isDeload: true` descarga quitando un día —pasa de tres a dos— y las
   dos sesiones que quedan son idénticas a las de una semana normal, porque
   apuntan a la misma rutina. Descargar es bajar volumen o intensidad, no sólo
   entrenar menos veces. El eje que lo arreglaría es **estructura fija / dosis
   variable** aplicado al par plan-semana. Se decidió posponerlo, no hacerlo a
   medias.
8. **Faltan los eventos del equipo.** Los entrenamientos grupales no son una
   entidad nueva —`Session` ya tiene `kind: 'group'`—; un evento, una carrera o
   una quedada, sí.
9. **Las cuotas no guardan importes.** Poner precio exige decidir moneda y modelo
   de tarifas, y nada de eso está decidido.
10. **Los avisos son una bandeja dentro de la aplicación.** Quien no la abra no
    se entera. Correo o push son otro trabajo, y otro consentimiento.

**De rendimiento, sin decidir:**

11. El chunk `index` pesa **820 kB** y sigue subiendo —eran 769 kB el 9 de
    septiembre—. Vite avisa por encima de 500. Nadie ha decidido si merece
    `manualChunks`.

---

## Preguntas abiertas para el usuario

1. **¿`backup/supabase-test` se empuja o se borra?** Cuarta sesión preguntándolo.
2. **¿Se borran las ramas ya fusionadas?** Son ocho en `origin`, todas con su PR
   cerrado.
3. **¿Cuándo se enciende la confirmación por correo?** Es la única de la lista de
   pendientes que afecta a quien use la aplicación hoy, y exige montar SMTP
   antes.
4. **Los peldaños de la escalera de hitos y las constantes de nivel son una
   propuesta.** Están juntos y con nombre para que ajustarlos sea cambiar una
   constante, pero nadie los ha validado como producto. Lo mismo vale para los
   cuatro nodos de las rutas —0, 300, 1200 y 3000 puntos— y para el umbral de
   adherencia del 85 %.
5. **La lista de especialidades del registro es una propuesta**, no un dato
   validado.
