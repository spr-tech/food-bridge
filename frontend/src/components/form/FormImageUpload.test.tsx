// FormImageUpload: picking a file stores it in Formik and shows a preview; the error
// is linked to the picker.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form, Formik } from 'formik'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as Yup from 'yup'
import { FormImageUpload } from '@/components/form/FormImageUpload'

const schema = Yup.object({
  photo: Yup.mixed().required('Choose a photo'),
})

function renderField(onSubmit = vi.fn()) {
  render(
    <Formik initialValues={{ photo: null }} validationSchema={schema} onSubmit={onSubmit}>
      <Form noValidate>
        <FormImageUpload name="photo" label="Photo" required />
        <button type="submit">Check</button>
      </Form>
    </Formik>,
  )
  return screen.getByLabelText(/Photo/)
}

describe('FormImageUpload', () => {
  // jsdom has no object URLs.
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('links the error to the picker after a submit', async () => {
    const user = userEvent.setup()
    const picker = renderField()

    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(picker).toHaveAttribute('aria-invalid', 'true')
    // The error, then the drop zone's hint.
    expect(picker).toHaveAccessibleDescription(
      'Choose a photo JPG or PNG, up to 5 MB. A placeholder is shown if you skip this.',
    )
  })

  it('stores the chosen file and shows a preview', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const picker = renderField(onSubmit)
    const file = new File(['photo'], 'bread.png', { type: 'image/png' })

    await user.upload(picker, file)
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(screen.getByRole('img', { name: 'Preview of the chosen photo' })).toHaveAttribute('src', 'blob:preview')
    expect(onSubmit).toHaveBeenCalledWith({ photo: file }, expect.anything())
  })
})
