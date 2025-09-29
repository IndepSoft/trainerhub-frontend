import { cn } from '@/shared/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import type { LucideIcon } from 'lucide-react';

interface SelectFieldProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  icon?: LucideIcon;
}

export default function SelectFieldCustom({
	placeholder,
	value,
	onChange,
	options,
	icon: Icon
}:SelectFieldProps) {
  return (
	<div className="relative w-full">
		{Icon && (
		<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
			<Icon className={cn('size-4 shrink-0')} />
		</div>
		)}
		<div className='w-full'>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className={`w-full ${Icon ? 'pl-9' : ''}`}>
					<SelectValue className='' placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent className=''>
					{options.map((option) => (
						<SelectItem key={option} value={option}>
							{option}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	</div>
  )
}
