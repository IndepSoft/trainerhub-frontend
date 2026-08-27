# Seguimiento: adaptación a PWA

Lista de trabajo viva para la rama `feature/pwa-adaptation`. Se marca a medida
que se avanza, para no perder el hilo entre sesiones.

**Regla que lo gobierna:** [`../CLAUDE.md`](../CLAUDE.md) §1.6 — Responsive
obligatorio.
**Auditoría de origen:** medida en navegador a 375 × 812 el 27 ago 2026.

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

### ⬜ 3 · dashboard → apilar indicadores y tarjetas

Es el que parte de cero: ni un solo prefijo responsive.

- [ ] Los 4 indicadores dejan de ir en una fila `flex gap-4` fija
- [ ] Las dos tarjetas inferiores (Próximas Sesiones / Actividades) se apilan
- [ ] Ningún bloque de texto por debajo de 280 px
- [ ] Verificado a 375 px
- [ ] Verificado a 1280 px sin regresión

Objetivo medible: hoy los indicadores caen a 121–154 px y el texto de
actividades a 77 px, unos ocho caracteres por línea.

### ⬜ 4 · Pestañas desplazables y objetivos táctiles

Transversal: toca `shared/ui` y `shared/components/navigation`.

- [ ] Las `TabsList` con `grid-cols-5` pasan a desplazamiento horizontal en móvil
      (afecta a `progress`, `reports`, `AchievementSystem`, `StreakTrackingSystem`)
- [ ] Botón de menú móvil: hoy **36 × 36** → 44
- [ ] Botón de notificaciones: hoy **28 × 28** → 44
- [ ] Revisar el resto de `size="sm"` y `size="icon"` en móvil
- [ ] Verificado a 375 px en todas las rutas

### ⬜ 5 · Registrar la ruta de `reports`

Sin ruta no hay forma de auditarlo, y hoy el sidebar enlaza a una página que no
existe.

- [ ] Crear `reports/infrastructure/routes.tsx` con `withProtectedRoute`
- [ ] Registrarlo en `app/routes/index.tsx`
- [ ] Auditarlo a 375 px como los demás
- [ ] Corregir lo que aparezca

Pendiente relacionado: `navigation.config.ts` también declara `/settings` y
`/login`, que tampoco existen como rutas.

### ⬜ 6 · Manifiesto, service worker e iconos

**Sólo cuando no quede nada roto que cachear.** Un service worker sirviendo una
vista de 33 px la deja disponible sin conexión.

- [ ] `vite-plugin-pwa` (hoy no hay ninguna dependencia PWA)
- [ ] `manifest.webmanifest`: nombre, iconos, `display: standalone`, colores
- [ ] Iconos 192 / 512 y maskable
- [ ] `theme-color` y metaetiquetas de Apple en `index.html` (hoy sólo `viewport`)
- [ ] Estrategia de caché: qué va precacheado y qué va a red primero
- [ ] Comprobar instalabilidad en un dispositivo real

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
