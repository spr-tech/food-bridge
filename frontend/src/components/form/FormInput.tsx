// A text-style input (text, email, password, number) wired to Formik, on the shared
// FormField and Input. An optional decorative icon sits inside the start of the field.
import type { ReactNode } from 'react'
import { useField } from 'formik'
import { FormField } from '@/components/ui/form-field'
import { Input, type InputProps } from '@/components/ui/input'
import { useFieldError } from '@/components/form/useFieldError'
import type { FormFieldBaseProps } from '@/components/form/types'
import { cn } from '@/lib/cn'

type FormInputProps = FormFieldBaseProps &
  Omit<InputProps, 'name' | 'id' | 'required' | 'value'> & {
    icon?: ReactNode
  }

export function FormInput({ name, label, hint, required, icon, className, ...inputProps }: FormInputProps) {
  const [field] = useField<string>(name)
  const error = useFieldError(name)

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(control) => (
        <div className="relative">
          {icon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
            >
              {icon}
            </span>
          )}
          <Input
            {...inputProps}
            {...field}
            value={field.value ?? ''}
            data-field={name}
            className={cn(icon && 'pl-10', className)}
            {...control}
          />
        </div>
      )}
    </FormField>
  )
}
