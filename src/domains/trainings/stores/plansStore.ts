import { create } from 'zustand'
import { plansMock } from '../data/plans.mock'
import type { TrainingPlan } from '../types/training.types'

interface PlansState {
  plans: TrainingPlan[]
  createPlan: (data: Omit<TrainingPlan, 'id'>) => TrainingPlan
  updatePlan: (planId: string, data: Omit<TrainingPlan, 'id'>) => void
}

/**
 * Planes de la sesión.
 *
 * Misma forma y mismo razonamiento que `routinesStore`: el mock pasa a ser la
 * semilla, y esto no es un puerto en `shared/domain/ports` porque `TrainingPlan`
 * no cruza a un segundo dominio todavía.
 *
 * TODO: vive sólo en memoria. Al recargar vuelve la semilla.
 */
export const usePlansStore = create<PlansState>((set) => ({
  plans: plansMock,

  createPlan: (data) => {
    const plan: TrainingPlan = { id: crypto.randomUUID(), ...data }
    set((state) => ({ plans: [plan, ...state.plans] }))
    return plan
  },

  // Conserva la posición: editar un plan no lo crea de nuevo.
  updatePlan: (planId, data) => {
    set((state) => ({
      plans: state.plans.map((plan) => (plan.id === planId ? { id: planId, ...data } : plan)),
    }))
  },
}))
