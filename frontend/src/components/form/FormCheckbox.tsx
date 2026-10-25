// A single checkbox wired to Formik, on the shared Checkbox. The value is true or false.
// The shared Checkbox draws its own label and links only its description, with no
// error or aria-invalid of its own, so the error goes into the description: that way
// it is still read out with the checkbox. Changing it marks it touched (no blur event).
import { useField } from 'formik'
import { Checkbox } from '@/components/ui/checkbox'
import { useFieldError } from '@/components/form/useFieldError'
import type { FormFieldBaseProps } from '@/components/form/types'

type FormCheckboxProps = FormFieldBaseProps & {
  disabled?: boolean
}

export function FormCheckbox({ name, label, hint, required, disabled }: FormCheckboxProps) {
  const [field, , helpers] = useField<boolean>(name)
  const error = useFieldError(name)
  const description = [hint, error].filter(Boolean).join(' ') || undefined

  return (
    <Checkbox
      name={name}
      label={label}
      description={description}
      required={required}
      checked={field.value === true}
      disabled={disabled}
      onCheckedChange={(checked) => {
        void helpers.setValue(checked)
        void helpers.setTouched(true, false)
      }}
    />
  )
}
