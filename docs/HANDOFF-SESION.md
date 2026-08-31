# Traspaso de sesión — 30 ago 2026

Contexto **de sesión**, no de proyecto. Sirve para que la siguiente sesión
retome el trabajo sin volver a deducirlo todo. Las reglas permanentes viven en
[`../CLAUDE.md`](../CLAUDE.md); el registro de arquitectura, en
[`CAMBIOS-Y-ARQUITECTURA.md`](CAMBIOS-Y-ARQUITECTURA.md); la lista de la
adaptación móvil, en [`PWA-SEGUIMIENTO.md`](PWA-SEGUIMIENTO.md).

**Se reescribe entero cada sesión, no se parchea.** La versión anterior se
escribió el 27 de agosto para la rama `feature/pwa-adaptation` y en dos días
quedó desfasada en cuatro puntos: daba una ruta de proyecto que ya no existe,
una rama activa que ya se fusionó, un «paso 4 de 6» que hoy son ocho pasos
cerrados, y afirmaba que no había pruebas cuando hay cincuenta y dos. Un
traspaso caducado hace más daño que ninguno, porque se lee como si fuera cierto.

Aquel documento se declaraba efímero —«cuando la adaptación a PWA esté
fusionada, se borra»—. Se fusionó, así que la condición ya se cumplió. Se
conserva el fichero con otro propósito: traspaso rodante entre sesiones.

---

## Dónde estamos ahora mismo

| Rama | Commit | Estado |
|---|---|---|
| `feature/redesign-ui` | `549558a` | **rama activa**, sincronizada con origin |
| `develop` | `1492aed` en origin | 27 commits por detrás de la rama activa |
| `main` | `91d0fd8` | 85 commits por detrás; PR abierto sin fusionar |
| `feature/pwa-adaptation` | `23d110c` | fusionada en `develop` (PR #6): se puede borrar |
| `backup/supabase-test` | `d117d93` | recuperada de origin — ver «Trampas» |

⚠️ **La copia local de `develop` está en `513e9b5`, doce commits por detrás de
`origin/develop`.** Ramificar desde ella sin un `git pull` previo parte de un
punto viejo.

Estado verificado el 30 de agosto, ejecutado y no supuesto: `npm run lint`
limpio, `npm run build` en verde, 52 pruebas de Playwright.

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

- Email: cualquiera con formato válido, p. ej. `entrenador@indepsoft.com`
- Contraseña: seis caracteres o más, p. ej. `desarrollo123`
- `error@test.local` falla a propósito, para probar la interfaz de error

---

## Pruebas: sí las hay

Es el punto donde más se equivocaba la versión anterior de este documento.

- `tests/visual/screenshots.spec.ts`: **52 pruebas**, 53 aserciones. Son 30
  bloques `test()`, la mayoría parametrizados por tres anchos —375, 768 y
  1440— desde la constante `VIEWPORTS`.
- Se lanzan con `npx playwright test`. **No hay script `test` en
  `package.json`**; `--list` funciona sin levantar el servidor.
- `playwright.config.ts` arranca el servidor solo y reutiliza el que ya esté
  escuchando en el 5178. El *timeout* está en 240 s a propósito: Vite tarda más
  de dos minutos en el primer arranque tras cambiar dependencias.
- **No están en CI.** `.github/workflows/ci.yml` corre `npm ci`, `npm run lint`
  y `npm run build`, y sube `dist/` como artefacto. Nada más.
- Nacieron como capturas de revisión que «no afirman nada», pero varias ya
  afirman: desbordamiento horizontal cero, pestañas de 44 px, y que la pestaña
  de plantillas muestre plantillas y no rutinas.

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

**`git mv` falla en Windows con «Permission denied»** por bloqueos de fichero de
procesos node. La alternativa que funciona es `cp -r` + `rm -rf`; git lo detecta
igual como renombrado.

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
- **«Plantilla» es la marca `isTemplate`, no una colección aparte.** Costó dos
  commits: el primero lo afirmó sin llegar a hacerlo.

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

## Estado estructural, medido

**Puertos: sólo tres.** `AuthPort`, `TrainerRepository` y `StudentRepository`.
No existen `RoutineRepository`, `SessionRepository` ni `DashboardRepository`;
nueve ficheros `*.mock.ts` los esperan con un `TODO` que nombra la costura.

**`FakeStudentRepository` está activo en producción**, marcado en
`app/container.ts`. Es el único adaptador falso que no se elimina por
*tree-shaking*, porque no está detrás de `import.meta.env.DEV` como el de auth.

**31 `TODO` en `src/`** (sin contar `shared/ui`), en cuatro familias: datos
simulados esperando repositorio; acciones declaradas y no conectadas —cinco en
`StudentCard`, cinco en `RoutineCard`, dos en cada ficha de detalle, y los dos
componentes de filtros, que no filtran nada—; autenticación incompleta
—`AuthPort` no expone `signUp`, así que «Crear cuenta» no da de alta a nadie, y
recuperar contraseña tampoco existe—; y copy pendiente de producto.

**`navigation.config.ts` sigue declarando `/settings` y `/login` sin ruta
registrada.** `/reports` se resolvió en el paso 5 de la adaptación móvil.

**El chunk `index` pesa 591 kB**, por encima del aviso de Vite. Nadie ha decidido
todavía si merece `manualChunks`.

---

## Preguntas abiertas para el usuario

1. **PR a `main`**: 85 commits esperando. `main` hoy no compila —conserva
   marcadores de conflicto y el router desconectado—, así que fusionar lo
   arreglaría.
2. **Qué hacer con `backup/supabase-test`**: empujarla a origin o borrarla. Hoy
   está sólo en local y sin respaldo, que es lo peor de las dos opciones.
3. **El contenido de `progress` está escrito para el entrenador** («3 estudiantes
   necesitan atención») aunque es un módulo del estudiante. Decisión de producto.
4. **La lista de especialidades del registro es una propuesta**, no un dato
   validado. Lleva su `TODO`.
5. **Meter Playwright en CI**, y con ello un script `test` en `package.json`.
