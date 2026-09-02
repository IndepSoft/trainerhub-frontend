import { SidebarProvider } from '@/shared/ui/sidebar'
import { ThemeProvider } from './ThemeProvider'

interface UIProvidersProps {
  children: React.ReactNode
}

export function UIProviders({ children }: UIProvidersProps) {
  return (
    <ThemeProvider>
      <SidebarProvider defaultOpen>{children}</SidebarProvider>
    </ThemeProvider>
  )
}
