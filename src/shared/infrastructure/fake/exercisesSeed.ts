import type { Exercise } from '@/shared/domain/entities/exercise'

/**
 * Catálogo de ejercicios.
 *
 * Cada entrada es un ejercicio CON su equipamiento: «press de banca con barra» y
 * «press de banca con mancuernas» son entradas distintas, porque tienen distinta
 * estabilización y distinta progresión de carga.
 *
 * Vive junto a `FakeExerciseRepository`, como el resto de semillas.
 *
 * TODO: pasa al backend cuando exista. Es catálogo de sistema, ampliable por el
 * entrenador con sus propios ejercicios, pero no editable en su base.
 */
export const exercisesSeed: Exercise[] = [
  {
    id: 'sentadilla-barra',
    name: 'Sentadilla con barra',
    equipmentId: 'barra',
    movementPatternId: 'dominante-rodilla',
    primaryMuscleGroupId: 'cuadriceps',
    secondaryMuscleGroupIds: ['gluteo', 'isquiosurales', 'lumbar'],
    instructions: [
      'Barra apoyada sobre el trapecio, pies al ancho de los hombros.',
      'Baja controlando hasta que el muslo quede paralelo al suelo.',
      'Empuja desde el medio del pie sin dejar caer el pecho.',
    ],
  },
  {
    id: 'peso-muerto-rumano',
    name: 'Peso muerto rumano',
    equipmentId: 'barra',
    movementPatternId: 'dominante-cadera',
    primaryMuscleGroupId: 'isquiosurales',
    secondaryMuscleGroupIds: ['gluteo', 'lumbar'],
    instructions: [
      'Rodillas ligeramente flexionadas y fijas.',
      'Lleva la cadera atrás manteniendo la barra pegada a la pierna.',
      'Sube apretando el glúteo, sin hiperextender la espalda.',
    ],
  },
  {
    id: 'press-banca-barra',
    name: 'Press de banca con barra',
    equipmentId: 'barra',
    movementPatternId: 'empuje-horizontal',
    primaryMuscleGroupId: 'pectoral',
    secondaryMuscleGroupIds: ['triceps', 'deltoides'],
    instructions: [
      'Escápulas retraídas y pies apoyados.',
      'Baja la barra al esternón con los codos a unos 45 grados.',
      'Empuja sin despegar la zona lumbar del banco.',
    ],
  },
  {
    id: 'press-inclinado-mancuernas',
    name: 'Press inclinado con mancuernas',
    equipmentId: 'mancuerna',
    movementPatternId: 'empuje-horizontal',
    primaryMuscleGroupId: 'pectoral',
    secondaryMuscleGroupIds: ['deltoides', 'triceps'],
    instructions: ['Banco a 30 grados.', 'Baja hasta sentir estiramiento sin forzar el hombro.'],
  },
  {
    id: 'remo-barra',
    name: 'Remo con barra',
    equipmentId: 'barra',
    movementPatternId: 'traccion-horizontal',
    primaryMuscleGroupId: 'dorsal',
    secondaryMuscleGroupIds: ['biceps', 'trapecio', 'lumbar'],
    instructions: ['Tronco inclinado unos 45 grados.', 'Lleva la barra al ombligo.'],
  },
  {
    id: 'jalon-polea',
    name: 'Jalón al pecho en polea',
    equipmentId: 'polea',
    movementPatternId: 'traccion-vertical',
    primaryMuscleGroupId: 'dorsal',
    secondaryMuscleGroupIds: ['biceps'],
    instructions: ['Agarre algo más ancho que los hombros.', 'Lleva los codos hacia las costillas.'],
  },
  {
    id: 'press-militar-barra',
    name: 'Press militar con barra',
    equipmentId: 'barra',
    movementPatternId: 'empuje-vertical',
    primaryMuscleGroupId: 'deltoides',
    secondaryMuscleGroupIds: ['triceps', 'trapecio'],
    instructions: ['De pie, core apretado.', 'Empuja sin arquear la lumbar.'],
  },
  {
    id: 'curl-biceps-mancuernas',
    name: 'Curl de bíceps con mancuernas',
    equipmentId: 'mancuerna',
    movementPatternId: 'monoarticular',
    primaryMuscleGroupId: 'biceps',
    secondaryMuscleGroupIds: [],
    instructions: ['Codos pegados al tronco.', 'Sube sin balancear.'],
  },
  {
    id: 'extension-triceps-polea',
    name: 'Extensión de tríceps en polea',
    equipmentId: 'polea',
    movementPatternId: 'monoarticular',
    primaryMuscleGroupId: 'triceps',
    secondaryMuscleGroupIds: [],
    instructions: ['Codos fijos.', 'Extiende sin adelantar los hombros.'],
  },
  {
    id: 'zancada-mancuernas',
    name: 'Zancada con mancuernas',
    equipmentId: 'mancuerna',
    movementPatternId: 'dominante-rodilla',
    primaryMuscleGroupId: 'cuadriceps',
    secondaryMuscleGroupIds: ['gluteo', 'isquiosurales'],
    instructions: ['Paso largo, rodilla trasera cerca del suelo.', 'Tronco vertical.'],
  },
  {
    id: 'hip-thrust-barra',
    name: 'Hip thrust con barra',
    equipmentId: 'barra',
    movementPatternId: 'dominante-cadera',
    primaryMuscleGroupId: 'gluteo',
    secondaryMuscleGroupIds: ['isquiosurales'],
    instructions: ['Espalda apoyada en el banco.', 'Sube hasta alinear tronco y muslo.'],
  },
  {
    id: 'flexiones',
    name: 'Flexiones',
    equipmentId: 'peso-corporal',
    movementPatternId: 'empuje-horizontal',
    primaryMuscleGroupId: 'pectoral',
    secondaryMuscleGroupIds: ['triceps', 'deltoides', 'abdomen'],
    instructions: ['Cuerpo en línea recta.', 'Codos a unos 45 grados.'],
  },
  {
    id: 'plancha',
    name: 'Plancha',
    equipmentId: 'peso-corporal',
    movementPatternId: 'core-antiextension',
    primaryMuscleGroupId: 'abdomen',
    secondaryMuscleGroupIds: ['lumbar', 'deltoides'],
    instructions: ['Antebrazos bajo los hombros.', 'Glúteo apretado, cadera neutra.'],
  },
  {
    id: 'pallof-press-polea',
    name: 'Pallof press en polea',
    equipmentId: 'polea',
    movementPatternId: 'core-antirotacion',
    primaryMuscleGroupId: 'abdomen',
    secondaryMuscleGroupIds: ['gluteo'],
    instructions: ['De perfil a la polea.', 'Extiende los brazos resistiendo la rotación.'],
  },
  {
    id: 'elevacion-gemelos',
    name: 'Elevación de gemelos',
    equipmentId: 'maquina-guiada',
    movementPatternId: 'monoarticular',
    primaryMuscleGroupId: 'gemelos',
    secondaryMuscleGroupIds: [],
    instructions: ['Recorrido completo.', 'Pausa arriba.'],
  },
]
