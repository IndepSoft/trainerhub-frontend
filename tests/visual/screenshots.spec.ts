import { test, type Page } from '@playwright/test'

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
