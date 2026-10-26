// A photo picker wired to Formik, as the design's dashed drop zone (2-donor-share-food,
// m2). The value is a File or null. Click or tap the zone, drop a file on it, or Tab to
// the (visually hidden) file input and press Enter. A preview and "Remove photo" follow.
// How photos reach the service is TBC (spec S2); this only collects the file.
// The shared set has no file picker, so this one is ours, built on the shared FormField.
// Candidate to add to the shared repo.
import { useEffect, useId, useRef, useState } from 'react'
import { useField } from 'formik'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { useFieldError } from '@/components/form/useFieldError'
import type { FormFieldBaseProps } from '@/components/form/types'
import { cn } from '@/lib/cn'

type FormImageUploadProps = FormFieldBaseProps & {
  disabled?: boolean
}

function UploadIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="shrink-0">
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  )
}

export function FormImageUpload({ name, label, hint, required, disabled }: FormImageUploadProps) {
  const [field, , helpers] = useField<File | null>(name)
  const error = useFieldError(name)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const zoneHintId = useId()

  // Frees the previous preview's memory when it changes and when the field unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function choose(file: File | null) {
    void helpers.setValue(file)
    void helpers.setTouched(true, false)
    setPreviewUrl(file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null)
  }

  function remove() {
    choose(null)
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.focus()
  }

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(control) => (
        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            name={name}
            accept="image/jpeg,image/png"
            disabled={disabled}
            data-field={name}
            className="peer sr-only"
            {...control}
            aria-describedby={[control['aria-describedby'], zoneHintId].filter(Boolean).join(' ')}
            onChange={(event) => choose(event.currentTarget.files?.[0] ?? null)}
          />
          {/* For pointers only: keyboard and screen reader users use the input above. */}
          <div
            aria-hidden="true"
            onClick={() => !disabled && inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              if (!disabled) setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              if (!disabled) choose(event.dataTransfer.files[0] ?? null)
            }}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-dashed border-dropzone-border bg-dropzone-bg p-4.5 text-sm text-text-secondary md:gap-4 md:p-6.5 md:text-[15px]',
              'peer-focus-visible:[outline:var(--focus-ring-width)_solid_var(--color-focus)] peer-focus-visible:[outline-offset:var(--focus-ring-offset)]',
              dragging && 'border-primary',
              error && 'border-danger',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <UploadIcon />
            <div>
              <span className="hidden md:inline">
                <b className="text-text">Click to upload</b> or drag and drop
              </span>
              <b className="text-text md:hidden">Take or upload a photo</b>
              <div id={zoneHintId} className="text-xs text-text-muted md:text-[13px]">
                JPG or PNG, up to 5 MB. A placeholder is shown if you skip this.
              </div>
            </div>
          </div>

          {field.value && (
            <div className="flex items-center gap-3">
              {previewUrl && (
                <img src={previewUrl} alt="Preview of the chosen photo" className="h-16 w-24 rounded-md border object-cover" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm">{field.value.name}</span>
              <Button variant="ghost" size="sm" onClick={remove} disabled={disabled}>
                Remove photo
              </Button>
            </div>
          )}
        </div>
      )}
    </FormField>
  )
}
