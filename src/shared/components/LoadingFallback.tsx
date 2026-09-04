/**
 * Indicador de carga para rutas perezosas.
 *
 * Llena el hueco de su contenedor. Antes usaba `min-h-screen`, que dentro del
 * layout forzaba 812 px de alto en un contenedor de 748 y desbordaba.
 */
export function LoadingFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  )
}
