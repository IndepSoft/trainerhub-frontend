import { profileIdFromEmail } from './devIdentity'

/** El correo con el que se administra la plataforma en desarrollo. */
export const DEV_ADMIN_EMAIL = 'admin@indepsoft.com'

/**
 * Quién administra la plataforma.
 *
 * UNA LISTA DE IDENTIFICADORES, no un campo en la cuenta. Es la misma regla que
 * gobierna el rol de crew y por el mismo motivo: lo que el propio usuario puede
 * editar no sirve para decidir permisos. Aquí se lleva al extremo, porque un
 * administrador de plataforma ve TODOS los equipos.
 *
 * Es cuenta aparte de la del entrenador de desarrollo, y a propósito: si el
 * mismo correo fuera las dos cosas, no habría forma de comprobar que la
 * separación funciona —cualquier fallo de filtrado quedaría tapado—.
 *
 * TODO: con backend esto es una tabla que sólo escribe el rol de servicio, y la
 * comprobación vive en las políticas, no en el cliente.
 */
export const platformAdminsSeed: string[] = [profileIdFromEmail(DEV_ADMIN_EMAIL)]
