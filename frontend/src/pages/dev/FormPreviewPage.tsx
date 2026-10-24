// /dev/forms, development builds only: every reusable form input in its normal,
// error and disabled states, for checking layout, focus and screen reader output.
import type { ReactNode } from 'react'
import { Form, Formik, type FormikErrors, type FormikTouched } from 'formik'
import { toast } from 'sonner'
import * as Yup from 'yup'
import { PageHeader } from '@/components/common/PageHeader'
import {
  FormCheckbox,
  FormDateTime,
  FormImageUpload,
  FormInput,
  FormSelect,
  FormTextarea,
} from '@/components/form'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/constants/listingOptions'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

type PreviewValues = {
  foodName: string
  description: string
  category: string
  deadline: string
  photo: File | null
  confirm: boolean
}

const EMPTY: PreviewValues = {
  foodName: '',
  description: '',
  category: '',
  deadline: '',
  photo: null,
  confirm: false,
}

const FILLED: PreviewValues = {
  foodName: 'Wholewheat bread loaves',
  description: 'Baked this morning, bagged in tens.',
  category: 'bakery',
  deadline: '2026-10-26T19:00',
  photo: null,
  confirm: true,
}

// Spec S2 wording where the spec has it; the photo and confirm messages are samples.
const SAMPLE_ERRORS: FormikErrors<PreviewValues> = {
  foodName: 'Enter the food name',
  description: 'Use 500 characters or fewer',
  category: 'Choose a category',
  deadline: 'The deadline must be later than now',
  photo: 'Choose a JPG or PNG file of 5 MB or less',
  confirm: 'Confirm the food is safe to share',
}

const ALL_TOUCHED: FormikTouched<PreviewValues> = {
  foodName: true,
  description: true,
  category: true,
  deadline: true,
  photo: true,
  confirm: true,
}

const schema = Yup.object({
  foodName: Yup.string().trim().required('Enter the food name'),
  category: Yup.string().required('Choose a category'),
  deadline: Yup.string().required('The deadline must be later than now'),
  confirm: Yup.boolean().oneOf([true], 'Confirm the food is safe to share'),
})

function renderFields(disabled = false): ReactNode {
  return (
    <>
      <FormInput name="foodName" label="Food name" required disabled={disabled} />
      <FormTextarea
        name="description"
        label="Description"
        hint="Up to 500 characters."
        disabled={disabled}
      />
      <FormSelect
        name="category"
        label="Category"
        placeholder="Choose a category"
        options={CATEGORIES}
        required
        disabled={disabled}
      />
      <FormDateTime name="deadline" label="Collection deadline" required disabled={disabled} />
      <FormImageUpload name="photo" label="Photo" hint="JPG or PNG, up to 5 MB." disabled={disabled} />
      <FormCheckbox name="confirm" label="The food is safe to share" required disabled={disabled} />
    </>
  )
}

const SECTION = 'flex flex-col gap-5 rounded-md border bg-surface p-6'

export function FormPreviewPage() {
  useDocumentTitle('Form preview')

  return (
    <>
      <PageHeader title="Form preview" description="Development only. Not part of the app." />
      <div className="grid gap-8 lg:grid-cols-3">
        <Formik initialValues={EMPTY} validationSchema={schema} onSubmit={() => void toast.success('All fields are valid')}>
          <Form noValidate className={SECTION}>
            <h2 className="text-xl">Normal</h2>
            {renderFields()}
            <Button type="submit" className="self-start">Check fields</Button>
          </Form>
        </Formik>

        <Formik initialValues={EMPTY} initialErrors={SAMPLE_ERRORS} initialTouched={ALL_TOUCHED} onSubmit={() => {}}>
          <Form noValidate className={SECTION}>
            <h2 className="text-xl">Error</h2>
            {renderFields()}
          </Form>
        </Formik>

        <Formik initialValues={FILLED} onSubmit={() => {}}>
          <Form noValidate className={SECTION}>
            <h2 className="text-xl">Disabled</h2>
            {renderFields(true)}
          </Form>
        </Formik>
      </div>
    </>
  )
}
