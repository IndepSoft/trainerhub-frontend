import { MetricBlock } from '@/shared/components/MetricBlock'
import { PageHeader } from '@/shared/components/PageHeader'
import { GamificationHeader } from '../components/GamificationHeader'
import { MilestonePath } from '../components/MilestonePath'
import { AchievementSystem } from '../components/AchievementSystem'
import { JoinCrewPrompt } from '../components/JoinCrewPrompt'
import { useGamificationProfile } from '../hooks/useGamificationProfile'
import { useProgressOverview } from '../hooks/useProgressOverview'
import { useViewerContext } from '@/app/ViewerContext'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * El progreso de quien lo mira. Sólo composición.
 *
 * ES DE UNO MISMO Y DE NADIE MÁS. Tuvo un selector de alumno para que el
 * entrenador eligiera a quién mirar, y eso convertía la pantalla en un módulo
 * aparte al que había que ir y buscar a la persona. El progreso de un alumno es
 * un dato SUYO: pertenece a su tarjeta y a su ficha, que es donde el entrenador
 * ya está mirando cuando se lo pregunta.
 *
 * Quien no entrena aquí no llega: la navegación no le ofrece el destino
 * —`onlyIfTrainsHere`— y si escribe la dirección se encuentra la invitación a
 * unirse, que es lo que le corresponde.
 */
export default function Progress() {
  const { t } = useTranslation()
  const { active, loading } = useViewerContext()
  const student = active?.student ?? null

  const { profile, achievements, completedCount, levelCompletion, experienceToNextLevel } =
    useGamificationProfile(student?.id)
  const { overview } = useProgressOverview(achievements, completedCount)

  return (
    // Misma estructura de scroll que el resto de paginas: la cabecera queda
    // fija y solo desplaza <main>. Antes era un `space-y-6` suelto y la pagina
    // scrolleaba entera, cabecera incluida.
    <div className="flex flex-col flex-1 overflow-hidden bg-bone">
      {/* La cabecera de verdad de esta seccion es la racha y el nivel, que el
          brief exige visibles siempre; va `sticky` dentro del contenedor de
          desplazamiento, mas abajo. Esta solo nombra la pagina. */}
      <PageHeader className="pb-4">
        <PageHeader.Eyebrow>{t('progress.eyebrow')}</PageHeader.Eyebrow>
        <PageHeader.Title>{t('progress.title')}</PageHeader.Title>
      </PageHeader>

      {/* Contenedor de scroll de la pagina. Es un div y no un <main> a
          proposito: el landmark <main> ya lo pinta SidebarInset desde
          RootLayout, y anidar uno dentro de otro es HTML invalido -solo se
          admite uno por documento- ademas de confundir a los lectores de
          pantalla. */}
      <div className="flex-1 overflow-auto">
        {/*
          SIN EQUIPO SE PINTA TODO, A CERO.
          Es la decision de producto: el alumno navega, ve el registro entero
          -nivel, racha, sendero- vacio, y todo le empuja a unirse. Cortarle el
          paso con una pantalla unica seria mas simple y explicaria menos.
        */}
        {!loading && student === null && <JoinCrewPrompt />}

        <GamificationHeader
          streak={profile.streak}
          level={profile.level}
          levelCompletion={levelCompletion}
          experienceToNextLevel={experienceToNextLevel}
        />

        <MilestonePath milestones={profile.milestones} />

        {/* Contadores en el registro sobrio, con reglas de 1 px en vez de
            tarjetas. Los tres salen ahora de sesiones reales: antes eran
            tres cifras escritas a mano —12 logros, 5 desafios, 87 % de
            participacion— que no cambiaban nunca. */}
        <div className="grid grid-cols-1 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {overview.stats.map((stat) => (
            <MetricBlock key={stat.id} title={stat.label} indicator={stat.value} icon={stat.icon} />
          ))}
        </div>

        <div className="ps-4 pe-4 pb-4 pt-6 max-w-8xl mx-auto space-y-6">
          {/* Sin envoltura <Card>, por el mismo motivo que en Reportes: su
              contenido son a su vez tarjetas, que pagaban el relleno dos veces y
              caian a 277 px, bajo el minimo util de 280 de la regla 1.6. Un
              <h2> da la misma informacion sin ese nivel, y ademas es un
              encabezado de verdad para un lector de pantalla: CardTitle
              renderiza un <div>. */}
          <section className="space-y-4">
            {/*
              Sin pestanas. Quedaban tres -Logros, Desafios, Rachas- y las dos
              ultimas se han movido a Entrenamientos, porque son cosas que el
              entrenador CREA para luego asignarlas, no cosas que el estudiante
              consigue. Con una sola seccion, un control de navegacion de una
              pestana es cromo que no lleva a ningun sitio.
            */}
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
              {t('progress.achievements')}
            </h2>
            <AchievementSystem achievements={achievements} />
          </section>
        </div>
      </div>
    </div>
  )
}
