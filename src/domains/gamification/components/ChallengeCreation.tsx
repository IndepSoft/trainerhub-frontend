"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { CalendarIcon, Target, Trophy, User, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from '@/shared/lib/utils'
import { challengeTypes, rewardTypes } from "../libs/challengeTypeConfig"
import { mockStudents } from "../data/mockChallenges"

interface ChallengeCreationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateChallenge: (challenge: any) => void
}

export function ChallengeCreation({ open, onOpenChange, onCreateChallenge }: ChallengeCreationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    target: "",
    unit: "",
    trackingFrequency: "",
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    rewardType: "",
    rewardValue: "",
    rewardDescription: "",
    studentId: "",
    personalMessage: "",
  })

  const selectedType = challengeTypes.find((type) => type.id === formData.type)
  const selectedStudent = mockStudents.find((student) => student.id === formData.studentId)

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    const challenge = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      studentId: formData.studentId,
      studentName: selectedStudent?.name || "",
      createdBy: "trainer-1",
      objective: {
        type: formData.type,
        target: Number.parseFloat(formData.target),
        unit: formData.unit,
        currentValue: 0,
        measurable: true,
        trackingFrequency: formData.trackingFrequency,
      },
      startDate: formData.startDate,
      endDate: formData.endDate,
      reward: {
        type: formData.rewardType,
        value: formData.rewardValue,
        description: formData.rewardDescription,
      },
      status: "active",
      progress: 0,
      milestones: [
        { percentage: 25, title: "Primer Cuarto", achieved: false },
        { percentage: 50, title: "Mitad del Camino", achieved: false },
        { percentage: 75, title: "Casi Listo", achieved: false },
        { percentage: 100, title: "¡Completado!", achieved: false },
      ],
    }

    onCreateChallenge(challenge)
    onOpenChange(false)
    setCurrentStep(1)
    setFormData({
      title: "",
      description: "",
      type: "",
      target: "",
      unit: "",
      trackingFrequency: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      rewardType: "",
      rewardValue: "",
      rewardDescription: "",
      studentId: "",
      personalMessage: "",
    })
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.type && formData.title && formData.description
      case 2:
        return formData.target && formData.unit && formData.trackingFrequency
      case 3:
        return formData.rewardType && formData.rewardDescription
      case 4:
        return formData.studentId
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Desafío Personalizado</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600",
                )}
              >
                {step < currentStep ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 4 && <div className={cn("w-16 h-1 mx-2", step < currentStep ? "bg-blue-600" : "bg-gray-200")} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Challenge Type */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Paso 1: Tipo de Desafío</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {challengeTypes.map((type) => (
                    <Card
                      key={type.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        formData.type === type.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50",
                      )}
                      onClick={() => setFormData({ ...formData, type: type.id, unit: type.units[0] })}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{type.icon}</span>
                          <div>
                            <h4 className="font-medium">{type.name}</h4>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {formData.type && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título del Desafío</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ej: Desafío de Pérdida de Peso de 30 Días"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe el desafío y sus objetivos..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Define Objective */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Paso 2: Definir Objetivo</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target">Meta Objetivo</Label>
                  <Input
                    id="target"
                    type="number"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    placeholder="Ej: 5"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unidad</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedType?.units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="tracking">Frecuencia de Seguimiento</Label>
                <Select
                  value={formData.trackingFrequency}
                  onValueChange={(value) => setFormData({ ...formData, trackingFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="¿Con qué frecuencia se medirá?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="per_session">Por Sesión</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.startDate, "PPP", { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Fecha de Fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.endDate, "PPP", { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Set Reward */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Paso 3: Configurar Recompensa</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rewardTypes.map((reward) => (
                  <Card
                    key={reward.id}
                    className={cn(
                      "cursor-pointer transition-all",
                      formData.rewardType === reward.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50",
                    )}
                    onClick={() => setFormData({ ...formData, rewardType: reward.id })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        <div>
                          <h4 className="font-medium">{reward.name}</h4>
                          <p className="text-sm text-muted-foreground">{reward.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {formData.rewardType && (
                <div className="space-y-4">
                  {formData.rewardType === "discount" && (
                    <div>
                      <Label htmlFor="rewardValue">Porcentaje de Descuento</Label>
                      <Input
                        id="rewardValue"
                        type="number"
                        value={formData.rewardValue}
                        onChange={(e) => setFormData({ ...formData, rewardValue: e.target.value })}
                        placeholder="Ej: 20"
                        //suffix="%"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="rewardDescription">Descripción de la Recompensa</Label>
                    <Textarea
                      id="rewardDescription"
                      value={formData.rewardDescription}
                      onChange={(e) => setFormData({ ...formData, rewardDescription: e.target.value })}
                      placeholder="Describe la recompensa que recibirá el estudiante..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Assign Student */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Paso 4: Asignar Estudiante</h3>

              <div>
                <Label htmlFor="student">Seleccionar Estudiante</Label>
                <Select
                  value={formData.studentId}
                  onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Buscar y seleccionar estudiante..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="personalMessage">Mensaje Personal (Opcional)</Label>
                <Textarea
                  id="personalMessage"
                  value={formData.personalMessage}
                  onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
                  placeholder="Escribe un mensaje motivacional para el estudiante..."
                  rows={3}
                />
              </div>

              {/* Challenge Preview */}
              {formData.studentId && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Vista Previa del Desafío</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{formData.title}</h4>
                      <Badge className="bg-blue-100 text-blue-800">Nuevo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{formData.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Target className="h-4 w-4" />
                        <span>
                          {formData.target} {formData.unit}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4" />
                        <span>{formData.rewardDescription}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Asignado a: {selectedStudent?.name}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Paso {currentStep} de 4</span>
          </div>

          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={!isStepValid()}>
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!isStepValid()} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              Crear Desafío
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
