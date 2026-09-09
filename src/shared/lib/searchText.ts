/**
 * Texto preparado para buscar: sin marcas diacríticas, en minúsculas y sin
 * espacios en los bordes, para que «jose» encuentre a «José» y «full body»
 * encuentre «Full body · Principiante».
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}
