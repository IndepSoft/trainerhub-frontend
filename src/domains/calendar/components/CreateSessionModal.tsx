"use client"

import { useState } from "react"
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Calendar } from '@/shared/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Plus, CalendarIcon, Clock, MapPin, User, Users } from "lucide-react"
import { toast } from "sonner"

const students = [
  { id: 1, name: "María García", avatar: "MG" },
  { id: 2, name: "Carlos López", avatar: "CL" },
  { id: 3, name: "Ana Martínez", avatar: "AM" },
  { id: 4, name: "Pedro Rodríguez", avatar: "PR" },
  { id: 5, name: "Laura Sánchez", avatar: "LS" },
]

const sessionTypes = [
  { value: "personal", label: "Entrenamiento Personal", icon: User },
  { value: "evaluation", label: "Evaluación Inicial", icon: User },
  { value: "followup", label: "Seguimiento", icon: User },
  { value: "group", label: "Clase Grupal", icon: Users },
]

const locations = ["Gimnasio Principal", "Sala Grupal", "Sala de Evaluación", "Oficina", "Exterior", "Online"]

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

export function CreateSessionModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionType, setSessionType] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [duration, setDuration] = useState("60")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")

  const handleCreateSession = () => {
    if (!sessionType || !selectedDate || !selectedTime || !location) {
      toast("Por favor completa todos los campos requeridos.")
      return
    }

    if (sessionType !== "group" && !selectedStudent) {
      toast("Selecciona un alumno para la sesión individual.")
      return
    }

    const studentName = students.find((s) => s.id.toString() === selectedStudent)?.name || "Grupo"
    const sessionTypeName = sessionTypes.find((t) => t.value === sessionType)?.label || ""

    toast(`Sesión de ${sessionTypeName} con ${studentName} programada para ${selectedDate.toLocaleDateString("es-ES")} a las ${selectedTime}.`)

    // Reset form
    setSessionType("")
    setSelectedStudent("")
    setSelectedDate(undefined)
    setSelectedTime("")
    setDuration("60")
    setLocation("")
    setNotes("")
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Sesión
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Programar Nueva Sesión</DialogTitle>
          <DialogDescription>Crea una nueva sesión de entrenamiento o cita</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipo de Sesión</CardTitle>
              <CardDescription>Selecciona el tipo de sesión que deseas programar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {sessionTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      sessionType === type.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSessionType(type.value)}
                  >
                    <div className="flex items-center gap-3">
                      <type.icon className="w-5 h-5" />
                      <span className="font-medium">{type.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Student Selection (only for individual sessions) */}
          {sessionType && sessionType !== "group" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seleccionar Alumno</CardTitle>
                <CardDescription>Elige el alumno para esta sesión</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedStudent === student.id.toString()
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedStudent(student.id.toString())}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={`/generic-placeholder-icon.png?height=40&width=40`} />
                        <AvatarFallback>{student.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Fecha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  disabled={(date) => date < new Date()}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Hora y Duración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Hora de inicio</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duración (minutos)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location and Notes */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Ubicación
              </Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                placeholder="Instrucciones especiales, objetivos de la sesión, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleCreateSession} className="flex-1">
              Crear Sesión
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}