import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { AppProviders } from './providers/AppProviders'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { Toaster } from '@/shared/ui/sonner'
import { hideSplash } from './splash'
import { prefetchModules } from './prefetchModules'

const App = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  /*
   * La pantalla de arranque se retira cuando la SESIÓN está resuelta, no
   * cuando React monta: montar ocurre antes de que haya nada que mirar, y
   * retirarla ahí devolvía el esqueleto sin contexto que venía a tapar. A
   * partir de aquí, lo que se ve es la aplicación decidiendo a dónde llevar.
   */
  const authInitialized = useAuthStore((state) => state.initialized)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (!authInitialized) return

    hideSplash()
    // Con la primera pantalla ya en marcha: los módulos se traen con el hilo
    // libre, para que la primera visita a una pestaña no espere a la red.
    prefetchModules()
  }, [authInitialized])

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
