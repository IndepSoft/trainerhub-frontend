import { cn } from '@/shared/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // `motion-safe`: con prefers-reduced-motion el bloque se queda quieto
        // en vez de latir. Sigue comunicando «aqui va algo» por su forma.
        'motion-safe:animate-pulse rounded-md bg-cobalt-tint-2',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
