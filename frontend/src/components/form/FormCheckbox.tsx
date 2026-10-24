// A single checkbox wired to Formik. The value is true or false.
import { useField } from 'formik'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField, type FormFieldBaseProps } from '@/components/form/FormField'

type FormCheckboxProps = FormFieldBaseProps & {
  disabled?: boolean
}

export function FormCheckbox({ name, label, hint, required, disabled }: FormCheckboxProps) {
  const [field, , helpers] = useField<boolean>(name)

  return (
    <FormField name={name} label={label} hint={hint} required={required} inline>
      {(control) => (
        <Checkbox
          name={name}
          checked={field.value === true}
          disabled={disabled}
          onCheckedChange={(checked) => void helpers.setValue(checked === true)}
          onBlur={() => void helpers.setTouched(true)}
          {...control}
        />
      )}
    </FormField>
  )
}
