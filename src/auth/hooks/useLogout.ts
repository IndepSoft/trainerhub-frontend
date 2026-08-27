import { useAuthStore } from '@/app/stores/authStore'
import { useNavigate } from 'react-router-dom'

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/authentication', { replace: true })
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  return { handleLogout }
}