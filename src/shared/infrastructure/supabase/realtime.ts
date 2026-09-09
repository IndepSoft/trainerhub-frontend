import { supabase } from './client'

/**
 * Suscribe a los cambios de una o varias tablas y avisa con cada uno.
 *
 * El aviso NO LLEVA LA FILA: el contrato del puerto es «algo cambio», y quien
 * escucha vuelve a leer por el camino de siempre. Repartir filas crudas seria
 * hacer pasar el esquema por el puerto, y ademas obligaria a cada hook a
 * fusionar a mano lo que el repositorio ya sabe traer.
 *
 * ---------------------------------------------------------------------------
 * POR QUE YA NO SE FILTRA POR CREW
 *
 * Habia un `filter: crew_id=eq.<crew activo>`. Se ha quitado, y no por
 * simplificar: filtraba mal de tres maneras distintas.
 *
 *  1. **Se tragaba los borrados.** El registro de un DELETE solo llevaba la
 *     clave primaria, asi que no habia `crew_id` que comparar y el evento se
 *     descartaba. Cancelar una sesion no refrescaba a nadie. (La migracion de
 *     tiempo real pone `replica identity full` y eso ya no pasa, pero el filtro
 *     seguia sin aportar nada que RLS no hiciera mejor.)
 *
 *  2. **Se quedaba viejo.** El ambito se leia UNA VEZ, al suscribirse, y los
 *     hooks montan su efecto con dependencias vacias. Cambiar de equipo en el
 *     conmutador dejaba el canal escuchando al equipo anterior hasta que algo
 *     desmontara el componente.
 *
 *  3. **No sabia expresar lo que mas falta.** `useViewer` escucha para
 *     enterarse de un equipo en el que TODAVIA NO ESTA -el que acaba de fundar,
 *     o aquel cuya solicitud le acaban de aceptar-. Un filtro por el equipo
 *     activo es justo el que no puede ver eso, y sin equipo activo la funcion
 *     ni siquiera llegaba a suscribirse: devolvia una baja vacia.
 *
 * Lo que ocupa su lugar son dos cosas que ya estaban y son mas fuertes:
 *
 *  - **RLS decide quien recibe.** El canal respeta las politicas de la tabla,
 *    evaluadas por suscriptor. Un alumno no se entera de las sesiones de sus
 *    compañeros aunque escuche la tabla entera, y no porque el cliente se
 *    contenga, sino porque el servidor no se lo manda.
 *
 *  - **El ambito lo aplica la relectura.** El repositorio filtra por el crew
 *    activo cuando vuelve a leer, y lee el ambito EN ESE MOMENTO. Un aviso de
 *    otro equipo al que se pertenece cuesta una consulta de mas; el filtro
 *    costaba pantallas que no se actualizaban.
 * ---------------------------------------------------------------------------
 *
 * Varias tablas comparten un solo canal a proposito. Un repositorio que vigila
 * tres tablas abre una conexion, no tres: las suscripciones se declaran antes
 * de `subscribe()`, que es lo que el cliente exige para registrarlas juntas.
 */
export function subscribeToTables(
  tables: readonly string[],
  listener: () => void
): () => void {
  const channel = supabase.channel(`cambios:${tables.join('+')}:${crypto.randomUUID()}`)

  for (const table of tables) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => listener())
  }

  channel.subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

/** El caso de una sola tabla, que es el habitual. */
export function subscribeToTable(table: string, listener: () => void): () => void {
  return subscribeToTables([table], listener)
}
