// FormInput shows its error as text, linked to the input, once the field is touched.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form, Formik } from 'formik'
import { describe, expect, it } from 'vitest'
import * as Yup from 'yup'
import { FormInput } from '@/components/form/FormInput'

const schema = Yup.object({
  foodName: Yup.string().required('Enter the food name'),
})

function renderField() {
  render(
    <Formik initialValues={{ foodName: '' }} validationSchema={schema} onSubmit={() => {}}>
      <Form noValidate>
        <FormInput name="foodName" label="Food name" required />
      </Form>
    </Formik>,
  )
  return screen.getByLabelText(/Food name/)
}

describe('FormInput', () => {
  it('shows no error before the field is touched', () => {
    const input = renderField()

    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(screen.queryByText('Enter the food name')).not.toBeInTheDocument()
  })

  it('shows the error text and sets aria-invalid after leaving an empty required field', async () => {
    const user = userEvent.setup()
    const input = renderField()

    await user.click(input)
    await user.tab()

    expect(await screen.findByText('Enter the food name')).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(input).toHaveAccessibleDescription('Enter the food name')
  })
})
