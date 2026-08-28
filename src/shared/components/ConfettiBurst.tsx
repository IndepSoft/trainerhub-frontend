import { useMemo } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'

interface ConfettiBurstProps {
  /** Número de partículas. Por encima de unas 40 el coste no compensa. */
  particleCount?: number
}

interface Particle {
  id: number
  offsetX: string
  offsetY: string
  rotation: string
  duration: string
  delay: string
  color: string
  left: string
  size: number
}

/**
 * Sólo colores del sistema: un confeti multicolor genérico rompería la paleta.
 *
 * Se descartó Cobalt: la celebración va sobre fondo Ink, que es azul muy oscuro,
 * y las partículas azules desaparecían. Se comprobó en captura. Quedan los dos
 * naranjas más el blanco, que contrastan sobre Ink.
 */
const PARTICLE_COLORS = [
  'hsl(var(--ember))',
  'hsl(var(--ember-deep))',
  'hsl(var(--cobalt-lift))',
  '#FFFFFF',
]

/**
 * Estallido de confeti para una micro-celebración.
 *
 * Sin librería: son partículas con una trayectoria propia inyectada por
 * variables CSS y un único fotograma clave. Añadir una dependencia de ~15 kB
 * para esto no se justifica en una aplicación que quiere funcionar sin conexión.
 *
 * Con `prefers-reduced-motion` NO se renderiza nada. La celebración no se
 * ralentiza ni se atenúa: se omite. Quien pide menos movimiento no quiere
 * confeti lento, quiere que no haya confeti; el logro se comunica igual por la
 * tipografía y el color.
 *
 * `aria-hidden`: es decoración pura, y anunciar treinta partículas a un lector
 * de pantalla sería ruido.
 */
export function ConfettiBurst({ particleCount = 32 }: ConfettiBurstProps) {
  const prefersReducedMotion = useReducedMotion()

  // Las trayectorias se calculan una sola vez: recalcularlas en cada render
  // reiniciaria la animacion a mitad de vuelo.
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: particleCount }, (_, index) => {
      const angle = (index / particleCount) * Math.PI * 2
      const distance = 120 + Math.random() * 180
      return {
        id: index,
        offsetX: `${Math.cos(angle) * distance}px`,
        offsetY: `${Math.sin(angle) * distance + 220}px`,
        rotation: `${Math.round((Math.random() - 0.5) * 720)}deg`,
        duration: `${1.1 + Math.random() * 0.9}s`,
        delay: `${Math.random() * 0.25}s`,
        color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
        left: `${20 + Math.random() * 60}%`,
        size: 6 + Math.round(Math.random() * 6),
      }
    })
  }, [particleCount])

  if (prefersReducedMotion) return null

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute top-1/3 animate-confetti-burst"
          style={{
            left: particle.left,
            width: particle.size,
            height: particle.size * 0.4,
            backgroundColor: particle.color,
            animationDelay: particle.delay,
            '--confetti-x': particle.offsetX,
            '--confetti-y': particle.offsetY,
            '--confetti-rotation': particle.rotation,
            '--confetti-duration': particle.duration,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
