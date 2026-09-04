import { useState } from 'react'
import { RegisterIntentChooser } from './RegisterIntentChooser'
import { TrainerRegisterForm } from './TrainerRegisterForm'
import { StudentRegisterForm } from './StudentRegisterForm'
import type { RegisterIntent } from '../types/register.types'

/**
 * El registro: primero con qué vienes, después el formulario que toca.
 *
 * SÓLO COMPOSICIÓN. Era un componente de doscientas líneas que guardaba estado,
 * validaba, enviaba y pintaba; ahora el estado y el envío viven en
 * `useRegisterForm` y cada alta tiene su formulario.
 *
 * Volver a elegir DESMONTA el formulario, así que lo escrito se pierde. Es
 * intencionado: los campos de los dos roles no son los mismos, y conservar una
 * especialidad elegida por alguien que acaba de decir que no entrena a nadie
 * dejaría un dato que después se ignora.
 */
export function RegisterForm() {
  const [intent, setIntent] = useState<RegisterIntent | null>(null)

  if (intent === null) {
    return <RegisterIntentChooser onChoose={setIntent} />
  }

  // «Atrás» lleva al otro formulario, no al selector: quien pulsa «no entreno a
  // nadie» ya ha dicho lo que quiere, y devolverle a elegir le haría decirlo dos
  // veces.
  if (intent === 'trainer') {
    return <TrainerRegisterForm onBack={() => setIntent('student')} />
  }

  return <StudentRegisterForm onBack={() => setIntent('trainer')} />
}
