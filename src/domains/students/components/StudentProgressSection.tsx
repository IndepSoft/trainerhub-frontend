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
    <section className="px-5 py-8" aria-labelledby="progreso-titulo">
      <h2
        id="progreso-titulo"
        className="mb-4 border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
      >
        {t('studentProgress.title')}
      </h2>

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
