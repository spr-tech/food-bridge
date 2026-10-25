// A date field wired to Formik, using the browser's own date picker (keyboard and screen
// reader friendly). The value is "YYYY-MM-DD".
import { FormInput, type FormInputProps } from '@/components/form/FormInput'

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

export function FormDate(props: Omit<FormInputProps, 'type' | 'icon'>) {
  return <FormInput {...props} type="date" icon={<CalendarIcon />} />
}
