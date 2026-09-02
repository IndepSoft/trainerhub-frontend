import type {
  CrewStaffRepository,
  NewCrewStaff,
} from '@/shared/domain/ports/CrewStaffRepository'
import type { CrewScope } from '@/shared/domain/ports/CrewScope'
import type { CrewRole, CrewStaff } from '@/shared/domain/entities/crew'
import type { Capability } from '@/shared/domain/permissions'
import { meaningfulExtras } from '@/shared/domain/permissions'
import { crewStaffSeed } from './crewStaffSeed'

/**
 * El equipo técnico simulado.
 *
 * TODO: los datos viven sólo en memoria. Al recargar vuelve la semilla.
 */
export class FakeCrewStaffRepository implements CrewStaffRepository {
  private staff: CrewStaff[] = crewStaffSeed
  private readonly listeners = new Set<() => void>()
  private readonly scope: CrewScope

  constructor(scope: CrewScope) {
    this.scope = scope
  }

  async findAll(): Promise<CrewStaff[]> {
    const crewId = this.scope.current()
    if (crewId === null) return []
    return this.staff.filter((entry) => entry.crewId === crewId)
  }

  async findAllByProfileId(profileId: string): Promise<CrewStaff[]> {
    // Sin acotar: son los puestos de uno mismo, y es como se descubre en qué
    // crews se trabaja. Está razonado en el puerto.
    return this.staff.filter((entry) => entry.profileId === profileId)
  }

  async add(data: NewCrewStaff): Promise<CrewStaff> {
    const crewId = this.scope.current()
    if (crewId === null) {
      throw new Error('No hay ningún crew activo: un puesto pertenece a un equipo.')
    }

    const entry: CrewStaff = {
      id: crypto.randomUUID(),
      crewId,
      ...data,
      extraCapabilities: meaningfulExtras(data.role, data.extraCapabilities),
    }

    this.staff = [...this.staff, entry]
    this.notify()
    return entry
  }

  async updateRole(staffId: string, role: CrewRole): Promise<void> {
    this.staff = this.staff.map((entry) => {
      if (entry.id !== staffId) return entry

      // Al cambiar de rol se limpian las concesiones que el rol nuevo ya trae:
      // un administrador con «Agenda» concedida aparte sugiere que sin ella no
      // podría, que es falso.
      return { ...entry, role, extraCapabilities: meaningfulExtras(role, entry.extraCapabilities) }
    })
    this.notify()
  }

  async updateCapabilities(staffId: string, extraCapabilities: Capability[]): Promise<void> {
    this.staff = this.staff.map((entry) =>
      entry.id === staffId
        ? { ...entry, extraCapabilities: meaningfulExtras(entry.role, extraCapabilities) }
        : entry
    )
    this.notify()
  }

  async remove(staffId: string): Promise<void> {
    this.staff = this.staff.filter((entry) => entry.id !== staffId)
    this.notify()
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Todos los puestos, sin acotar. Fuera del puerto: sólo para la plataforma. */
  listAll(): CrewStaff[] {
    return this.staff
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
