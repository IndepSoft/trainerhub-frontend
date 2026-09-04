import type {
  Equipment,
  MovementPattern,
  MuscleGroup,
  TrainingObjective,
  TrainingSplit,
} from '../types/catalog.types'

/**
 * Catálogos de referencia.
 *
 * TODO: pasan al backend cuando exista. Son datos de sistema, no del entrenador:
 * cuando haya repositorio, se sirven igual para todos y no se editan desde la
 * aplicación.
 */

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'pectoral', name: 'Pectoral', region: 'tren superior' },
  { id: 'dorsal', name: 'Dorsal', region: 'tren superior' },
  { id: 'deltoides', name: 'Deltoides', region: 'tren superior' },
  { id: 'trapecio', name: 'Trapecio', region: 'tren superior' },
  { id: 'biceps', name: 'Bíceps', region: 'tren superior' },
  { id: 'triceps', name: 'Tríceps', region: 'tren superior' },
  { id: 'cuadriceps', name: 'Cuádriceps', region: 'tren inferior' },
  { id: 'isquiosurales', name: 'Isquiosurales', region: 'tren inferior' },
  { id: 'gluteo', name: 'Glúteo', region: 'tren inferior' },
  { id: 'aductores', name: 'Aductores', region: 'tren inferior' },
  { id: 'gemelos', name: 'Gemelos', region: 'tren inferior' },
  { id: 'abdomen', name: 'Abdomen', region: 'core' },
  { id: 'lumbar', name: 'Lumbar', region: 'core' },
]

export const MOVEMENT_PATTERNS: MovementPattern[] = [
  { id: 'empuje-horizontal', name: 'Empuje horizontal' },
  { id: 'empuje-vertical', name: 'Empuje vertical' },
  { id: 'traccion-horizontal', name: 'Tracción horizontal' },
  { id: 'traccion-vertical', name: 'Tracción vertical' },
  { id: 'dominante-rodilla', name: 'Dominante de rodilla' },
  { id: 'dominante-cadera', name: 'Dominante de cadera' },
  { id: 'core-antiextension', name: 'Core · antiextensión' },
  { id: 'core-antirotacion', name: 'Core · antirrotación' },
  { id: 'monoarticular', name: 'Monoarticular' },
]

export const EQUIPMENT: Equipment[] = [
  { id: 'barra', name: 'Barra', kind: 'peso libre' },
  { id: 'mancuerna', name: 'Mancuernas', kind: 'peso libre' },
  { id: 'kettlebell', name: 'Kettlebell', kind: 'peso libre' },
  { id: 'polea', name: 'Polea', kind: 'máquina' },
  { id: 'maquina-guiada', name: 'Máquina guiada', kind: 'máquina' },
  { id: 'multipower', name: 'Multipower', kind: 'máquina' },
  { id: 'banco', name: 'Banco', kind: 'accesorio' },
  { id: 'banda', name: 'Banda elástica', kind: 'accesorio' },
  { id: 'trx', name: 'TRX', kind: 'accesorio' },
  { id: 'peso-corporal', name: 'Peso corporal', kind: 'peso corporal' },
]

export const TRAINING_OBJECTIVES: TrainingObjective[] = [
  {
    id: 'hipertrofia',
    name: 'Hipertrofia',
    description: 'Aumento de masa muscular. Volumen alto, RIR 1-3.',
  },
  {
    id: 'fuerza-maxima',
    name: 'Fuerza máxima',
    description: 'Cargas altas, pocas repeticiones y descansos largos.',
  },
  {
    id: 'resistencia-muscular',
    name: 'Resistencia muscular',
    description: 'Repeticiones altas y descansos cortos.',
  },
  {
    id: 'perdida-grasa',
    name: 'Pérdida de grasa',
    description: 'Densidad de trabajo alta, con circuitos y superseries.',
  },
  {
    id: 'acondicionamiento',
    name: 'Acondicionamiento general',
    description: 'Base de fuerza y movilidad para quien empieza o vuelve.',
  },
]

export const TRAINING_SPLITS: TrainingSplit[] = [
  {
    id: 'full-body',
    name: 'Full body',
    description: 'Todo el cuerpo en cada sesión. Frecuencia alta por músculo.',
    sessionsPerWeek: 3,
  },
  {
    id: 'torso-pierna',
    name: 'Torso / Pierna',
    description: 'Alterna tren superior y tren inferior.',
    sessionsPerWeek: 4,
  },
  {
    id: 'empuje-traccion-pierna',
    name: 'Empuje / Tracción / Pierna',
    description: 'Reparte por patrón de movimiento. Conocida como PPL.',
    sessionsPerWeek: 6,
  },
  {
    id: 'weider',
    name: 'Weider',
    description: 'Un grupo muscular por sesión. Frecuencia 1.',
    sessionsPerWeek: 5,
  },
]
