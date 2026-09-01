import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * Capturas de revision del rediseno en los tres anchos del brief.
 *
 * No son pruebas de regresion: no afirman nada. Su unico proposito es producir
 * imagenes que se miran antes de dar una seccion por terminada, porque las
 * clases de Tailwind no dicen la verdad sobre el resultado.
 */
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const

// El adaptador falso solo existe en desarrollo: cualquier email valido con seis
// caracteres o mas de contrasena entra. Ver src/app/container.ts.
async function signIn(page: Page): Promise<void> {
  await page.goto('/authentication')
  // Se marca el onboarding como visto: cada prueba arranca con almacenamiento
  // limpio, y sin esto RootLayout redirigiria a /onboarding en todas. Las
  // pruebas del propio onboarding lo borran a proposito.
  await page.evaluate(() => window.localStorage.setItem('trainerhub.onboarding.visto', 'true'))
  await page.getByPlaceholder('tu@email.com').fill('entrenador@indepsoft.com')
  await page.locator('input[type=password]').fill('desarrollo123')
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 })
}

/**
 * Los disparadores de un desplegable, por el nombre de su etiqueta.
 *
 * NO se usa `getByLabel`. Radix renderiza, junto al boton visible, un `<select>`
 * nativo oculto para que el control participe en el formulario, y la etiqueta
 * alcanza a los DOS: con dos ejercicios en pantalla, `getByLabel('Ejercicio')`
 * resolvia a cuatro elementos, asi que `nth(1)` era el select oculto de la
 * primera fila y no el disparador de la segunda. Hacer clic en un `<select>`
 * oculto no abre nada ni da error, que es lo que hacia el fallo tan dificil de
 * leer.
 *
 * El nativo no tiene nombre accesible, asi que filtrar por rol y nombre deja
 * exactamente uno por control.
 */
function desplegables(page: Page, etiqueta: string): Locator {
  return page.getByRole('combobox', { name: etiqueta, exact: true })
}

/**
 * Elige un valor de un desplegable de Radix.
 *
 * Las opciones se buscan DENTRO del `listbox`, por el mismo motivo: los
 * `<option>` del select nativo tambien tienen `role=option`. La comprobacion
 * final existe para que, si algo vuelve a torcerse, el fallo diga donde.
 */
async function elegirDelDesplegable(
  page: Page,
  disparador: Locator,
  nombre: string,
  // Por defecto exacto, para que «Rutinas» no case con «Rutinas (3)». Las
  // opciones que traen mas texto dentro -el alumno lleva ademas su nivel-
  // piden coincidencia parcial.
  exact = true
): Promise<void> {
  await disparador.click()

  const opcion = page.getByRole('listbox').getByRole('option', { name: nombre, exact })
  /*
   * Basta con desplazarla a la vista y pulsar.
   *
   * Con la lista de horas -veintisiete opciones- esto expiraba con «element is
   * outside of the viewport», y persiguiendo el fallo salio un defecto de la
   * aplicacion, no de la prueba: el panel no tenia tope de altura porque su
   * clase era sintaxis de Tailwind 4 en un proyecto que usa la 3. Arreglado
   * eso, el panel cabe y la opcion se alcanza.
   */
  await opcion.scrollIntoViewIfNeeded()
  await opcion.click()

  await expect(disparador).toContainText(nombre)
}

/** «6 min» → 6. La cifra del resumen, sea cual sea el texto que la rodea. */
function extraerMinutos(texto: string): number {
  const encontrado = texto.match(/(\d+)\s*min/)
  return encontrado === null ? Number.NaN : Number(encontrado[1])
}

/**
 * El proximo lunes, que es cuando empieza el plan de la semilla.
 *
 * Se calcula igual que en `assignmentsSeed`, y no se escribe a mano: las fechas
 * fijas caducan solas. Esta suite ya se rompio un 1 de septiembre porque una
 * prueba daba por hecho que el mes en curso era agosto.
 */
function proximoLunes(): Date {
  const hoy = new Date()
  const dias = ((8 - (hoy.getDay() || 7)) % 7) || 7
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + dias)
}

/** La misma forma que pinta `formatDateKey`: «lunes, 7 de septiembre». */
function comoFecha(date: Date): string {
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

function sumarDias(date: Date, dias: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + dias)
}

/**
 * Un contador de la cabecera de la agenda, por su rotulo.
 *
 * Devuelve el localizador y no su texto para que las aserciones ESPEREN: el
 * cambio de estado pasa por el puerto, asi que el contador se actualiza un
 * instante despues de guardar.
 */
function contador(page: Page, rotulo: string): Locator {
  return page.locator('main .grid > div').filter({ hasText: rotulo })
}

/**
 * Una sesion de la agenda que TODAVIA no esta completada.
 *
 * Se pide por el NOMBRE ACCESIBLE, que es donde vive el estado: el
 * `aria-label` de la tarjeta es «titulo. alumno. estado. hora, N minutos». El
 * texto visible no sirve -la insignia de estado no siempre esta en la vista- y
 * `hasText` solo mira texto.
 *
 * Coger «la primera» a secas dejo de valer cuando la semilla gano un historial
 * de sesiones cerradas: la primera del mes pasaba a ser una ya completada, y
 * marcarla como completada no cambia nada -el boton de guardar se queda
 * desactivado, porque no hay cambio que guardar-.
 */
function sesionSinCompletar(page: Page): Locator {
  return page.getByRole('button', { name: /Confirmada\..*minutos/ })
}

/**
 * La cifra de un contador de la agenda.
 *
 * Las pruebas de estado comparan ANTES y DESPUES en vez de afirmar numeros
 * fijos: un numero fijo ata la prueba a la semilla, y cambiar los datos de
 * ejemplo la rompe sin que la aplicacion tenga nada mal.
 */
async function leerCifra(localizador: Locator): Promise<number> {
  const texto = await localizador.innerText()
  const cifra = texto.match(/\d+/)
  return cifra === null ? 0 : Number(cifra[0])
}

/**
 * Desplaza el contenedor interno hasta abajo.
 *
 * `fullPage: true` no sirve en este layout: el desplazamiento vive en un div con
 * `overflow-auto` dentro de una altura fija, asi que la captura de pagina
 * completa se queda en lo que cabe en el viewport y todo lo de mas abajo no se
 * revisa nunca.
 */
async function scrollInnerContainerToBottom(page: Page): Promise<number> {
  const desplazado = await page.evaluate(() => {
    /*
     * El contenedor se busca DENTRO de <main> y quedandose con el que mas
     * contenido oculto tiene.
     *
     * Antes se cogia el primer `.overflow-auto` del documento, que en escritorio
     * es el de la barra lateral: la ayudante desplazaba el menu en vez de la
     * pagina, y las pruebas pasaban sin comprobar nada. En movil colaba porque
     * la barra lateral esta oculta.
     */
    const candidatos = [...document.querySelectorAll('main .overflow-auto')]
    const objetivo = candidatos
      .map((elemento) => ({
        elemento,
        oculto: elemento.scrollHeight - elemento.clientHeight,
      }))
      .sort((a, b) => b.oculto - a.oculto)[0]

    if (!objetivo || objetivo.oculto <= 0) return 0
    objetivo.elemento.scrollTop = objetivo.elemento.scrollHeight
    return objetivo.elemento.scrollTop
  })
  await page.waitForTimeout(400)
  return desplazado
}

for (const viewport of VIEWPORTS) {
  test(`dashboard en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await signIn(page)
    await page.waitForTimeout(1200)
    await page.screenshot({
      path: `tests/visual/salida/dashboard-${viewport.name}.png`,
      fullPage: true,
    })
  })
}

for (const viewport of VIEWPORTS) {
  test(`sesion en vivo en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await signIn(page)
    await page.goto('/session')
    // Se deja correr el cronometro para que las metricas no salgan a cero.
    await page.waitForTimeout(9000)
    await page.screenshot({
      path: `tests/visual/salida/sesion-${viewport.name}.png`,
      fullPage: true,
    })
  })
}

for (const viewport of VIEWPORTS) {
  test(`progreso en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await signIn(page)
    await page.goto('/progress')
    // Se espera a que terminen los contadores tipo odometro.
    await page.waitForTimeout(2500)
    await page.screenshot({
      path: `tests/visual/salida/progreso-${viewport.name}.png`,
      fullPage: true,
    })
  })
}

for (const viewport of VIEWPORTS) {
  test(`celebracion en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await signIn(page)
    await page.goto('/progress/celebracion')
    // Se deja avanzar el confeti para capturarlo a medio vuelo.
    await page.waitForTimeout(1400)
    await page.screenshot({
      path: `tests/visual/salida/celebracion-${viewport.name}.png`,
      fullPage: true,
    })
  })
}

for (const viewport of VIEWPORTS) {
  test(`progreso desplazado en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await signIn(page)
    await page.goto('/progress')
    await page.waitForTimeout(2000)
    await scrollInnerContainerToBottom(page)
    await page.screenshot({
      path: `tests/visual/salida/progreso-abajo-${viewport.name}.png`,
    })
  })
}

/**
 * Punto de ruptura de la navegacion.
 *
 * A 375 px debe haber barra inferior y no barra lateral; a 768 y 1440, al reves.
 * El brief pide comprobar exactamente estos tres anchos.
 */
for (const viewport of VIEWPORTS) {
  test(`navegacion en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await signIn(page)
    await page.waitForTimeout(1200)

    const bottomBar = page.getByRole('navigation', { name: 'Navegación principal' })
    const expectsBottomBar = viewport.width < 768

    if (expectsBottomBar) {
      await expect(bottomBar).toBeVisible()
    } else {
      await expect(bottomBar).toBeHidden()
    }

    await page.screenshot({
      path: `tests/visual/salida/navegacion-${viewport.name}.png`,
    })
  })
}

/**
 * Objetivo tactil y encaje de las etiquetas en la barra inferior.
 *
 * A 375 px, cinco destinos dejan 75 px por pestana. «Entrenamientos» tiene
 * catorce caracteres y es la que va justa: si la etiqueta desborda su caja, se
 * recorta o pisa a la vecina, y eso no se ve leyendo clases de Tailwind. La
 * regla 1.6 exige ademas 44 px de objetivo tactil.
 */
test('la barra inferior encaja a 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await signIn(page)
  await page.waitForTimeout(1200)

  const medidas = await page.evaluate(() => {
    const bar = document.querySelector('nav[aria-label="Navegación principal"]')
    if (!bar) return null
    return {
      desbordeDePagina:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      pestanas: [...bar.querySelectorAll('a')].map((link) => {
        const box = link.getBoundingClientRect()
        const label = link.querySelector('span:last-of-type') as HTMLElement | null
        return {
          texto: link.textContent?.trim() ?? '',
          ancho: Math.round(box.width),
          alto: Math.round(box.height),
          etiquetaDesborda: label ? label.scrollWidth > label.clientWidth + 1 : false,
        }
      }),
    }
  })

  expect(medidas).not.toBeNull()
  expect(medidas!.desbordeDePagina).toBe(0)
  expect(medidas!.pestanas).toHaveLength(5)

  for (const pestana of medidas!.pestanas) {
    expect(pestana.alto, `alto de «${pestana.texto}»`).toBeGreaterThanOrEqual(44)
    expect(pestana.etiquetaDesborda, `«${pestana.texto}» desborda su pestana`).toBe(false)
  }
})

/**
 * Capturas del pie de las pantallas que se revisaron antes de que existiera el
 * helper de desplazamiento interno.
 *
 * `fullPage: true` no ve nada por debajo del pliegue en este layout, asi que
 * dashboard y sesion en vivo se dieron por buenas mirando solo su mitad
 * superior. Esto cierra ese hueco.
 */
const RUTAS_A_REVISAR = [
  { nombre: 'dashboard', ruta: '/dashboard' },
  { nombre: 'sesion', ruta: '/session' },
] as const

for (const objetivo of RUTAS_A_REVISAR) {
  for (const viewport of VIEWPORTS) {
    test(`${objetivo.nombre} desplazado en ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await signIn(page)
      await page.goto(objetivo.ruta)
      await page.waitForTimeout(2000)
      await scrollInnerContainerToBottom(page)
      await page.screenshot({
        path: `tests/visual/salida/${objetivo.nombre}-abajo-${viewport.name}.png`,
      })
    })
  }
}

/**
 * La sesion de CARDIO tiene que caber sin desplazamiento a 375 px.
 *
 * No es una preferencia estetica: si hay que desplazarse para ver el
 * cronometro, la pantalla no cumple su unica funcion. Llego a desbordar 104 px
 * cuando se anadio la barra inferior, y por eso la ruta pasa a pantalla
 * completa. Esta prueba existe para que no vuelva a pasar en silencio.
 *
 * Se dice CUAL, porque desde que hay dos modos la afirmacion solo vale para
 * este: la de fuerza es una lista de bloques y se desplaza por definicion.
 */
test('la sesion de cardio cabe sin desplazamiento a 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await signIn(page)
  await page.goto('/session/session-4')
  await page.waitForTimeout(2000)

  const medida = await page.evaluate(() => {
    const scroller = document.querySelector('.overflow-auto')
    if (!scroller) return null
    return {
      sobra: scroller.scrollHeight - scroller.clientHeight,
      desbordeHorizontal:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })

  expect(medida).not.toBeNull()
  expect(medida!.sobra, 'la sesion desborda en vertical').toBeLessThanOrEqual(0)
  expect(medida!.desbordeHorizontal).toBe(0)
})

/**
 * Rutas que aun no tienen registro de diseno asignado pero cuyos colores ya
 * pasaron a tokens. Se capturan para poder ver si el barrido rompio algo: hasta
 * ahora no se habian mirado nunca.
 */
const RUTAS_SIN_REDISENAR = [
  { nombre: 'calendario', ruta: '/calendar' },
  { nombre: 'estudiantes', ruta: '/students' },
  { nombre: 'entrenamientos', ruta: '/trainings' },
  { nombre: 'reportes', ruta: '/reports' },
] as const

for (const objetivo of RUTAS_SIN_REDISENAR) {
  test(`${objetivo.nombre} en mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto(objetivo.ruta)
    await page.waitForTimeout(2000)

    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(desborde, 'desbordamiento horizontal').toBe(0)

    await page.screenshot({ path: `tests/visual/salida/${objetivo.nombre}-mobile.png` })
  })
}

/**
 * Onboarding: se muestra en la primera sesion del dispositivo y no vuelve.
 */
test.describe('onboarding', () => {
  async function signInSinOnboarding(page: Page): Promise<void> {
    await page.goto('/authentication')
    await page.evaluate(() => window.localStorage.removeItem('trainerhub.onboarding.visto'))
    await page.getByPlaceholder('tu@email.com').fill('entrenador@indepsoft.com')
    await page.locator('input[type=password]').fill('desarrollo123')
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  }

  for (const viewport of VIEWPORTS) {
    test(`aparece en la primera sesion en ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await signInSinOnboarding(page)
      await page.waitForURL(/\/onboarding/, { timeout: 20_000 })
      await page.waitForTimeout(800)

      const desborde = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(desborde, 'desbordamiento horizontal').toBe(0)

      await page.screenshot({ path: `tests/visual/salida/onboarding-${viewport.name}.png` })
    })
  }

  test('avanza, se completa y no vuelve a salir', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signInSinOnboarding(page)
    await page.waitForURL(/\/onboarding/, { timeout: 20_000 })

    // Cuatro pasos: tres «Siguiente» y un «Empezar».
    for (let paso = 0; paso < 3; paso++) {
      await page.getByRole('button', { name: 'Siguiente' }).click()
      await page.waitForTimeout(250)
    }
    await page.getByRole('button', { name: 'Empezar' }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 })

    // Recargar no debe devolver al onboarding: por eso se guarda la preferencia.
    await page.reload()
    await page.waitForTimeout(1500)
    expect(page.url()).toContain('/dashboard')
  })
})

/**
 * Gestos.
 *
 * Se ejercitan con eventos de puntero reales -no llamando a los manejadores-
 * porque lo que puede romperse es justo la traduccion del gesto: umbrales,
 * dominancia del eje y la condicion de estar arriba del todo.
 */
test.describe('gestos', () => {
  /*
   * El deslizamiento entre pestanas vive ahora en Entrenamientos: Progreso se
   * quedo con una sola seccion -logros- cuando desafios y rachas se movieron.
   */
  test('deslizar cambia de pestana en entrenamientos', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/trainings')
    await page.waitForTimeout(1500)

    const lista = page.getByRole('tablist').first()
    await lista.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await expect(lista.getByRole('tab', { selected: true })).toContainText('Rutinas')

    /*
     * El gesto se hace sobre el PANEL, no sobre la tira de pestanas: Radix
     * activa la pestana al pulsar, asi que empezar el arrastre encima de un
     * `TabsTrigger` cambiaria de pestana antes de que el deslizamiento exista.
     */
    const panel = page.getByRole('tabpanel').first()
    const caja = await panel.boundingBox()
    expect(caja).not.toBeNull()

    const y = caja!.y + 30
    await page.mouse.move(caja!.x + caja!.width - 20, y)
    await page.mouse.down()
    await page.mouse.move(caja!.x + 20, y + 5, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(400)

    await expect(lista.getByRole('tab', { selected: true })).toContainText('Planes')
  })

  test('un desplazamiento vertical NO cambia de pestana', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/trainings')
    await page.waitForTimeout(1500)

    const lista = page.getByRole('tablist').first()
    await lista.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    const caja = await lista.boundingBox()

    // Vertical con algo de inclinacion: es como se desplaza con el pulgar, y no
    // debe contar como cambio de pestana.
    await page.mouse.move(caja!.x + caja!.width / 2, caja!.y + caja!.height + 20)
    await page.mouse.down()
    await page.mouse.move(caja!.x + caja!.width / 2 - 70, caja!.y + caja!.height + 220, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(400)

    await expect(lista.getByRole('tab', { selected: true })).toContainText('Rutinas')
  })

  test('tirar hacia abajo recarga el dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.waitForTimeout(1500)

    await page.mouse.move(187, 220)
    await page.mouse.down()
    await page.mouse.move(187, 480, { steps: 10 })

    // A mitad del gesto el indicador ya debe estar visible.
    await expect(page.getByText('Suelta para actualizar')).toBeAttached()

    await page.mouse.up()
    await page.waitForTimeout(900)

    // Y despues debe desaparecer: la recarga termino.
    await expect(page.getByText('Actualizando')).toHaveCount(0)
  })
})

/**
 * Esqueleto de carga.
 *
 * Se retrasa a proposito el fragmento de la ruta para que el respaldo de
 * Suspense se quede en pantalla el tiempo suficiente. Sin ese retraso el
 * esqueleto vive unos milisegundos y no hay forma de comprobar que existe ni de
 * mirarlo.
 */
test('el esqueleto se muestra mientras carga la ruta', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await signIn(page)

  await page.route('**/Progress*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2500))
    await route.continue()
  })

  await page.goto('/progress', { waitUntil: 'commit' })
  await page.waitForTimeout(900)

  const cargando = page.getByText('Cargando', { exact: true })
  await expect(cargando).toBeAttached()

  await page.screenshot({ path: 'tests/visual/salida/esqueleto-mobile.png' })
})

/**
 * Placas de logro: conseguidas y bloqueadas conviviendo.
 *
 * Se captura la rejilla entera porque el valor del diseno esta en el contraste
 * entre placas grabadas y placas en blanco; una sola no dice nada.
 */
test('placas de logro', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await signIn(page)
  await page.goto('/progress')
  await page.waitForTimeout(2000)

  const placa = page.getByRole('button', { name: /Conseguido/ }).first()
  await placa.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  await expect(placa).toBeVisible()
  await page.screenshot({ path: 'tests/visual/salida/placas-mobile.png' })
})

/**
 * Transiciones de vista.
 *
 * No se comprueba «que se vea bonito» -no es comprobable- sino lo que si puede
 * romperse: que la navegacion con `viewTransition` llegue a su destino. Una
 * transicion que se queda a medias deja la pantalla congelada, y eso es peor que
 * no tenerla.
 */
test('la navegacion con transicion llega a su destino', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await signIn(page)
  await page.waitForTimeout(1200)

  await page.getByRole('link', { name: /Estudiantes/ }).click()
  await page.waitForURL(/\/students/, { timeout: 15_000 })
  await page.waitForTimeout(600)

  // La pagina destino debe estar realmente pintada, no congelada a mitad.
  await expect(page.getByRole('heading', { name: 'Estudiantes' })).toBeVisible()

  await page.getByRole('link', { name: /Progreso/ }).click()
  await page.waitForURL(/\/progress/, { timeout: 15_000 })
  await page.waitForTimeout(600)
  await expect(page.getByRole('heading', { name: 'Progreso', level: 1 })).toBeVisible()
})

/**
 * Tarjetas navegables.
 *
 * El patron de enlace estirado tiene un fallo caracteristico: el enlace cubre la
 * tarjeta entera y se come el boton del menu. Estas pruebas comprueban las dos
 * mitades, porque arreglar una suele romper la otra.
 */
test.describe('tarjeta de estudiante', () => {
  test('tocar la tarjeta abre la ficha', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/students')
    await page.waitForTimeout(1500)

    const tarjeta = page.getByRole('link', { name: 'Juan Pérez' })
    await tarjeta.scrollIntoViewIfNeeded()

    // Se pulsa lejos del nombre, abajo a la derecha de la tarjeta: si el enlace
    // no estuviera estirado, ahi no habria nada que pulsar.
    // Se busca el <article> contenedor y no una clase: la clase cambia con
    // cada iteracion de diseno -paso de `rounded-xl` a `rounded-block`- y la
    // prueba se rompia sin que la funcionalidad hubiera cambiado.
    const caja = await tarjeta.locator('xpath=ancestor::article[1]').boundingBox()
    expect(caja).not.toBeNull()
    await page.mouse.click(caja!.x + caja!.width - 60, caja!.y + caja!.height - 30)

    await page.waitForURL(/\/students\/.+/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Juan Pérez' })).toBeVisible()
  })

  test('el menu de acciones sigue siendo pulsable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/students')
    await page.waitForTimeout(1500)

    await page.getByRole('button', { name: 'Acciones para Juan Pérez' }).click()
    await expect(page.getByRole('menuitem', { name: 'Ver ficha' })).toBeVisible()

    // Y no ha navegado: el enlace estirado no se ha tragado el toque.
    expect(page.url()).toContain('/students')
    expect(page.url()).not.toMatch(/\/students\/.+/)
  })
})

test('la tarjeta de rutina abre su ficha', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await signIn(page)
  await page.goto('/trainings')
  await page.waitForTimeout(1500)

  const enlace = page.getByRole('link').filter({ hasText: /.+/ }).nth(0)
  const titulo = await page
    .locator('h3 a[href^="/trainings/"]')
    .first()
    .textContent()

  await page.locator('h3 a[href^="/trainings/"]').first().click()
  await page.waitForURL(/\/trainings\/.+/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { level: 1 })).toContainText(titulo!.trim())

  // La ficha se captura DESPLAZADA: los bloques, que son lo que la estructura
  // aporta, viven por debajo del pliegue.
  await scrollInnerContainerToBottom(page)
  await page.screenshot({ path: 'tests/visual/salida/rutina-detalle-mobile.png' })

  // La duracion es derivada: no existe campo que la almacene.
  await expect(page.getByText('min estimados')).toBeVisible()
  expect(enlace).toBeDefined()
})

test('capturas de las fichas nuevas', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await signIn(page)
  await page.goto('/students')
  await page.waitForTimeout(1200)
  await page.locator('h3 a[href^="/students/"]').first().click()
  await page.waitForURL(/\/students\/.+/, { timeout: 15_000 })
  await page.waitForTimeout(800)
  await page.screenshot({ path: 'tests/visual/salida/estudiante-detalle-mobile.png' })
})

/**
 * El flujo que conecta el calendario con la sesion en vivo.
 *
 * Antes de esto la sesion en vivo solo se alcanzaba desde el dashboard, y una
 * sesion del calendario no se podia empezar: el modal ofrecia recordatorio,
 * editar y eliminar, ninguna de las cuales es lo que se hace con una sesion que
 * empieza ahora.
 */
test.describe('calendario: iniciar una sesion', () => {
  test('tocar una sesion abre el detalle y se puede iniciar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/calendar')
    await page.waitForTimeout(1800)

    // Por nombre accesible y no por estructura: `ol button` ataba la prueba al
    // marcado, y dejo de casar en cuanto la vista de dia paso de lista de
    // tramos a escala con sesiones posicionadas.
    await page.getByRole('button', { name: /Entrenamiento Personal/ }).first().click()

    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toBeVisible()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'tests/visual/salida/sesion-detalle-mobile.png' })

    const iniciar = dialogo.getByRole('button', { name: /Iniciar sesión/ })
    await expect(iniciar).toBeVisible()
    await iniciar.click()

    await page.waitForURL(/\/session/, { timeout: 15_000 })
    await expect(page.getByText('Duración')).toBeVisible()
  })

  test('los avisos de confirmacion se ven', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/calendar')
    await page.waitForTimeout(1800)

    // Por nombre accesible y no por estructura: `ol button` ataba la prueba al
    // marcado, y dejo de casar en cuanto la vista de dia paso de lista de
    // tramos a escala con sesiones posicionadas.
    await page.getByRole('button', { name: /Entrenamiento Personal/ }).first().click()
    await page.getByRole('button', { name: /Recordatorio/ }).click()

    // El Toaster no estaba montado: `toast()` se llamaba y no aparecia nada.
    await expect(page.getByText(/Recordatorio enviado a/)).toBeVisible({ timeout: 8000 })
  })
})

/**
 * Alta de sesion.
 *
 * Se comprueba la validacion porque era lo que estaba roto: solo lanzaba un
 * `toast` y el Toaster no estaba montado, asi que enviar el formulario
 * incompleto no producia NADA visible.
 */
test.describe('calendario: nueva sesion', () => {
  test('el formulario avisa de lo que falta', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/calendar')
    await page.waitForTimeout(1800)

    await page.getByRole('button', { name: 'Nueva Sesión' }).click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toBeVisible()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'tests/visual/salida/nueva-sesion-mobile.png' })

    await dialogo.getByRole('button', { name: /Programar sesión/ }).click()

    // Aviso general y marcas junto a cada campo pendiente.
    await expect(page.getByText(/Faltan \d+ campos por completar/)).toBeVisible({
      timeout: 8000,
    })
    expect(await dialogo.getByText('Falta este campo').count()).toBeGreaterThan(2)
  })

  test('el tipo de sesion se elige con el teclado', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/calendar')
    await page.waitForTimeout(1800)

    await page.getByRole('button', { name: 'Nueva Sesión' }).click()
    const dialogo = page.getByRole('dialog')

    /*
     * Se enfoca y se pulsa, que es lo que hace un usuario de teclado. No sirve
     * `.check()`: el input va `sr-only` -visualmente oculto pero en el orden de
     * tabulacion, que es justo el punto- y Playwright lo considera no
     * accionable. Con los `<div onClick>` anteriores esto era imposible de
     * cualquier forma: un div no recibe foco.
     */
    const primerTipo = dialogo.getByRole('radio').first()
    await primerTipo.focus()
    await expect(primerTipo).toBeFocused()

    await page.keyboard.press('Space')
    await expect(primerTipo).toBeChecked()
  })
})

/**
 * Vista semanal. Solo existe desde `md`: en movil el modo esta forzado a dia
 * porque ocho columnas a 375 px dejan 33 px por columna.
 */
test('vista semanal en desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await signIn(page)
  await page.goto('/calendar')
  await page.waitForTimeout(2000)

  const desborde = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(desborde, 'desbordamiento horizontal').toBe(0)

  await page.screenshot({ path: 'tests/visual/salida/semana-desktop.png' })
})

/**
 * La fila de dias no debe irse con la rejilla.
 *
 * Al desplazar una semana hay que seguir sabiendo en que columna cae cada dia;
 * sin eso, la rejilla es un tablero de celdas sin encabezado.
 */
test('la fila de dias sigue visible al desplazar la semana', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await signIn(page)
  await page.goto('/calendar')
  await page.waitForTimeout(2000)

  const sabado = page.getByText('Sáb', { exact: true })
  await expect(sabado).toBeInViewport()

  const desplazado = await scrollInnerContainerToBottom(page)
  // Si no hubo desplazamiento, la prueba no estaria comprobando nada.
  expect(desplazado, 'la rejilla debe haberse desplazado').toBeGreaterThan(200)

  // Y la fila de dias sigue en pantalla.
  await expect(sabado).toBeInViewport()

  await page.screenshot({ path: 'tests/visual/salida/semana-desplazada.png' })
})

/**
 * Reparto entre Progreso y Entrenamientos.
 *
 * Lo que el estudiante CONSIGUE va en Progreso; lo que el entrenador CREA para
 * asignar va en Entrenamientos. Es una decision de producto que se toma una vez
 * y se deshace sola en cuanto alguien vuelve a meter una pestana donde no toca.
 */
test.describe('reparto de secciones', () => {
  test('progreso solo muestra logros', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/progress')
    await page.waitForTimeout(1800)

    await expect(page.getByRole('heading', { name: 'Logros' })).toBeVisible()

    // Ya no hay pestanas de navegacion de pagina: con una sola seccion sobran.
    await expect(page.getByRole('tab', { name: /Desafíos/ })).toHaveCount(0)
    await expect(page.getByRole('tab', { name: /Rachas/ })).toHaveCount(0)
  })

  test('entrenamientos reune lo que el entrenador crea', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/trainings')
    await page.waitForTimeout(1800)

    const lista = page.getByRole('tablist').first()
    for (const etiqueta of [/Rutinas/, /Planes/, /Desafíos/, /Rachas/]) {
      await expect(lista.getByRole('tab', { name: etiqueta })).toBeVisible()
    }

    /*
     * NO hay pestana de plantillas, y la prueba lo fija.
     *
     * La hubo, y la marca `isTemplate` que la sostenia no gobernaba ningun
     * comportamiento: solo repartia una coleccion en dos y pintaba un rotulo
     * distinto. Con ninguna rutina asignada a ningun estudiante, todas eran
     * igualmente plantillas, asi que la pestana separaba una lista de si misma.
     */
    await expect(lista.getByRole('tab', { name: /Plantillas/ })).toHaveCount(0)

    // Y todas las rutinas viven en una sola lista, la de Rutinas.
    await expect(page.getByRole('link', { name: 'Full body · Principiante' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Torso · Empuje y tracción' })).toBeVisible()

    await page.screenshot({ path: 'tests/visual/salida/rutinas-desktop.png' })

    // Desafios y rachas estan vacias a proposito y lo dicen. La prueba fija que
    // NO vuelvan a pintar datos de ejemplo: eso hacia creer que la funcion
    // existe.
    await lista.getByRole('tab', { name: /Desafíos/ }).click()
    await page.waitForTimeout(400)
    await expect(page.getByRole('heading', { name: 'Desafíos' })).toBeVisible()
    await page.screenshot({ path: 'tests/visual/salida/proximamente-desktop.png' })

    await lista.getByRole('tab', { name: /Rachas/ }).click()
    await page.waitForTimeout(400)
    await expect(page.getByRole('heading', { name: 'Rachas' })).toBeVisible()
  })
})

/**
 * Creación de rutinas.
 *
 * La pantalla no existía: el modelo de dominio estaba escrito y no había forma
 * de crear nada con él. Estas pruebas fijan las tres cosas que la hacen algo
 * más que un formulario bonito: que valide, que guarde de verdad, y que la
 * duración que el entrenador ve mientras escribe sea la que queda guardada.
 */
test.describe('creacion de rutinas', () => {
  async function elegirEjercicio(page: Page, indice: number, nombre: string): Promise<void> {
    await elegirDelDesplegable(page, desplegables(page, 'Ejercicio').nth(indice), nombre)
  }

  test('no guarda una rutina sin nombre ni ejercicio', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/trainings/new')

    // Los errores no salen antes de intentar guardar: recibir a alguien con
    // cuatro avisos en rojo por no haber escrito todavia nada es reprenderle
    // por acabar de llegar.
    await expect(page.getByRole('alert')).toHaveCount(0)

    await page.getByRole('button', { name: 'Guardar rutina' }).click()

    await expect(page.getByText('Ponle un nombre a la rutina.')).toBeVisible()
    await expect(page.getByRole('alert')).toContainText('Falta elegir un ejercicio')
    // Y sigue en el formulario: no se ha creado nada.
    expect(page.url()).toContain('/trainings/new')
  })

  test('la duracion estimada distingue la superserie de la serie simple', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/trainings/new')

    await page.getByLabel('Nombre').fill('Torso · Empuje pesado')
    await elegirEjercicio(page, 0, 'Press de banca con barra')
    await page.getByRole('button', { name: /Añadir ejercicio al bloque 1/ }).click()
    await expect(desplegables(page, 'Ejercicio')).toHaveCount(2)
    await elegirEjercicio(page, 1, 'Remo con barra')

    const resumen = page.locator('dl').first()
    const enSerieSimple = extraerMinutos(await resumen.innerText())

    await elegirDelDesplegable(page, desplegables(page, 'Método'), 'Superserie')

    const enSuperserie = extraerMinutos(await resumen.innerText())

    /*
     * En superserie los ejercicios se encadenan sin descanso entre ellos, asi
     * que solo cuenta el del final de la ronda. Si esta prueba dejara de
     * distinguirlas seria que el calculo volvio a tratar todo como series
     * simples, que inflaba la estimacion casi al doble.
     */
    expect(enSerieSimple).toBeGreaterThan(enSuperserie)
  })

  test('la rutina creada se guarda con la duracion que mostraba el formulario', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/trainings')

    const contadorInicial = await page.getByRole('tab', { name: /Rutinas/ }).innerText()

    await page.getByRole('link', { name: 'Nueva Rutina' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva rutina' })).toBeVisible()

    await page.getByLabel('Nombre').fill('Torso · Empuje pesado')
    await page.getByLabel('Descripción').fill('Sesión de empuje con superserie final.')
    await elegirEjercicio(page, 0, 'Press de banca con barra')

    const minutosEnFormulario = extraerMinutos(await page.locator('dl').first().innerText())

    await page.getByRole('button', { name: 'Guardar rutina' }).click()

    // Se navega a la ficha de la rutina recien creada, que ya tiene su
    // identificador propio.
    await page.waitForURL(/\/trainings\/(?!new)[\w-]+/, { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Torso · Empuje pesado' })).toBeVisible()

    // La cifra que se veia al escribir es la que quedo guardada. Si el resumen
    // calculara por su cuenta, aqui se separarian.
    const minutosEnFicha = extraerMinutos(await page.locator('main').innerText())
    expect(minutosEnFicha).toBe(minutosEnFormulario)

    await page.screenshot({ path: 'tests/visual/salida/rutina-creada-mobile.png' })

    // Y aparece en la lista, que es lo que un formulario que no persiste no
    // haria: el contador de la pestana sube.
    await page.getByRole('link', { name: 'Rutinas' }).click()
    await expect(page.getByRole('tab', { name: /Rutinas/ })).not.toHaveText(contadorInicial)
    await expect(page.getByRole('link', { name: 'Torso · Empuje pesado' })).toBeVisible()
  })

  test('el formulario cumple las reglas de 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/trainings/new')
    await page.waitForTimeout(1200)

    const medidas = await page.evaluate(() => {
      const ancho = (elemento: Element) => elemento.getBoundingClientRect().width
      const caja = (elemento: Element) => elemento.getBoundingClientRect()

      return {
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        contenedoresEstrechos: [
          ...document.querySelectorAll('section, article, [class*="rounded-block"]'),
        ]
          .map(ancho)
          .filter((medida) => medida > 0 && medida < 280).length,
        controlesPequenos: [
          ...document.querySelectorAll('button, [role=tab], input, textarea'),
        ]
          .map(caja)
          .filter((rect) => rect.height > 0 && rect.height < 44).length,
        // Toda etiqueta tiene que apuntar a un control que exista: es un fallo
        // que este proyecto ya tuvo en el formulario de registro.
        etiquetasHuerfanas: [...document.querySelectorAll('label[for]')].filter(
          (etiqueta) => document.getElementById(etiqueta.getAttribute('for') ?? '') === null
        ).length,
      }
    })

    expect(medidas.desborde, 'desbordamiento horizontal').toBe(0)
    expect(medidas.contenedoresEstrechos, 'contenedores por debajo de 280 px').toBe(0)
    expect(medidas.controlesPequenos, 'controles por debajo de 44 px').toBe(0)
    expect(medidas.etiquetasHuerfanas, 'etiquetas sin control').toBe(0)
  })
})

/**
 * Los planes dejan de ser inalcanzables.
 *
 * El modelo -mesociclo, microciclos, objetivos y divisiones- estaba escrito y
 * no lo importaba nadie: `usePlans` y `plansMock` eran codigo muerto. Un modelo
 * que no se ve es indistinguible de un modelo que no existe.
 */
test('los planes se ven desde entrenamientos', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await signIn(page)
  await page.goto('/trainings')
  await page.waitForTimeout(1500)

  const lista = page.getByRole('tablist').first()
  await lista.getByRole('tab', { name: /Planes/ }).click()
  await page.waitForTimeout(500)

  await expect(page.getByRole('heading', { name: 'Base de fuerza · 4 semanas' })).toBeVisible()
  // El objetivo y la division se resuelven desde el catalogo, que era la otra
  // mitad muerta: se guardan por identificador, no por nombre.
  await expect(page.getByText('Acondicionamiento general')).toBeVisible()
  await expect(page.getByText('Full body', { exact: true })).toBeVisible()

  const desborde = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(desborde, 'desbordamiento horizontal').toBe(0)

  await page.screenshot({ path: 'tests/visual/salida/planes-mobile.png' })
})

/**
 * Catálogo del entrenamiento.
 *
 * Es lo que desbloquea la pantalla de creación: sin esto, componer una rutina
 * ofrecía quince ejercicios fijos y no había forma de prescribir la máquina que
 * sí hay en el gimnasio.
 */
test.describe('catalogo del entrenamiento', () => {
  const EJERCICIO_NUEVO = 'Prensa de piernas a 45 grados'

  async function abrirCatalogo(page: Page): Promise<void> {
    await page.goto('/trainings')
    await page.getByRole('link', { name: 'Catálogo' }).click()
    /*
     * Margen amplio a proposito: la ruta es `lazy`, asi que al pulsar hay que
     * descargar y compilar su fragmento. En el servidor de desarrollo, y con la
     * maquina cargada por la propia suite, eso pasa de los cinco segundos por
     * defecto. No tapa nada: si la pagina no apareciera, tampoco lo haria en
     * quince.
     */
    await expect(page.getByRole('heading', { name: 'Catálogo', level: 1 })).toBeVisible({
      timeout: 15_000,
    })
  }

  test('un ejercicio nuevo queda disponible al componer una rutina', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await abrirCatalogo(page)

    await page.getByRole('button', { name: 'Nuevo ejercicio' }).click()

    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toBeVisible()

    await dialogo.getByLabel('Nombre').fill(EJERCICIO_NUEVO)
    await elegirDelDesplegable(page, desplegables(page, 'Equipamiento'), 'Máquina guiada')
    await elegirDelDesplegable(
      page,
      desplegables(page, 'Patrón de movimiento'),
      'Dominante de rodilla'
    )
    await elegirDelDesplegable(page, desplegables(page, 'Grupo muscular principal'), 'Cuádriceps')

    // El principal NO se ofrece como secundario: contaria dos veces al repartir
    // volumen y en la ficha se leeria repetido.
    await expect(dialogo.getByRole('button', { name: 'Cuádriceps' })).toHaveCount(0)
    await dialogo.getByRole('button', { name: 'Glúteo' }).click()

    await dialogo.getByRole('button', { name: 'Añadir al catálogo' }).click()

    // El dialogo se cierra de verdad: si se quedara montado, dejaria el <body>
    // con `pointer-events: none` y la pagina inservible por detras.
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByText(EJERCICIO_NUEVO)).toBeVisible()

    await page.screenshot({ path: 'tests/visual/salida/catalogo-desktop.png' })

    /*
     * Y AHORA LO QUE IMPORTA: el ejercicio nuevo se puede prescribir.
     *
     * Esta es la prueba de que el catalogo desbloquea algo, y no solo de que
     * guarda una fila en una lista.
     *
     * Se navega POR LA INTERFAZ y no con `page.goto`. El catalogo vive en
     * memoria mientras dura la sesion -esta anotado en `catalogStore`-, asi que
     * una carga completa de pagina lo devolveria a su semilla y el ejercicio
     * recien creado desapareceria. Es la limitacion declarada, no un defecto,
     * pero la prueba tiene que respetarla o estaria comprobando otra cosa.
     */
    await page.getByRole('link', { name: 'Entrenamientos' }).first().click()
    await page.getByRole('link', { name: 'Nueva Rutina' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva rutina' })).toBeVisible()

    await desplegables(page, 'Ejercicio').first().click()
    await expect(
      page.getByRole('listbox').getByRole('option', { name: EJERCICIO_NUEVO, exact: true })
    ).toBeVisible()
  })

  test('no deja borrar un ejercicio que alguna rutina prescribe', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await abrirCatalogo(page)

    const enUso = 'Press de banca con barra'
    await page.getByRole('button', { name: `Eliminar ${enUso}` }).click()

    /*
     * Se bloquea y se dice quien lo impide. La rutina guarda `exerciseId`, no
     * una copia: borrar la entrada dejaria la referencia colgando y romperia la
     * rutina en silencio. La vista degrada -pinta «Ejercicio»- pero eso no es
     * excusa para permitirlo.
     */
    await expect(page.getByRole('alert')).toContainText('No se puede borrar')
    await expect(page.getByRole('alert')).toContainText('Full body · Principiante')
    await expect(page.getByText(enUso).first()).toBeVisible()
  })

  test('el catalogo cumple las reglas de 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await abrirCatalogo(page)

    const lista = page.getByRole('tablist').first()

    for (const pestana of ['Ejercicios', 'Equipamiento', 'Bloques', 'Referencia']) {
      await lista.getByRole('tab', { name: pestana }).click()
      await page.waitForTimeout(400)

      const medidas = await page.evaluate(() => {
        const caja = (elemento: Element) => elemento.getBoundingClientRect()

        return {
          desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          contenedoresEstrechos: [
            ...document.querySelectorAll('section, article, [class*="rounded-block"]'),
          ]
            .map((elemento) => caja(elemento).width)
            .filter((ancho) => ancho > 0 && ancho < 280).length,
          controlesPequenos: [
            ...document.querySelectorAll('button, [role=tab], input, textarea'),
          ]
            .map(caja)
            .filter((rect) => rect.height > 0 && rect.height < 44).length,
          etiquetasHuerfanas: [...document.querySelectorAll('label[for]')].filter(
            (etiqueta) => document.getElementById(etiqueta.getAttribute('for') ?? '') === null
          ).length,
        }
      })

      expect(medidas.desborde, `desbordamiento en ${pestana}`).toBe(0)
      expect(medidas.contenedoresEstrechos, `contenedores bajo 280 px en ${pestana}`).toBe(0)
      expect(medidas.controlesPequenos, `controles bajo 44 px en ${pestana}`).toBe(0)
      expect(medidas.etiquetasHuerfanas, `etiquetas sin control en ${pestana}`).toBe(0)
    }

    await page.screenshot({ path: 'tests/visual/salida/catalogo-mobile.png' })
  })

  test('el material se edita en la fila y se protege igual', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await abrirCatalogo(page)

    await page.getByRole('tab', { name: 'Equipamiento' }).click()

    // Alta.
    await page.getByLabel('Nuevo material').fill('Prensa de piernas')
    await page.getByRole('button', { name: 'Añadir' }).click()
    await expect(page.getByText('Prensa de piernas')).toBeVisible()

    // Edicion en la propia fila: son dos campos, y abrir una ventana para dos
    // campos hace lento lo que deberia ser instantaneo.
    await page.getByRole('button', { name: 'Editar Prensa de piernas' }).click()
    await page.getByLabel('Nombre de Prensa de piernas').fill('Prensa horizontal')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Prensa horizontal')).toBeVisible()

    // Recien creado no lo usa nadie, asi que se puede borrar.
    await page.getByRole('button', { name: 'Eliminar Prensa horizontal' }).click()
    await expect(page.getByText('Prensa horizontal')).toHaveCount(0)

    // Pero la barra si la usan ejercicios, y ese borrado se bloquea.
    await page.getByRole('button', { name: 'Eliminar Barra' }).click()
    await expect(page.getByRole('alert')).toContainText('No se puede borrar «Barra»')
  })
})

/**
 * Biblioteca de bloques.
 *
 * Resuelve la duplicacion que de verdad duele -volver a teclear la misma
 * superserie- sin crear el problema que resolveria peor: si la rutina apuntara
 * a la entrada guardada, editarla cambiaria en silencio el programa que alguien
 * esta haciendo esta semana.
 */
test.describe('biblioteca de bloques', () => {
  async function componerBloque(page: Page, ejercicio: string): Promise<void> {
    await page.goto('/trainings/new')
    await page.getByLabel('Nombre').fill('Torso · Empuje pesado')
    await elegirDelDesplegable(page, desplegables(page, 'Ejercicio').first(), ejercicio)
  }

  test('un bloque guardado se vuelve a insertar como copia', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await componerBloque(page, 'Press de banca con barra')

    // El boton esta apagado mientras el bloque no tenga su ejercicio elegido,
    // asi que llegados aqui ya tiene que poder pulsarse.
    await page.getByRole('button', { name: /Guardar el bloque 1 en la biblioteca/ }).click()
    await expect(page.getByText(/guardado en la biblioteca/)).toBeVisible()

    await page.getByRole('button', { name: 'Insertar guardado' }).click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toBeVisible()
    await dialogo.getByRole('button', { name: /Serie simple/ }).click()

    // Dos bloques, y el insertado trae el ejercicio ya puesto.
    await expect(page.getByRole('heading', { name: 'Bloque', level: 3 })).toHaveCount(2)
    await expect(desplegables(page, 'Ejercicio')).toHaveCount(2)
    await expect(desplegables(page, 'Ejercicio').nth(1)).toContainText('Press de banca con barra')
  })

  test('editar lo insertado no toca la entrada guardada', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await componerBloque(page, 'Press de banca con barra')

    await page.getByRole('button', { name: /Guardar el bloque 1 en la biblioteca/ }).click()
    await page.getByRole('button', { name: 'Insertar guardado' }).click()
    await page.getByRole('dialog').getByRole('button', { name: /Serie simple/ }).click()

    // Se cambia la prescripcion del bloque INSERTADO.
    await page.getByLabel('Repeticiones').nth(1).fill('5')

    /*
     * Y la entrada guardada sigue diciendo 8-10. Si la rutina referenciara la
     * entrada en vez de copiarla, aqui pondria 5: seria haberle cambiado el
     * programa a todo el que use ese bloque, sin avisar.
     *
     * Se navega por la interfaz: el almacen vive en memoria y `page.goto`
     * lo devolveria a su semilla, que en esta biblioteca es estar vacia.
     */
    await page.getByRole('link', { name: 'Rutinas' }).first().click()
    await page.getByRole('link', { name: 'Catálogo' }).click()
    await page.getByRole('tab', { name: 'Bloques' }).click()

    await expect(page.getByText('Serie simple · Press de banca con barra')).toBeVisible()
    await expect(page.getByText('3 × 8-10', { exact: true })).toBeVisible()
    await expect(page.getByText('3 × 5', { exact: true })).toHaveCount(0)
  })

  test('la entrada guardada se renombra y se borra sin romper nada', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await componerBloque(page, 'Sentadilla con barra')
    await page.getByRole('button', { name: /Guardar el bloque 1 en la biblioteca/ }).click()

    await page.getByRole('link', { name: 'Rutinas' }).first().click()
    await page.getByRole('link', { name: 'Catálogo' }).click()
    await page.getByRole('tab', { name: 'Bloques' }).click()

    // El nombre sale del contenido: guardar no pregunta, para no convertir un
    // gesto en un tramite.
    const generado = 'Serie simple · Sentadilla con barra'
    await expect(page.getByText(generado)).toBeVisible()

    await page.getByRole('button', { name: `Renombrar ${generado}` }).click()
    await page.getByLabel(`Nombre de ${generado}`).fill('Mi bloque de pierna')
    await page.getByRole('button', { name: 'Guardar el nombre' }).click()
    await expect(page.getByText('Mi bloque de pierna')).toBeVisible()

    // Borrar una entrada no necesita proteccion: nadie depende de ella, porque
    // las rutinas guardan copias.
    await page.getByRole('button', { name: 'Eliminar Mi bloque de pierna' }).click()
    await expect(page.getByRole('heading', { name: 'Sin bloques guardados' })).toBeVisible()
  })
})

/**
 * Edicion de rutinas.
 *
 * El mismo formulario que las crea, con el borrador cargado desde la rutina. La
 * ruta es lo unico que distingue una cosa de la otra.
 */
test.describe('edicion de rutinas', () => {
  test('el formulario abre con la rutina cargada y guarda sobre ella', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/trainings/routine-2/edit')

    await expect(page.getByRole('heading', { name: 'Editar rutina' })).toBeVisible()
    await expect(page.getByLabel('Nombre')).toHaveValue('Empuje · Intermedio')
    // Tres bloques y cuatro ejercicios, ya elegidos.
    await expect(page.getByRole('heading', { name: 'Bloque', level: 3 })).toHaveCount(3)
    await expect(desplegables(page, 'Ejercicio')).toHaveCount(4)
    await expect(desplegables(page, 'Ejercicio').first()).toContainText('Press de banca con barra')

    const minutosAntes = extraerMinutos(await page.locator('dl').first().innerText())

    await page.getByLabel('Nombre').fill('Empuje · Intermedio (revisado)')
    // Mas series: la duracion estimada tiene que subir.
    await page.getByLabel('Series').first().fill('6')
    const minutosDespues = extraerMinutos(await page.locator('dl').first().innerText())
    expect(minutosDespues).toBeGreaterThan(minutosAntes)

    await page.getByRole('button', { name: 'Guardar cambios' }).click()

    /*
     * Vuelve a la ficha de LA MISMA rutina: editar conserva el identificador.
     * Si se hubiera creado una nueva, la URL traeria otro.
     */
    await page.waitForURL(/\/trainings\/routine-2$/)
    await expect(page.getByRole('heading', { name: 'Empuje · Intermedio (revisado)' })).toBeVisible()

    const minutosEnFicha = extraerMinutos(await page.locator('main').innerText())
    expect(minutosEnFicha).toBe(minutosDespues)

    // Y no se ha duplicado: siguen siendo tres rutinas.
    await page.getByRole('link', { name: 'Rutinas' }).first().click()
    await expect(page.getByRole('tab', { name: /Rutinas/ })).toContainText('(3)')
  })

  test('editar una rutina que no existe no revienta', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/trainings/no-existe/edit')

    await expect(page.getByText('Rutina no encontrada')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Volver a rutinas' })).toBeVisible()
  })

  test('se llega a editar desde la ficha', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/trainings/routine-1')

    await page.getByRole('link', { name: 'Editar' }).click()
    await expect(page.getByRole('heading', { name: 'Editar rutina' })).toBeVisible()
    await expect(page.getByLabel('Nombre')).toHaveValue('Full body · Principiante')
  })
})

/**
 * Planes: crear y editar.
 *
 * Estaban modelados y solo se leian. Un plan es un mesociclo, asi que el
 * formulario se organiza por semanas y cada semana por sus siete dias.
 */
test.describe('planes', () => {
  test('la accion primaria sigue a la pestana', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/trainings')

    // Sin acotar a la cabecera: hay varios `<header>` en la pagina -el de la
    // aplicacion y el de la seccion- y el enlace es unico de todos modos.
    await expect(page.getByRole('link', { name: 'Nueva Rutina' })).toBeVisible()

    await page.getByRole('tab', { name: /Planes/ }).click()
    await expect(page.getByRole('link', { name: 'Nuevo Plan' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Nueva Rutina' })).toHaveCount(0)

    // La pestana viaja en la URL, asi que es enlazable.
    await expect(page).toHaveURL(/tab=planes/)
  })

  test('un plan nuevo se crea y aparece en su pestana', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/trainings?tab=planes')

    await page.getByRole('link', { name: 'Nuevo Plan' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo plan' })).toBeVisible()

    await page.getByLabel('Nombre').fill('Hipertrofia · 4 semanas')
    await elegirDelDesplegable(page, desplegables(page, 'Objetivo'), 'Hipertrofia')
    await elegirDelDesplegable(page, desplegables(page, 'División'), 'Torso / Pierna')

    // La division dice cuantas sesiones asume, sin imponerlas: es distinta de
    // la frecuencia con la que se toca cada musculo.
    await expect(page.getByText('Asume 4 sesiones por semana.')).toBeVisible()

    await elegirDelDesplegable(page, desplegables(page, 'lunes'), 'Empuje · Intermedio')
    await elegirDelDesplegable(page, desplegables(page, 'miércoles'), 'Full body · Principiante')

    const resumen = page.locator('dl').first()
    await expect(resumen).toContainText('2')

    /*
     * Anadir una semana COPIA la anterior: en un mesociclo la estructura se
     * repite, y arrancar en blanco obligaria a reelegir las mismas rutinas.
     */
    await page.getByRole('button', { name: 'Añadir semana' }).click()
    await expect(page.getByRole('heading', { name: 'Semana', level: 3 })).toHaveCount(2)
    await expect(desplegables(page, 'lunes').nth(1)).toContainText('Empuje · Intermedio')

    await page.getByRole('button', { name: 'Guardar plan' }).click()

    // Se aterriza en la FICHA del plan recien creado, no en la lista: es donde
    // se comprueba que ha quedado como se queria.
    await page.waitForURL(/\/trainings\/plans\/(?!new)[\w-]+$/)
    await expect(page.getByRole('heading', { name: 'Hipertrofia · 4 semanas' })).toBeVisible()

    // Y desde la ficha se vuelve a la lista, con el contador ya en dos.
    await page.getByRole('link', { name: 'Planes' }).first().click()
    await page.waitForURL(/tab=planes/)
    await expect(page.getByRole('tab', { name: /Planes/ })).toContainText('(2)')
  })

  test('un plan sin ninguna rutina asignada no se guarda', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/trainings/plans/new')

    await page.getByRole('button', { name: 'Guardar plan' }).click()

    await expect(page.getByText('Ponle un nombre al plan.')).toBeVisible()
    await expect(page.getByRole('alert')).toContainText('Asigna al menos una rutina')
    expect(page.url()).toContain('/trainings/plans/new')
  })

  test('editar un plan carga sus semanas', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/trainings/plans/plan-1/edit')

    await expect(page.getByRole('heading', { name: 'Editar plan' })).toBeVisible()
    await expect(page.getByLabel('Nombre')).toHaveValue('Base de fuerza · 4 semanas')
    await expect(page.getByRole('heading', { name: 'Semana', level: 3 })).toHaveCount(4)
    await expect(desplegables(page, 'Objetivo')).toContainText('Acondicionamiento general')

    // La cuarta semana viene marcada como descarga, y el formulario dice la
    // verdad sobre lo que eso hace hoy.
    await expect(page.getByRole('button', { name: 'Descarga', pressed: true })).toHaveCount(1)
    await expect(page.getByText('no reduce el volumen por sí solo')).toBeVisible()
  })

  test('el formulario de plan cumple las reglas de 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/trainings/plans/plan-1/edit')
    await page.waitForTimeout(1200)

    const medidas = await page.evaluate(() => {
      const caja = (elemento: Element) => elemento.getBoundingClientRect()

      return {
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        contenedoresEstrechos: [
          ...document.querySelectorAll('section, article, [class*="rounded-block"]'),
        ]
          .map((elemento) => caja(elemento).width)
          .filter((ancho) => ancho > 0 && ancho < 280).length,
        controlesPequenos: [...document.querySelectorAll('button, input, textarea')]
          .map(caja)
          .filter((rect) => rect.height > 0 && rect.height < 44).length,
        etiquetasHuerfanas: [...document.querySelectorAll('label[for]')].filter(
          (etiqueta) => document.getElementById(etiqueta.getAttribute('for') ?? '') === null
        ).length,
      }
    })

    expect(medidas.desborde, 'desbordamiento horizontal').toBe(0)
    expect(medidas.contenedoresEstrechos, 'contenedores bajo 280 px').toBe(0)
    expect(medidas.controlesPequenos, 'controles bajo 44 px').toBe(0)
    expect(medidas.etiquetasHuerfanas, 'etiquetas sin control').toBe(0)

    await page.screenshot({ path: 'tests/visual/salida/plan-mobile.png' })
  })
})

/**
 * Ficha de plan.
 *
 * La tarjeta llevaba directamente al formulario, y consultar un mesociclo
 * -que se hace a diario- obligaba a leer entre desplegables.
 */
test.describe('ficha de plan', () => {
  test('la tarjeta lleva a la ficha, y la ficha a la rutina de cada dia', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/trainings?tab=planes')

    await page.getByRole('link', { name: 'Base de fuerza · 4 semanas' }).click()
    await page.waitForURL(/\/trainings\/plans\/plan-1$/)

    // Las cifras salen del dato, con las mismas funciones que la tarjeta.
    const resumen = page.locator('dl').first()
    await expect(resumen).toContainText('11')

    // Las cuatro semanas, con sus siete dias cada una y los descansos a la
    // vista: ocultar los huecos haria que «lunes, miercoles y viernes» y «tres
    // dias seguidos» se vieran igual.
    await expect(page.locator('ol > li')).toHaveCount(4)
    await expect(page.locator('ol > li').first().locator('ul > li')).toHaveCount(7)
    await expect(page.getByText('Descanso').first()).toBeVisible()

    // La cuarta semana esta marcada como descarga.
    await expect(page.getByText('Descarga').first()).toBeVisible()

    // Y cada dia con rutina lleva a su ficha.
    await page.getByRole('link', { name: 'Full body · Principiante' }).first().click()
    await page.waitForURL(/\/trainings\/routine-1$/)
  })

  test('la ficha de plan cumple las reglas de 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/trainings/plans/plan-1')
    await page.waitForTimeout(1200)

    const medidas = await page.evaluate(() => {
      const caja = (elemento: Element) => elemento.getBoundingClientRect()

      return {
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        contenedoresEstrechos: [
          ...document.querySelectorAll('section, article, [class*="rounded-block"]'),
        ]
          .map((elemento) => caja(elemento).width)
          .filter((ancho) => ancho > 0 && ancho < 280).length,
        controlesPequenos: [...document.querySelectorAll('button, a, input, textarea')]
          .map(caja)
          .filter((rect) => rect.height > 0 && rect.height < 44).length,
        /*
         * El nombre de la rutina no puede truncarse: es el dato que se viene a
         * leer. Con el sangrado de escritorio se quedaba en 99 px cuando
         * necesita 136.
         */
        nombresTruncados: [...document.querySelectorAll('ol li ul li a')].filter(
          (enlace) => enlace.scrollWidth > enlace.clientWidth + 1
        ).length,
      }
    })

    expect(medidas.desborde, 'desbordamiento horizontal').toBe(0)
    expect(medidas.contenedoresEstrechos, 'contenedores bajo 280 px').toBe(0)
    expect(medidas.controlesPequenos, 'controles bajo 44 px').toBe(0)
    expect(medidas.nombresTruncados, 'nombres de rutina truncados').toBe(0)

    await page.screenshot({ path: 'tests/visual/salida/plan-ficha-mobile.png' })
  })

  test('una ficha de plan que no existe no revienta', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/trainings/plans/no-existe')

    await expect(page.getByText('Plan no encontrado')).toBeVisible()
  })
})

/**
 * Borrado de rutinas y planes.
 *
 * La asimetria es intencionada: un plan guarda `routineId`, asi que borrar una
 * rutina programada dejaria el mesociclo apuntando al vacio. Nada apunta a un
 * plan, asi que un plan siempre se puede borrar.
 */
test.describe('borrado', () => {
  test('no deja borrar una rutina que algun plan programa', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/trainings/routine-1')

    await page.getByRole('button', { name: 'Eliminar' }).click()

    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toContainText('No se puede eliminar')
    // Dice QUIEN lo impide, y con el verbo en singular.
    await expect(dialogo).toContainText('La programa el plan Base de fuerza · 4 semanas')
    // Y no ofrece borrar: solo cerrar.
    await expect(dialogo.getByRole('button', { name: 'Eliminar' })).toHaveCount(0)
    await expect(dialogo.getByRole('button', { name: 'Entendido' })).toBeVisible()
  })

  test('borra una rutina que no programa nadie, tras confirmar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/trainings/routine-3')

    await page.getByRole('button', { name: 'Eliminar' }).click()

    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toContainText('¿Eliminar la rutina?')
    await expect(dialogo).toContainText('no se puede deshacer')

    // Se puede echar atras: cancelar no borra.
    await dialogo.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Torso · Empuje y tracción' })).toBeVisible()

    await page.getByRole('button', { name: 'Eliminar' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()

    // Se sale de la ficha, que ya no existe, y el contador baja.
    await page.waitForURL(/\/trainings$/)
    await expect(page.getByRole('tab', { name: /Rutinas/ })).toContainText('(2)')
  })

  test('un plan siempre se puede borrar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/trainings/plans/plan-1')

    await page.getByRole('button', { name: 'Eliminar' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()

    await page.waitForURL(/tab=planes/)
    await expect(page.getByText('Aún no has creado ningún plan.')).toBeVisible()

    /*
     * Y la rutina que ese plan programaba pasa a poder borrarse: la regla mira
     * el estado de ahora, no una foto de cuando se cargo la pagina.
     *
     * Se navega POR LA INTERFAZ: los almacenes viven en memoria, asi que un
     * `page.goto` recargaria la aplicacion y resucitaria el plan recien
     * borrado, con lo que la prueba comprobaria lo contrario de lo que dice.
     */
    await page.getByRole('tab', { name: /Rutinas/ }).click()
    await page.getByRole('link', { name: 'Full body · Principiante' }).click()
    await page.getByRole('button', { name: 'Eliminar' }).click()
    await expect(page.getByRole('dialog')).toContainText('¿Eliminar la rutina?')
  })
})

/**
 * «Usar en una sesion»: el flujo que une entrenamientos con la agenda.
 *
 * Es lo que hizo que `Routine` subiera a `shared/domain/entities`: la sesion
 * guarda `routineId`, asi que dos dominios necesitan la entidad y ninguno puede
 * importar del otro. La agenda la lee por el mismo puerto que trainings.
 */
test.describe('usar una rutina en una sesion', () => {
  test('desde la ficha se llega a la agenda con la rutina puesta', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/trainings/routine-2')

    await page.getByRole('link', { name: 'Usar en una sesión' }).click()

    // El dialogo de alta se abre solo, ya con la rutina elegida.
    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toBeVisible()
    await expect(desplegables(page, 'Rutina')).toContainText('Empuje · Intermedio')

    /*
     * Y el parametro desaparece de la URL: recargar o volver atras no debe
     * reabrir el formulario, ni la direccion quedarse diciendo algo que ya no
     * es cierto.
     */
    await expect(page).toHaveURL(/\/calendar$/)
  })

  test('la sesion agendada existe y enlaza a su rutina', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/trainings/routine-2')
    await page.getByRole('link', { name: 'Usar en una sesión' }).click()

    const dialogo = page.getByRole('dialog')
    await dialogo.getByText('Entrenamiento personal').click()
    // El desplegable muestra el nombre corto -«Maria G.»-, no el completo.
    await elegirDelDesplegable(page, desplegables(page, 'Alumno'), 'María', false)
    /*
     * El dia de hoy, por su NOMBRE ACCESIBLE completo.
     *
     * Buscarlo por el numero no vale: la rejilla incluye los dias de relleno del
     * mes anterior, asi que un «31» puede ser el del mes pasado -deshabilitado,
     * porque no se agenda en el pasado- y el clic se queda esperando para
     * siempre a un boton que nunca se habilita.
     */
    const hoy = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    await dialogo.getByRole('button', { name: hoy }).click()
    await elegirDelDesplegable(page, desplegables(page, 'Hora'), '15:00')
    await elegirDelDesplegable(page, desplegables(page, 'Ubicación'), 'Gimnasio Principal')

    await dialogo.getByRole('button', { name: 'Programar sesión' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    /*
     * La sesion EXISTE en la agenda. Antes el formulario solo lanzaba un aviso y
     * no dejaba nada detras, asi que este flujo habria terminado en nada.
     */
    /*
     * Se busca por NOMBRE ACCESIBLE: en la vista semanal la tarjeta es compacta
     * y muestra el alumno, no el titulo, pero su `aria-label` si lo lleva. Es
     * ademas lo que oye quien no ve la pantalla.
     */
    const agendada = page.getByLabel(/Empuje · Intermedio/).first()
    await expect(agendada).toBeVisible()

    // Y su ficha enlaza a la rutina que ejecuta.
    await agendada.click()
    const detalle = page.getByRole('dialog')
    await expect(detalle.getByRole('link', { name: 'Empuje · Intermedio' })).toBeVisible()
    await detalle.getByRole('link', { name: 'Empuje · Intermedio' }).click()
    await page.waitForURL(/\/trainings\/routine-2$/)
  })
})

/**
 * Asignar sesiones a un alumno desde su ficha.
 *
 * Es lo que hizo que `Session` subiera a `shared/domain/entities`: la necesitan
 * `calendar` y `students`. Y lo que obligo a que el alumno se guarde por
 * IDENTIFICADOR: con el nombre en texto no habia forma de preguntar «que tiene
 * Maria esta semana» sin comparar cadenas.
 */
test.describe('sesiones del alumno', () => {
  test('la ficha lista las sesiones de ese alumno y solo esas', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students/student-2')

    await expect(page.getByRole('heading', { name: 'Sesiones' })).toBeVisible()
    await expect(page.getByText('Entrenamiento Personal')).toBeVisible()
    await expect(page.getByText('Gimnasio Principal')).toBeVisible()

    /*
     * Y NO las de otros. La semilla decia «María García» donde el padron dice
     * «María Gómez», asi que con el nombre en texto esta sesion no era de nadie:
     * ahora lo es de `student-2` porque lo dice su identificador.
     */
    await expect(page.getByText('Evaluación Inicial')).toHaveCount(0)
  })

  test('un alumno sin sesiones lo dice, y no finge una lista vacia', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/students/student-5')

    // `student-5` no existe en la semilla: la ficha degrada, no revienta.
    await expect(page.getByText('Estudiante no encontrado')).toBeVisible()
  })

  test('lo agendado desde la ficha aparece en el calendario', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students/student-3')

    // `.first()` porque el disparador y el envio del dialogo comparten
    // etiqueta, que en pantalla se lee bien -uno abre y el otro confirma- pero
    // deja dos coincidencias.
    await page.getByRole('button', { name: 'Agendar sesión' }).first().click()

    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toContainText('Carlos López')

    await elegirDelDesplegable(page, desplegables(page, 'Rutina'), 'Full body · Principiante')

    const hoy = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    await dialogo.getByRole('button', { name: hoy }).click()
    await elegirDelDesplegable(page, desplegables(page, 'Hora'), '16:00')
    await elegirDelDesplegable(page, desplegables(page, 'Ubicación'), 'Sala Grupal')

    await dialogo.getByRole('button', { name: 'Agendar sesión' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // Aparece en la lista del alumno sin recargar.
    await expect(page.getByText('Sala Grupal')).toBeVisible()

    /*
     * Y EN EL CALENDARIO, que es lo que se pedia. No comparten estado: comparten
     * ORIGEN. Los dos dominios leen del mismo puerto y estan suscritos a sus
     * cambios, asi que ninguno tiene que saber del otro.
     *
     * Se navega por la interfaz: los adaptadores falsos viven en memoria y un
     * `page.goto` recargaria la aplicacion perdiendo lo recien agendado.
     */
    await page.getByRole('link', { name: 'Ver la agenda completa' }).click()
    await page.waitForURL(/\/calendar$/)

    // La tarjeta compacta muestra el alumno; su nombre accesible, el titulo.
    const agendada = page.getByLabel(/Full body · Principiante/).first()
    await expect(agendada).toBeVisible()
    await expect(agendada).toContainText('Carlos López')
  })

  test('la ficha del alumno cumple las reglas de 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/students/student-2')
    await page.waitForTimeout(1200)

    const medidas = await page.evaluate(() => {
      const caja = (elemento: Element) => elemento.getBoundingClientRect()

      return {
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        contenedoresEstrechos: [
          ...document.querySelectorAll('section, article, [class*="rounded-block"]'),
        ]
          .map((elemento) => caja(elemento).width)
          .filter((ancho) => ancho > 0 && ancho < 280).length,
        controlesPequenos: [...document.querySelectorAll('button, a, input, textarea')]
          .map(caja)
          .filter((rect) => rect.height > 0 && rect.height < 44).length,
        etiquetasHuerfanas: [...document.querySelectorAll('label[for]')].filter(
          (etiqueta) => document.getElementById(etiqueta.getAttribute('for') ?? '') === null
        ).length,
      }
    })

    expect(medidas.desborde, 'desbordamiento horizontal').toBe(0)
    expect(medidas.contenedoresEstrechos, 'contenedores bajo 280 px').toBe(0)
    expect(medidas.controlesPequenos, 'controles bajo 44 px').toBe(0)
    expect(medidas.etiquetasHuerfanas, 'etiquetas sin control').toBe(0)

    await page.screenshot({ path: 'tests/visual/salida/alumno-sesiones-mobile.png' })
  })
})

/**
 * Choques de horario.
 *
 * La agenda dejaba doble-reservar sin decir nada. La regla AVISA y deja decidir:
 * hay solapes legitimos -una sesion online en paralelo, un margen aceptado- y
 * prohibirlos en seco hace que la gente pelee con la herramienta. Lo inaceptable
 * es doblar la agenda sin enterarse.
 */
test.describe('choques de horario', () => {
  /** La semilla pone una sesion hoy a las 09:00, de 60 minutos. */
  const HOY = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  async function abrirAgendarDesdeFicha(page: Page): Promise<Locator> {
    await page.goto('/students/student-3')
    await page.getByRole('button', { name: 'Agendar sesión' }).first().click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toBeVisible()
    await dialogo.getByRole('button', { name: HOY }).click()
    return dialogo
  }

  test('el desplegable marca los tramos ya ocupados', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    const dialogo = await abrirAgendarDesdeFicha(page)

    await desplegables(page, 'Hora').click()

    /*
     * Contesta por adelantado la pregunta que el entrenador se hace de verdad
     * -«¿cuando le meto?»- en vez de regañarle despues de elegir.
     */
    const listado = page.getByRole('listbox')
    await expect(listado.getByRole('option', { name: /09:00.*ocupado/ })).toBeVisible()
    // Y un tramo libre no dice nada.
    await expect(listado.getByRole('option', { name: '14:00', exact: true })).toBeVisible()

    await expect(dialogo).toBeVisible()
  })

  test('avisa al agendar encima, nombrando con que choca', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    const dialogo = await abrirAgendarDesdeFicha(page)

    await elegirDelDesplegable(page, desplegables(page, 'Hora'), '09:00', false)
    await elegirDelDesplegable(page, desplegables(page, 'Ubicación'), 'Sala Grupal')
    await dialogo.getByRole('button', { name: 'Agendar sesión' }).click()

    // Nombra la sesion y su tramo: «ese hueco esta ocupado» no le sirve a nadie.
    const aviso = dialogo.getByRole('alert')
    await expect(aviso).toContainText('Choca con')
    await expect(aviso).toContainText('09:00–10:00')

    // Y NO se ha agendado nada todavia: el dialogo sigue abierto.
    await expect(dialogo).toBeVisible()
  })

  test('un choque a media hora tambien se detecta, no solo la misma hora', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    const dialogo = await abrirAgendarDesdeFicha(page)

    /*
     * La sesion de la semilla ocupa de 09:00 a 10:00. Empezar a las 09:30 no
     * comparte hora de inicio y choca igual: la regla compara INTERVALOS, que es
     * lo que hace que el fallo dificil de ver tambien salte.
     */
    await elegirDelDesplegable(page, desplegables(page, 'Hora'), '09:30', false)
    await elegirDelDesplegable(page, desplegables(page, 'Ubicación'), 'Sala Grupal')
    await dialogo.getByRole('button', { name: 'Agendar sesión' }).click()

    await expect(dialogo.getByRole('alert')).toContainText('Choca con')
  })

  test('encadenar dos sesiones seguidas NO es un choque', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    const dialogo = await abrirAgendarDesdeFicha(page)

    /*
     * La semilla deja un hueco exacto: una sesion termina a las 10:00 y la
     * siguiente empieza a las 10:30. Media hora ahi encaja tocando las dos y sin
     * pisar ninguna, que es lo que prueba que los intervalos son medio abiertos
     * por los DOS extremos.
     */
    await elegirDelDesplegable(page, desplegables(page, 'Duración'), '30 min')
    await elegirDelDesplegable(page, desplegables(page, 'Hora'), '10:00', false)
    await elegirDelDesplegable(page, desplegables(page, 'Ubicación'), 'Sala Grupal')
    await dialogo.getByRole('button', { name: 'Agendar sesión' }).click()

    // Se agenda sin avisar de nada.
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByText('Sala Grupal')).toBeVisible()
  })

  test('se puede agendar encima a proposito, con un segundo gesto', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    const dialogo = await abrirAgendarDesdeFicha(page)

    await elegirDelDesplegable(page, desplegables(page, 'Hora'), '09:00', false)
    await elegirDelDesplegable(page, desplegables(page, 'Ubicación'), 'Online')
    await dialogo.getByRole('button', { name: 'Agendar sesión' }).click()
    await expect(dialogo.getByRole('alert')).toBeVisible()

    // El solape legitimo -una sesion online en paralelo- se permite tras leer
    // con que choca.
    await dialogo.getByRole('button', { name: 'Agendar de todos modos' }).click()

    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByText('Online')).toBeVisible()
  })

  test('cambiar la hora retira el aviso', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    const dialogo = await abrirAgendarDesdeFicha(page)

    await elegirDelDesplegable(page, desplegables(page, 'Hora'), '09:00', false)
    await elegirDelDesplegable(page, desplegables(page, 'Ubicación'), 'Sala Grupal')
    await dialogo.getByRole('button', { name: 'Agendar sesión' }).click()
    await expect(dialogo.getByRole('alert')).toBeVisible()

    // El aviso describe un hueco concreto: en cuanto el hueco cambia, deja de
    // ser cierto y no puede quedarse en pantalla.
    await elegirDelDesplegable(page, desplegables(page, 'Hora'), '15:00', false)
    await expect(dialogo.getByRole('alert')).toHaveCount(0)
  })
})

/**
 * Asignar rutinas y planes a un estudiante.
 *
 * ASIGNAR NO ES AGENDAR, y esa separacion es lo que estas pruebas fijan.
 * Asignar dice «esto es tuyo»; poner las sesiones en el calendario es otra
 * accion, opcional. Los tres tipos -sesion, rutina, plan- son independientes y
 * no excluyentes: lo decide el entrenador.
 */
test.describe('asignaciones del alumno', () => {
  test('la ficha distingue plan de rutina, y si el plan ha empezado', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students/student-2')

    await expect(page.getByRole('heading', { name: 'Asignado' })).toBeVisible()

    // Un plan con fecha de inicio dice cuando empieza.
    await expect(page.getByText(`Empieza el ${comoFecha(proximoLunes())}`)).toBeVisible()
    // Y una rutina suelta, cuando se asigno: es repertorio, no algo que empiece.
    await expect(page.getByText(/^Asignada el /)).toBeVisible()

    /*
     * Las dos conviven. No son excluyentes ni jerarquicas: un alumno puede
     * seguir un plan y tener ademas rutinas sueltas.
     */
    await expect(page.getByRole('link', { name: 'Base de fuerza · 4 semanas' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Empuje · Intermedio' })).toBeVisible()
  })

  test('un plan sin fecha de inicio lo dice, en vez de fingir que ha empezado', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/students/student-3')

    // Es un estado legitimo: «este es tu programa, ya veremos cuando empiezas».
    await expect(page.getByText('Asignado, sin fecha de inicio')).toBeVisible()
  })

  test('asignar un plan NO crea ninguna sesion', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students/student-4')

    /*
     * Se cuentan FILAS y no se compara el texto de la seccion: las sesiones
     * llegan del puerto, asi que leer el texto nada mas cargar capturaba la
     * seccion todavia vacia y luego «cambiaba» sola.
     */
    const filasDeSesion = page
      .locator('section')
      .filter({ hasText: 'Sesiones' })
      .locator('ul > li')
    await expect(filasDeSesion).toHaveCount(1)

    await page.getByRole('button', { name: 'Asignar' }).first().click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toContainText('Asignar no agenda nada')

    await elegirDelDesplegable(page, desplegables(page, 'Plan'), 'Base de fuerza · 4 semanas')
    await dialogo.getByRole('button', { name: 'Asignar' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // Aparece en «Asignado»...
    await expect(page.getByRole('link', { name: 'Base de fuerza · 4 semanas' })).toBeVisible()
    await expect(page.getByText('Asignado, sin fecha de inicio')).toBeVisible()

    /*
     * ...y la agenda NO ha cambiado. Es la decision de fondo: asignar y agendar
     * son dos compromisos distintos, y mezclarlos obligaria a fijar horarios
     * para poder asignar.
     */
    await expect(filasDeSesion).toHaveCount(1)
  })

  test('se pueden acumular varias asignaciones, sin excluirse', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students/student-4')

    await page.getByRole('button', { name: 'Asignar' }).first().click()
    await elegirDelDesplegable(page, desplegables(page, 'Plan'), 'Base de fuerza · 4 semanas')
    await page.getByRole('dialog').getByRole('button', { name: 'Asignar' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // Y ahora una rutina, sin que la primera se vaya.
    await page.getByRole('button', { name: 'Asignar' }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Rutina' }).click()
    await elegirDelDesplegable(page, desplegables(page, 'Rutina'), 'Full body · Principiante')
    await page.getByRole('dialog').getByRole('button', { name: 'Asignar' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await expect(page.getByRole('link', { name: 'Base de fuerza · 4 semanas' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Full body · Principiante' })).toBeVisible()
  })

  test('quitar una asignacion no toca las sesiones ya agendadas', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students/student-2')

    const filasDeSesion = page
      .locator('section')
      .filter({ hasText: 'Sesiones' })
      .locator('ul > li')
    await expect(filasDeSesion).toHaveCount(1)

    await page.getByRole('button', { name: /Quitar la asignación de Empuje/ }).click()
    await expect(page.getByRole('link', { name: 'Empuje · Intermedio' })).toHaveCount(0)

    /*
     * Las sesiones siguen. Son compromisos con fecha y hora que alguien puede
     * haber comunicado ya: desasignar dice «esto deja de ser tuyo de aqui en
     * adelante», no «nunca ocurrio».
     */
    await expect(filasDeSesion).toHaveCount(1)
  })

  test('la seccion de asignado cumple las reglas de 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/students/student-2')
    await page.waitForTimeout(1200)

    const medidas = await page.evaluate(() => {
      const caja = (elemento: Element) => elemento.getBoundingClientRect()

      return {
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        contenedoresEstrechos: [
          ...document.querySelectorAll('section, article, [class*="rounded-block"]'),
        ]
          .map((elemento) => caja(elemento).width)
          .filter((ancho) => ancho > 0 && ancho < 280).length,
        controlesPequenos: [...document.querySelectorAll('button, a, input, textarea')]
          .map(caja)
          .filter((rect) => rect.height > 0 && rect.height < 44).length,
        etiquetasHuerfanas: [...document.querySelectorAll('label[for]')].filter(
          (etiqueta) => document.getElementById(etiqueta.getAttribute('for') ?? '') === null
        ).length,
      }
    })

    expect(medidas.desborde, 'desbordamiento horizontal').toBe(0)
    expect(medidas.contenedoresEstrechos, 'contenedores bajo 280 px').toBe(0)
    expect(medidas.controlesPequenos, 'controles bajo 44 px').toBe(0)
    expect(medidas.etiquetasHuerfanas, 'etiquetas sin control').toBe(0)

    await page.screenshot({ path: 'tests/visual/salida/alumno-asignado-mobile.png' })
  })
})

/**
 * Volcar un plan asignado a la agenda.
 *
 * Es la tercera accion, la que convierte «este es tu programa» en huecos
 * reservados. Separada de asignar a proposito: hay quien asigna un plan para que
 * el alumno lo siga por su cuenta.
 */
test.describe('volcar un plan a la agenda', () => {
  /**
   * Abre el volcado en la ficha en la que ya se este.
   *
   * NO navega: un `page.goto` recarga la aplicacion y los adaptadores falsos
   * vuelven a su semilla, asi que la prueba de conflictos perdia la sesion que
   * acababa de crear para provocarlo.
   */
  async function abrirVolcado(page: Page): Promise<Locator> {
    await page.getByRole('button', { name: /Volcar a la agenda/ }).click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toContainText('Volcar a la agenda')
    return dialogo
  }

  async function ponerHoras(page: Page, hora: string): Promise<void> {
    for (const dia of ['lunes', 'miércoles', 'jueves', 'viernes']) {
      await elegirDelDesplegable(page, desplegables(page, dia), hora)
    }
  }

  test('pide una hora por cada dia que el plan usa, y no por los siete', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students/student-2')
    const dialogo = await abrirVolcado(page)

    /*
     * El plan entrena lunes, miercoles y viernes, y su semana de descarga lunes
     * y jueves: cuatro dias distintos. Preguntar por los siete obligaria a
     * rellenar tres campos para dias de descanso.
     */
    for (const dia of ['lunes', 'miércoles', 'jueves', 'viernes']) {
      await expect(dialogo.getByText(dia, { exact: true })).toBeVisible()
    }
    await expect(dialogo.getByText('martes', { exact: true })).toHaveCount(0)
    await expect(dialogo.getByText('domingo', { exact: true })).toHaveCount(0)

    // Sin horas no hay nada que previsualizar, y lo dice.
    await expect(dialogo).toContainText('Elige la hora de al menos un día')
  })

  test('la previa calcula las fechas, incluido el cambio de mes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students/student-2')
    const dialogo = await abrirVolcado(page)
    await ponerHoras(page, '08:00')

    /*
     * Tres semanas de tres dias mas la descarga de dos: once. Es el mismo numero
     * que la ficha del plan cuenta con `countPlanSessions`, y que salga igual es
     * lo que confirma que el generador respeta el plan.
     */
    await expect(dialogo.getByRole('button', { name: 'Agendar 11 sesiones' })).toBeVisible()

    /*
     * La semana 1 arranca en la fecha de inicio, y el jueves de la cuarta cae 24
     * dias despues. Se calcula en vez de escribirse: con fechas fijas, la prueba
     * caduca sola en cuanto pasa el mes.
     */
    const inicio = proximoLunes()
    await expect(dialogo).toContainText(`${comoFecha(inicio)} · 08:00`)
    await expect(dialogo).toContainText(`${comoFecha(sumarDias(inicio, 24))} · 08:00`)
  })

  test('confirmar crea las sesiones, con la duracion de su rutina', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)

    await page.goto('/students/student-2')

    const filasDeSesion = page
      .locator('section')
      .filter({ hasText: 'Sesiones' })
      .locator('ul > li')

    const dialogo = await abrirVolcado(page)
    await expect(filasDeSesion).toHaveCount(1)

    await ponerHoras(page, '08:00')
    await dialogo.getByRole('button', { name: 'Agendar 11 sesiones' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // Una que ya habia mas las once volcadas.
    await expect(filasDeSesion).toHaveCount(12)

    /*
     * La duracion sale de la rutina, no de un valor fijo: es el motivo de que
     * `estimateRoutineMinutes` subiera a `shared/domain`. Full body estima 25.
     */
    await expect(page.getByText('08:00 · 25 min').first()).toBeVisible()
    // Y nacen pendientes: confirmarlas es un acto aparte.
    await expect(page.getByText('PENDIENTE').first()).toBeVisible()
  })

  test('volcar dos veces avisa de las once colisiones, y no lo impide', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students/student-2')

    // Primer volcado, sin nada que le estorbe.
    const primero = await abrirVolcado(page)
    await ponerHoras(page, '08:00')
    await expect(primero).not.toContainText('en conflicto')
    await primero.getByRole('button', { name: 'Agendar 11 sesiones' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    /*
     * El segundo choca con el primero ENTERO. Es el caso que hoy no esta
     * resuelto -nada impide repetir el volcado, y saldrian once sesiones mas-,
     * asi que al menos se ve venir: la previa lo dice antes de crear nada.
     *
     * Se provoca asi, y no agendando a mano en la fecha de inicio, porque eso
     * obligaba a navegar el calendario por meses y la prueba caducaba al cambiar
     * de mes.
     */
    const segundo = await abrirVolcado(page)
    await ponerHoras(page, '08:00')

    await expect(segundo).toContainText('11 en conflicto')
    await expect(segundo.getByText(/· ocupado/).first()).toBeVisible()
    // Avisa, no bloquea: el boton sigue disponible.
    await expect(segundo.getByRole('button', { name: 'Agendar 11 sesiones' })).toBeEnabled()
  })

  test('un plan sin fecha de inicio no ofrece volcarse', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/students/student-3')

    /*
     * Sin fecha de inicio no hay desde cuando contar las semanas, asi que el
     * boton no llevaria a ninguna parte. La asignacion sigue siendo valida: solo
     * es un plan que aun no ha empezado.
     */
    await expect(page.getByText('Asignado, sin fecha de inicio')).toBeVisible()
    await expect(page.getByRole('button', { name: /Volcar a la agenda/ })).toHaveCount(0)
  })
})

/**
 * El ciclo de vida de una sesion.
 *
 * `completed` faltaba en el modelo y el cambio de estado no persistia: la
 * sesion nacia pendiente y ahi se quedaba, asi que nada de lo que el entrenador
 * hacia podia darse por hecho y los contadores de la agenda solo podian
 * reflejar la semilla.
 */
test.describe('estado de la sesion', () => {
  test('marcar una sesion como completada mueve los contadores', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/calendar')
    await page.waitForTimeout(1500)

    /*
     * Se mide el cambio, no el valor.
     *
     * Antes se afirmaba «Completadas 0» y «Confirmadas 2», que eran las cifras
     * exactas de la semilla de entonces. En cuanto la semilla gano un historial
     * de sesiones ya cerradas -para que Progreso tuviera de donde salir-, la
     * prueba fallo sin que nada se hubiera roto. Lo que esta comprobando es que
     * el cambio de estado mueve la sesion de un contador al otro, y eso se dice
     * en diferencias.
     */
    const completadasAntes = await leerCifra(contador(page, 'Completadas'))
    const confirmadasAntes = await leerCifra(contador(page, 'Confirmadas'))

    await sesionSinCompletar(page).first().click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toBeVisible()

    await elegirDelDesplegable(page, dialogo.getByRole('combobox').first(), 'Completada')
    await dialogo.getByRole('button', { name: 'Guardar' }).click()

    /*
     * El cambio PERSISTE. Antes esto lanzaba un aviso y no tocaba nada: es la
     * diferencia entre que la aplicacion diga que ha pasado algo y que pase.
     */
    await expect(contador(page, 'Completadas')).toContainText(String(completadasAntes + 1))
    // Y sale de donde estaba: no se suma, se mueve.
    await expect(contador(page, 'Confirmadas')).toContainText(String(confirmadasAntes - 1))
  })

  test('el desplegable ofrece los cuatro estados, en orden de ciclo de vida', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/calendar')
    await page.waitForTimeout(1500)

    await page.getByRole('button', { name: /minutos/ }).first().click()
    await page.getByRole('dialog').getByRole('combobox').first().click()

    const opciones = page.getByRole('listbox').getByRole('option')
    await expect(opciones).toHaveText([
      'Pendiente',
      'Confirmada',
      'Completada',
      'Cancelada',
    ])
  })

  test('eliminar una sesion la elimina, y no solo lo anuncia', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/calendar')
    await page.waitForTimeout(1500)

    const tarjetas = page.getByRole('button', { name: /minutos/ })
    const antes = await tarjetas.count()

    await tarjetas.first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()

    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(tarjetas).toHaveCount(antes - 1)
  })

  test('la ficha del alumno refleja el estado nuevo', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/calendar')
    await page.waitForTimeout(1500)

    await sesionSinCompletar(page).first().click()
    const dialogo = page.getByRole('dialog')
    await elegirDelDesplegable(page, dialogo.getByRole('combobox').first(), 'Completada')
    await dialogo.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    /*
     * Se navega por la interfaz: los adaptadores falsos viven en memoria y un
     * `page.goto` devolveria la sesion a su estado de semilla.
     *
     * Los dos dominios leen del mismo puerto, asi que el estado cambiado en la
     * agenda se ve en la ficha sin que ninguno sepa del otro.
     */
    await page.getByRole('link', { name: 'Estudiantes' }).first().click()
    await page.getByRole('link', { name: 'María Gómez' }).click()
    // `.first()`: el historial de la semilla puede traer mas sesiones cerradas,
    // y el localizador dejaria de ser unico.
    await expect(page.getByText('Completada').first()).toBeVisible()
  })
})

/**
 * La sesion en vivo, con sus dos modos.
 *
 * `/session` no recibia nada y siempre pintaba la misma sesion simulada
 * corriendo por un mapa: agendar «Full body» para Maria y pulsar iniciar te
 * dejaba en la sesion de otra persona. Y todo lo que compone este proyecto
 * -bloques, series, RIR- no tenia donde ejecutarse.
 */
test.describe('sesion en vivo', () => {
  test('una sesion de fuerza pinta los bloques de SU rutina', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/session/session-1')

    // De quien es y que ejecuta, resueltos por identificador.
    await expect(page.getByText('María Gómez')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Empuje · Intermedio' })).toBeVisible()

    // Sus bloques, con metodo y prescripcion.
    await expect(page.getByText('Serie simple').first()).toBeVisible()
    await expect(page.getByText('Superserie').first()).toBeVisible()
    await expect(page.getByText('Press de banca con barra')).toBeVisible()
    await expect(page.getByText('4 × 6-8 · RIR 2')).toBeVisible()

    // Y NADA de la pantalla de carrera.
    await expect(page.getByText('GPS')).toHaveCount(0)
  })

  test('marcar series avanza, y volver a pulsar la ultima desmarca', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/session/session-1')

    const avance = page.getByRole('progressbar')
    // El total sale de la rutina: 14 series entre sus tres bloques.
    await expect(avance).toHaveAttribute('aria-valuemax', '14')
    await expect(avance).toHaveAttribute('aria-valuenow', '0')

    const series = page.getByRole('button', { name: /^Serie \d+ de/ })
    await series.nth(0).click()
    await series.nth(1).click()
    await expect(avance).toHaveAttribute('aria-valuenow', '2')

    /*
     * Volver a pulsar la ultima marcada la desmarca: equivocarse contando series
     * es lo mas normal del mundo y no puede costar reiniciar la sesion.
     */
    await series.nth(1).click()
    await expect(avance).toHaveAttribute('aria-valuenow', '1')
  })

  test('una sesion de cardio conserva su pantalla de carrera', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/session/session-4')

    await expect(page.getByRole('heading', { name: 'Carrera continua' })).toBeVisible()
    await expect(page.getByText('GPS')).toBeVisible()

    // Y ninguna casilla de serie: no ejecuta una rutina de sala.
    await expect(page.getByRole('button', { name: /^Serie \d+ de/ })).toHaveCount(0)
  })

  test('terminar deja la sesion completada, y se ve en la agenda', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/calendar')
    await page.waitForTimeout(1500)

    await expect(contador(page, 'Completadas')).toContainText('0')

    // Se entra a la sesion desde su detalle, que es el camino real.
    await page.getByRole('button', { name: /minutos/ }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Iniciar sesión' }).click()
    await page.waitForURL(/\/session\/[\w-]+/)

    /*
     * POR TECLADO, y no con un clic. El control es deslizar-para-confirmar: un
     * toque NO debe confirmar, que es justo lo que protege de terminar por error
     * una sesion en marcha. El `<button>` existe como alternativa accesible, y
     * pulsar Intro es como se activa sin arrastrar.
     */
    await page.getByRole('button', { name: 'Pausar la sesión' }).press('Enter')
    // El gesto de finalizar solo aparece en pausa, para que no compita con la
    // accion principal.
    await page.getByRole('button', { name: 'Finalizar la sesión' }).press('Enter')
    await page.waitForURL(/celebracion/)

    /*
     * AQUI SE CIERRA EL BUCLE: lo que pasa en la sesion vuelve a la agenda.
     *
     * Se vuelve con el historial y no con `page.goto` ni con el menu: `goto`
     * recargaria la aplicacion y devolveria la sesion a su estado de semilla, y
     * la celebracion es una ruta a pantalla completa —sin menu— a proposito.
     */
    await page.goBack()
    await page.goBack()
    await page.waitForURL(/\/calendar$/)

    await expect(contador(page, 'Completadas')).toContainText('1')
  })

  test('lo hecho en la sesion llega al progreso del alumno', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)

    /*
     * ESTE ES EL BUCLE ENTERO, y el motivo de que la sesion guarde un resultado.
     *
     * Antes, terminar solo dejaba el estado en `completed`: las series marcadas
     * y el tiempo morian con el componente, asi que Progreso no tenia de donde
     * sacar un numero y se lo inventaba. `session-1` es de `student-2`, que no
     * tiene historial, asi que lo que se vea despues sale entero de aqui.
     */
    await page.goto('/session/session-1')

    // Por la barra de avance y no por el texto: «5» suelto aparece tambien en
    // los numeros de serie y en la lista de ejercicios.
    const avance = page.getByRole('progressbar', { name: 'Series completadas' })
    await expect(avance).toHaveAttribute('aria-valuenow', '0')

    const series = page.getByRole('button', { name: /Serie \d+ de/ })
    for (let indice = 0; indice < 5; indice += 1) {
      await series.nth(indice).click()
    }
    await expect(avance).toHaveAttribute('aria-valuenow', '5')

    // Por teclado: el control es deslizar-para-confirmar y un toque no confirma.
    await page.getByRole('button', { name: 'Pausar la sesión' }).press('Enter')
    await page.getByRole('button', { name: 'Finalizar la sesión' }).press('Enter')
    await page.waitForURL(/progress/)

    /*
     * Se navega por la interfaz, sin `goto`: los adaptadores falsos viven en
     * memoria y recargar devolveria la sesion a su estado de semilla.
     */
    await page.getByLabel('Ver el progreso de').selectOption('student-2')
    await page.waitForTimeout(1200)

    // 20 XP por terminar la sesion mas 1 por cada una de las 5 series marcadas.
    await expect(page.getByText('25 / 100 XP')).toBeVisible()
    // Y el primer hito ya cuenta una: el sendero mide sesiones cerradas.
    await expect(page.getByText('1/3')).toBeVisible()
  })

  test('una sesion que no existe no revienta', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/session/no-existe')

    await expect(page.getByText('Sesión no encontrada')).toBeVisible()
  })

  test('la sesion de fuerza cumple las reglas de 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/session/session-1')
    await page.waitForTimeout(1200)

    const medidas = await page.evaluate(() => {
      const caja = (elemento: Element) => elemento.getBoundingClientRect()

      return {
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        controlesPequenos: [...document.querySelectorAll('button, a')]
          .map(caja)
          .filter((rect) => rect.height > 0 && rect.height < 44).length,
      }
    })

    expect(medidas.desborde, 'desbordamiento horizontal').toBe(0)
    expect(medidas.controlesPequenos, 'controles bajo 44 px').toBe(0)

    await page.screenshot({ path: 'tests/visual/salida/sesion-fuerza-mobile.png' })
  })
})

/**
 * El panel, con datos reales.
 *
 * Venia entero de un fichero de ejemplo: ocho sesiones esta semana, doce rutinas
 * creadas y una lista de proximas sesiones que no existian en ninguna agenda. El
 * entrenador hacia el trabajo y la pantalla de resumen lo ignoraba.
 */
test.describe('panel', () => {
  test('los indicadores cuentan lo que hay, no lo que se escribio', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.waitForTimeout(1500)

    const indicadores = page.locator('main .grid > div')

    // Cuatro alumnos y tres rutinas en la semilla. Si cambia la semilla, cambia
    // el panel: eso es justo lo que antes no pasaba.
    await expect(indicadores.filter({ hasText: 'Estudiantes' })).toContainText('4')
    await expect(indicadores.filter({ hasText: 'Rutinas Creadas' })).toContainText('3')

    /*
     * Y NO hay indicador de ingresos. Se quito: no existe ninguna fuente de
     * pagos, y una cifra inventada en la primera pantalla es peor que un hueco.
     */
    await expect(page.getByText('Ingresos del Mes')).toHaveCount(0)
  })

  test('las proximas sesiones son las de la agenda, con sus alumnos', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.waitForTimeout(1500)

    const proximas = page.locator('section').filter({ hasText: 'Próximas sesiones' })

    // Nombres resueltos desde `studentId`, no escritos en el dato de la sesion.
    await expect(proximas.getByText('María Gómez')).toBeVisible()
    await expect(proximas.getByText('Carlos López')).toBeVisible()
  })

  test('completar una sesion la mueve de proximas a actividad reciente', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.waitForTimeout(1500)

    /*
     * Que hay en cabeza de la actividad antes de tocar nada.
     *
     * Ya no se afirma que la lista este vacia: la semilla trae un historial de
     * sesiones cerradas desde que Progreso calcula la racha y el nivel a partir
     * de el. Y tampoco se cuentan las entradas, porque la lista esta recortada
     * a las mas recientes: añadir una no cambia el total, EMPUJA a las demas.
     * Eso es lo que se comprueba.
     */
    const actividadPrevia = page.locator('section').filter({ hasText: 'Actividad reciente' })
    const cabezaAntes = await actividadPrevia.getByRole('listitem').first().innerText()

    // Se completa una desde la agenda.
    await page.getByRole('link', { name: 'Calendario' }).first().click()
    await page.waitForTimeout(1200)
    await sesionSinCompletar(page).first().click()
    const dialogo = page.getByRole('dialog')
    await elegirDelDesplegable(page, dialogo.getByRole('combobox').first(), 'Completada')
    await dialogo.getByRole('button', { name: 'Guardar' }).click()

    /*
     * Y el panel se entera sin recargar: esta suscrito al mismo puerto. Se
     * navega por la interfaz porque `page.goto` devolveria la sesion a su
     * estado de semilla.
     */
    await page.getByRole('link', { name: 'Dashboard' }).first().click()
    await page.waitForTimeout(1200)

    const actividad = page.locator('section').filter({ hasText: 'Actividad reciente' })
    // La recien cerrada es de hoy, asi que entra en cabeza: es la mas nueva.
    await expect(actividad.getByRole('listitem').first()).toContainText('Hoy')
    await expect(actividad.getByRole('listitem').first()).not.toHaveText(cabezaAntes)
  })

  test('el panel cumple las reglas de 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.waitForTimeout(1500)

    const medidas = await page.evaluate(() => {
      const caja = (elemento: Element) => elemento.getBoundingClientRect()

      return {
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        contenedoresEstrechos: [...document.querySelectorAll('main section, main .grid > div')]
          .map((elemento) => caja(elemento).width)
          .filter((ancho) => ancho > 0 && ancho < 280).length,
      }
    })

    expect(medidas.desborde, 'desbordamiento horizontal').toBe(0)
    expect(medidas.contenedoresEstrechos, 'contenedores bajo 280 px').toBe(0)
  })
})

/**
 * Alta, edicion y baja de alumnos.
 *
 * «Añadir estudiante» era un `console.log`: `StudentRepository` era el UNICO
 * puerto sin `create`, asi que un entrenador que instalara la aplicacion no
 * podia meter a nadie.
 */
test.describe('alumnos', () => {
  test('crear un alumno lo añade a la lista y al contador', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students')

    const equipoAntes = await leerCifra(page.getByText(/Tu equipo ·/))

    await page.getByRole('button', { name: 'Añadir alumno' }).click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo.getByRole('heading', { name: 'Nuevo alumno' })).toBeVisible()

    await dialogo.getByLabel('Nombre').fill('Lucía')
    await dialogo.getByLabel('Apellidos').fill('Ramos')
    await dialogo.getByLabel('Correo').fill('lramos@correo.com')
    await dialogo.getByLabel('Edad').fill('31')
    await dialogo.getByRole('button', { name: 'Movilidad' }).click()
    await dialogo.getByRole('button', { name: 'Añadir alumno' }).click()

    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Lucía Ramos/ })).toBeVisible()
    await expect(page.getByText('Tu equipo · ' + (equipoAntes + 1))).toBeVisible()
  })

  test('el formulario exige nombre, apellidos y correo', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students')

    await page.getByRole('button', { name: 'Añadir alumno' }).click()
    const dialogo = page.getByRole('dialog')
    await dialogo.getByRole('button', { name: 'Añadir alumno' }).click()

    // El dialogo sigue abierto y dice QUE falta, en vez de cerrarse sin crear.
    await expect(dialogo).toBeVisible()
    await expect(dialogo.getByText('Falta este campo')).toHaveCount(3)
  })

  test('un alumno con sesiones agendadas no se puede borrar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students')

    const tarjeta = page.locator('article').filter({ hasText: 'Juan Pérez' })
    await tarjeta.getByRole('button').first().click()
    await page.getByRole('menuitem', { name: 'Eliminar' }).click()

    /*
     * NO se pregunta y luego se falla: se explica el impedimento en lugar de
     * pedir una confirmacion que ya se sabe que no se puede cumplir.
     */
    const dialogo = page.getByRole('dialog')
    await expect(dialogo.getByRole('heading', { name: 'No se puede eliminar' })).toBeVisible()
    await expect(dialogo).toContainText(/sesion(es)? agendada/)
    await expect(dialogo.getByRole('button', { name: 'Eliminar' })).toHaveCount(0)
  })
})

/**
 * El progreso, que antes no era de nadie.
 *
 * Nivel 7, 340 de 500 XP y una racha de 12 dias estaban escritos a mano en un
 * fichero de ejemplo: el numero no cambiaba entrenando ni dejando de entrenar,
 * y era el mismo para cualquier alumno.
 */
test.describe('progreso', () => {
  test('la racha y el nivel salen del historial del alumno', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/progress?student=student-1')
    await page.waitForTimeout(1500)

    /*
     * Las cifras se comprueban contra la regla, no contra un numero copiado.
     *
     * La semilla de `student-1` son diez sesiones cerradas, 105 series en
     * total. Con 20 XP por sesion y 1 por serie son 305 XP; descontando 100 del
     * nivel 1 y 150 del 2, quedan 55 dentro del nivel 3, que cuesta 200.
     */
    await expect(page.getByText('Nivel 3')).toBeVisible()
    await expect(page.getByText('55 / 200 XP')).toBeVisible()

    // Siete dias seguidos hasta ayer. La racha NO se rompe por no haber
    // entrenado hoy todavia: el dia no ha terminado.
    await expect(page.getByText('días de racha')).toBeVisible()
  })

  test('cambiar de alumno cambia las cifras', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/progress?student=student-1')
    await page.waitForTimeout(1500)

    await expect(page.getByText('Nivel 3')).toBeVisible()

    // `student-2` no tiene ninguna sesion cerrada: empieza de cero.
    await page.getByLabel('Ver el progreso de').selectOption('student-2')
    await page.waitForTimeout(1500)

    await expect(page.getByText('Nivel 1')).toBeVisible()
    await expect(page.getByText('0 / 100 XP')).toBeVisible()
    await expect(page.getByText('Aún no hay logros conseguidos')).toBeVisible()
  })

  test('los logros se consiguen por lo hecho, con su fecha real', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/progress?student=student-1')
    await page.waitForTimeout(1500)

    /*
     * «Semana Perfecta» se desbloquea sola: la condicion es una funcion sobre
     * las sesiones, no una frase con una fecha de enero de 2024 escrita al lado.
     */
    const recientes = page.locator('section').filter({ hasText: 'Conseguidos recientemente' })
    // Por su fila de la lista: el nombre aparece tres veces -en la insignia de
    // la galeria, en la insignia pequeña de la fila y en el titulo-, asi que
    // pedirlo por texto suelto resuelve a varios elementos.
    const fila = recientes.getByRole('listitem').filter({ hasText: 'Semana Perfecta' })
    await expect(fila).toHaveCount(1)
    // Con SU fecha: el dia en el que se cumplio la condicion, no una escrita a
    // mano. La semilla la deja en el ultimo dia entrenado, que es ayer.
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    await expect(fila).toContainText(ayer.toLocaleDateString('es'))

    // Y los que no hay de donde sacar ya no se ofrecen: sin registro corporal ni
    // sistema de desafios, esas dos categorias desaparecen del filtro.
    await expect(page.getByRole('button', { name: /Métricas/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Desafíos/ })).toHaveCount(0)
  })

  test('«Ver progreso» desde la ficha lleva al progreso de ESE alumno', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signIn(page)
    await page.goto('/students/student-1')

    await page.getByRole('link', { name: 'Ver progreso' }).click()

    await expect(page).toHaveURL(/\/progress\?student=student-1/)
    await expect(page.getByText('Progreso de Juan Pérez')).toBeVisible()
  })
  test('el formulario de alumno cumple las reglas de 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/students')
    await page.getByRole('button', { name: 'Añadir alumno' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const medidas = await page.evaluate(() => {
      const dialogo = document.querySelector('[role="dialog"]')
      if (dialogo === null) return { desborde: 0, tactilesPequenos: -1, anchoDialogo: 0 }

      return {
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        anchoDialogo: Math.round(dialogo.getBoundingClientRect().width),
        /*
         * `offsetHeight` y no `getBoundingClientRect`: el panel de vista previa
         * escala la pagina, y la caja mide en pixeles ya escalados.
         *
         * Se excluye lo que esta oculto a la accesibilidad: Radix renderiza
         * junto a cada desplegable un `<select>` nativo de 1 px para que el
         * control participe en el formulario. No es un objetivo tactil, es
         * fontaneria, y contarlo daria un fallo que no existe.
         */
        tactilesPequenos: [...dialogo.querySelectorAll('button, select, input')].filter(
          (control) =>
            control instanceof HTMLElement &&
            control.getAttribute('aria-hidden') !== 'true' &&
            control.closest('[aria-hidden="true"]') === null &&
            control.offsetHeight > 0 &&
            control.offsetHeight < 44
        ).length,
      }
    })

    expect(medidas.desborde, 'desbordamiento horizontal').toBe(0)
    expect(medidas.anchoDialogo, 'ancho util del dialogo').toBeGreaterThanOrEqual(280)
    expect(medidas.tactilesPequenos, 'objetivos tactiles bajo 44 px').toBe(0)
  })

  test('el progreso cumple las reglas de 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await signIn(page)
    await page.goto('/progress?student=student-1')
    await page.waitForTimeout(1500)
    await scrollInnerContainerToBottom(page)

    const medidas = await page.evaluate(() => {
      return {
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        contenedoresEstrechos: [...document.querySelectorAll('main section, main .grid > div')]
          .map((elemento) => elemento.getBoundingClientRect().width)
          .filter((ancho) => ancho > 0 && ancho < 280).length,
        // El selector de alumno es el control nuevo de esta pantalla.
        altoSelector: (() => {
          const selector = document.querySelector('main select')
          return selector instanceof HTMLElement ? selector.offsetHeight : 0
        })(),
      }
    })

    expect(medidas.desborde, 'desbordamiento horizontal').toBe(0)
    expect(medidas.contenedoresEstrechos, 'contenedores bajo 280 px').toBe(0)
    expect(medidas.altoSelector, 'objetivo tactil del selector de alumno').toBeGreaterThanOrEqual(44)
  })
})


/**
 * El registro, que era otro `console.log`.
 *
 * `AuthPort` no tenia `signUp`, asi que «Crear cuenta» no daba de alta a nadie.
 */
test.describe('registro', () => {
  async function rellenarRegistro(page: Page, correo: string): Promise<void> {
    await page.goto('/authentication')
    await page.evaluate(() => window.localStorage.setItem('trainerhub.onboarding.visto', 'true'))
    await page.getByRole('tab', { name: 'Registrarme' }).click()

    // Sin `exact`: la etiqueta de un campo obligatorio es «Nombre *», porque
    // `FormField` le añade el asterisco dentro del propio <label>.
    await page.getByLabel('Nombre').fill('Ana')
    await page.getByLabel('Apellido').fill('Soto')
    await page.getByLabel('Email').fill(correo)
    await page.locator('input[type=password]').fill('secreto123')
    await elegirDelDesplegable(page, page.getByRole('combobox').first(), 'Pérdida de peso')
  }

  test('crear una cuenta da de alta al entrenador y entra', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await rellenarRegistro(page, 'asoto@correo.com')

    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 })

    // La ficha del entrenador existe: sin ella la cuenta entraria sin nombre.
    const fichas = await page.evaluate(() =>
      window.localStorage.getItem('trainerhub.fake-trainers')
    )
    expect(fichas).toContain('asoto@correo.com')
  })

  test('registrarse con el correo de un alumno lo enlaza en vez de crear entrenador', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    // Mayusculas distintas a proposito: nadie escribe su correo dos veces igual,
    // y el enlace de una cuenta con su ficha no puede depender de eso.
    await rellenarRegistro(page, 'MGomez@gmail.com')

    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 })

    /*
     * QUIEN ERES LO DECIDE TU CORREO. El correo ya tenia ficha de alumna, asi
     * que la cuenta se ata a ella y NO nace un entrenador.
     */
    const fichas = await page.evaluate(() =>
      window.localStorage.getItem('trainerhub.fake-trainers')
    )
    expect(fichas).toBeNull()
  })
})
