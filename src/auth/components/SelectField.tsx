import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import type { LucideIcon } from 'lucide-react'

interface SelectFieldProps {
  id: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  options: string[]
  icon?: LucideIcon
}

export function SelectField({
  id,
  placeholder,
  value,
  onChange,
  options,
  icon: Icon,
}: SelectFieldProps) {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
          <Icon className="size-4 shrink-0" />
        </div>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className={`w-full ${Icon ? 'pl-9' : ''}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
