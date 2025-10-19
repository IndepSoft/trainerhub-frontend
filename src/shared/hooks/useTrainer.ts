import { useEffect, useState } from "react"
import { TrainerRepository } from "../infrastructure/trainerRepository"
import type { Trainer } from "../types/trainer"

export const useTrainer = (profileId?: string) => {
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!profileId) {
      setLoading(false)
      return
    }

    const repository = new TrainerRepository()
    
    repository.findByProfileId(profileId)
      .then(setTrainer)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [profileId])

  return { trainer, loading, error }
}