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
 * La sesion en vivo tiene que caber sin desplazamiento a 375 px.
 *
 * No es una preferencia estetica: si hay que desplazarse para ver el
 * cronometro, la pantalla no cumple su unica funcion. Llego a desbordar 104 px
 * cuando se anadio la barra inferior, y por eso la ruta pasa a pantalla
 * completa. Esta prueba existe para que no vuelva a pasar en silencio.
 */
test('la sesion en vivo cabe sin desplazamiento a 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await signIn(page)
  await page.goto('/session')
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
  /** «6 min» → 6. La cifra del resumen, sea cual sea el texto que la rodea. */
  function extraerMinutos(texto: string): number {
    const encontrado = texto.match(/(\d+)\s*min/)
    return encontrado === null ? Number.NaN : Number(encontrado[1])
  }

  /**
   * Los disparadores de un desplegable, por el nombre de su etiqueta.
   *
   * NO se usa `getByLabel`. Radix renderiza, junto al boton visible, un
   * `<select>` nativo oculto para que el control participe en el formulario, y
   * la etiqueta alcanza a los DOS: con dos ejercicios en pantalla,
   * `getByLabel('Ejercicio')` resolvia a cuatro elementos, asi que `nth(1)` era
   * el select oculto de la primera fila y no el disparador de la segunda.
   * Hacer clic en un `<select>` oculto no abre nada ni da error, que es lo que
   * hacia el fallo tan dificil de leer.
   *
   * El nativo no tiene nombre accesible, asi que filtrar por rol y nombre deja
   * exactamente uno por fila.
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
    nombre: string
  ): Promise<void> {
    await disparador.click()
    await page.getByRole('listbox').getByRole('option', { name: nombre, exact: true }).click()
    await expect(disparador).toContainText(nombre)
  }

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
