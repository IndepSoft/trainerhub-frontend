import { SidebarProvider } from '@/shared/ui/sidebar'

interface UIProvidersProps {
  children: React.ReactNode
}

export function UIProviders({ children }: UIProvidersProps) {
  return (
    <SidebarProvider defaultOpen>
      {/* Aquí irán ThemeProvider, ToastProvider, etc. */}
      {children}
    </SidebarProvider>
  )
}