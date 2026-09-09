import { useState } from 'react'
import { Check, Link2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { buildJoinUrl } from '../libs/joinLink'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface CopyInviteButtonProps {
  joinToken: string
}

/**
 * Copia el enlace de entrada, para mandárselo a alguien concreto.
 *
 * Va junto a cada alumno SIN CUENTA. El entrenador le hizo la ficha y la
 * persona no tiene cómo saberlo: el QR está en el equipo y ella no ha entrado
 * nunca. Con el enlace en la mano se lo manda por donde ya hablan, y el alta
 * la enlaza a su ficha por el correo. Sin esto, «sin cuenta» era una etiqueta
 * que no llevaba a nada.
 */
export function CopyInviteButton({ joinToken }: CopyInviteButtonProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildJoinUrl(joinToken))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="shrink-0 gap-1.5 text-xs"
      onClick={() => void handleCopy()}
    >
      {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
      {copied ? t('crew.linkCopied') : t('crew.copyInvite')}
    </Button>
  )
}
