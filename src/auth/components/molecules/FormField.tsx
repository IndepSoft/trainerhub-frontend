

import React from 'react'
import { Label } from '@/shared/ui/label';


interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

export default function FormField({
	required = false,
	children,
	label
}:FormFieldProps) {
  return (
	<div className="space-y-2">
		<Label htmlFor={label.toLowerCase().replace(' ', '-')} className="text-sm font-medium">
		{label}
		{required && <span className="text-destructive ml-1">*</span>}
		</Label>
		{children}
	</div>
  )
}
