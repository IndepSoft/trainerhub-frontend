import type { NewTrainer, TrainerRepository } from '@/shared/domain/ports/TrainerRepository'
import type { Trainer } from '@/shared/domain/entities/trainer'

const FAKE_TRAINERS_STORAGE_KEY = 'trainerhub.fake-trainers'

/**
 * Entrenadores simulados, para acompañar a `FakeAuthAdapter`.
 *
 * EXISTE POR COHERENCIA, NO POR COMODIDAD. Con la autenticación simulada activa,
 * el identificador de perfil lo inventa el adaptador falso a partir del correo,
 * así que preguntarle por él a Supabase no encontraba nunca nada: quien entraba
 * en desarrollo se quedaba sin ficha —la barra lateral sin nombre— y registrarse
 * era imposible, porque el alta viajaba a una tabla real desde una cuenta que no
 * lo era. Los dos adaptadores falsos se eligen con la misma condición en la raíz
 * de composición, precisamente para que no puedan desparejarse.
 *
 * PERSISTE EN `localStorage`, al revés que el resto de adaptadores falsos, que
 * viven sólo en memoria. Aquí hace falta: la sesión simulada sí sobrevive a la
 * recarga, y una sesión que vuelve sin su ficha deja al usuario dentro de la
 * aplicación y sin nombre, que es peor que no entrar.
 */
export class FakeTrainerRepository implements TrainerRepository {
  private trainers: Trainer[] = this.readPersisted()

  async findByProfileId(profileId: string): Promise<Trainer | null> {
    return this.trainers.find((trainer) => trainer.profileId === profileId) ?? null
  }

  async create(data: NewTrainer): Promise<Trainer> {
    const trainer: Trainer = {
      id: crypto.randomUUID(),
      ...data,
      // Los pone el sistema, igual que en el esquema real: nadie se registra
      // verificado ni con reseñas.
      verified: false,
      totalReviews: 0,
    }

    this.trainers = [...this.trainers, trainer]
    this.persist()
    return trainer
  }

  private persist(): void {
    try {
      window.localStorage.setItem(FAKE_TRAINERS_STORAGE_KEY, JSON.stringify(this.trainers))
    } catch (error) {
      // Modo privado o almacenamiento deshabilitado: la ficha no sobrevive a la
      // recarga. No es motivo para interrumpir el registro.
      console.warn('[FakeTrainerRepository] No se pudo guardar la ficha simulada.', error)
    }
  }

  private readPersisted(): Trainer[] {
    try {
      const raw = window.localStorage.getItem(FAKE_TRAINERS_STORAGE_KEY)
      if (!raw) return []

      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter(isTrainer) : []
    } catch {
      return []
    }
  }
}

/**
 * Los datos vienen del almacenamiento del navegador, que es una frontera: pudo
 * escribirlos otra versión de la aplicación, o cualquiera desde la consola.
 */
function isTrainer(value: unknown): value is Trainer {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.profileId === 'string' &&
    typeof candidate.firstName === 'string' &&
    typeof candidate.lastName === 'string'
  )
}
