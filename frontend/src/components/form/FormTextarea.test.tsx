// FormTextarea: the shared character count follows Formik's value, and errors are
// linked to the field.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form, Formik } from 'formik'
import { describe, expect, it } from 'vitest'
import * as Yup from 'yup'
import { FormTextarea } from '@/components/form/FormTextarea'

const schema = Yup.object({
  description: Yup.string().min(10, 'Use 10 characters or more'),
})

function renderField() {
  render(
    <Formik initialValues={{ description: '' }} validationSchema={schema} onSubmit={() => {}}>
      <Form noValidate>
        <FormTextarea name="description" label="Description" maxLength={500} showCount />
      </Form>
    </Formik>,
  )
  return screen.getByRole('textbox', { name: 'Description' })
}

describe('FormTextarea', () => {
  it('counts the characters typed', async () => {
    const user = userEvent.setup()
    const textarea = renderField()

    await user.type(textarea, 'Bread')

    expect(textarea).toHaveValue('Bread')
    expect(textarea).toHaveAccessibleDescription('5 of 500 characters used')
  })

  it('links its error once the field is left', async () => {
    const user = userEvent.setup()
    const textarea = renderField()

    await user.type(textarea, 'Bread')
    await user.tab()

    expect(textarea).toHaveAttribute('aria-invalid', 'true')
    expect(textarea).toHaveAccessibleDescription(/Use 10 characters or more/)
  })
})
