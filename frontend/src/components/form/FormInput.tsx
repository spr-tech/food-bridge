// A text-style input (text, email, password, number) wired to Formik, on the shared
// FormField and Input.
import { useField } from 'formik'
import { FormField } from '@/components/ui/form-field'
import { Input, type InputProps } from '@/components/ui/input'
import { useFieldError } from '@/components/form/useFieldError'
import type { FormFieldBaseProps } from '@/components/form/types'

type FormInputProps = FormFieldBaseProps & Omit<InputProps, 'name' | 'id' | 'required' | 'value'>

export function FormInput({ name, label, hint, required, ...inputProps }: FormInputProps) {
  const [field] = useField<string>(name)
  const error = useFieldError(name)

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(control) => <Input {...inputProps} {...field} value={field.value ?? ''} {...control} />}
    </FormField>
  )
}
