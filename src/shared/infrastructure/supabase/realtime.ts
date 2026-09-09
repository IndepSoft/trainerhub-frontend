import { supabase } from './client'

/**
 * Suscribe a los cambios de una tabla y avisa con cada uno.
 *
 * UNA SOLA FORMA DE HACERLO para los tres adaptadores que lo necesitan
 * -avisos, muro y agenda-, en el orden que decidio el plan (§1.3). Cada
 * llamada abre su propio canal y la baja lo cierra: quien deja de escuchar
 * deja de costar.
 *
 * Se filtra por crew cuando la tabla lo tiene, para no recibir lo de todos
 * los equipos. Lo que RLS no deja leer tampoco llega por aqui: el canal
 * respeta las politicas de la tabla, asi que un alumno no recibe las sesiones
 * de sus compañeros aunque escuche la tabla entera.
 *
 * El aviso no lleva la fila: el contrato del puerto es «algo cambio», y quien
 * escucha vuelve a leer por el mismo camino de siempre. Repartir filas crudas
 * seria hacer pasar el esquema por el puerto.
 */
export function subscribeToTable(
  table: string,
  crewId: string | null,
  listener: () => void
): () => void {
  if (crewId === null) return () => undefined

  const channel = supabase
    .channel(`${table}:${crewId}:${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `crew_id=eq.${crewId}` },
      () => listener()
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

/** Como la anterior, para tablas sin `crew_id`: los «me gusta» del muro. */
export function subscribeToWholeTable(table: string, listener: () => void): () => void {
  const channel = supabase
    .channel(`${table}:${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => listener())
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
