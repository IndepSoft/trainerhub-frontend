'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { StreakCounter } from './StreakCounter'
import { Flame, AlertTriangle, Trophy, TrendingUp, Search } from 'lucide-react'
import { StatCard } from './StatCard'

type StreakStatus = 'active' | 'at_risk' | 'broken'
type StreakType = 'workout' | 'nutrition' | 'weigh_in' | 'check_in'
type Milestone = {
  days: number
  title: string
  reward: string
  achieved: boolean
  achievedDate?: Date
}
type StreakData = {
  studentId: string
  studentName: string
  streakType: StreakType
  currentStreak: number
  longestStreak: number
  lastActivity: Date
  streakStatus: StreakStatus
  riskLevel: number
  milestones: Milestone[]
}

const mockStreakData: StreakData[] = [
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

export function StreakTrackingSystem() {
  const [streaks, setStreaks] = useState(mockStreakData)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredStreaks = streaks.filter((streak) => {
    const matchesSearch = streak.studentName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || streak.streakType === typeFilter
    const matchesStatus =
      statusFilter === 'all' || streak.streakStatus === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const handleStreakAction = (
    studentId: string,
    action: 'freeze' | 'extend'
  ) => {
    setStreaks(
      streaks.map((streak) =>
        streak.studentId === studentId
          ? {
              ...streak,
              streakStatus:
                action === 'freeze' ? 'active' : streak.streakStatus,
              riskLevel: action === 'extend' ? 24 : streak.riskLevel,
            }
          : streak
      )
    )
  }

  const stats = {
    totalStreaks: streaks.length,
    activeStreaks: streaks.filter((s) => s.streakStatus === 'active').length,
    atRiskStreaks: streaks.filter((s) => s.streakStatus === 'at_risk').length,
    brokenStreaks: streaks.filter((s) => s.streakStatus === 'broken').length,
    avgStreak: Math.round(
      streaks.reduce((sum, s) => sum + s.currentStreak, 0) / streaks.length
    ),
    longestStreak: Math.max(...streaks.map((s) => s.longestStreak)),
  }

  const streaksByType = {
    workout: streaks.filter((s) => s.streakType === 'workout'),
    nutrition: streaks.filter((s) => s.streakType === 'nutrition'),
    weigh_in: streaks.filter((s) => s.streakType === 'weigh_in'),
    check_in: streaks.filter((s) => s.streakType === 'check_in'),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Sistema de Rachas
          </h2>
          <p className="text-muted-foreground">
            Monitorea y motiva la consistencia de tus estudiantes
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <StatCard
          icon={Flame}
          color="text-orange-600"
          label="Total Rachas"
          value={stats.totalStreaks}
        />
        <StatCard
          icon={Flame}
          color="text-green-600"
          label="Activas"
          value={stats.activeStreaks}
        />
        <StatCard
          icon={AlertTriangle}
          color="text-yellow-600"
          label="En Riesgo"
          value={stats.atRiskStreaks}
        />
        <StatCard
          icon={Flame}
          color="text-gray-400"
          label="Rotas"
          value={stats.brokenStreaks}
        />
        <StatCard
          icon={TrendingUp}
          color="text-blue-600"
          label="Promedio"
          value={stats.avgStreak}
        />
        <StatCard
          icon={Trophy}
          color="text-yellow-600"
          label="Récord"
          value={stats.longestStreak}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar estudiantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo de racha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="workout">Entrenamiento</SelectItem>
                <SelectItem value="nutrition">Nutrición</SelectItem>
                <SelectItem value="weigh_in">Pesaje</SelectItem>
                <SelectItem value="check_in">Check-in</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="at_risk">En Riesgo</SelectItem>
                <SelectItem value="broken">Rotas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Streak Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Rachas por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                Todas ({filteredStreaks.length})
              </TabsTrigger>
              <TabsTrigger value="workout">
                Entrenamiento ({streaksByType.workout.length})
              </TabsTrigger>
              <TabsTrigger value="nutrition">
                Nutrición ({streaksByType.nutrition.length})
              </TabsTrigger>
              <TabsTrigger value="weigh_in">
                Pesaje ({streaksByType.weigh_in.length})
              </TabsTrigger>
              <TabsTrigger value="check_in">
                Check-in ({streaksByType.check_in.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredStreaks.map((streak) => (
                  <StreakCounter
                    key={`${streak.studentId}-${streak.streakType}`}
                    streakData={streak}
                    showRiskAlert={true}
                    onStreakAction={(action) =>
                      handleStreakAction(streak.studentId, action)
                    }
                  />
                ))}
              </div>
            </TabsContent>

            {Object.entries(streaksByType).map(([type, typeStreaks]) => (
              <TabsContent key={type} value={type} className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {typeStreaks
                    .filter(
                      (streak) =>
                        streak.studentName
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) &&
                        (statusFilter === 'all' ||
                          streak.streakStatus === statusFilter)
                    )
                    .map((streak) => (
                      <StreakCounter
                        key={`${streak.studentId}-${streak.streakType}`}
                        streakData={streak}
                        showRiskAlert={true}
                        onStreakAction={(action) =>
                          handleStreakAction(streak.studentId, action)
                        }
                      />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Risk Alerts Summary */}
      {stats.atRiskStreaks > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Rachas en Riesgo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {streaks
                .filter((s) => s.streakStatus === 'at_risk')
                .map((streak) => (
                  <div
                    key={`${streak.studentId}-${streak.streakType}`}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Flame className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="font-medium">{streak.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {streak.streakType} - {streak.currentStreak} días
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-yellow-800">
                        {streak.riskLevel} horas restantes
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleStreakAction(streak.studentId, 'extend')
                        }
                      >
                        Extender
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
