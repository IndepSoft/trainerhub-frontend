import { StudentProgressStrip } from './StudentProgressStrip'
import { useStudentsProgress } from '../hooks/useStudentsProgress'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface StudentProgressSectionProps {
  studentId: string
}

/**
 * El progreso de un alumno, dentro de su ficha.
 *
 * AQUÍ Y NO EN UNA PANTALLA APARTE. Vivía en `/progress` con un selector para
 * elegir a quién mirar, y eso obligaba a salir de la ficha, ir a otro sitio y
 * buscar de nuevo a la misma persona que ya se tenía delante.
 *
 * SÓLO LA BARRA DE NIVEL. Llegó a traer también el sendero de hitos —«Tu
 * camino»— y la racha, reutilizando la cabecera de la pantalla del alumno. Eran
 * de él, no de quien le entrena: el sendero es el registro motivacional que
 * empuja a seguir, y está escrito para quien lo recorre. Al entrenador le sirve
 * la medida, y la tiene aquí.
 *
 * Sale del MISMO AGREGADO que la lista —`useStudentsProgress`—, así que abrir
 * una ficha no cuesta una consulta más: el padrón ya lo ha pedido para escribir
 * cuántas sesiones lleva cada uno.
 */
export function StudentProgressSection({ studentId }: StudentProgressSectionProps) {
  const { t } = useTranslation()
  const { progressById, loading } = useStudentsProgress()

  return (
    /* Sin título propio: va dentro de la sección «Progreso» de la ficha, y un
       «PROGRESO» bajo la pestaña que ya lo dice se lee como un error. El nombre
       sigue en `aria-label` para quien recorre la página por regiones. */
    <section className="px-5 pb-6 pt-2" aria-label={t('studentProgress.title')}>
      {/* Sin el relleno lateral propio de la franja: aquí la sección ya lo pone,
          y duplicarlo dejaría la barra más estrecha que el resto de la ficha. */}
      <div className="[&>*]:px-0 [&>*]:pt-0">
        <StudentProgressStrip
          progress={loading ? undefined : (progressById.get(studentId) ?? null)}
        />
      </div>
    </section>
  )
}
