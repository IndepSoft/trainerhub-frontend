# Seguimiento: adaptación a PWA

Lista de trabajo viva para la rama `feature/pwa-adaptation`. Se marca a medida
que se avanza, para no perder el hilo entre sesiones.

**Regla que lo gobierna:** [`../CLAUDE.md`](../CLAUDE.md) §1.6 — Responsive
obligatorio.
**Auditoría de origen:** medida en navegador a 375 × 812 el 27 ago 2026.
**Contexto de sesión y trampas del entorno:** [`HANDOFF-SESION.md`](HANDOFF-SESION.md)

Criterio para marcar un paso: **verificado en navegador a 375 px**, no
«compila». Tres de los defectos encontrados compilaban y pasaban el lint sin
una queja.

---

## Estado de partida (medido, no leído)

| Dominio | Veredicto inicial | Dato que lo sostiene |
|---|---|---|
| `calendar` | Inutilizable | 8 columnas fijas a 33 px; «Lun» recortado (17 de 27 px) |
| `dashboard` | Ilegible | 0 prefijos responsive; indicadores a 121–154 px; texto a 77 px |
| `progress` | Aceptable | 21 prefijos, pero 4 rejillas fijas; pestañas 57 × 29 px |
| `reports` | Sin evaluar | Sin ruta registrada: inalcanzable |
| `trainings` | Correcto | 0 prefijos, aprueba por tener una sola columna |
| `students` | Correcto | Único con adaptación deliberada |

---

## Pasos

### ✅ 1 · Centrado del diálogo

Commit `513e9b5` — en `develop`.

- [x] Diagnosticada la causa: `zoom-in-95` reescribe `transform` y anula
      `-translate-x-1/2`
- [x] Centrado con `inset-0` + `m-auto` + `h-fit`, sin tocar `transform`
- [x] Añadido `max-h-[calc(100dvh-2rem)]` con `overflow-y-auto`
- [x] Verificado a 375 px: izq. 9 / der. 366, **0 px fuera** (antes: 178 fuera)
- [x] Verificado a 1280 px: izq. 397 de 397 esperados, **desviación 0**
- [x] Comprobado en los dos diálogos de calendar

### ✅ 2 · calendar → vista día bajo `md`

Commit `750bad9` — en `feature/pwa-adaptation`.

- [x] `useCalendar` devuelve el modo efectivo; en móvil siempre `day`
- [x] La preferencia del usuario se conserva aparte para volver a escritorio
- [x] `canChooseViewMode` oculta el selector cuando no hay nada que elegir
- [x] Reutilizado `useIsMobile` en vez de crear otro
- [x] Cabeceras apiladas y con envoltura en móvil
- [x] Objetivos táctiles a 44 px en los controles del dominio
- [x] `shrink-0` en las flechas: encogían a 42 px por ser elementos flex
- [x] Verificado a 375 px: sin rejilla de 8 columnas, sin selector, 0 desborde
- [x] Verificado a 1280 px: vista semanal de vuelta, columnas de 113 px

### ✅ 3 · dashboard → apilar indicadores y tarjetas

Partía de cero: no tenía ni un solo prefijo responsive.

- [x] Los 4 indicadores pasan a rejilla `1 / sm:2 / lg:4`, ya no a una fila fija
- [x] Las dos tarjetas inferiores se apilan hasta `lg`
- [x] `IndicatorCardComponent` deja de declarar su propio `flex-1`: la
      disposición es responsabilidad del contenedor, no de la tarjeta
- [x] Mismo arreglo aplicado a `reports`, que repetía el patrón idéntico
- [x] Verificado a 375 px
- [x] Verificado a 1280 px sin regresión

| Medida | Antes | Después |
|---|---|---|
| Ancho de indicador | 121–154 px | **311 px** |
| Texto de actividad | 77 px | **232 px** |
| Tarjetas inferiores | lado a lado | apiladas, 343 px |

En escritorio se conserva: los cuatro en una fila a 226 px y las dos tarjetas
lado a lado a 468 px.

### ✅ 4 · Pestañas desplazables y objetivos táctiles

Transversal: toca `shared/ui` y `shared/components/navigation`.

- [x] Las cuatro `TabsList` con `grid-cols-5` pasan a desplazamiento horizontal
      en móvil y conservan la rejilla desde `md`
- [x] Botón de menú móvil: 36 × 36 → **44 × 44**
- [x] Botón de notificaciones: 28 × 28 → **44 × 44**
- [x] Revisado el resto de `size="sm"` y `size="icon"`
- [x] Verificado a 375 px en `/dashboard`, `/trainings`, `/students`,
      `/calendar`, `/progress` y `/authentication`: **0 desborde, 0 controles
      por debajo de 44 px**
- [x] Verificado a 1280 px sin regresión: la lista vuelve a `grid`, 36 px de
      alto, pestañas de 229 × 29

**Lo que el plan no anticipaba.** El defecto no eran cuatro `TabsList`: era que
**ninguna variante de `Button` llegaba a 44 px** —`sm` 32, `default` 36, `lg` 40,
`icon` 36— y el disparador de `Select` se quedaba en 36. Parchear los diez sitios
que las usan habría sido duplicación; el arreglo está en la variante, móvil
primero, con `md:` devolviendo la altura compacta en escritorio.

| Medida | Antes | Después |
|---|---|---|
| Pestaña en `progress` | 57 × 29 | **69–84 × 44**, con desplazamiento |
| Lista de pestañas | comprimida a 261 px | 261 visibles / 383 de contenido |
| Botones de `StudentCard` | 261 × 38 | **261 × 44** |
| Filtros de `Select` | 227 × 36 | **227 × 44** |

**Tres trampas que costó encontrar**, anotadas para no repetirlas:

- `min-width` explícito en una pestaña **destruye** el `min-width: auto` de
  flexbox, que era justo lo que impedía comprimirlas. Con él, las cinco
  seguían aplastándose a 51 px en vez de desbordar y desplazarse. Se quitó: el
  ancho lo da el contenido más `px-3`.
- `height` no basta para un botón con `flex-1` dentro de una columna flex:
  `flex-basis: 0` gana y lo dejaba en 38 px. El suelo tiene que ser `min-height`.
- Dos botones de `ChallengeCard` eran `size="sm"` con un icono dentro y **sin
  nombre accesible**. Pasan a `size="icon"` con `aria-label`.

Además, los dos botones de la cabecera de `students` estaban escritos a mano
—con un `hover:bg-blue-700` fuera del sistema de color— en vez de usar el
componente compartido. Ahora usan `Button`.

⚠️ **`reports` recibió el mismo cambio pero no se ha podido verificar en
navegador**: sigue sin ruta registrada. Queda cubierto por el paso 5.

### ✅ 5 · Registrar la ruta de `reports`

Sin ruta no había forma de auditarlo, y el sidebar enlazaba a una página que no
existía.

- [x] Creado `reports/infrastructure/routes.tsx` con `withProtectedRoute`
- [x] Registrado en `app/routes/index.tsx`
- [x] Auditado a 375 px
- [x] Verificado a 1280 px sin regresión

**El defecto que salió era grave y estructural.** La página era ilegible casi
entera: el contenedor de scroll medía **0 px de alto** con 624 px de contenido, y
la sección de gamificación —1760 px— colgaba **fuera** de él, dentro de una raíz
`overflow-hidden`. Sin scroll posible, todo lo que pasaba de 812 px era
inalcanzable, incluidas las pestañas que el paso 4 acababa de arreglar.

Es la misma clase de fallo que cerró `a26ec30` para las otras cinco páginas. En
`reports` quedó a medias: recibió el `flex-1` pero la sección suelta nunca se
movió dentro del contenedor. Ahora sigue la estructura de las demás.

| Medida | Antes | Después |
|---|---|---|
| Contenedor de scroll | **0** visible / 624 | **595** visible / 2232 |
| Sección fuera del scroll | sí, 1760 px | no |
| Desborde horizontal | 0 | 0 |
| Controles bajo 44 px | 0 | 0 |

De paso, y por las reglas 1.1 y 1.2:

- Bloque de código comentado y dos `<div>` vacíos, eliminados.
- `useState` + `useEffect` copiaban a estado una constante de módulo: sólo
  añadían un render extra y un primer pintado en blanco. Se usa la constante.
- Las cuatro pestañas sin contenido mostraban «page2 works» —andamiaje del
  generador— que un usuario lee como un fallo. Pasan a un aviso honesto con un
  `TODO` que explica qué falta decidir.
- El relleno de `Card` baja a 16 px en móvil y vuelve a 24 desde `md`: una
  tarjeta dentro de otra pagaba el relleno dos veces.

✅ **Cerrado después.** Las cuatro tarjetas de gráficos se quedaron en 277 px,
tres por debajo del mínimo. La causa de raíz no era el relleno sino el
anidamiento: eran tarjetas dentro de la tarjeta «Sistema de Gamificación». Se
eliminó esa envoltura —ver el paso 7— y pasan a **311 px**, el mismo ancho que
las demás tarjetas de la aplicación.

Pendiente relacionado: `navigation.config.ts` también declara `/settings` y
`/login`, que siguen sin existir como rutas.

### ✅ 6 · Manifiesto, service worker e iconos

- [x] `vite-plugin-pwa` 1.3.0 instalado, 0 vulnerabilidades
- [x] `manifest.webmanifest`: nombre, descripción, `lang: es`, `scope`,
      `display: standalone`, colores del tema
- [x] Iconos 192 / 512, maskable 512 y apple-touch 180 — **provisionales**
- [x] `theme-color`, metaetiquetas de Apple, `lang="es"` y título real en
      `index.html`, que seguía siendo la plantilla de Vite
- [x] Estrategia de caché decidida y verificada
- [x] Verificado sin conexión de verdad
- [ ] **Comprobar instalabilidad en un dispositivo real** — no se puede hacer
      desde aquí, ver abajo

**El bloqueante era otro: el build no emitía `index.html`.** `vite.config.ts`
declaraba `build.rollupOptions.input: './src/app/main.tsx'`, lo que sustituye la
entrada HTML por defecto de Vite. Resultado: `dist/` salía con `assets/` y nada
más. El artefacto de producción **no se podía servir**, y sin HTML no hay dónde
inyectar el manifiesto ni el registro del service worker. Llevaba dando «build
en verde» todo este tiempo. Se elimina el `input`; `index.html` ya apuntaba a
`/src/app/main.tsx`, así que basta con eso.

**Estrategia de caché.** Se precachea sólo el armazón —js, css, html, iconos,
fuentes: 42 entradas— con `navigateFallback` a `index.html` para que las rutas
profundas funcionen. Las respuestas de la API **no se cachean a propósito**: son
datos autenticados de un entrenador concreto, y la caché de un service worker
sobrevive al cierre de sesión y queda al alcance de quien use luego el
dispositivo. Verificado: `apiEnCache: false`.

**Prueba sin conexión.** Con el servidor de vista previa **parado**, navegar a
`/reports` cargó el armazón desde la caché, React arrancó y el router redirigió a
`/authentication` por no haber sesión. Es la prueba real, no la teoría.

Matiz aprendido de paso: un `fetch('/reports')` desde JavaScript **falla** con el
servidor caído aunque la navegación funcione. `navigateFallback` sólo atiende
peticiones de navegación (`mode: 'navigate'`), no llamadas de `fetch`.

**Otros dos arreglos que exigió el paso:**

- `tsconfig.node.json` no tenía `skipLibCheck`, así que `tsc -b` comprobaba los
  `.d.ts` de Workbox —escritos contra globales de service worker— y fallaba.
  Añadir `"WebWorker"` al `lib` no vale: choca con `DOM`, porque ambos declaran
  `self`, `location` y `navigator`.
- `Authentication.tsx` y `QuickActionCard.tsx` forzaban `CardContent className="p-6"`,
  que anulaba el relleno móvil del paso 5. Es redundante —`p-6` ya es el valor
  desde `md`— y sólo servía para pisar el móvil. Los campos del login pasan de
  261 a 277 px.

⚠️ **Los iconos son un marcador de posición.** Una mancuerna blanca sobre el azul
primario del tema, generada por script. Cumplen los requisitos técnicos —tamaños,
`purpose: maskable` con la marca dentro de la zona segura del 80 %— pero no son la
identidad de TrainerHub. El script queda fuera del repositorio; se regeneran desde
el logo real cuando exista.

⚠️ **La instalabilidad no está verificada.** Los requisitos técnicos sí lo están
y son medibles: contexto seguro, service worker activo y controlando la página,
manifiesto con `name`, `short_name`, `start_url`, `display: standalone` e iconos
de 192 y 512. Pero `beforeinstallprompt` no se dispara en el panel embebido, que
no es un Chrome completo. Falta abrirlo en un teléfono.

### ✅ 7 · Quitar la envoltura que estrechaba las tarjetas de gráficos

Cierra el único defecto de §1.6 que quedaba medido y sin resolver.

- [x] Eliminada la `<Card>` que envolvía las pestañas de Reportes
- [x] El título se conserva como `<h2>` suelto
- [x] Verificado a 375 px: **las ocho tarjetas a 311 px**, ninguna bajo 280
- [x] Verificado a 1280 px sin regresión

Una tarjeta cuyo contenido son a su vez tarjetas hace pagar el relleno dos
veces. Un encabezado suelto da la misma información sin ese nivel de
anidamiento, y de paso corrige una carencia de accesibilidad: `CardTitle`
renderiza un `<div>`, que para un lector de pantalla **no es un encabezado**.
La página pasa de tener sólo un `<h1>` a una jerarquía `<h1>` → `<h2>`.

| Medida | Antes | Después |
|---|---|---|
| Tarjetas de gráficos a 375 px | 277 px | **311 px** |
| Lienzo del gráfico a 375 px | 243 px | **277 px** |
| Tarjeta ancha a 1280 px | 1148 px | **1201 px** |

Sigue en pie la pregunta de producto que hay detrás, y que este paso **no**
resuelve: el bloque repite las mismas cinco solapas que `/progress` y cuatro de
ellas siguen vacías. Puede que sobre entero en Reportes.

### ✅ 8 · Mismo anidamiento en `progress`

Al auditar tras el refactor de `shared` aparecieron **seis tarjetas a 277 px en
`/progress`**: el mismo patrón `Card` → `Tabs` → `Card`, en dos sitios.

- [x] `Progress.tsx`: fuera la envoltura «Seguimiento de Progreso»
- [x] `StreakTrackingSystem.tsx`: fuera la envoltura «Rachas por Categoría»,
      un nivel más abajo, que seguía dejando tres tarjetas a 277
- [x] Verificado a 375 px en las seis rutas más las cuatro pestañas de
      `progress`: **0 contenedores bajo 280, 0 controles bajo 44, 0 desborde**
- [x] Verificado a 1280 px: la lista de pestañas vuelve a `grid` de 36 px

Los títulos se conservan como `<h2>` y `<h3>`, con lo que `/progress` pasa de
tener un solo `<h1>` a una jerarquía `<h1>` → `<h2>` → `<h3>`.

Matiz de medición: en la pestaña «Logros» hay elementos de 64 y 96 px, pero son
**insignias de logro**, que la propia §1.6 exime del umbral. El criterio se
aplica a contenedores, no a insignias.

---

## Deuda anotada de paso

No bloquea la PWA, pero salió durante el trabajo:

- [ ] `ChallengeCreation.tsx`: 552 líneas, el fichero más grande tras el
      `sidebar` de shadcn. Se divide en un componente por paso más su hook.
- [ ] El contenido de `progress` está escrito para el entrenador («3 estudiantes
      necesitan atención») aunque es un módulo del estudiante. Decisión de
      producto pendiente.
- [ ] `AuthPort` no expone `signUp`: el botón «Crear cuenta» no da de alta a nadie.
- [ ] Sin tests. Lint y build verifican la forma, no el comportamiento.

---

## Cómo medir

```js
// Desbordamiento horizontal: debe dar 0
document.documentElement.scrollWidth - document.documentElement.clientWidth

// Controles por debajo del objetivo táctil
[...document.querySelectorAll('button,a,[role=tab]')]
  .map(e => e.getBoundingClientRect())
  .filter(r => r.height > 0 && (r.height < 44 || r.width < 44)).length
```
