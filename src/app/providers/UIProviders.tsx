import { SidebarProvider } from '@/shared/ui/sidebar'
import { ThemeProvider } from './ThemeProvider'
import { LanguageProvider } from './LanguageProvider'

interface UIProvidersProps {
  children: React.ReactNode
}

/*
 * El idioma va POR ENCIMA del tema y de la barra lateral, y no es indiferente:
 * cualquier cosa que se pinte dentro puede necesitar traducir, y un proveedor no
 * ve el contexto de sus hermanos.
 */
export function UIProviders({ children }: UIProvidersProps) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <SidebarProvider defaultOpen>{children}</SidebarProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}
