import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { Label } from '@/shared/ui/label'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Edit,
  Trash2,
  MessageSquare,
} from 'lucide-react'
import { SESSION_STATUS, SESSION_STATUS_ENTRIES } from '../libs/sessionStatus'
import { getStudentInitials, parseLocalDateKey } from '../libs/calendar.utils'
import type { Session, SessionStatus } from '../types/calendar.types'
import { toast } from "sonner"
import { useState } from "react"

interface SessionDetailsModalProps {
  session: Session
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (sessionId: string, newStatus: string) => void
}

export function SessionDetailsModal({ session, open, onOpenChange, onStatusChange }: SessionDetailsModalProps) {
  const [newStatus, setNewStatus] = useState<SessionStatus>(session.status)
  const [sessionNotes, setSessionNotes] = useState(session.notes)

  const handleStatusUpdate = () => {
    if (newStatus !== session.status) {
      onStatusChange(session.id, newStatus)
    }
  }

  const handleDeleteSession = () => {
    toast("La sesión ha sido eliminada correctamente.")
    onOpenChange(false)
  }

  const handleSendReminder = () => {
    toast(`Se ha enviado un recordatorio a ${session.student}.`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={`/generic-placeholder-icon.png?height=40&width=40`} />
              <AvatarFallback>{getStudentInitials(session.student)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{session.title}</h2>
              <p className="text-sm text-muted-foreground">{session.category}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Sesión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {parseLocalDateKey(session.date).toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {session.time} ({session.durationMinutes} min)
                    </p>
                    <p className="text-sm text-muted-foreground">Hora y duración</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{session.location}</p>
                    <p className="text-sm text-muted-foreground">Ubicación</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{session.student}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.kind === 'individual' ? 'Sesión individual' : 'Sesión grupal'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado de la Sesión</CardTitle>
              <CardDescription>Actualiza el estado y gestiona la sesión</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Estado actual:</span>
                  <Badge className={SESSION_STATUS[session.status].badgeClassName}>
                    {SESSION_STATUS[session.status].icon}
                    <span className="ml-1">
                      {SESSION_STATUS[session.status].label}
                    </span>
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cambiar estado</Label>
                <div className="flex gap-3">
                  <Select
                    value={newStatus}
                    onValueChange={(value: SessionStatus) => setNewStatus(value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/*
                        Las opciones salen de la tabla de estados: antes las
                        etiquetas estaban escritas aqui y tambien en
                        getStatusText, y podian divergir.
                      */}
                      {SESSION_STATUS_ENTRIES.map(([status, presentation]) => (
                        <SelectItem key={status} value={status}>
                          {presentation.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleStatusUpdate} disabled={newStatus === session.status}>
                    Actualizar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notas de la Sesión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notas y observaciones</Label>
                <Textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Añade notas sobre la sesión..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleSendReminder} className="gap-2 bg-transparent">
              <MessageSquare className="w-4 h-4" />
              Enviar Recordatorio
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Edit className="w-4 h-4" />
              Editar Sesión
            </Button>
            <Button variant="destructive" onClick={handleDeleteSession} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Eliminar Sesión
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}