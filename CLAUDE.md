# CLAUDE.md — trainerhub-frontend

Guía del proyecto. Claude Code la lee automáticamente en cada sesión abierta
desde este repositorio.

**Registro de cambios y decisiones:** [`docs/CAMBIOS-Y-ARQUITECTURA.md`](docs/CAMBIOS-Y-ARQUITECTURA.md)

---

## 1. Reglas no negociables

Estas reglas están por encima de la conveniencia, la prisa y el tamaño de la
tarea. Si una petición sólo puede cumplirse rompiéndolas, hay que decirlo y
proponer la alternativa correcta, no romperlas en silencio.

### 1.1 Nada de parches rápidos

No se aceptan soluciones temporales, atajos ni código puesto "para que funcione
ahora". Si algo requiere un rodeo, el rodeo se discute antes de escribirlo.

Un caso real de este repositorio muestra por qué: `AuthService.loginWithEmail`
devolvía un usuario `dev-user` fijo con la llamada real comentada debajo. Como
atajo de desarrollo parecía inofensivo; en realidad daba acceso a toda la
aplicación a cualquiera que escribiese cualquier cosa en el formulario, y
sobrevivió a varios commits porque nadie lo miró de cerca. Los parches rápidos
no se quedan cortos: se quedan.

Corolario: **nada de código comentado**. Si no se usa, se borra — el historial
de git es el archivo. Un bloque comentado no dice si es un plan, un experimento
fallido o una regresión.

### 1.2 Nada de código spaghetti

- Una responsabilidad por módulo, por función y por componente.
- Prohibido saltarse capas: un componente jamás accede a infraestructura.
- Prohibida la lógica de negocio dentro de un componente de presentación.
- Prohibida la duplicación silenciosa. Antes de crear algo, se busca si ya existe.

Otro caso real: `useAuthUser` y `useTrainer` hacían lo mismo, uno bien (vía
repositorio) y otro mal (consultando el proveedor directamente desde el hook y
redeclarando el tipo `Trainer` en línea). Convivieron sin que nadie lo notara.

### 1.3 Todo tipado

- **`any` está prohibido.** Si no se conoce el tipo, es `unknown` y se estrecha.
- Prohibido `as` para silenciar al compilador. Un *cast* sólo es legítimo en la
  frontera de infraestructura, sobre datos crudos externos, y acompañado de su
  *mapper*.
- Prohibido `@ts-ignore` y `@ts-expect-error` sin una línea que explique por qué.
- Toda función exportada declara su tipo de retorno explícitamente.
- Los *props* de cada componente van en una interfaz con nombre, nunca en línea.

### 1.4 Nada de abreviaturas

Los nombres se escriben completos y describen la intención, no la mecánica.

| Prohibido | Correcto |
|---|---|
| `usr`, `u` | `user` |
| `btn` | `button` |
| `hdl`, `h` | `handleSubmit` |
| `tmp`, `aux`, `data2` | el nombre de lo que realmente contiene |
| `e` (salvo el evento de un handler) | `error`, `element`, `entry` |
| `res`, `req` | `response`, `request` |
| `cfg` | `configuration` |
| `arr`, `lst` | el plural del elemento: `students`, `sessions` |

Excepciones aceptadas por convención universal: `id`, `url`, `i` como índice de
bucle, y `_` como descarte explícito.

Lo mismo vale para las implementaciones: nada de encadenar operaciones crípticas
para ahorrar líneas. Un paso intermedio con nombre siempre gana a un *one-liner*
ingenioso.

### 1.5 Comentarios que explican el porqué

El código dice *qué* hace. El comentario existe para decir *por qué*, y sobre
todo para dejar constancia de lo que no es evidente: una decisión con
alternativas descartadas, una restricción externa, una trampa conocida.

Prohibido el comentario que repite el código (`// incrementa el contador`).

### 1.6 Responsive obligatorio: el objetivo es una PWA

TrainerHub va a ser una aplicación instalable. Eso cambia el listón: el móvil no
es una adaptación posterior, es el caso base. Una PWA instalada se juzga como una
app nativa, no como una página web que se ve regular en el teléfono.

Estas cinco reglas salen de una auditoría medida en navegador a 375 px, no de una
lectura del código. Encontró tres defectos que compilaban y pasaban el lint sin
una sola queja.

**Ninguna rejilla con número de columnas fijo.** Toda `grid-cols-N` con N mayor
que 1 arranca en `grid-cols-1` y sube por punto de ruptura. Sin excepciones: es
la causa de los dos fallos críticos que encontró la auditoría. La vista semanal
del calendario usaba `grid-cols-8` sin prefijo, lo que en un móvil deja columnas
de 33 px donde ni el texto «Lun» cabe.

**Cero desbordamiento horizontal a 375 px.** Criterio comprobable:
`document.documentElement.scrollWidth` igual al ancho de la ventana en cada ruta.

**Ancho mínimo útil, no sólo ausencia de desbordes.** No desbordar y ser legible
son cosas distintas: el dashboard daba cero desbordamiento y a la vez comprimía el
texto de actividades a 77 px de ancho, unos ocho caracteres por línea.

El umbral se mide sobre **contenedores** —tarjetas, paneles, columnas—, que no
deben bajar de unos 280 px en móvil. No se aplica a cada nodo de texto suelto:
una insignia que pone «Cancelada» ocupa 74 px y eso es correcto, no un defecto.
Para párrafos, el criterio útil no es el ancho sino la medida: por debajo de unos
veinte caracteres por línea el texto deja de leerse con comodidad.

**Objetivos táctiles de 44 × 44 px** en botones, pestañas y enlaces. Es requisito
de plataforma para una app instalable —44 pt en Apple HIG, 48 dp en Material— y
va por encima del mínimo de 24 px que exige WCAG 2.2 AA.

**Seguimiento del trabajo:** [`docs/PWA-SEGUIMIENTO.md`](docs/PWA-SEGUIMIENTO.md)
lleva la lista de pasos con su estado.

**Se verifica en dispositivo, no leyendo clases.** Cada dominio se abre a 375 px
antes de darlo por terminado. Las clases de Tailwind no dicen la verdad sobre el
resultado: `flex-1` no desborda nunca, simplemente aplasta el contenido hasta que
deja de comunicar.

---

## 2. Arquitectura: puertos y adaptadores

**Objetivo explícito del proyecto: el frontend no debe depender de Supabase.**
Migrar a un backend propio tiene que ser escribir adaptadores nuevos y cambiar
la raíz de composición — nunca recorrer la aplicación.

### 2.1 Dirección de dependencias

```
componentes / páginas
        ↓
      hooks
        ↓
   PUERTOS (interfaces)            ← el dominio define el contrato
        ↑
   ADAPTADORES (implementaciones)  ← la infraestructura lo cumple
```

La flecha de los adaptadores **sube**. Es la inversión de dependencias: el
dominio no conoce a la infraestructura; la infraestructura se pliega al dominio.

### 2.2 Las capas

| Carpeta | Qué contiene | Qué tiene prohibido |
|---|---|---|
| `shared/domain/entities` | Entidades de la aplicación, en camelCase | Cualquier import externo |
| `shared/domain/ports` | Interfaces: qué necesita la aplicación | Cualquier implementación |
| `shared/domain/errors.ts` | `AppError` normalizado | Errores de proveedor |
| `shared/infrastructure/<proveedor>` | Cliente, *mappers*, traducción de errores | Ser importado desde fuera |
| `app/container.ts` | Raíz de composición | Lógica de cualquier tipo |
| `<dominio>/hooks` | Estado de React sobre los puertos | Tocar infraestructura |
| `<dominio>/components`, `pages` | Presentación | Lógica de negocio y acceso a datos |

### 2.3 Reglas del desacoplamiento

**El SDK del proveedor sólo se importa dentro de su carpeta de infraestructura.**
Lo impide `no-restricted-imports` en `eslint.config.js`; no es una convención,
falla el lint.

**Los puertos se describen en operaciones de negocio, nunca de consulta.**

```ts
// ✅ el puerto expresa una intención
findByProfileId(profileId: string): Promise<Trainer | null>

// ❌ el puerto filtra el lenguaje de consulta del proveedor: el desacoplamiento
//    sería ficticio, porque un backend propio no tiene .eq()
select(columns: string, filters: (query: Query) => Query): Promise<Row[]>
```

Por esto se eliminó `useSupabaseQuery`, que recibía un nombre de tabla suelto y
un constructor de filtros.

**Cada entidad tiene su *mapper*.** El `snake_case` de Postgres, los nulos de SQL
y las claves numéricas mueren en `mappers.ts`. El dominio no hereda las
decisiones del esquema.

**Los errores se traducen en la frontera.** Ningún `PostgrestError` ni
equivalente futuro cruza hacia la aplicación: se convierte en `AppError` con un
código propio.

**La raíz de composición es el único punto que nombra implementaciones.** Nadie
más instancia un adaptador ni lo importa por su clase.

---

## 3. SOLID, aplicado a este proyecto

- **Responsabilidad única.** Un hook orquesta estado; un repositorio accede a
  datos; un *mapper* traduce; un componente pinta. Cuando algo hace dos de esas
  cosas, se parte.
- **Abierto/cerrado.** Añadir un proveedor es añadir un adaptador, no editar los
  existentes. Añadir un dominio es añadir su carpeta y una línea en el router.
- **Sustitución de Liskov.** Cualquier implementación de un puerto debe ser
  intercambiable sin que el consumidor lo note: mismos errores (`AppError`),
  misma semántica del ausente (`null`, no excepción).
- **Segregación de interfaces.** Puertos pequeños y por capacidad. Antes varios
  puertos por caso de uso que un `TrainerRepository` con veinte métodos.
- **Inversión de dependencias.** Los hooks dependen de `AuthPort`, jamás de
  `SupabaseAuthAdapter`. Se tipa contra la interfaz, siempre.

---

## 4. Contexto del proyecto

### 4.1 Stack

React 19.2 · TypeScript 5.9 · Vite 7 · Tailwind 3.4 · shadcn/ui (new-york) ·
react-router-dom 7 · zustand 5 · Supabase (tras adaptador)

Node: la version la fija `.nvmrc`. `engines` declara el suelo (`>=22.12.0`, que
impone Vite) y `.npmrc` con `engine-strict=true` hace que npm **falle** la
instalacion si no se cumple, en vez de limitarse a avisar.

### 4.2 Comandos

```bash
npm run dev      # servidor de desarrollo
npm run build    # tsc -b && vite build
npm run lint     # eslint .
npm run preview  # sirve el build
```

**Integracion continua:** `.github/workflows/ci.yml` ejecuta `npm ci`, `npm run
lint` y `npm run build` en cada PR hacia `develop` y `main`. Antes de abrir un
PR, pasa esa misma secuencia en local — es exactamente lo que va a correr.

### 4.3 Convenciones establecidas

- Alias `@/` para todo `src/`. Relativos sólo dentro del mismo módulo.
- Función `cn` en `@/shared/lib/utils` (alineado con `components.json`).
- Componentes UI en `shared/ui/` — territorio de shadcn, no se edita a mano
  salvo necesidad justificada.
- Rutas por dominio en `<dominio>/infrastructure/routes.tsx`, compuestas en
  `app/routes/index.tsx`.
- HOC `withSuspense` y `withProtectedRoute` para lo transversal de rutas.

### 4.4 Entorno

Variables en `.env` (plantilla en `.env.example`). `.gitignore` cubre `.env` y
`.env.*` con excepción para `.env.example`. **Ninguna clave se commitea.**

---

## 5. Antes de dar algo por terminado

1. `npm run build` en verde. **No es opcional y no se da por supuesto: se ejecuta.**
2. `npm run lint` sin errores nuevos.
3. Ningún `any`, ningún `as` de conveniencia, ningún bloque comentado.
4. Ningún import de infraestructura fuera de su carpeta.
5. Nombres completos y descriptivos.
6. **Si el cambio es visible, se abre a 375 px** y se comprueban las reglas de
   §1.6: sin desbordamiento, sin bloques por debajo de 280 px, objetivos táctiles
   de 44 px.
7. Si se dejó algo a medias, va documentado con `TODO:` explicando qué falta y
   por qué — y se menciona al reportar. Nunca se entrega en silencio.

---

## 6. Deuda conocida

Registrada para que no se confunda con trabajo nuevo. Detalle y contexto en
[`docs/CAMBIOS-Y-ARQUITECTURA.md`](docs/CAMBIOS-Y-ARQUITECTURA.md).

- Los adaptadores siguen siendo falsos salvo `TrainerRepository` sobre Supabase,
  y ése convive con `FakeTrainerRepository`, que se elige con la misma condición
  que la autenticación simulada. Los datos falsos viven en memoria: al recargar
  vuelve la semilla.
- No se puede cambiar la contraseña: `AuthPort` no expone esa operación, así que
  Configuración no la ofrece en vez de fingirla.
- La traducción cubre lo que escribe la aplicación —español, inglés y
  portugués—, no lo que escribe una persona: los nombres de rutinas, los
  anuncios del muro y el título de una sesión ya creada se quedan en el idioma en
  que se escribieron. Está dicho en el propio selector. Toda cadena nueva se
  añade a los TRES diccionarios: `Dictionary` es `Record<TranslationKey, string>`
  y una clave que falte no compila.
- `GuestRoute` está implementado pero no cableado: falta `withGuestRoute`.
- La página del equipo tiene miembros, solicitudes, QR, muro y ranking.
  **Faltan los eventos.** Los entrenamientos grupales NO son una entidad nueva
  —`Session` ya tiene `kind: 'group'`—; un evento, una carrera o una quedada, sí.
- El muro no avisa: un anuncio nuevo no se señala en ningún sitio. Lo barato es
  un contador en la entrada de navegación del equipo; las notificaciones push son
  otro trabajo.
- `CrewPost.likedBy` guarda la lista entera de quién ha dado «me gusta». Con
  equipos de decenas da igual; con miles hay que pasar a un contador y una
  bandera calculados en el servidor.
- **Todas las reglas de permisos las comprueba el navegador.** Impide
  equivocarse, no impide actuar: un cliente modificado escribe igual. Cada regla
  tiene ya una sola definición en `shared/domain` —`can`, `lastAdminBlocker`,
  `canEnrollMembers`— y CAMBIOS §14.5 lleva la tabla de qué política de servidor
  sustituye a cada una. Es lo único que queda entre esto y ser seguro.
- La lista de administradores de plataforma es una constante en la semilla. Con
  backend es una tabla que sólo escribe el rol de servicio.
- No hay cobro: activar una suscripción es una decisión manual desde `/admin`.
- No hay registro de auditoría: nadie sabe quién miró o cambió qué.
- `CrewStaff.displayName` y `email` están copiados, no referenciados. Es la
  excepción a «se referencia el vocabulario»: no hay entidad de persona todavía
  —`AuthUser` sólo tiene id y correo—, así que el nombre se guarda con el puesto.
  Cuando exista un perfil, esto se resuelve por identificador.
- Props declaradas y sin conectar, marcadas con `TODO:` en gamification y
  calendar. `ChallengeCard.onUpdate` es la más grave: el padre le pasa un
  manejador real que nunca se invoca.
- Los filtros de `TrainingFilters` y `StudentFilters` no filtran.
- Las sesiones volcadas desde un plan no guardan de qué volcado salieron, así que
  no se pueden mover ni cancelar en bloque y volcar dos veces duplica.
- La subestructura de carpetas difiere entre dominios; falta unificarla.
- Las cuotas no guardan importes: la cola de cobros dice **quién vence y
  cuándo**, no cuánto. Poner precio exige decidir moneda y modelo de tarifas, y
  nada de eso está decidido. Ver `StudentSubscription`.
- Los avisos son una bandeja **dentro** de la aplicación: quien no la abra no se
  entera. Correo o push son otro trabajo, y otro consentimiento.
- El lint esta en cero. `react-refresh/only-export-components` queda desactivada
  **solo** en `src/shared/ui/**`, porque el patron de shadcn -componente y
  variantes de `cva` en el mismo fichero- choca con ella y no es corregible sin
  desviarse de la libreria.
