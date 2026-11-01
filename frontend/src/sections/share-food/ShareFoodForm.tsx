
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Form, Formik, type FormikHelpers } from 'formik'
import { useNavigate } from 'react-router'
import {
  FocusFirstError,
  FormDate,
  FormImageUpload,
  FormInput,
  FormSelect,
  FormTextarea,
  FormTime,
  focusField,
} from '@/components/form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { CATEGORIES, PICKUP_AREAS, UNITS } from '@/constants/listingOptions'
import { listingDetailPath } from '@/constants/routes'
import { useIdempotencyKey } from '@/hooks/useIdempotencyKey'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { combineDeadline, lagosToday, splitDeadline } from '@/lib/deadline'
import {
  DESCRIPTION_MAX,
  listingSchema,
  type ListingFormValues,
} from '@/schema/listingSchema'
import { LeaveGuard } from '@/sections/share-food/LeaveGuard'
import { errorStatus, fieldErrors } from '@/services/errors'
import {
  useCreateListing,
  useUpdateListing,
  useUploadListingImage,
} from '@/services/listings'
import type { Listing } from '@/types/api'

type ShareFoodFormProps = {
  listing?: Listing
}

const NOT_PUBLISHED = "Your listing wasn't published. Try again."
const NOT_UPDATED = "Your changes weren't saved. Try again."
const NOT_ALLOWED = "You don't have access to this."
const PHOTO_UPLOAD_FAILED =
  "Your photo couldn't be uploaded. Please try again."

const LISTING_NOT_EDITABLE =
  "This listing can no longer be edited because its status has changed. Only available listings can be edited."

const FIELD_ORDER = [
  'foodName',
  'description',
  'category',
  'quantity',
  'unit',
  'pickupArea',
  'collectionDate',
  'collectionTime',
  'photo',
]

const SERVICE_FIELD: Record<string, keyof ListingFormValues> = {
  deadline: 'collectionTime',
  collectionDeadline: 'collectionTime',
}

function getBackendErrorCode(error: unknown): string | null {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('data' in error)
  ) {
    return null
  }

  const data = error.data

  if (
    typeof data !== 'object' ||
    data === null ||
    !('code' in data)
  ) {
    return null
  }

  return typeof data.code === 'string'
    ? data.code
    : null
}

export function ShareFoodForm({ listing }: ShareFoodFormProps) {
  const [createListing] = useCreateListing()
  const [updateListing] = useUpdateListing()
  const [uploadListingImage] = useUploadListingImage()

  const { getKey, reset } = useIdempotencyKey()
  const navigate = useNavigate()
  const { toast } = useToast()
  const sessionEnded = useSessionEnded()

  const [formError, setFormError] = useState<string | null>(null)
  const [leavingOnPurpose, setLeavingOnPurpose] = useState(false)

  const inFlight = useRef(false)

  const isEditing = Boolean(listing)

  const deadlineParts = listing
    ? splitDeadline(listing.deadline)
    : null

  const initialValues: ListingFormValues = {
    foodName: listing?.foodName ?? '',
    description: listing?.description ?? '',
    category: listing?.category ?? '',
    quantity: listing ? String(listing.quantity) : '',
    unit: listing?.unit ?? '',
    pickupArea: listing?.pickupArea ?? '',
    collectionDate: deadlineParts?.date ?? lagosToday(),
    collectionTime: deadlineParts?.time ?? '',
    photo: null,
  }

  async function handleSubmit(
    values: ListingFormValues,
    helpers: FormikHelpers<ListingFormValues>,
  ) {
    if (inFlight.current) return

    inFlight.current = true
    setFormError(null)

    let uploadingPhoto = false

    try {
      // Preserve the existing image if no replacement was selected.
      let photoUrl = listing?.photoUrl ?? null

      // Upload a newly selected image to Cloudinary first.
      if (values.photo) {
        uploadingPhoto = true
        photoUrl = await uploadListingImage(values.photo).unwrap()
        uploadingPhoto = false
      }

      const input = {
        foodName: values.foodName.trim(),
        description: values.description.trim(),
        category: values.category,
        quantity: Number(values.quantity),
        unit: values.unit,
        pickupArea: values.pickupArea,
        deadline:
          combineDeadline(
            values.collectionDate,
            values.collectionTime,
          ) ?? '',
        photoUrl,
      }

      const savedListing = listing
        ? await updateListing({
            listingId: listing.id,
            input,
          }).unwrap()
        : await createListing({
            idempotencyKey: getKey(),
            input,
          }).unwrap()

      reset()

      flushSync(() => setLeavingOnPurpose(true))

      toast({
        variant: 'success',
        title: isEditing ? 'Listing updated' : 'Listing published',
      })

      void navigate(listingDetailPath(savedListing.id))
    } catch (error) {
      const status = errorStatus(error)
      const code = getBackendErrorCode(error)

      if (status === 401) {
        flushSync(() => setLeavingOnPurpose(true))
        void sessionEnded()
      } else if (code === 'LISTING_NOT_EDITABLE') {
        setFormError(LISTING_NOT_EDITABLE)
      } else if (status === 403) {
        setFormError(NOT_ALLOWED)
      } else if (uploadingPhoto) {
        setFormError(PHOTO_UPLOAD_FAILED)
      } else if (status === 400) {
        const fields: Partial<
          Record<keyof ListingFormValues, string>
        > = {}

        for (const [field, message] of Object.entries(fieldErrors(error))) {
          const name =
            SERVICE_FIELD[field] ??
            (field as keyof ListingFormValues)

          fields[name] = message
        }

        if (Object.keys(fields).length === 0) {
          setFormError(isEditing ? NOT_UPDATED : NOT_PUBLISHED)
        } else {
          helpers.setErrors(fields)

          const first = FIELD_ORDER.find(
            (name) => fields[name as keyof ListingFormValues],
          )

          if (first) {
            for (const name of Object.keys(fields)) {
              void helpers.setFieldTouched(name, true, false)
            }

            focusField(first)
          }
        }
      } else {
        setFormError(
          isEditing ? NOT_UPDATED : NOT_PUBLISHED,
        )
      }
    } finally {
      inFlight.current = false
    }
  }

  return (
    <Formik<ListingFormValues>
      initialValues={initialValues}
      validationSchema={listingSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, dirty }) => (
        <Form noValidate>
          <LeaveGuard active={dirty && !leavingOnPurpose} />
          <FocusFirstError order={FIELD_ORDER} />

          <Card className="shadow-[0_1px_2px_rgb(0_0_0/0.03),0_8px_22px_rgb(30_42_36/0.05)]">
            <div className="flex flex-col gap-4 md:gap-5 md:p-3.5">
              <p className="text-sm text-text-muted">
                Fields marked * are required.
              </p>

              <div role="alert">
                {formError && (
                  <p className="rounded-md border-2 border-danger px-4 py-3 text-sm font-medium text-danger">
                    <span aria-hidden="true">! </span>
                    {formError}
                  </p>
                )}
              </div>

              <FormInput
                name="foodName"
                label="Food name"
                required
                maxLength={80}
                placeholder="e.g. Bread, Jollof rice, Vegetable stew"
              />

              <FormTextarea
                name="description"
                label="Description"
                required
                maxLength={DESCRIPTION_MAX}
                showCount
                placeholder="Describe the food and include any collection instructions."
              />

              <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr]">
                <FormSelect
                  name="category"
                  label="Category"
                  required
                  placeholder="Select category"
                  options={CATEGORIES}
                />

                <div className="grid grid-cols-2 gap-3 md:contents">
                  <FormInput
                    name="quantity"
                    label="Quantity"
                    required
                    inputMode="numeric"
                    placeholder="e.g. 20"
                  />

                  <FormSelect
                    name="unit"
                    label="Unit"
                    required
                    placeholder="Select unit"
                    options={UNITS}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr]">
                <FormSelect
                  name="pickupArea"
                  label="Pickup area"
                  required
                  placeholder="Select area"
                  options={PICKUP_AREAS}
                />

                <div className="grid grid-cols-[1.2fr_1fr] gap-3 md:contents">
                  <FormDate
                    name="collectionDate"
                    label="Collection date"
                    required
                    min={lagosToday()}
                  />

                  <FormTime
                    name="collectionTime"
                    label="Time"
                    required
                  />
                </div>
              </div>

              {listing?.photoUrl && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-text">
                    Current photo
                  </p>

                  <img
                    src={listing.photoUrl}
                    alt={`Current photo of ${listing.foodName}`}
                    className="h-40 w-full rounded-xl border border-border object-cover"
                  />

                  <p className="text-xs text-text-muted">
                    Choose a new photo below to replace this one.
                  </p>
                </div>
              )}

              <FormImageUpload
                name="photo"
                label={
                  isEditing
                    ? 'Replace photo (optional)'
                    : 'Add photo (optional)'
                }
              />

              <div className="flex md:justify-end">
                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full md:w-auto md:min-w-50 hover:cursor-pointer"
                >
                  {isEditing ? 'Save changes' : 'Publish listing'}
                </Button>
              </div>
            </div>
          </Card>
        </Form>
      )}
    </Formik>
  )
}
