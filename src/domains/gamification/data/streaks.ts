const mockStreakData = [
  {
    studentId: '1',
    studentName: 'Ana García',
    streakType: 'workout' as const,
    currentStreak: 21,
    longestStreak: 35,
    lastActivity: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    streakStatus: 'active' as const,
    riskLevel: 16,
    milestones: [
      {
        days: 7,
        title: 'Primera Semana',
        reward: 'Badge de Constancia',
        achieved: true,
        achievedDate: new Date('2024-01-07'),
      },
      {
        days: 21,
        title: 'Hábito Formado',
        reward: '10% descuento',
        achieved: true,
        achievedDate: new Date('2024-01-21'),
      },
      {
        days: 30,
        title: 'Mes Completo',
        reward: 'Sesión gratis',
        achieved: false,
      },
      {
        days: 50,
        title: 'Imparable',
        reward: 'Suplemento gratis',
        achieved: false,
      },
      { days: 100, title: 'Leyenda', reward: 'Mes gratis', achieved: false },
    ],
  },
  {
    studentId: '2',
    studentName: 'Carlos López',
    streakType: 'nutrition' as const,
    currentStreak: 14,
    longestStreak: 28,
    lastActivity: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
    streakStatus: 'at_risk' as const,
    riskLevel: 4,
    milestones: [
      {
        days: 7,
        title: 'Primera Semana',
        reward: 'Badge Nutricional',
        achieved: true,
        achievedDate: new Date('2024-01-14'),
      },
      {
        days: 21,
        title: 'Hábito Nutricional',
        reward: 'Consulta nutricional',
        achieved: false,
      },
      {
        days: 30,
        title: 'Mes Saludable',
        reward: 'Plan de comidas',
        achieved: false,
      },
    ],
  },
  {
    studentId: '3',
    studentName: 'María Rodríguez',
    streakType: 'check_in' as const,
    currentStreak: 45,
    longestStreak: 45,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    streakStatus: 'active' as const,
    riskLevel: 22,
    milestones: [
      {
        days: 7,
        title: 'Comunicación Activa',
        reward: 'Badge de Compromiso',
        achieved: true,
        achievedDate: new Date('2024-01-07'),
      },
      {
        days: 21,
        title: 'Seguimiento Constante',
        reward: 'Análisis personalizado',
        achieved: true,
        achievedDate: new Date('2024-01-21'),
      },
      {
        days: 30,
        title: 'Mes de Seguimiento',
        reward: 'Sesión de evaluación',
        achieved: true,
        achievedDate: new Date('2024-01-30'),
      },
      {
        days: 50,
        title: 'Seguimiento Experto',
        reward: 'Plan personalizado',
        achieved: false,
      },
    ],
  },
  {
    studentId: '4',
    studentName: 'Juan Pérez',
    streakType: 'weigh_in' as const,
    currentStreak: 0,
    longestStreak: 12,
    lastActivity: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
    streakStatus: 'broken' as const,
    riskLevel: 0,
    milestones: [
      {
        days: 7,
        title: 'Seguimiento Semanal',
        reward: 'Badge de Control',
        achieved: true,
        achievedDate: new Date('2024-01-07'),
      },
      {
        days: 21,
        title: 'Control Constante',
        reward: 'Análisis corporal',
        achieved: false,
      },
      {
        days: 30,
        title: 'Mes de Control',
        reward: 'Evaluación completa',
        achieved: false,
      },
    ],
  },
]

export default mockStreakData
