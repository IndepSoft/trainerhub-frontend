"use client"

import { useState } from "react"
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { ChallengeCard } from "./ChallengeCard"
import { ChallengeCreation } from "./ChallengeCreation"
import { Plus, Search, Target, Trophy, Clock, Users } from "lucide-react"
import type { Challenge } from "../types/challenge.types"
import { mockChallenges } from "../data/mockChallenges"

export function PersonalizedChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>(mockChallenges)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showCreateWizard, setShowCreateWizard] = useState(false)

  const filteredChallenges = challenges.filter((challenge) => {
    const matchesSearch =
      challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challenge.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || challenge.status === statusFilter
    const matchesType = typeFilter === "all" || challenge.objective.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const handleCreateChallenge = (newChallenge: any) => {
    setChallenges([...challenges, newChallenge])
  }

  const handleUpdateProgress = (challengeId: string, progress: number) => {
    setChallenges(
      challenges.map((challenge) =>
        challenge.id === challengeId
          ? {
              ...challenge,
              progress,
              objective: { ...challenge.objective, currentValue: (challenge.objective.target * progress) / 100 },
            }
          : challenge,
      ),
    )
  }

  const handleTogglePause = (challengeId: string) => {
    setChallenges(
      challenges.map((challenge) =>
        challenge.id === challengeId
          ? { ...challenge, status: challenge.status === "paused" ? "active" : "paused" }
          : challenge,
      ),
    )
  }

  const stats = {
    total: challenges.length,
    active: challenges.filter((c) => c.status === "active").length,
    completed: challenges.filter((c) => c.status === "completed").length,
    avgProgress: Math.round(challenges.reduce((sum, c) => sum + c.progress, 0) / challenges.length),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Desafíos Personalizados</h2>
          <p className="text-muted-foreground">Crea y gestiona desafíos motivacionales para tus estudiantes</p>
        </div>
        <Button onClick={() => setShowCreateWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Desafío
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Desafíos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Activos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Completados</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Progreso Promedio</p>
                <p className="text-2xl font-bold">{stats.avgProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar desafíos o estudiantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
                <SelectItem value="failed">Fallidos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="weight_loss">Pérdida de Peso</SelectItem>
                <SelectItem value="strength_gain">Ganancia de Fuerza</SelectItem>
                <SelectItem value="endurance">Resistencia</SelectItem>
                <SelectItem value="attendance">Asistencia</SelectItem>
                <SelectItem value="habit_formation">Formación de Hábitos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredChallenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            showProgress={true}
            allowEdit={true}
            onUpdate={(progress) => handleUpdateProgress(challenge.id, progress)}
            onEdit={() => console.log("Edit challenge:", challenge.id)}
            onTogglePause={() => handleTogglePause(challenge.id)}
          />
        ))}
      </div>

      {filteredChallenges.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron desafíos</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Crea tu primer desafío personalizado para motivar a tus estudiantes"}
            </p>
            {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
              <Button onClick={() => setShowCreateWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Desafío
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Challenge Creation Wizard */}
      <ChallengeCreation
        open={showCreateWizard}
        onOpenChange={setShowCreateWizard}
        onCreateChallenge={handleCreateChallenge}
      />
    </div>
  )
}