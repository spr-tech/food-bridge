// A time field wired to Formik, using the browser's own time picker. The value is "HH:mm".
import { FormInput, type FormInputProps } from '@/components/form/FormInput'

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function FormTime(props: Omit<FormInputProps, 'type' | 'icon'>) {
  return <FormInput {...props} type="time" icon={<ClockIcon />} />
}
