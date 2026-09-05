import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/shared/lib/utils'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  )
}

/**
 * Lista de pestañas: raíl con subrayado, no control segmentado.
 *
 * ANTES ERA EL RELLENO GRIS por defecto de shadcn —`bg-muted`, esquinas
 * redondeadas, la activa en blanco con sombra—. Se cambia por dos motivos, y el
 * segundo pesa más que el estético.
 *
 * El de forma: ese recuadro es el aspecto que trae la librería de fábrica, sin
 * decisión detrás.
 *
 * Y el de función: un contenedor con fondo obliga a que TODAS las pestañas
 * quepan dentro, así que con cinco en un móvil de 375 px se aplastaban a 57 px
 * cada una. Sin recuadro, la fila puede DESBORDAR y desplazarse en horizontal,
 * que es como se resuelve esto en móvil. Por eso tampoco lleva `grid`: una
 * rejilla reparte el ancho a la fuerza; una fila flexible deja que cada pestaña
 * ocupe lo que su texto necesita.
 *
 * La barra de desplazamiento se oculta pero el gesto sigue funcionando: el
 * subrayado y el corte de la última pestaña ya indican que hay más a la derecha.
 */
function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'relative flex w-full items-stretch gap-1 overflow-x-auto border-b border-border',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
      {...props}
    />
  )
}

/**
 * Pestaña.
 *
 * `min-h-11` son los 44 px de objetivo táctil en móvil, con `md:min-h-10` para
 * recuperar una altura compacta en escritorio, donde se apunta con ratón. Antes
 * medían 29 px de alto.
 *
 * `shrink-0` es lo que permite el desbordamiento: sin él, flexbox comprimiría
 * las pestañas hasta que cupieran y no habría nada que desplazar.
 */
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'relative inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5',
        'whitespace-nowrap rounded-t-md px-3 text-sm font-medium md:min-h-10',
        'text-muted-foreground transition-colors hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:text-foreground',
        /*
         * El indicador es un BORDE INFERIOR, no un `::after`.
         *
         * Con `::after` no funcionaba: la clase
         * `data-[state=active]:after:bg-primary` llegaba al elemento pero
         * Tailwind no generaba ninguna regla para ella —comprobado recorriendo
         * las hojas de estilo—, asi que el subrayado de la pestaña activa salia
         * transparente. Apilar un variante `data-[...]` sobre un pseudoelemento
         * es justo donde falla.
         *
         * El `-mb-px` lo sube un pixel para que se apoye sobre el borde de la
         * lista en vez de dibujarse debajo y verse doble.
         */
        '-mb-px border-b-2 border-transparent transition-colors',
        'data-[state=active]:border-primary',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
