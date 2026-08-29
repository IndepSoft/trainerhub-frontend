import { expect, test, type Page } from '@playwright/test'

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
async function scrollInnerContainerToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    const container = document.querySelector('.overflow-auto')
    if (container) container.scrollTop = container.scrollHeight
  })
  await page.waitForTimeout(400)
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
