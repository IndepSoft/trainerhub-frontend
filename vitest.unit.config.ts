import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Pruebas UNITARIAS: funciones puras del dominio, sin navegador y sin base.
 *
 * Aparte de la configuracion de contrato a proposito: aquella exige Docker,
 * y una funcion que calcula una edad o suma series no deberia. Aqui vive lo
 * que los motores de progreso van a calcular: edad, volumen planificado, y
 * mas adelante rachas con pausas. Cada regla del cliente que no autoriza
 * nada -presentacion, derivaciones- se prueba aqui; lo que autoriza, en la
 * base y por contrato.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    include: ['tests/unit/**/*.unit.test.ts'],
    environment: 'node',
  },
})
