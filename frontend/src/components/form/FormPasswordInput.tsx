// A password field wired to Formik, with a Show password button at the end of the field.
// The button's name stays "Show password"; aria-pressed says whether it is showing.
import { useState, type ReactNode } from 'react'
import { useField } from 'formik'
import { FormField } from '@/components/ui/form-field'
import { Input, type InputProps } from '@/components/ui/input'
import { useFieldError } from '@/components/form/useFieldError'
import type { FormFieldBaseProps } from '@/components/form/types'

type FormPasswordInputProps = FormFieldBaseProps &
  Omit<InputProps, 'name' | 'id' | 'required' | 'value' | 'type'> & {
    icon?: ReactNode
  }

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function FormPasswordInput({ name, label, hint, required, icon, ...inputProps }: FormPasswordInputProps) {
  const [field] = useField<string>(name)
  const error = useFieldError(name)
  const [shown, setShown] = useState(false)

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
            type={shown ? 'text' : 'password'}
            value={field.value ?? ''}
            data-field={name}
            className={icon ? 'pr-11 pl-10' : 'pr-11'}
            {...control}
          />
          <button
            type="button"
            aria-label="Show password"
            aria-pressed={shown}
            onClick={() => setShown((current) => !current)}
            className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-text-muted hover:text-text"
          >
            <EyeIcon />
          </button>
        </div>
      )}
    </FormField>
  )
}
