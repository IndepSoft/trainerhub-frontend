import { defineConfig } from '@playwright/test'

/**
 * Configuracion de la suite de interfaz.
 *
 * `webServer` levanta SU PROPIO servidor, en el puerto 5179 y con la
 * simulacion forzada por variable de entorno. Antes reutilizaba el de trabajo
 * en el 5178 y heredaba su `.env`: en cuanto ese servidor corria contra
 * Supabase de verdad, las ciento ochenta pruebas fallaban en el login por un
 * motivo que no era el suyo. Asi la suite no depende de lo que haya en `.env`
 * ni de que servidor tenga abierto quien trabaja.
 */
export default defineConfig({
  testDir: './tests/visual',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5179',
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
    command: 'npm run dev -- --port 5179 --strictPort',
    url: 'http://localhost:5179',
    // La simulacion, diga lo que diga `.env`: la suite vive de las semillas.
    env: { VITE_USE_FAKE_AUTH: 'true' },
    reuseExistingServer: true,
    // Vite tarda mas de dos minutos en el primer arranque tras cambiar
    // dependencias, porque vuelve a preoptimizar. 120 s se quedaban cortos y
    // la suite fallaba con «Timed out waiting from config.webServer».
    timeout: 240_000,
  },
})
