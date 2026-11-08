// The error to show for a Formik field, or undefined. Errors wait until the user
// leaves the field or tries to submit, so nobody is told off while still typing.
import { useField, useFormikContext } from 'formik'

export function useFieldError(name: string): string | undefined {
  const [, meta] = useField(name)
  const { submitCount } = useFormikContext()

  const show = Boolean(meta.error) && (meta.touched || submitCount > 0)
  return show ? meta.error : undefined
}
