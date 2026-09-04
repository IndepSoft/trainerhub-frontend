import type { LucideIcon } from 'lucide-react'

interface ComingSoonProps {
  icon: LucideIcon
  title: string
  description: string
}

/**
 * Sección todavía no construida.
 *
 * Existe para que una pestaña vacía diga la verdad. La alternativa habitual
 * —dejarla en blanco, o mostrar datos de ejemplo— hace que el usuario crea que
 * algo falla o, peor, que interactúe con datos que no son suyos.
 *
 * La animación es deliberadamente sobria y va toda bajo `motion-safe`: con
 * `prefers-reduced-motion` queda un bloque quieto que sigue comunicando lo
 * mismo. Los tres puntos no representan progreso ni porcentaje: sólo dicen «en
 * marcha», que es lo único que honestamente se puede afirmar.
 */
export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <span className="relative mb-6 flex size-16 items-center justify-center">
        {/* El pulso va en un anillo detras y no sobre el icono: `animate-ping`
            sobre el propio elemento lo desvanece, y el icono acabaria siendo lo
            mas tenue del bloque. Mismo motivo que en el hito activo del
            sendero. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-ember/15 motion-safe:animate-ping"
        />
        <span className="relative flex size-16 items-center justify-center rounded-full border-2 border-ember/40 bg-ember/10">
          <Icon className="size-7 text-ember" strokeWidth={1.75} />
        </span>
      </span>

      <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
        {title}
      </h3>

      <p className="mt-2 max-w-xs text-sm text-ink/50">{description}</p>

      <span aria-hidden="true" className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="size-1.5 rounded-full bg-cobalt/40 motion-safe:animate-pulse"
            // Escalonados: tres puntos latiendo a la vez son un parpadeo; en
            // secuencia se leen como algo en marcha.
            style={{ animationDelay: `${index * 220}ms` }}
          />
        ))}
      </span>
    </div>
  )
}
