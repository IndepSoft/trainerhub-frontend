import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // El service worker se activa solo en cuanto hay version nueva. Es la
      // opcion honesta mientras no exista interfaz para avisar al usuario:
      // 'prompt' sin ese aviso deja la app anclada en una version vieja para
      // siempre.
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'TrainerHub',
        short_name: 'TrainerHub',
        description: 'Gestiona tus estudiantes, sesiones y progreso como entrenador.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // Azul primario del tema (--primary: 220 90% 42%) y fondo de la app.
        theme_color: '#0b4bcc',
        background_color: '#ffffff',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Solo se precachea el armazon de la aplicacion. Las respuestas de la
        // API NO se cachean a proposito: son datos autenticados de un
        // entrenador concreto, y la cache de un service worker sobrevive al
        // cierre de sesion y es visible para el siguiente que use el
        // dispositivo. Sin backend propio, el riesgo supera a la ganancia.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
