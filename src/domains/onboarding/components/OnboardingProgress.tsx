interface OnboardingProgressProps {
  total: number
  currentIndex: number
  onSelect: (index: number) => void
}

/**
 * Indicador de paso.
 *
 * Son barras y no puntos: una barra muestra cuánto queda, un punto sólo dice
 * dónde estás. En cuatro pasos la diferencia importa poco; en el hábito de
 * lectura, mucho.
 *
 * Cada barra es accionable, no decorativa: quien quiera volver a un paso
 * concreto no tiene por qué deslizar hacia atrás varias veces. El área táctil
 * la da un relleno vertical generoso, aunque la barra sea fina.
 */
export function OnboardingProgress({ total, currentIndex, onSelect }: OnboardingProgressProps) {
  return (
    <ol className="flex gap-2">
      {Array.from({ length: total }, (_, index) => (
        <li key={index} className="flex-1">
          <button
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Ir al paso ${index + 1} de ${total}`}
            aria-current={index === currentIndex ? 'step' : undefined}
            className="flex h-11 w-full items-center"
          >
            <span
              className={
                index <= currentIndex
                  ? 'h-1 w-full rounded-full bg-ember transition-colors'
                  : 'h-1 w-full rounded-full bg-white/20 transition-colors'
              }
            />
          </button>
        </li>
      ))}
    </ol>
  )
}
