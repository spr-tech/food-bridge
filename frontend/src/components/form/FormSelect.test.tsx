// FormSelect: the error waits for a submit, is linked to the control, and clears once
// an option is chosen; the chosen value reaches Formik.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form, Formik } from 'formik'
import { describe, expect, it, vi } from 'vitest'
import * as Yup from 'yup'
import { FormSelect } from '@/components/form/FormSelect'

const OPTIONS = [
  { value: 'bakery', label: 'Bakery' },
  { value: 'produce', label: 'Produce' },
]

const schema = Yup.object({
  category: Yup.string().required('Choose a category'),
})

function renderField(onSubmit = vi.fn()) {
  render(
    <Formik initialValues={{ category: '' }} validationSchema={schema} onSubmit={onSubmit}>
      <Form noValidate>
        <FormSelect name="category" label="Category" options={OPTIONS} required />
        <button type="submit">Check</button>
      </Form>
    </Formik>,
  )
  return screen.getByRole('combobox', { name: /Category/ })
}

describe('FormSelect', () => {
  it('shows no error before a submit', () => {
    const trigger = renderField()

    expect(trigger).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByText('Choose a category')).not.toBeInTheDocument()
  })

  it('shows the error after a submit, linked to the control', async () => {
    const user = userEvent.setup()
    const trigger = renderField()

    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAttribute('aria-required', 'true')
    expect(trigger).toHaveAccessibleDescription('Choose a category')
  })

  it('submits the chosen option and clears the error', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const trigger = renderField(onSubmit)

    await user.click(screen.getByRole('button', { name: 'Check' }))
    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: 'Produce' }))
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(onSubmit).toHaveBeenCalledWith({ category: 'produce' }, expect.anything())
    expect(screen.queryByText('Choose a category')).not.toBeInTheDocument()
  })
})
