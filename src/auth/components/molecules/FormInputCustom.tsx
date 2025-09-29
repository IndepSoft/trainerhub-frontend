
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';
import type { LucideIcon } from 'lucide-react';

interface FormInputCustomProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  required?: boolean;
}


export default function FormInputCustom({
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  required = false
}: FormInputCustomProps) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Icon className={cn('size-4 shrink-0')} />
        </div>
      )}
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={Icon ? 'pl-9' : ''}
        required={required}
      />
    </div>
  )
}
