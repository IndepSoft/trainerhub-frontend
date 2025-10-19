import { useAuthStore } from "@/app/stores/authStore"

export const useAuth = () => {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  
  return {
    user,
    isAuthenticated: !!user,
    isLoading: loading
  }
}