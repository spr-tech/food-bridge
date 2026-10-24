// A date and time field wired to Formik. Uses the browser's own picker, which is
// keyboard and screen reader friendly. The value is "YYYY-MM-DDTHH:mm".
import type { ComponentProps } from 'react'
import { useField } from 'formik'
import { Input } from '@/components/ui/input'
import { FormField, type FormFieldBaseProps } from '@/components/form/FormField'

type FormDateTimeProps = FormFieldBaseProps &
  Omit<ComponentProps<typeof Input>, 'name' | 'id' | 'required' | 'value' | 'type'>

export function FormDateTime({ name, label, hint, required, ...inputProps }: FormDateTimeProps) {
  const [field] = useField<string>(name)

  return (
    <FormField name={name} label={label} hint={hint} required={required}>
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
