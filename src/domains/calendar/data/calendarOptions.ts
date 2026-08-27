/**
 * Opciones fijas de la agenda.
 *
 * `TIME_SLOTS` estaba duplicado literalmente -los mismos 27 tramos- en
 * Calendar.tsx y en CreateSessionModal.tsx. Dos copias que habria que recordar
 * mantener a la vez.
 */
export const TIME_SLOTS: string[] = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00',
]

export const WEEK_DAY_LABELS: string[] = [
  'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom',
]

export const SESSION_LOCATIONS: string[] = [
  'Gimnasio Principal',
  'Sala Grupal',
  'Sala de Evaluación',
  'Oficina',
  'Exterior',
  'Online',
]
