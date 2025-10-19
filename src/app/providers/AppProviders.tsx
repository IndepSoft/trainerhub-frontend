import { CoreProviders } from "./CoreProviders"
import { UIProviders } from "./UIProviders"

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <CoreProviders>
      <UIProviders>
        {children}
      </UIProviders>
    </CoreProviders>
  )
}