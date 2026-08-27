# Traspaso de sesión — 27 ago 2026

Contexto **de sesión**, no de proyecto. Sirve para que otra sesión retome el
trabajo sin volver a deducirlo todo. Las reglas permanentes viven en
[`../CLAUDE.md`](../CLAUDE.md); la lista de tareas, en
[`PWA-SEGUIMIENTO.md`](PWA-SEGUIMIENTO.md).

**Este fichero es efímero.** Cuando la adaptación a PWA esté fusionada, se borra.

---

## Dónde estamos ahora mismo

| Rama | Commit | Estado |
|---|---|---|
| `feature/pwa-adaptation` | `d99bc2d` | **rama activa**, sincronizada con origin |
| `develop` | `513e9b5` | sincronizada con origin |
| `main` | `91d0fd8` | **33 commits por detrás**, PR abierto sin fusionar |
| `feature/supabase-integration` | `2b69db7` | ya fusionada, sin nada propio: se puede borrar |
| `backup/supabase-test` | `d117d93` | ⚠️ **sólo local**, ver más abajo |

29 commits en la sesión. Todo lo empujado está en GitHub; no queda trabajo sin
subir.

**Trabajo en curso:** paso 4 de 6 de la adaptación móvil. Los pasos 1, 2 y 3
están cerrados y verificados.

---

## Cómo levantar el entorno

El proyecto está en `C:\ddd-2\trainerhub-frontend`, **no** en `C:\ddd-2`.

```bash
cd C:\ddd-2\trainerhub-frontend && npm run dev
```

Para la vista previa hay un `launch.json` en `C:\ddd-2\.claude` con la
configuración `trainerhub-dev` en el puerto 5178.

**Credenciales de desarrollo.** El `.env` local tiene `VITE_USE_FAKE_AUTH=true`,
así que entra el `FakeAuthAdapter`, no Supabase:

- Email: cualquiera con formato válido, p. ej. `entrenador@indepsoft.com`
- Contraseña: seis caracteres o más, p. ej. `desarrollo123`
- `error@test.local` falla a propósito, para probar la interfaz de error

---

## Trampas de este entorno

Cosas que costaron tiempo en esta sesión y volverán a morder si no se saben.

**Los 404 de `trainers` son esperados, no una regresión.** La base de datos de
Supabase está vacía: el proyecto existe pero no tiene ni una tabla. Cada carga
del dashboard lanza dos o más `GET /rest/v1/trainers` que devuelven 404. La app
degrada bien. No perseguirlos.

**El buffer de consola del navegador arrastra errores de sesiones anteriores del
servidor.** Tras reiniciar la vista previa aparecen `ERR_CONNECTION_REFUSED` y
fallos de módulos que ya no existen. Para leer errores de verdad, abrir una
pestaña nueva.

**El panel del navegador arranca a ~568 px, que ya es móvil.** Si se mide sin
fijar el viewport, las conclusiones salen mal. Hay que usar `resize_window`
explícitamente, y devolverlo a `desktop` al terminar.

**`git mv` falla en Windows con «Permission denied»** por bloqueos de fichero de
procesos node. La alternativa que funciona es `cp -r` + `rm -rf`; git lo detecta
igualmente como renombrado.

**`gh` no está instalado.** Los PR no se pueden crear por CLI: hay que abrir la
URL de `compare` en el navegador. Si alguien instala `gh` y lo autentica, deja
de aplicar.

**Cuidado con la rama en la que se commitea.** En esta sesión, siete commits
cayeron por error en una rama `refactor-claude` que seguía a `origin/develop`.
Se detectó tres veces y se acabó borrando esa rama. Conviene comprobar
`git branch --show-current` antes de commitear.

---

## Decisiones ya tomadas — no volver a discutirlas

- **Arquitectura de puertos y adaptadores.** El SDK de Supabase sólo se importa
  en `shared/infrastructure/supabase`. Lo impide una regla de eslint, no una
  convención. Migrar de backend = escribir adaptadores y cambiar
  `app/container.ts`.
- **TypeScript se queda en 5.9.3**, aunque `latest` sea 7.0.2. Motivo:
  `typescript-eslint@8.68.0` declara `typescript: ">=4.8.4 <6.1.0"`, así que TS 7
  dejaría el proyecto sin lint tipado. El código propio ya compila limpio bajo
  TS 7 con `skipLibCheck`; el bloqueante es externo y observable con
  `npm view typescript-eslint@latest peerDependencies`.
- **Cada dominio sigue el mismo esquema:** `types/`, `data/`, `hooks/`,
  `components/` plano —sin `molecules`/`organisms`— y una página que sólo compone.
  Los seis ya están así.
- **Los datos simulados viven en `data/` y se sirven por un hook**, que es la
  costura donde entrará el repositorio real. Cuando llegue el backend, se toca el
  hook y nada más.
- **Interfaz en castellano, código en inglés.** Por eso el dominio es `progress`
  pero la etiqueta del menú dice «Progreso».

---

## Preguntas abiertas para el usuario

Ninguna bloquea el paso 4, pero conviene resolverlas.

1. **PR a `main`**: 33 commits esperando. `main` hoy no compila —conserva
   marcadores de conflicto y el router desconectado—, así que fusionar lo
   arreglaría. Sin decidir.
2. **PR de `feature/pwa-adaptation`**: sugerí esperar a cerrar los pasos 4 y 5
   para que la revisión vea la adaptación completa. Sin confirmar.
3. **El contenido de `progress` está escrito para el entrenador** («3 estudiantes
   necesitan atención») aunque el usuario dijo que es un módulo del estudiante.
   Reescribirlo es decisión de producto; no se tocó.
4. **La lista de especialidades del registro la inventé yo.** Las anteriores eran
   de desarrollo de software —«DevOps», «Machine Learning»— copiadas de otro
   proyecto. Las sustituí por especialidades de entrenamiento, con `TODO` para
   que producto las revise.
5. **`backup/supabase-test` sólo existe en esta máquina.** Guarda 10 commits de
   Diase13 y Edward Mamani con un dominio `workouts` entero (~6.000 líneas) que
   nunca se fusionó. La rama remota se borró a petición del usuario, con respaldo
   local. **Si se borra esa copia, el trabajo desaparece.** SHA:
   `d117d93f35ece5c48b5fef82694eb0800dc310d4`.
6. **No hay tests.** Se propuso empezar por lo puro y la frontera —`errorMapper`,
   `mappers`, `buildObjective`, `FakeAuthAdapter`, los guardias de ruta— con
   Vitest. Sin respuesta.

---

## Qué se hizo, por bloques

**Infraestructura y seguridad.** `.gitignore` no cubría `.env` a secas. Se
eliminó un login falso que daba acceso a toda la app escribiendo cualquier cosa.
Tres rutas estaban sin `withProtectedRoute`. `npm audit` de 16 a 0.

**Arquitectura.** Desacoplamiento de Supabase: de 5 ficheros que importaban el
SDK a 1. Se eliminaron `useSupabaseQuery` —que filtraba la semántica de PostgREST
y tenía un refetch infinito latente— y `useAuthUser`, duplicado de `useTrainer`.

**Toolchain.** React 19.2.8, TypeScript 5.9.3, `baseUrl` eliminado, Node fijado
con `.nvmrc` + `engines` + `engine-strict`, y workflow de CI en
`.github/workflows/ci.yml`.

**Refactor de los seis dominios**, con defectos reales encontrados en cada uno:
dos fallos de huso horario en calendar, un formulario de registro que recargaba
la página, etiquetas de formulario que no apuntaban a ningún control, contadores
escritos a mano que mentían, y clases de Tailwind interpoladas que nunca se
generaban.

**Adaptación móvil**, pasos 1 a 3 de 6. Detalle y medidas en
[`PWA-SEGUIMIENTO.md`](PWA-SEGUIMIENTO.md).

---

## Siguiente paso concreto

**Paso 4 — pestañas desplazables y objetivos táctiles.** Es transversal: toca
`shared/ui` y `shared/components/navigation`, así que afecta a toda la app.

- Cuatro `TabsList` con `grid-cols-5` fijo: en `progress/pages/Progress.tsx`,
  `reports/pages/Reports.tsx`, `progress/components/AchievementSystem.tsx` y
  `progress/components/StreakTrackingSystem.tsx`. A 375 px dan pestañas de
  57 × 29 px. Deberían pasar a desplazamiento horizontal.
- Dos botones de la navegación por debajo del objetivo táctil: menú móvil
  36 × 36 y notificaciones 28 × 28. Ambos en `shared/components/navigation`.

Y recordar el criterio de la §1.6: **un paso no está hecho hasta verificarlo a
375 px en el navegador**. En esta sesión, tres de los defectos encontrados
compilaban y pasaban el lint sin una sola queja.
