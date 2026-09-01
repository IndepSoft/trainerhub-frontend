/**
 * Resultado de un borrado.
 *
 * No es un booleano: cuando no se puede borrar, el MOTIVO forma parte de la
 * respuesta. Devolver `false` a secas obligaria a la vista a volver a calcular
 * por que, que es justo la logica que no debe vivir ahi.
 *
 * Vive en `shared/domain` porque lo usan ya tres dominios: el catalogo de
 * ejercicios, las rutinas y los planes, y los estudiantes. Los tres tienen la
 * misma regla de fondo -no se borra lo que otra cosa referencia- y la misma
 * forma de contarlo.
 */
export type DeletionResult = { deleted: true } | { deleted: false; reason: string }
