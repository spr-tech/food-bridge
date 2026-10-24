// A dropdown wired to Formik, built on the shadcn (Radix) Select.
import { useField } from 'formik'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormField, type FormFieldBaseProps } from '@/components/form/FormField'
import type { Option } from '@/constants/listingOptions'

type FormSelectProps = FormFieldBaseProps & {
  options: Option[]
  placeholder?: string
  disabled?: boolean
}

export function FormSelect({ name, label, hint, required, options, placeholder, disabled }: FormSelectProps) {
  const [field, , helpers] = useField<string>(name)

  return (
    <FormField name={name} label={label} hint={hint} required={required}>
      {(control) => (
        <Select
          name={name}
          value={field.value ?? ''}
          disabled={disabled}
          onValueChange={(value) => void helpers.setValue(value)}
          // Radix Select has no blur, so closing it counts as leaving the field.
          // No validation here: it would run on the value from before the choice.
          onOpenChange={(open) => {
            if (!open) void helpers.setTouched(true, false)
          }}
        >
          <SelectTrigger {...control} className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  )
}
