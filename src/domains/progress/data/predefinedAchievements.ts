import type { Achievement } from "../types/achievement.types";

/**
 * Catalogo de logros.
 *
 * Nombres y descripciones en castellano, como el resto de la interfaz: estaban
 * en ingles y se mostraban tal cual al usuario, contra la convencion del
 * proyecto -interfaz en castellano, codigo en ingles-. Los identificadores y las
 * categorias siguen en ingles, que es codigo.
 *
 * TODO: la traduccion es literal. Producto deberia revisar el tono: un logro es
 * copy de marca y «Guerrero del Mes» admite mejores versiones.
 */

export const predefinedAchievements: Achievement[] = [
  {
    id: "perfect-week",
    name: "Semana Perfecta",
    description: "Entrena 7 días seguidos",
    icon: "trophy",
    category: "attendance",
    rarity: "common",
    pointsReward: 100,
    unlockedAt: new Date("2024-01-15"),
  },
  {
    id: "monthly-warrior",
    name: "Guerrero del Mes",
    description: "Completa más de 20 sesiones en un mes",
    icon: "medal",
    category: "attendance",
    rarity: "rare",
    pointsReward: 300,
  },
  {
    id: "never-miss-monday",
    name: "Todos los Lunes",
    description: "Entrena 4 lunes seguidos",
    icon: "star",
    category: "attendance",
    rarity: "common",
    pointsReward: 150,
    unlockedAt: new Date("2024-01-22"),
  },
  {
    id: "early-bird",
    name: "Madrugador",
    description: "Completa 10 sesiones antes de las 8:00",
    icon: "award",
    category: "attendance",
    rarity: "rare",
    pointsReward: 200,
  },

  // Consistency Achievements
  {
    id: "habit-former",
    name: "Hábito Formado",
    description: "Mantén una racha de 21 días",
    icon: "flame",
    category: "consistency",
    rarity: "rare",
    pointsReward: 500,
    unlockedAt: new Date("2024-02-01"),
  },
  {
    id: "unstoppable",
    name: "Imparable",
    description: "Alcanza una racha de 50 días",
    icon: "flame",
    category: "consistency",
    rarity: "epic",
    pointsReward: 1000,
  },
  {
    id: "legend",
    name: "Leyenda",
    description: "Llega a una racha de 100 días",
    icon: "flame",
    category: "consistency",
    rarity: "legendary",
    pointsReward: 2500,
  },
  {
    id: "iron-will",
    name: "Voluntad de Hierro",
    description: "Completa el 90 % de las sesiones asignadas",
    icon: "target",
    category: "consistency",
    rarity: "epic",
    pointsReward: 750,
  },

  // Metrics Achievements
  {
    id: "first-steps",
    name: "Primeros Pasos",
    description: "Registra tus medidas iniciales",
    icon: "star",
    category: "metrics",
    rarity: "common",
    pointsReward: 50,
    unlockedAt: new Date("2024-01-10"),
  },
  {
    id: "progress-tracker",
    name: "Seguimiento Visual",
    description: "Sube 10 fotos de progreso",
    icon: "target",
    category: "metrics",
    rarity: "common",
    pointsReward: 100,
  },
  {
    id: "transformer",
    name: "Transformación",
    description: "Baja 5 kg desde tu peso inicial",
    icon: "trophy",
    category: "metrics",
    rarity: "epic",
    pointsReward: 1000,
  },
  {
    id: "strength-seeker",
    name: "Más Fuerte",
    description: "Sube un 25 % tu peso máximo",
    icon: "medal",
    category: "metrics",
    rarity: "rare",
    pointsReward: 400,
  },

  // Challenge Achievements
  {
    id: "challenge-accepted",
    name: "Desafío Aceptado",
    description: "Completa tu primer desafío personal",
    icon: "award",
    category: "challenges",
    rarity: "common",
    pointsReward: 200,
  },
  {
    id: "overachiever",
    name: "Antes de Tiempo",
    description: "Completa un desafío antes de la fecha límite",
    icon: "star",
    category: "challenges",
    rarity: "rare",
    pointsReward: 350,
  },
  {
    id: "challenge-master",
    name: "Maestro de Desafíos",
    description: "Completa 5 desafíos distintos",
    icon: "trophy",
    category: "challenges",
    rarity: "epic",
    pointsReward: 800,
  },
  {
    id: "goal-crusher",
    name: "Meta Superada",
    description: "Supera el objetivo de un desafío en un 20 %",
    icon: "target",
    category: "challenges",
    rarity: "legendary",
    pointsReward: 1500,
  },
]