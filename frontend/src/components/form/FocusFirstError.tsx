// Put inside a Formik form: after a submit that finds errors, moves focus to the first
// invalid field (in the order given), so keyboard and screen reader users land on it.
// Fields are found by the data-field attribute every adapter in this folder sets.
import { useEffect, useRef } from 'react'
import { getIn, useFormikContext } from 'formik'
import { focusField } from '@/components/form/focusField'

export function FocusFirstError({ order }: { order: string[] }) {
  const { submitCount, isSubmitting, errors } = useFormikContext()
  const handled = useRef(0)

  useEffect(() => {
    // Once per submit attempt, after validation has finished.
    if (isSubmitting || submitCount === handled.current) return
    handled.current = submitCount
    const first = order.find((name) => getIn(errors, name))
    if (first) focusField(first)
  }, [submitCount, isSubmitting, errors, order])

  return null
}
