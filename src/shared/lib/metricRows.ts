/**
 * Si la métrica en `index` queda sola en la última fila de la franja móvil
 * de dos columnas: sólo pasa con un total impar, y sólo a la última. Es la
 * que `MetricBlock` pinta `wide`. Se decide en quien recorre la lista, no en
 * CSS: la franja no sabe cuántas hay y la celda no sabe cuál es.
 */
export function closesRowAlone(index: number, total: number): boolean {
  return total % 2 === 1 && index === total - 1
}
