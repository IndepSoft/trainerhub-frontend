import type { CrewRole } from '../entities/crew'
import type { CrewStaff } from '../entities/crew'
import type { Capability } from '../permissions'

/**
 * Puerto del equipo técnico de un crew.
 *
 * PUERTO PROPIO Y NO DOS MÉTODOS MÁS EN `CrewRepository`, por segregación de
 * interfaces: quien pinta la cabecera del crew necesita el crew, no la potestad
 * de ascender a nadie. Puertos pequeños y por capacidad, como dice la guía.
 *
 * Aquí viven los que GESTIONAN —administradores y entrenadores—. Los alumnos no:
 * su pertenencia es su ficha, que ya es la relación entre un entrenador y quien
 * entrena. Desdoblarla obligaría a mantener dos filas para decir lo mismo.
 */
export interface CrewStaffRepository {
  /** El equipo técnico del crew activo. */
  findAll(): Promise<CrewStaff[]>

  /**
   * Los puestos de una persona, en cualquier crew. **No está acotado.**
   *
   * Es la otra mitad de cómo se deriva el rol, junto a las fichas de alumno. Y,
   * como aquélla, lee lo de UNO MISMO: con RLS es una política de
   * `profile_id = auth.uid()`, no una excepción al aislamiento.
   */
  findAllByProfileId(profileId: string): Promise<CrewStaff[]>

  /** Mete a alguien en el equipo técnico del crew activo. */
  add(data: NewCrewStaff): Promise<CrewStaff>

  /**
   * Lo mismo, pero en un crew CONCRETO y no en el activo.
   *
   * Es la excepción declarada, igual que `students.claimMembership`: quien
   * administra la plataforma asciende a alguien en un equipo que no es el suyo
   * —el suyo es otro—, así que el ámbito activo no puede decidirlo.
   *
   * Que sea un método aparte y no un `crewId` opcional en `add` es a propósito:
   * un parámetro que casi siempre se omite acaba omitiéndose también donde hacía
   * falta, y el fallo es silencioso —se escribe en el equipo equivocado—.
   */
  addToCrew(crewId: string, data: NewCrewStaff): Promise<CrewStaff>

  /**
   * Cambia el rol de un puesto.
   *
   * Separado de las capacidades porque son decisiones distintas: ascender a
   * alguien a administrador no es lo mismo que prestarle una llave suelta, y
   * mezclarlas en un `update` permitiría hacer lo primero creyendo hacer lo
   * segundo.
   */
  updateRole(staffId: string, role: CrewRole): Promise<void>

  /** Cambia las concesiones por encima del rol. Sólo suman. */
  updateCapabilities(staffId: string, extraCapabilities: Capability[]): Promise<void>

  remove(staffId: string): Promise<void>

  onChange(listener: () => void): () => void
}

/** Un puesto nuevo. Sin `crewId`: lo pone el adaptador desde el ámbito activo. */
export type NewCrewStaff = Omit<CrewStaff, 'id' | 'crewId'>
