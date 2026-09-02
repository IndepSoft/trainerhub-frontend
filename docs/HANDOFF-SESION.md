# Traspaso de sesión — 1 sep 2026

Contexto **de sesión**, no de proyecto. Sirve para que la siguiente sesión
retome el trabajo sin volver a deducirlo todo. Las reglas permanentes viven en
[`../CLAUDE.md`](../CLAUDE.md); el registro de arquitectura, en
[`CAMBIOS-Y-ARQUITECTURA.md`](CAMBIOS-Y-ARQUITECTURA.md); la lista de la
adaptación móvil, en [`PWA-SEGUIMIENTO.md`](PWA-SEGUIMIENTO.md).

**Se pone al día cada sesión, y se reescribe cuando hace falta.** La versión del
27 de agosto se escribió para la rama `feature/pwa-adaptation` y en dos días
quedó desfasada en cuatro puntos a la vez: daba una ruta de proyecto que ya no
existía, una rama activa que ya se había fusionado, un «paso 4 de 6» que eran
ocho pasos cerrados, y afirmaba que no había pruebas cuando ya había decenas. Un
traspaso caducado hace más daño que ninguno, porque se lee como si fuera cierto.

Aquel documento se declaraba efímero —«cuando la adaptación a PWA esté
fusionada, se borra»—. Se fusionó, así que la condición ya se cumplió. Se
conserva el fichero con otro propósito: traspaso rodante entre sesiones.

---

## Dónde estamos ahora mismo

| Rama | Commit | Estado |
|---|---|---|
| `feature/redesign-ui` | el tip | **rama activa** |
| `develop` | `1492aed` en origin | 32 commits por detrás de la rama activa |
| `main` | `91d0fd8` | 90 commits por detrás; PR abierto sin fusionar |
| `feature/pwa-adaptation` | `23d110c` | fusionada en `develop` (PR #6): se puede borrar |
| `backup/supabase-test` | `d117d93` | recuperada de origin — ver «Trampas» |

⚠️ **La copia local de `develop` está en `513e9b5`, doce commits por detrás de
`origin/develop`.** Ramificar desde ella sin un `git pull` previo parte de un
punto viejo.

Estado verificado el 1 de septiembre, ejecutado y no supuesto: `npm run lint`
limpio, `npm run build` en verde, **156 pruebas de Playwright en verde**.

---

## Cómo levantar el entorno

El proyecto está en `D:\Develop\zdev-freelancer\trainerhub-frontend`.
**Ya no está en `C:\ddd-2`**: ese clon no existe en esta máquina.

```bash
npm run dev
```

`.claude/launch.json` define dos configuraciones de vista previa:
`trainerhub-dev` en el puerto 5178 y `trainerhub-preview` en el 4178.

**Credenciales de desarrollo.** El `.env` local tiene `VITE_USE_FAKE_AUTH=true`,
así que entra `FakeAuthAdapter`, no Supabase:

- `entrenador@indepsoft.com` — entrenador con ficha y con el crew de ejemplo,
  «Hierro y Asfalto», ya activo. Su código de invitación es `HIERRO24`.
- `admin@indepsoft.com` — administrador de plataforma. Aterriza en `/admin`,
  activa suscripciones y gestiona cuentas. **Sólo entra en su propio equipo,
  `CREWTEST`**: los de los demás son privados.
- `lucia@indepsoft.com` — entrenadora de «Hierro y Asfalto», sin gobierno del
  equipo. Es el caso del gimnasio, y trae además una concesión suelta —los
  ajustes— para poder ver el caso intermedio.
- Cualquier otro correo con formato válido entra sin ficha: cuenta sin equipo,
  que es como se prueba el flujo del alumno.
- Contraseña: seis caracteres o más, p. ej. `desarrollo123`
- `error@test.local` falla a propósito, para probar la interfaz de error

---

## Pruebas: sí las hay

Es el punto donde más se equivocaba la versión anterior de este documento.

- `tests/visual/screenshots.spec.ts`: **156 pruebas**. Muchas están
  parametrizadas por tres anchos —375, 768 y 1440— desde la constante
  `VIEWPORTS`.
- Se lanzan con `npx playwright test`. **No hay script `test` en
  `package.json`**; `--list` funciona sin levantar el servidor.
- `playwright.config.ts` arranca el servidor solo y reutiliza el que ya esté
  escuchando en el 5178. El *timeout* está en 240 s a propósito: Vite tarda más
  de dos minutos en el primer arranque tras cambiar dependencias.
- **No están en CI.** `.github/workflows/ci.yml` corre `npm ci`, `npm run lint`
  y `npm run build`, y sube `dist/` como artefacto. Nada más.
- Nacieron como capturas de revisión que «no afirman nada», pero la mayoría ya
  afirma: desbordamiento horizontal cero, controles de 44 px, contenedores por
  encima de 280, que la duración que muestra un formulario sea la que se guarda,
  y que un bloque insertado desde la biblioteca sea una copia y no una
  referencia.
- Una trampa que ya mordió: **`page.goto` recarga la aplicación**, y los
  adaptadores falsos vuelven a su semilla. Cualquier prueba que cree algo y
  luego compruebe otra pantalla tiene que navegar POR LA INTERFAZ, o estará
  comprobando la semilla.
- Y otra: la ruta del catálogo es `lazy`, así que su primera carga en desarrollo
  pasa de los cinco segundos por defecto cuando la máquina va cargada. Esa
  espera lleva margen explícito.
- **Pruebas atadas a la semilla.** Tres se rompieron al añadir historial de
  sesiones cerradas a `sessionsSeed`, sin que nada de la aplicación fallara:
  afirmaban «Completadas 0» y «Confirmadas 2», que eran las cifras exactas de la
  semilla de entonces. Se reescribieron en DIFERENCIAS —leer el contador antes y
  esperar uno más—. Regla que sale de ahí: una prueba de comportamiento no debe
  afirmar un número absoluto de datos de ejemplo.

**Y una trampa del panel de vista previa, no de la aplicación:
`requestAnimationFrame` no entrega nunca un fotograma ahí**, aunque
`document.visibilityState` diga `visible`. Cualquier cosa animada por fotogramas
—contadores, transiciones de salida de Radix— se queda congelada en su último
valor. Eso destapó un defecto real en `useCountUp`, que se ha corregido; pero al
verificar en ese panel hay que distinguir «no anima» de «no funciona».

---

## Trampas de este entorno

**`backup/supabase-test` se había perdido y se ha recuperado.** El traspaso
anterior advertía de que esa rama existía sólo en la máquina antigua y de que si
se borraba la copia el trabajo desaparecía. Al mudarse el proyecto de `C:\ddd-2`
a `D:\Develop`, la rama no viajó. GitHub todavía conservaba el objeto, así que se
ha rescatado:

```bash
git fetch origin d117d93f35ece5c48b5fef82694eb0800dc310d4
```

Ahora vive en la rama local `backup/supabase-test`. Son **10 commits de Diase13
y Edward Josué Mamani**, 138 ficheros y unas 15.600 líneas frente a `main`, con
un dominio `workouts` entero que nunca se fusionó. **Sigue existiendo sólo en
local y sigue siendo frágil.** Si de verdad importa, lo correcto es empujarla a
origin; si no importa, borrarla y dejarlo escrito. Lo que no puede es quedarse
en este limbo por tercera vez.

**Los 404 de `trainers` son esperados, no una regresión.** La base de datos de
Supabase existe pero está vacía: cero tablas. Cada carga del dashboard lanza
`GET /rest/v1/trainers` y recibe 404. La aplicación degrada bien.

**El buffer de consola del navegador arrastra errores de sesiones anteriores.**
Tras reiniciar la vista previa aparecen `ERR_CONNECTION_REFUSED` y fallos de
módulos que ya no existen. Para leer errores de verdad, abrir pestaña nueva.

**El panel del navegador arranca a ~568 px, que ya es móvil.** Sin fijar el
viewport con `resize_window`, las mediciones salen mal. Devolverlo a `desktop`
al terminar.

**Y el panel ESCALA la página, así que `getBoundingClientRect` miente.** Medido:
un control de 44 px devolvía 41,8 —factor 0,95—, lo que hace parecer que
incumple el objetivo táctil cuando no lo incumple. Para medir alturas y anchos
en el panel hay que usar `offsetHeight` / `offsetWidth`, que son de disposición
y no llevan la escala; `getBoundingClientRect` sólo es fiable en Playwright, que
fija un viewport real. Comprobarlo es una división:
`rect.height / offsetHeight`.

**`git mv` falla en Windows con «Permission denied»** por bloqueos de fichero de
procesos node. La alternativa que funciona es `cp -r` + `rm -rf`; git lo detecta
igual como renombrado.

**`getByLabel` sobre un `Select` de Radix devuelve DOS elementos.** Radix pinta,
junto al botón visible, un `<select>` nativo oculto para que el control participe
en el formulario, y la etiqueta alcanza a los dos. Con dos desplegables
«Ejercicio» en pantalla, `getByLabel('Ejercicio').nth(1)` era el select oculto
del primero, no el disparador del segundo — y hacer clic en un `<select>` oculto
no abre nada **ni da error**, así que la prueba moría mucho después buscando una
opción que nunca apareció. Se filtra por rol y nombre: `getByRole('combobox',
{ name, exact: true })`, que el nativo no tiene. Los ayudantes `desplegables` y
`elegirDelDesplegable` de la suite ya lo hacen.

**Los *heredoc* de bash no sirven para escribir estos documentos.** La
herramienta envuelve el comando en comillas simples, así que cualquier comilla
del contenido —o el propio delimitador citado— rompe el análisis sintáctico. Se
escriben con la herramienta de escritura de ficheros.

**`gh` no está instalado** (comprobado el 30 de agosto). Los PR no se pueden
crear por CLI: hay que abrir la URL de `compare` en el navegador.

**Comprobar la rama antes de commitear.** En una sesión anterior siete commits
cayeron en una rama equivocada. `git branch --show-current` cuesta nada.

---

## Decisiones ya tomadas — no volver a discutirlas

- **Puertos y adaptadores.** El SDK de Supabase sólo se importa en
  `shared/infrastructure/supabase`. Lo impide una regla de eslint, no una
  convención. Migrar de backend = escribir adaptadores y tocar `app/container.ts`.
- **TypeScript se queda en 5.9.3.** `typescript-eslint@8` declara
  `typescript: ">=4.8.4 <6.1.0"`; TS 7 dejaría el proyecto sin lint tipado.
- **Cada dominio sigue el mismo esquema:** `types/`, `data/`, `hooks/`,
  `components/` plano, `libs/` para lo puro, `infrastructure/routes.tsx`, y una
  página que sólo compone.
- **Los datos simulados se sirven por un hook**, que es la costura donde entra
  el repositorio real.
- **Interfaz en castellano, código en inglés.** Por eso el dominio es `progress`
  y la etiqueta del menú dice «Progreso».
- **Desafíos y rachas viven en Entrenamientos, no en Progreso.** Son cosas que
  el entrenador *crea para asignar*; en Progreso queda lo que el estudiante
  *consigue*. Se vaciaron a `ComingSoon` porque las ~2000 líneas que había
  operaban sobre datos globales, sin ligar a ningún estudiante y sin forma de
  asignarlos.
- **«Plantilla» ya no existe.** Fue una marca sin comportamiento: sólo repartía
  la lista en dos pestañas. Como **nada se asigna a ningún estudiante**, todas
  las rutinas eran igualmente plantillas y la distinción no distinguía. Cuando
  exista la asignación será derivable, o se sustituirá por carpetas o favoritos.
- **Se referencia el vocabulario, se copia la decisión.** Es la regla que ordena
  el dominio. El ejercicio se referencia por identificador —si cambia de nombre,
  cambia en todas partes, y por eso su borrado está protegido—. El bloque
  guardado se **copia** al insertarlo: si se referenciara, editar la entrada de
  la biblioteca cambiaría en silencio el programa que alguien está haciendo esta
  semana.
- **De los seis catálogos sólo se editan dos.** Ejercicios y equipamiento son
  del entrenador. Grupos musculares, patrones, objetivos y divisiones son
  vocabulario: abrirlos a texto libre rompe el filtrado en cuanto uno escribe
  «Pecho» y otro «Pectoral».

---

## Qué hizo la sesión del 29 de agosto — 20 commits

**Sistema de diseño.** `c612e66` introduce los tokens y `1a01d78` barre 142
colores escritos a mano. De ahí salen la paleta con nombre —`cobalt`, `ember`,
`ink`, `bone`, `scale-1..3`—, dos radios en lugar de una escala uniforme
(`radius-block` a escuadra para bloques, `radius-action` en píldora para
acciones) y Barlow con su corte Condensed como única familia en dos anchos.
Encima: `PageHeader` único para las seis páginas, logros como placas, pulsación
larga, esqueletos de carga, deslizar entre pestañas y tirar para recargar.

**Calendario**, cinco commits. La sesión pasa a ser una tarjeta con la estética
de `students`; la celda semanal es su versión reducida; las sesiones se colocan
sobre una escala de tiempo real (`libs/sessionLayout.ts`); la cabecera queda
fija y la rejilla gana campo de visión.

**Entrenamientos**, cuatro commits, los últimos de la sesión:

1. Desafíos y rachas salen de Progreso y entran aquí, vaciados a `ComingSoon`.
2. Modelo de dominio `Ejercicio → Bloque → Rutina → Plan`, con cinco catálogos
   de referencia, `BlockMethod` —simple, superserie, triserie, circuito— y
   duración **calculada** en `libs/routine.utils.ts` en vez de almacenada.
3. Corrección: plantillas y rutinas seguían siendo dos arrays separados y
   `isTemplate` no lo leía nadie.

---

## Qué hizo la sesión del 30–31 de agosto — 5 commits

1. **Creación de rutinas** (`b811963`). La pantalla que faltaba. Guardar guarda
   de verdad: la colección pasa a `stores/routinesStore.ts` y el mock queda como
   semilla. El resumen en vivo usa las mismas funciones que la tarjeta y la
   ficha, así que la duración que se ve al escribir es la que se guarda. De paso,
   los planes dejan de ser inalcanzables: pasan a una pestaña.
2. **Fuera «plantilla»** (`0023e8b`). Ver «Decisiones ya tomadas».
3. **Catálogo** (`5b51f37`), en `/trainings/catalog`. Era un agujero abierto por
   el commit 1: la creación de rutinas ofrecía quince ejercicios fijos y no
   había forma de añadir el decimosexto.
4. **Biblioteca de bloques** (`e129486`). Guardar un bloque con un gesto y
   volver a insertarlo, copiando.
5. **Ficha de plan y borrado con integridad.** La tarjeta lleva a una ficha que
   se lee; editar es una acción de dentro. Una rutina que algún plan programa no
   se puede borrar, y el diálogo dice quién lo impide.
6. **`Routine` sube a `shared/domain/entities` y nace `RoutineRepository`.** Se
   cumplió la condición que este documento dejaba escrita: la agenda cuelga una
   rutina de una sesión, así que la entidad cruza a un segundo dominio. Los dos
   la leen por el puerto, vía `container`, y ninguno importa del otro —igual que
   con los alumnos—. El almacén de zustand desaparece; su sitio lo ocupa
   `FakeRoutineRepository`.
7. **`Session` sube a `shared/domain/entities` y nace `SessionRepository`.** La
   ficha del estudiante lista y agenda sus sesiones, así que la entidad cruza a
   `students`. El alumno pasa a guardarse por IDENTIFICADOR: era su nombre en
   texto, y el dato ya estaba corrompido —las sesiones decían «María García» y
   «Ana Martínez» cuando en el padrón estaban «María Gómez» y «Ana Torres»—.
   Lo agendado en la ficha aparece en el calendario y al revés, sin que ninguno
   de los dos dominios sepa del otro: comparten origen, no estado.
8. **Edición de rutinas y planes completos.** `RoutineForm` y `PlanForm` sirven
   para alta y edición: la ruta decide, y `submit` devuelve datos sin
   identificador para que quien llama elija si crea o actualiza. La acción
   primaria de la cabecera sigue a la pestaña —«Nueva Rutina» / «Nuevo Plan»— y
   la pestaña activa pasó a vivir en la URL, que es lo que permite volver a
   `/trainings?tab=planes` tras guardar un plan en vez de aterrizar donde no se
   ve lo que acabas de crear.

---

## ⚠️ La deuda que salió del análisis y NO se ha tocado

**El plan no puede expresar progresión, que es su única razón de existir.**

`PlanDay` sólo guarda un `routineId`, y la rutina lleva dentro toda la
prescripción. Resultado: no hay forma de decir «la misma sesión, con más volumen
la semana 3». Para progresar hay que duplicar la rutina entera por semana, que
es la misma duplicación que la biblioteca de bloques resuelve un nivel más
abajo — pero sin resolver.

Ya se nota en los datos, y es medible: en `plans.mock.ts`, la semana 4 está
marcada `isDeload: true` y **apunta a la misma rutina con la misma prescripción
que las tres anteriores**. La descarga está rotulada y no descarga nada. Es
exactamente la enfermedad que tenía `isTemplate`: una marca sin comportamiento.

El eje que lo arreglaría es **estructura fija / dosis variable**, aplicado al par
plan-semana: la sesión define qué ejercicios y con qué método, y la semana del
plan define series, repeticiones y RIR. Es un rediseño del modelo de planes y se
decidió posponerlo, no hacerlo a medias.

Mientras tanto, los planes son de sólo lectura: no hay ficha de plan ni forma de
crearlos.

---

## Estado estructural, medido

**Puertos: sólo tres.** `AuthPort`, `TrainerRepository` y `StudentRepository`.
No existen `RoutineRepository`, `SessionRepository` ni `DashboardRepository`; los
ficheros `*.mock.ts` los esperan con un `TODO` que nombra la costura.

**Siete puertos**: `AuthPort`, `TrainerRepository`, `StudentRepository`,
`RoutineRepository`, `SessionRepository`, `PlanRepository` y
`AssignmentRepository`. Y tres módulos de reglas puras en `shared/domain`:
`sessionScheduling` (choques), `planScheduling` (volcado) y `routineDuration`. Cada uno nació al cumplirse su condición —una entidad
sube cuando la necesitan DOS dominios, según `shared/domain/entities/student.ts`—
y no antes.

**Siguen en zustand, y siguen sin ser puertos**: `catalogStore` y
`blockLibraryStore` en `trainings`. Ninguna de esas entidades cruza todavía.

**ASIGNAR NO ES AGENDAR**, y son tres compromisos independientes:

| | Qué dice | ¿Ocupa un hueco? |
|---|---|---|
| Sesión | «esto, este día a esta hora» | sí, por definición |
| Rutina asignada | «éste es tu repertorio» | no |
| Plan asignado | «éste es tu programa» | no |

No son excluyentes: un alumno puede tener un plan y tres rutinas a la vez. Y un
plan puede estar asignado **sin fecha de inicio**, que es un estado legítimo
—«ya veremos cuándo empiezas»— y por eso `startDate` admite `null`.

**Volcar un plan a la agenda** es la cuarta acción, y ya existe: desde la
asignación, con una hora por cada día de la semana que el plan usa, una previa
que marca los conflictos y confirmación explícita. Genera las sesiones
—materializadas, no derivadas— con la duración estimada de cada rutina.

Sólo se ofrece en planes **con fecha de inicio**: sin ella no hay desde cuándo
contar las semanas.

**Cada dominio tiene su propio hook sobre el puerto compartido** en vez de
importar del vecino: `useSchedulableStudents` y `useSchedulableRoutines` en
`calendar`, `useStudentSessions` y `useAssignableRoutines` en `students`. Se
repite la forma a propósito; lo que no se repite es el origen del dato.

⚠️ **Todo lo creado vive sólo en memoria.** Al recargar la página vuelven las
semillas: la rutina creada, el ejercicio dado de alta y la biblioteca entera
desaparecen. No se persiste en `localStorage` a propósito, porque sería fingir
un backend. Tenerlo presente al probar a mano —y en las pruebas, que navegan por
la interfaz y no con `page.goto` justamente por esto.

**`FakeStudentRepository` está activo en producción**, marcado en
`app/container.ts`. Es el único adaptador falso que no se elimina por
*tree-shaking*, porque no está detrás de `import.meta.env.DEV` como el de auth.

**37 `TODO` en `src/`** (sin contar `shared/ui`), en cuatro familias: datos
simulados esperando repositorio; acciones declaradas y no conectadas —cinco en
`StudentCard`, cinco en `RoutineCard`, dos en cada ficha de detalle, y los dos
componentes de filtros, que no filtran nada—; autenticación incompleta
—`AuthPort` no expone `signUp`, así que «Crear cuenta» no da de alta a nadie, y
recuperar contraseña tampoco existe—; y copy pendiente de producto.

**Rutinas y planes se crean y se editan.** Lo que sigue sin conectar es «Usar en
una sesión» y «Eliminar», que dependen del flujo de asignación.

**No hay ficha de plan.** La tarjeta lleva directamente a su formulario de
edición, que por ahora ES la vista de un plan.

**`navigation.config.ts` sigue declarando `/settings` y `/login` sin ruta
registrada.** `/reports` se resolvió en el paso 5 de la adaptación móvil.

⚠️ **`shared/ui` trae ~20 clases de Tailwind 4 que aquí no generan nada.** Los
componentes de shadcn se copiaron de una version pensada para Tailwind 4 y el
proyecto usa la 3.4, asi que la forma con parentesis —`max-h-(--variable)`,
`size-(--cell-size)`, `origin-(--variable)`— es sintaxis invalida y Tailwind no
emite ninguna regla. Tambien estan muertas `shadow-xs`, `outline-hidden` y
`field-sizing-content`, que en la 3 se llaman de otra forma o no existen.

No es cosmetico en todos los casos: en `select.tsx` la clase muerta era el TOPE
DE ALTURA del panel, asi que el desplegable de veintisiete tramos horarios crecia
por encima de la ventana y parte de la lista quedaba inalcanzable. Comprobado en
el navegador: `max-height` computaba a `none` y no habia ni una regla en la hoja
de estilos que mencionara la variable.

Arreglados los dos `max-h-` —`select` y `dropdown-menu`— por su consecuencia
funcional. El resto sigue inerte y sin auditar; el sospechoso mas probable es
`size-(--cell-size)` en `calendar.tsx`. Se encuentran con:

```bash
grep -rn "\-(\-\-\|shadow-xs\|outline-hidden\|field-sizing" src/shared/ui/
```

**El chunk `index` pesa 591 kB**, por encima del aviso de Vite. Nadie ha decidido
todavía si merece `manualChunks`.

---

## El plan en curso: cerrar el flujo sin huecos

Decidido con el usuario. El orden lo imponen las dependencias, no las ganas.

### Hecho

1. **Ciclo de vida de la sesión.** `completed` existe y el cambio de estado
   persiste. Antes nacía pendiente y ahí se quedaba.
2. **La pantalla de ejecución.** Dos modos: fuerza —los bloques de su rutina,
   avance en series— y cardio, que es la que había. Terminar marca la sesión
   como completada, y ahí se cierra el bucle.
3. **El panel dice la verdad.** Indicadores contados, próximas sesiones de la
   agenda, actividad reciente = sesiones completadas. Fuera el indicador de
   ingresos y las tendencias: no hay fuente ni histórico.

4. **Crear, editar y borrar estudiantes.** `StudentRepository` era el ÚNICO
   puerto sin `create`. Ya lo tiene, más `update`, `remove` y `linkAccount`.
   «Añadir estudiante» e «Invitar estudiante» eran dos `console.log` y ahora son
   un solo botón que da de alta de verdad: desde que el alumno se enlaza con su
   cuenta por el correo que se escribe ahí, dar de alta ES invitar. Borrar está
   protegido —un alumno con sesiones agendadas no se borra— con la misma regla
   que ya gobernaba rutinas y catálogo. Se quitó «Duplicar»: duplicar a una
   persona daría dos fichas con el mismo correo, que es justo la clave del
   enlace.
5. **`AuthPort.signUp`.** «Crear cuenta» daba de alta a nadie. Ahora crea la
   cuenta y **el perfil que va con ella**, y decide cuál por el correo: si ya
   tiene ficha de alumno, la cuenta se ata a esa ficha; si no, nace un
   entrenador. El rol no se guarda en la cuenta, se deduce de qué repositorio
   conoce el perfil.

   Salió de ahí `FakeTrainerRepository`: con autenticación simulada, el
   identificador de perfil lo inventa el adaptador falso, así que preguntarle
   por él a Supabase no encontraba nada. Los dos adaptadores falsos se eligen
   ahora con la misma condición, para que no puedan desparejarse.
6. **Reglas de gamificación.** Construidas, y todo sale de las sesiones
   cerradas.

   Primero hubo que guardar el hecho: `Session` gana `result` —series marcadas,
   series prescritas, tiempo y día de cierre— y el puerto gana `complete()`, una
   sola operación en vez de un cambio de estado seguido de una escritura. Antes,
   terminar una sesión perdía las series y el tiempo con el componente.

   Sobre eso, `progressRules.ts`, puro: 20 XP por sesión más 1 por serie —el
   fijo existe porque el cardio no tiene series—, niveles de coste lineal, y la
   racha contada hacia atrás desde hoy, que **no se rompe por no haber entrenado
   hoy todavía**. Los logros dejan de tener la condición en prosa: cada uno lleva
   una función, y su fecha de desbloqueo se obtiene repasando el historial día a
   día, así que es real. Diez logros se fueron —«métricas» y «desafíos»—: no hay
   registro corporal ni sistema de desafíos, y un logro inalcanzable es peor que
   no ofrecerlo.
7. **El progreso ya es de alguien.** La pantalla enseñaba una racha y un nivel
   sin decir de quién. Ahora lleva `?student=<id>` en la URL, un selector en la
   cabecera, y «Ver progreso» desde la ficha del alumno lleva al suyo.

### Pendiente después

- **Roles y acceso de estudiante, la mitad que falta.** El registro ya distingue
  quién eres, pero después nadie lo usa: entrenador y alumno aterrizan los dos en
  `/dashboard`. Faltan las guardas por rol, la navegación filtrada y la
  superficie del alumno.
- Filtros de rutinas y de estudiantes: los controles no filtran nada.
- `/settings` sigue en el menú lateral sin ruta registrada; `/login` es
  configuración muerta que nadie pinta.
- «Vista previa» en las rutinas.
- Reportes: cuatro pestañas vacías.
- `planAssignmentId` en las sesiones volcadas, y el volcado duplicado.

---

## Preguntas abiertas para el usuario

0. **Subir los 5 commits de esta sesión.** Están sólo en esta máquina.
1. **PR a `main`**: 90 commits esperando. `main` hoy no compila —conserva
   marcadores de conflicto y el router desconectado—, así que fusionar lo
   arreglaría.
2. **Qué hacer con `backup/supabase-test`**: empujarla a origin o borrarla. Hoy
   está sólo en local y sin respaldo, que es lo peor de las dos opciones.
3. **Los peldaños de la escalera de hitos y las constantes de XP son una
   propuesta.** 3, 7, 12, 20 y 30 sesiones; 20 XP por sesión y 1 por serie. Están
   juntos y con nombre en `progressRules.ts` para que ajustarlos sea cambiar una
   constante, pero nadie los ha validado como producto.
4. **La lista de especialidades del registro es una propuesta**, no un dato
   validado. Lleva su `TODO`.
5. **Meter Playwright en CI**, y con ello un script `test` en `package.json`.
   Con 72 pruebas que ya afirman cosas, dejarlas fuera de CI es desperdiciarlas.
6. **La progresión del mesociclo**, arriba. Es el rediseño más grande pendiente.
7. **Dónde aterriza un alumno al entrar.** Hoy, en el panel del entrenador. Es
   la pieza que queda del acceso de estudiante y hace falta decidir qué ve.
