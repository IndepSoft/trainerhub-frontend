import { useSearchParams } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'
import { RegisterForm } from '../components/RegisterForm'
import { readAuthView } from '../libs/authView'

/**
 * La puerta: identificarse o darse de alta, según la dirección.
 *
 * YA NO HAY TARJETA NI PESTAÑAS. Era el aspecto de fábrica de la librería, y
 * no se parecía a nada de lo que viene después: el onboarding, la celebración
 * y las fichas hablan en Ink, Ember y Condensed. Ahora la puerta también.
 *
 * EL CONTENEDOR DE LA PÁGINA —el fondo y quién desplaza— vive en `AuthScreen`,
 * no aquí. Estaba repetido entre esta página y la de contraseña nueva, y son
 * decisiones de la composición: cambian con el punto de ruptura, y quien sabe
 * de eso es la pantalla, no la ruta.
 */
export default function AuthenticationPage() {
  const [searchParams] = useSearchParams()
  const view = readAuthView(searchParams)

  return view === 'login' ? <LoginForm /> : <RegisterForm />
}
