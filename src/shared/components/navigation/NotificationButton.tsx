import { Bell } from 'lucide-react'

export function NotificationButton() {
  return (
    <button
      className="inline-flex h-11 w-11 items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
      aria-label="Notificaciones"
    >
      <Bell className="h-5 w-5" />
    </button>
  )
}
