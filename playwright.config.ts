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
    /*
     * La suite comprueba la aplicacion EN ESPAÑOL, y sus aserciones estan
     * escritas asi: `getByRole('button', { name: 'Iniciar sesion' })`.
     *
     * Sin esto, Playwright arranca en `en-US`, `LanguageProvider` detecta ingles
     * -que es lo que debe hacer- y los ciento setenta casos fallan a la vez por
     * un motivo que no es el que estan probando. Fijar el idioma aqui es
     * declarar contra que version se prueba, no esconder nada: el conmutador
     * tiene sus propias pruebas.
     */
    locale: 'es-ES',
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
