// A multi-line text field wired to Formik.
import type { ComponentProps } from 'react'
import { useField } from 'formik'
import { Textarea } from '@/components/ui/textarea'
import { FormField, type FormFieldBaseProps } from '@/components/form/FormField'

type FormTextareaProps = FormFieldBaseProps &
  Omit<ComponentProps<typeof Textarea>, 'name' | 'id' | 'required' | 'value'>

export function FormTextarea({ name, label, hint, required, ...textareaProps }: FormTextareaProps) {
  const [field] = useField<string>(name)

  return (
    <FormField name={name} label={label} hint={hint} required={required}>
      {(control) => (
        <Textarea {...textareaProps} {...field} value={field.value ?? ''} {...control} />
      )}
    </FormField>
  )
}
