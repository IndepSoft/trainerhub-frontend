interface CoreProvidersProps {
  children: React.ReactNode
}

export function CoreProviders({ children }: CoreProvidersProps) {
  return (
    <>
      {/* Aquí irán QueryClientProvider, AuthProvider, etc. */}
      {children}
    </>
  )
}