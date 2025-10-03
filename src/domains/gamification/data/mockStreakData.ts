import type { StreakData } from '../types/streak.types'

export const mockStreakData: StreakData[] = [
    {
        studentId: '1',
        studentName: 'Ana García',
        streakType: 'workout',
        currentStreak: 21,
        longestStreak: 35,
        lastActivity: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        streakStatus: 'active',
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
        streakType: 'nutrition',
        currentStreak: 14,
        longestStreak: 28,
        lastActivity: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
        streakStatus: 'at_risk',
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
        streakType: 'check_in',
        currentStreak: 45,
        longestStreak: 45,
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        streakStatus: 'active',
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
]