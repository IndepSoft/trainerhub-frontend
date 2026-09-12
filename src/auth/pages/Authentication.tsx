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
 * DESPLAZA. La raíz es `overflow-y-auto` y no un centrado con `items-center`:
 * en un teléfono de 667 px el alta de entrenador medía más que la pantalla y
 * su parte de arriba quedaba por encima del borde, inalcanzable. `min-h-0`
 * deja que encoja dentro del layout, que es de altura fija.
 */
export default function AuthenticationPage() {
  const [searchParams] = useSearchParams()
  const view = readAuthView(searchParams)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-bone">
      {view === 'login' ? <LoginForm /> : <RegisterForm />}
    </div>
  )
}
