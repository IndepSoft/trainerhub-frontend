"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from '@/shared/lib/utils'

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          /*
            EN MOVIL ES UNA HOJA QUE SUBE, y en escritorio el dialogo de
            siempre. Lo decide la propuesta de vistas —«en movil TODO dialogo
            es esto»— y se hace aqui, una vez, en vez de en los trece que hay:
            un dialogo nuevo nace siendo hoja sin que nadie se acuerde.

            Pegada abajo, a todo el ancho y con las esquinas de arriba
            redondeadas, porque es donde llega el pulgar. Como mucho el 90 %
            del alto, y lo que no quepa se desplaza por dentro.
          */
          "bg-background fixed inset-x-0 bottom-0 top-auto z-50 grid max-h-[90dvh] w-full gap-4 overflow-y-auto rounded-t-2xl border border-b-0 p-5 pt-2 shadow-[0_-8px_32px_rgba(10,18,36,0.18)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=closed]:duration-200 data-[state=open]:duration-300",
          /*
            Desde `md`, el dialogo centrado. El centrado NO usa transform a
            proposito: `zoom-in-95` reescribe la propiedad `transform` entera y
            se llevaba por delante las traslaciones, asi que el dialogo quedaba
            descentrado —a 375 px empujaba 178 px fuera de la pantalla, con su
            contenido inalcanzable—. `inset-0` mas `m-auto` y `h-fit` centran
            en los dos ejes sin tocarlo.

            Las animaciones de la hoja se anulan uno por uno: sin el
            `slide-*-0`, el dialogo de escritorio entraria deslizando desde
            abajo.
          */
          "md:inset-0 md:m-auto md:h-fit md:max-h-[calc(100dvh-2rem)] md:max-w-lg md:rounded-lg md:border-b md:p-6 md:shadow-lg md:duration-200 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95 md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=open]:slide-in-from-bottom-0",
          className
        )}
        {...props}
      >
        {/*
          El asa. No se arrastra —cerrar es el aspa, «Cancelar» o tocar
          fuera—: es la senal de que eso es una hoja y de por donde se va, que
          es lo que la gente espera al ver una lamina pegada al borde de abajo.
        */}
        <div
          aria-hidden="true"
          /* Margen propio: la mitad de los dialogos anula el relleno de la
             hoja con `p-0` y pone el suyo dentro. */
          className="mx-auto mt-3 h-1 w-9 shrink-0 rounded-full bg-cobalt-tint-3 md:hidden"
        />

        {children}
        {showCloseButton && (
          /*
            Se toca shadcn a proposito, y por la regla 1.6.
            El aspa venia sin caja propia: era el icono de 16 px y nada mas, y
            medido a 375 px daba un objetivo tactil de 16 x 16 -muy por debajo
            de los 44 exigidos, y por debajo incluso del minimo de 24 de WCAG
            2.2 AA-. Es el boton de cerrar de TODOS los dialogos de la
            aplicacion, asi que el fallo se repetia en cada uno.
            El icono sigue midiendo 16: lo que crece es la zona pulsable.
          */
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Cerrar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        /*
          En la hoja, apilados y a todo el ancho, con el primario ARRIBA: es el
          que se pulsa, y abajo del todo queda el que no. `flex-col-reverse`
          es lo que lo consigue sin tocar el orden del DOM, que sigue siendo el
          de lectura —primero cancelar, despues confirmar—. Desde `md`, en fila
          y a la derecha, como siempre.
        */
        "flex flex-col-reverse gap-2 md:flex-row md:justify-end",
        /*
          Y PEGADO ABAJO mientras el cuerpo se desplaza: en una hoja de 90 px
          de alto maximo, un formulario largo —asignar un plan, con su
          calendario— dejaba el boton fuera de la pantalla, y la hoja existe
          precisamente para tenerlo donde llega el pulgar. En escritorio, donde
          el dialogo es una caja centrada, vuelve a su sitio.
        */
        "sticky bottom-0 z-10 bg-background md:static md:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}