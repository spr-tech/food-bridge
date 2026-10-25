// FormCheckbox: the shared Checkbox has no error slot, so the adapter puts the error in
// the checkbox's description. It must still be read out with the checkbox.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form, Formik } from 'formik'
import { describe, expect, it, vi } from 'vitest'
import * as Yup from 'yup'
import { FormCheckbox } from '@/components/form/FormCheckbox'

const schema = Yup.object({
  confirm: Yup.boolean().oneOf([true], 'Confirm the food is safe to share'),
})

function renderField(onSubmit = vi.fn()) {
  render(
    <Formik initialValues={{ confirm: false }} validationSchema={schema} onSubmit={onSubmit}>
      <Form noValidate>
        <FormCheckbox name="confirm" label="The food is safe to share" hint="Required to publish." />
        <button type="submit">Check</button>
      </Form>
    </Formik>,
  )
  return screen.getByRole('checkbox', { name: 'The food is safe to share' })
}

describe('FormCheckbox', () => {
  it('describes the checkbox with its hint only, before a submit', () => {
    const checkbox = renderField()

    expect(checkbox).toHaveAccessibleDescription('Required to publish.')
  })

  it('adds the error to the description after a submit', async () => {
    const user = userEvent.setup()
    const checkbox = renderField()

    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(checkbox).toHaveAccessibleDescription(
      'Required to publish. Confirm the food is safe to share',
    )
  })

  it('submits true once ticked', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const checkbox = renderField(onSubmit)

    await user.click(checkbox)
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(onSubmit).toHaveBeenCalledWith({ confirm: true }, expect.anything())
  })
})
