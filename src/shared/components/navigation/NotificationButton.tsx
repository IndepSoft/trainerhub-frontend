import { Bell } from 'lucide-react'

export function NotificationButton() {
  return (
    <button 
      className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
      aria-label="Notificaciones"
    >
      <Bell className="h-4 w-4" />
    </button>
  )
}