import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { AppProviders } from './providers/AppProviders'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { Toaster } from '@/shared/ui/sonner'

const App = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <AppProviders>
      <RouterProvider router={router} />

      {/*
        El Toaster faltaba. `toast()` se llamaba desde tres sitios del
        calendario -eliminar sesion, enviar recordatorio, crear sesion- y sin
        este componente montado NINGUNO llegaba a verse: el usuario hacia la
        accion y no recibia respuesta alguna.

        `richColors` para que el exito y el error se distingan sin leer.
        `offset` deja sitio a la barra inferior de navegacion en movil, que si
        no queda tapada por el aviso.
      */}
      <Toaster
        position="bottom-center"
        richColors
        offset={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      />
    </AppProviders>
  )
}

export default App
