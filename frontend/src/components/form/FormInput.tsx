// A text-style input (text, email, password, number) wired to Formik.
import type { ComponentProps } from 'react'
import { useField } from 'formik'
import { Input } from '@/components/ui/input'
import { FormField, type FormFieldBaseProps } from '@/components/form/FormField'

type FormInputProps = FormFieldBaseProps &
  Omit<ComponentProps<typeof Input>, 'name' | 'id' | 'required' | 'value'>

export function FormInput({ name, label, hint, required, ...inputProps }: FormInputProps) {
  const [field] = useField<string>(name)

  return (
    <FormField name={name} label={label} hint={hint} required={required}>
      {(control) => <Input {...inputProps} {...field} value={field.value ?? ''} {...control} />}
    </FormField>
  )
}
