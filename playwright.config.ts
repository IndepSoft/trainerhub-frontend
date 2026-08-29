import { defineConfig } from '@playwright/test'

/**
 * Configuracion solo para las capturas de revision visual del rediseno.
 *
 * `webServer` levanta el servidor de desarrollo y lo reutiliza si ya hay uno
 * escuchando, para no pelearse con el que se use durante el trabajo.
 */
export default defineConfig({
  testDir: './tests/visual',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5178',
  },
  webServer: {
    command: 'npm run dev -- --port 5178 --strictPort',
    url: 'http://localhost:5178',
    reuseExistingServer: true,
    // Vite tarda mas de dos minutos en el primer arranque tras cambiar
    // dependencias, porque vuelve a preoptimizar. 120 s se quedaban cortos y
    // la suite fallaba con «Timed out waiting from config.webServer».
    timeout: 240_000,
  },
})
