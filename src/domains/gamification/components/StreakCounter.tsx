'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Progress } from '@/shared/ui/progress'
import { Flame, AlertTriangle, Pause, Play, Trophy, Clock } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { StreakCounterProps } from '../types/streak.types'
import { streakTypeConfig } from '../libs/streakTypeConfig'
import { getFlameIntensity, getRiskColor } from '../libs/streak.utils'

export function StreakCounter({
    streakData,
    showRiskAlert = true,
    onStreakAction,
    size = 'medium',
}: StreakCounterProps) {
    const [showDetails, setShowDetails] = useState(false)

    const config = streakTypeConfig[streakData.streakType]
    const flame = getFlameIntensity(streakData.currentStreak)
    const riskColor = getRiskColor(streakData.streakStatus, streakData.riskLevel)

    const nextMilestone = streakData.milestones.find(
        (m) => !m.achieved && m.days > streakData.currentStreak
    )
    const progressToNext = nextMilestone
        ? (streakData.currentStreak / nextMilestone.days) * 100
        : 100

    const hoursUntilRisk = streakData.riskLevel
    const lastActivityHours = Math.floor(
        (new Date().getTime() - streakData.lastActivity.getTime()) /
        (1000 * 60 * 60)
    )

    return (
        <Card
            className={cn(
                'transition-all duration-200',
                showDetails && 'ring-2 ring-blue-200'
            )}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={cn('p-2 rounded-full', config.bgColor)}>
                            <span className="text-lg">{config.icon}</span>
                        </div>
                        <div>
                            <CardTitle className="text-lg">{config.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {streakData.studentName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Flame className={cn(flame.color, flame.size)} />
                        <div className="text-right">
                            <p className={cn('text-2xl font-bold', riskColor)}>
                                {streakData.currentStreak}
                            </p>
                            <p className="text-xs text-muted-foreground">días</p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                    <Badge
                        variant={
                            streakData.streakStatus === 'active'
                                ? 'default'
                                : streakData.streakStatus === 'at_risk'
                                    ? 'destructive'
                                    : 'secondary'
                        }
                        className="capitalize"
                    >
                        {streakData.streakStatus === 'active' && 'Activa'}
                        {streakData.streakStatus === 'at_risk' && 'En Riesgo'}
                        {streakData.streakStatus === 'broken' && 'Rota'}
                    </Badge>

                    <div className="text-sm text-muted-foreground">
                        Récord: {streakData.longestStreak} días
                    </div>
                </div>

                {/* Risk Alert */}
                {showRiskAlert && streakData.streakStatus === 'at_risk' && (
                    <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-800">
                                ¡Racha en riesgo!
                            </p>
                            <p className="text-xs text-yellow-700">
                                {hoursUntilRisk <= 6
                                    ? `Solo quedan ${hoursUntilRisk} horas para mantener la racha`
                                    : `${hoursUntilRisk} horas hasta que la racha esté en peligro`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Last Activity */}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Última actividad: hace {lastActivityHours} horas</span>
                </div>

                {/* Progress to Next Milestone */}
                {nextMilestone && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                                Próximo hito: {nextMilestone.title}
                            </span>
                            <span className="text-muted-foreground">
                                {streakData.currentStreak}/{nextMilestone.days} días
                            </span>
                        </div>
                        <Progress value={progressToNext} className="h-2" />
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Trophy className="h-3 w-3" />
                            <span>Recompensa: {nextMilestone.reward}</span>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {onStreakAction && streakData.streakStatus !== 'broken' && (
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStreakAction('freeze')}
                            className="flex-1"
                        >
                            <Pause className="h-4 w-4 mr-2" />
                            Congelar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStreakAction('extend')}
                            className="flex-1"
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Extender
                        </Button>
                    </div>
                )}

                {/* Toggle Details */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowDetails(!showDetails)}
                >
                    {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
                </Button>

                {/* Expanded Details */}
                {showDetails && (
                    <div className="space-y-3 pt-3 border-t">
                        <div>
                            <h4 className="text-sm font-medium mb-2">Hitos de Racha</h4>
                            <div className="space-y-2">
                                {streakData.milestones.map((milestone, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            'flex items-center justify-between p-2 rounded-lg text-sm',
                                            milestone.achieved
                                                ? 'bg-green-50 text-green-800'
                                                : milestone.days <= streakData.currentStreak
                                                    ? 'bg-blue-50 text-blue-800'
                                                    : 'bg-gray-50 text-gray-600'
                                        )}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className={cn(
                                                    'w-2 h-2 rounded-full',
                                                    milestone.achieved ? 'bg-green-500' : 'bg-gray-300'
                                                )}
                                            />
                                            <span className="font-medium">{milestone.title}</span>
                                            <span className="text-xs">({milestone.days} días)</span>
                                        </div>
                                        <div className="text-xs">
                                            {milestone.achieved && milestone.achievedDate
                                                ? `✓ ${milestone.achievedDate.toLocaleDateString()}`
                                                : milestone.reward}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium mb-2">Estadísticas</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="p-2 bg-gray-50 rounded">
                                    <p className="text-muted-foreground">Racha Actual</p>
                                    <p className="font-semibold">
                                        {streakData.currentStreak} días
                                    </p>
                                </div>
                                <div className="p-2 bg-gray-50 rounded">
                                    <p className="text-muted-foreground">Récord Personal</p>
                                    <p className="font-semibold">
                                        {streakData.longestStreak} días
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}