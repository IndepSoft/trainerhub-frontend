import { Input } from '@/shared/ui/input'
import type { LucideIcon } from 'lucide-react'

interface FormInputProps {
  id: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  icon?: LucideIcon
  required?: boolean
}

export function FormInput({
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  required = false,
}: FormInputProps) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Icon className="size-4 shrink-0" />
        </div>
      )}
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={Icon ? 'pl-9' : ''}
        required={required}
      />
    </div>
  )
}
