
import { useField } from 'formik'
import { FormField } from '@/components/ui/form-field'
import {
  Textarea,
  type TextareaProps,
} from '@/components/ui/textarea'
import { useFieldError } from '@/components/form/useFieldError'
import type { FormFieldBaseProps } from '@/components/form/types'

type FormTextareaProps = FormFieldBaseProps &
  Omit<
    TextareaProps,
    'name' | 'id' | 'required' | 'value'
  >

export function FormTextarea({
  name,
  label,
  hint,
  required,
  ...textareaProps
}: FormTextareaProps) {
  const [field] = useField<string>(name)
  const error = useFieldError(name)

  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      required={required}
    >
      {(control) => (
        <Textarea
          {...textareaProps}
          {...field}
          value={field.value ?? ''}
          data-field={name}
          required={required}
          {...control}
        />
      )}
    </FormField>
  )
}
