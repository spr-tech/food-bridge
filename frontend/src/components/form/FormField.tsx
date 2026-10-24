// Shared layout for every Formik input: label, required marker, hint and error,
// plus the ids and ARIA attributes that tie them to the control.
import { useId, type ReactNode } from 'react'
import { useField, useFormikContext } from 'formik'
import { Label } from '@/components/ui/label'

export type FieldControlProps = {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': boolean
  'aria-required': boolean | undefined
}

export type FormFieldBaseProps = {
  name: string
  label: string
  hint?: string
  required?: boolean
}

type FormFieldProps = FormFieldBaseProps & {
  // Checkboxes put the label beside the control instead of above it.
  inline?: boolean
  children: (control: FieldControlProps) => ReactNode
}

export function FormField({ name, label, hint, required, inline, children }: FormFieldProps) {
  const [, meta] = useField(name)
  const { submitCount } = useFormikContext()
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  // Errors wait until the user leaves the field or tries to submit.
  const showError = Boolean(meta.error) && (meta.touched || submitCount > 0)
  const describedBy = [hint && hintId, showError && errorId].filter(Boolean).join(' ')

  const control: FieldControlProps = {
    id,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': showError,
    'aria-required': required || undefined,
  }

  const labelElement = (
    <Label htmlFor={id} className="text-text">
      {label}
      {required && (
        <span aria-hidden="true" className="text-danger">
          *
        </span>
      )}
    </Label>
  )

  return (
    <div className="flex flex-col gap-1.5">
      {inline ? (
        <div className="flex items-center gap-2">
          {children(control)}
          {labelElement}
        </div>
      ) : (
        labelElement
      )}
      {hint && (
        <p id={hintId} className="text-sm text-text-muted">
          {hint}
        </p>
      )}
      {!inline && children(control)}
      {showError && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {meta.error}
        </p>
      )}
    </div>
  )
}
