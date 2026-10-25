// A date and time field wired to Formik, on the shared FormField and Input. Uses the
// browser's own picker, which is keyboard and screen reader friendly. The value is
// "YYYY-MM-DDTHH:mm".
import { useField } from 'formik'
import { FormField } from '@/components/ui/form-field'
import { Input, type InputProps } from '@/components/ui/input'
import { useFieldError } from '@/components/form/useFieldError'
import type { FormFieldBaseProps } from '@/components/form/types'

type FormDateTimeProps = FormFieldBaseProps &
  Omit<InputProps, 'name' | 'id' | 'required' | 'value' | 'type'>

export function FormDateTime({ name, label, hint, required, ...inputProps }: FormDateTimeProps) {
  const [field] = useField<string>(name)
  const error = useFieldError(name)

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(control) => (
        <Input
          {...inputProps}
          {...field}
          type="datetime-local"
          value={field.value ?? ''}
          className="w-fit"
          {...control}
        />
      )}
    </FormField>
  )
}
