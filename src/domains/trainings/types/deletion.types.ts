/**
 * Resultado de un borrado.
 *
 * No es un booleano: cuando no se puede borrar, el motivo forma parte de la
 * respuesta. Devolver `false` a secas obligaría a la vista a volver a calcular
 * por qué, que es justo la lógica que no debe vivir ahí.
 *
 * Vive en su propio fichero porque lo comparten el editor del catálogo y el de
 * rutinas y planes: dejarlo colgando de uno de los dos hooks obligaría al otro a
 * importar un tipo desde un hook, que es una dependencia rara de leer.
 */
export type DeletionResult = { deleted: true } | { deleted: false; reason: string }
