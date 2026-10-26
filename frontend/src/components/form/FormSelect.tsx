// A dropdown wired to Formik, on the shared FormField and Select.
import { useField } from 'formik'
import { FormField } from '@/components/ui/form-field'
import { Select } from '@/components/ui/select'
import { useFieldError } from '@/components/form/useFieldError'
import type { FormFieldBaseProps } from '@/components/form/types'
import type { Option } from '@/constants/listingOptions'

type FormSelectProps = FormFieldBaseProps & {
  options: Option[]
  placeholder?: string
  disabled?: boolean
}

export function FormSelect({ name, label, hint, required, options, placeholder, disabled }: FormSelectProps) {
  const [field, , helpers] = useField<string>(name)
  const error = useFieldError(name)

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(control) => (
        <Select
          {...control}
          data-field={name}
          name={name}
          options={options}
          placeholder={placeholder}
          value={field.value || undefined}
          disabled={disabled}
          // The shared Select has no blur or close event, so choosing an option is what
          // marks it touched. An untouched empty Select still shows its error on submit.
          onValueChange={(value) => {
            void helpers.setValue(value ?? '')
            void helpers.setTouched(true, false)
          }}
        />
      )}
    </FormField>
  )
}
