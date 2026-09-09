import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Pruebas de CONTRATO: cada adaptador de Supabase contra una base de verdad.
 *
 * Corren en Node, sin navegador, contra `supabase start` (Docker) con la
 * semilla cargada. Son la segunda suite del proyecto —la de Playwright sigue
 * contra los adaptadores simulados— y existen por una razon concreta: una
 * politica RLS que deja ver de mas, o de menos, no la detecta ninguna prueba de
 * interfaz. Cada contrato ejercita las operaciones del puerto Y al menos un
 * caso negativo de RLS, que es la especificacion de la politica.
 *
 * Configuracion aparte de la de la aplicacion a proposito: no hay `vitest`
 * unitario todavia, y mezclar las dos cosas haria que `npm test` exigiera
 * Docker para correr una funcion pura.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    include: ['tests/contract/**/*.contract.test.ts'],
    environment: 'node',
    // En serie: comparten una base y las cuentas que crean llevan sufijo, pero
    // dos pruebas escribiendo a la vez sobre el mismo crew se pisarian.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
})
