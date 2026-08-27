"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { CreateSessionModal } from '../components/CreateSessionModal'
import { SessionDetailsModal } from "../components/SessionDetailsModal"

const sessions = [
  {
    id: 1,
    title: "Entrenamiento Personal - María García",
    student: "María García",
    type: "individual",
    category: "Entrenamiento Personal",
    date: "2024-01-15",
    time: "09:00",
    duration: 60,
    location: "Gimnasio Principal",
    status: "confirmed",
    notes: "Enfoque en tren superior",
    avatar: "MG",
  },
  {
    id: 2,
    title: "Evaluación Inicial - Carlos López",
    student: "Carlos López",
    type: "individual",
    category: "Evaluación",
    date: "2024-01-15",
    time: "10:30",
    duration: 45,
    location: "Sala de Evaluación",
    status: "pending",
    notes: "Primera sesión, mediciones corporales",
    avatar: "CL",
  },
  {
    id: 3,
    title: "Clase Grupal - HIIT",
    student: "Grupo HIIT",
    type: "group",
    category: "Entrenamiento Grupal",
    date: "2024-01-15",
    time: "18:00",
    duration: 45,
    location: "Sala Grupal",
    status: "confirmed",
    notes: "Máximo 8 personas",
    avatar: "GH",
  },
  {
    id: 4,
    title: "Seguimiento - Ana Martínez",
    student: "Ana Martínez",
    type: "individual",
    category: "Seguimiento",
    date: "2024-01-16",
    time: "14:00",
    duration: 30,
    location: "Oficina",
    status: "confirmed",
    notes: "Revisión de progreso mensual",
    avatar: "AM",
  },
  {
    id: 5,
    title: "Entrenamiento Personal - Pedro Rodríguez",
    student: "Pedro Rodríguez",
    type: "individual",
    category: "Entrenamiento Personal",
    date: "2024-01-16",
    time: "16:30",
    duration: 60,
    location: "Gimnasio Principal",
    status: "cancelled",
    notes: "Cancelado por el cliente",
    avatar: "PR",
  },
]

const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
]

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "day">("week")
  const [selectedSession, setSelectedSession] = useState<(typeof sessions)[0] | null>(null)

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) 
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const weekDates = getWeekDates(currentDate)

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return sessions.filter((session) => session.date === dateStr)
  }

  const getSessionsForTimeSlot = (date: Date, time: string) => {
    return getSessionsForDate(date).filter((session) => session.time === time)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-3 h-3" />
      case "pending":
        return <AlertCircle className="w-3 h-3" />
      case "cancelled":
        return <XCircle className="w-3 h-3" />
      default:
        return null
    }
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7))
    setCurrentDate(newDate)
  }

  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1))
    setCurrentDate(newDate)
  }

  const handleSessionClick = (session: (typeof sessions)[0]) => {
    setSelectedSession(session)
  }

  const handleStatusChange = (_sessionId: number, newStatus: string) => {
    toast(`La sesión ha sido marcada como ${newStatus}.`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda y Programación</h1>
          <p className="text-muted-foreground">Gestiona tus sesiones y citas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={viewMode} onValueChange={(value: "week" | "day") => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="day">Día</SelectItem>
            </SelectContent>
          </Select>
          <CreateSessionModal />
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (viewMode === "week" ? navigateWeek("prev") : navigateDay("prev"))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {viewMode === "week"
                  ? `${weekDates[0].toLocaleDateString("es-ES", { day: "numeric", month: "long" })} - ${weekDates[6].toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
                  : currentDate.toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (viewMode === "week" ? navigateWeek("next") : navigateDay("next"))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Hoy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "week" ? (
            <div className="grid grid-cols-8 gap-1">
              {/* Time column header */}
              <div className="p-2"></div>

              {/* Day headers */}
              {weekDates.map((date, index) => (
                <div key={index} className="p-2 text-center border-b">
                  <div className="font-medium">{weekDays[index]}</div>
                  <div
                    className={`text-sm ${date.toDateString() === new Date().toDateString() ? "text-primary font-bold" : "text-muted-foreground"}`}
                  >
                    {date.getDate()}
                  </div>
                </div>
              ))}

              {/* Time slots and sessions */}
              {timeSlots.map((time) => (
                <div key={time} className="contents">
                  {/* Time label */}
                  <div className="p-2 text-sm text-muted-foreground border-r">{time}</div>

                  {/* Day columns */}
                  {weekDates.map((date, dayIndex) => {
                    const sessionsInSlot = getSessionsForTimeSlot(date, time)
                    return (
                      <div key={`${time}-${dayIndex}`} className="p-1 border-b border-r min-h-16">
                        {sessionsInSlot.map((session) => (
                          <div
                            key={session.id}
                            className={`p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(session.status)}`}
                            onClick={() => handleSessionClick(session)}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              {getStatusIcon(session.status)}
                              <span className="font-medium truncate">{session.student}</span>
                            </div>
                            <div className="text-xs opacity-75">{session.category}</div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {timeSlots.map((time) => {
                const sessionsInSlot = getSessionsForTimeSlot(currentDate, time)
                return (
                  <div key={time} className="flex gap-4 p-4 border-b">
                    <div className="w-16 text-sm text-muted-foreground font-medium">{time}</div>
                    <div className="flex-1">
                      {sessionsInSlot.length > 0 ? (
                        <div className="space-y-2">
                          {sessionsInSlot.map((session) => (
                            <div
                              key={session.id}
                              className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(session.status)}`}
                              onClick={() => handleSessionClick(session)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={`/generic-placeholder-icon.png?height=40&width=40`} />
                                    <AvatarFallback>{session.avatar}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-medium">{session.title}</h3>
                                    <div className="flex items-center gap-4 text-sm opacity-75 mt-1">
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {session.duration} min
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {session.location}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(session.status)}
                                  <Badge variant="outline" className="text-xs">
                                    {session.type === "individual" ? "Individual" : "Grupal"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm">Sin sesiones programadas</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Sessions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sessions.filter((s) => s.status === "confirmed").length}
            </div>
            <p className="text-sm text-muted-foreground">Sesiones confirmadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {sessions.filter((s) => s.status === "pending").length}
            </div>
            <p className="text-sm text-muted-foreground">Esperando confirmación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Canceladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {sessions.filter((s) => s.status === "cancelled").length}
            </div>
            <p className="text-sm text-muted-foreground">Sesiones canceladas</p>
          </CardContent>
        </Card>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          open={!!selectedSession}
          onOpenChange={(open: any) => !open && setSelectedSession(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}