// A photo picker wired to Formik, with a preview. The value is a File or null.
// How photos reach the service is TBC (spec S2); this only collects the file.
// The shared set has no file picker, so this one is ours, built on the shared FormField
// and Input. Candidate to add to the shared repo.
import { useEffect, useState } from 'react'
import { useField } from 'formik'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { useFieldError } from '@/components/form/useFieldError'
import type { FormFieldBaseProps } from '@/components/form/types'

type FormImageUploadProps = FormFieldBaseProps & {
  disabled?: boolean
}

export function FormImageUpload({ name, label, hint, required, disabled }: FormImageUploadProps) {
  const [, , helpers] = useField<File | null>(name)
  const error = useFieldError(name)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Frees the previous preview's memory when it changes and when the field unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(control) => (
        <div className="flex flex-col gap-3">
          <Input
            type="file"
            name={name}
            accept="image/jpeg,image/png"
            disabled={disabled}
            className="h-auto py-2"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null
              void helpers.setValue(file)
              void helpers.setTouched(true, false)
              setPreviewUrl(file ? URL.createObjectURL(file) : null)
            }}
            {...control}
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview of the chosen photo"
              className="h-32 w-48 rounded-md border object-cover"
            />
          )}
        </div>
      )}
    </FormField>
  )
}
