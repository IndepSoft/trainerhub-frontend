import { LoadingFallback } from '@/shared/components/LoadingFallback'
import { Suspense, type JSX } from 'react'

export function withSuspense(element: JSX.Element) {
  return <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
}