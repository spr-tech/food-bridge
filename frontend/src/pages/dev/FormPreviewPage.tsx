// /dev/forms, development builds only: every shared component and every Formik adapter
// in its normal, error and disabled states, for checking layout, focus, contrast and
// screen reader output.
import { useState, type ReactNode } from 'react'
import { Form, Formik, type FormikErrors, type FormikTouched } from 'formik'
import * as Yup from 'yup'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import {
  FormCheckbox,
  FormDateTime,
  FormImageUpload,
  FormInput,
  FormSelect,
  FormTextarea,
} from '@/components/form'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { FilterBar, FilterGroup } from '@/components/ui/filter-bar'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge as SharedStatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { PICKUP_AREAS, CATEGORIES } from '@/constants/listingOptions'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { ListingStatus, RequestStatus } from '@/types/status'

// ---- Formik adapters ---------------------------------------------------------------

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
        hint="Add any collection instructions here."
        maxLength={500}
        showCount
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

// ---- Layout helpers ----------------------------------------------------------------

const PANEL = 'flex flex-col gap-5 rounded-md border bg-surface p-6'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl">{title}</h2>
      {children}
    </section>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={PANEL}>
      <h3 className="text-lg">{title}</h3>
      {children}
    </div>
  )
}

const REQUEST_STATUSES: RequestStatus[] = ['PENDING', 'APPROVED', 'DECLINED', 'EXPIRED', 'CANCELLED']
const LISTING_STATUSES: ListingStatus[] = ['AVAILABLE', 'RESERVED', 'COLLECTED', 'EXPIRED']

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

// ---- Page ----------------------------------------------------------------------------

export function FormPreviewPage() {
  useDocumentTitle('Component preview')
  const { toast } = useToast()

  const [text, setText] = useState('')
  const [notes, setNotes] = useState('')
  const [area, setArea] = useState<string | undefined>(undefined)
  const [checked, setChecked] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [retrying, setRetrying] = useState(false)

  const activeFilters = (category ? 1 : 0) + (availableOnly ? 1 : 0)

  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        title="Component preview"
        description="Development only. Not part of the app. Shared components from src/components/ui/ and our Formik adapters."
      />

      <Section title="Formik adapters">
        <div className="grid gap-8 lg:grid-cols-3">
          <Formik
            initialValues={EMPTY}
            validationSchema={schema}
            onSubmit={() => {
              toast({ variant: 'success', title: 'All fields are valid' })
            }}
          >
            <Form noValidate className={PANEL}>
              <h3 className="text-lg">Normal</h3>
              {renderFields()}
              <Button type="submit" className="self-start">
                Check fields
              </Button>
            </Form>
          </Formik>

          <Formik initialValues={EMPTY} initialErrors={SAMPLE_ERRORS} initialTouched={ALL_TOUCHED} onSubmit={() => {}}>
            <Form noValidate className={PANEL}>
              <h3 className="text-lg">Error</h3>
              {renderFields()}
            </Form>
          </Formik>

          <Formik initialValues={FILLED} onSubmit={() => {}}>
            <Form noValidate className={PANEL}>
              <h3 className="text-lg">Disabled</h3>
              {renderFields(true)}
            </Form>
          </Formik>
        </div>
      </Section>

      <Section title="Shared form controls">
        <div className="grid gap-8 lg:grid-cols-3">
          <Panel title="Normal">
            <FormField label="Food name" hint="As donors would say it" required>
              {(field) => <Input {...field} value={text} onChange={(e) => setText(e.target.value)} />}
            </FormField>
            <FormField label="Description">
              {(field) => (
                <Textarea {...field} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} showCount />
              )}
            </FormField>
            <FormField label="Pickup area">
              {(field) => <Select {...field} options={PICKUP_AREAS} value={area} onValueChange={setArea} />}
            </FormField>
            <Checkbox
              label="Notify me when it's collected"
              description="A sample checkbox."
              checked={checked}
              onCheckedChange={setChecked}
            />
          </Panel>

          <Panel title="Error">
            <FormField label="Food name" error="Enter the food name" required>
              {(field) => <Input {...field} defaultValue="" />}
            </FormField>
            <FormField label="Description" error="Use 500 characters or fewer">
              {(field) => <Textarea {...field} defaultValue="" />}
            </FormField>
            <FormField label="Pickup area" error="Choose a pickup area" required>
              {(field) => <Select {...field} options={PICKUP_AREAS} value={undefined} onValueChange={() => {}} />}
            </FormField>
          </Panel>

          <Panel title="Disabled">
            <FormField label="Food name">
              {(field) => <Input {...field} defaultValue="Wholewheat bread loaves" disabled />}
            </FormField>
            <FormField label="Description">
              {(field) => <Textarea {...field} defaultValue="Baked this morning." disabled />}
            </FormField>
            <FormField label="Pickup area">
              {(field) => <Select {...field} options={PICKUP_AREAS} value="yaba" onValueChange={() => {}} disabled />}
            </FormField>
            <Checkbox label="Notify me when it's collected" checked onCheckedChange={() => {}} disabled />
          </Panel>
        </div>
      </Section>

      <Section title="Buttons">
        <div className={PANEL}>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button iconOnly aria-label="Add listing" variant="secondary">
              <Plus aria-hidden="true" className="size-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button loading>Publish listing</Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>
              Disabled secondary
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Status badges">
        <div className={PANEL}>
          <h3 className="text-lg">FoodBridge statuses (our wrapper)</h3>
          <div className="flex flex-wrap gap-2">
            {REQUEST_STATUSES.map((status) => (
              <StatusBadge key={`request-${status}`} kind="request" status={status} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {LISTING_STATUSES.map((status) => (
              <StatusBadge key={`listing-${status}`} kind="listing" status={status} />
            ))}
          </div>
          <h3 className="text-lg">Shared tones with our global role colours</h3>
          <div className="flex flex-wrap gap-2">
            <SharedStatusBadge tone="neutral">Neutral</SharedStatusBadge>
            <SharedStatusBadge tone="info">Info</SharedStatusBadge>
            <SharedStatusBadge tone="success">Success</SharedStatusBadge>
            <SharedStatusBadge tone="warning">Warning</SharedStatusBadge>
            <SharedStatusBadge tone="danger">Danger</SharedStatusBadge>
          </div>
        </div>
      </Section>

      <Section title="Cards and loading">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card image="" imageAlt="">
            <CardHeader>
              <h3 className="text-lg">Bread & pastries</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-muted">Bakery · Mama’s Oven · 20 packs</p>
            </CardBody>
            <CardFooter>
              <StatusBadge kind="listing" status="AVAILABLE" />
            </CardFooter>
          </Card>
          <Card href="#cards" linkLabel="View Jollof rice and chicken">
            <CardHeader>
              <h3 className="text-lg">Jollof rice & chicken (linked card)</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-muted">The whole card is one link. Tab to it to see its focus ring.</p>
            </CardBody>
          </Card>
          <div aria-busy="true" className="flex flex-col gap-4">
            <Skeleton shape="card" />
          </div>
          <div aria-busy="true" className={PANEL}>
            <Skeleton shape="image" />
            <Skeleton lines={3} />
          </div>
        </div>
      </Section>

      <Section title="Empty and error states">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={PANEL}>
            <EmptyState
              headingLevel="h3"
              title="No listings match your filters"
              description="Try a different search or clear the filters."
              action={{ label: 'Clear filters', onClick: () => toast({ title: 'Filters cleared' }) }}
            />
          </div>
          <div className={PANEL}>
            <ErrorState
              headingLevel="h3"
              title="We couldn't load listings."
              description="Check your connection and try again."
              retrying={retrying}
              onRetry={() => {
                setRetrying(true)
                window.setTimeout(() => setRetrying(false), 1500)
              }}
            />
          </div>
        </div>
      </Section>

      <Section title="Filter bar">
        <div className={PANEL}>
          <FilterBar
            query={query}
            onQueryChange={setQuery}
            searchLabel="Search by food name, donor or area"
            searchPlaceholder="Search by food name, donor or area…"
            activeCount={activeFilters}
            onClearAll={() => {
              setQuery('')
              setCategory(undefined)
              setAvailableOnly(false)
            }}
            resultMessage="6 listings available"
          >
            <FormField label="Category">
              {(field) => (
                <Select {...field} options={CATEGORIES} value={category} onValueChange={setCategory} allowAny anyLabel="All categories" />
              )}
            </FormField>
            <FilterGroup legend="Status">
              <Checkbox label="Available only" checked={availableOnly} onCheckedChange={setAvailableOnly} />
            </FilterGroup>
          </FilterBar>
        </div>
      </Section>

      <Section title="Dialogs and toasts">
        <div className={PANEL}>
          <div className="flex flex-wrap gap-3">
            <Dialog
              trigger={<Button variant="secondary">Open dialog</Button>}
              title="About this listing"
              description="A plain dialog with a close button. Escape closes it."
            >
              <p>Collect from the side door before 7:00 PM.</p>
            </Dialog>
            <ConfirmDialog
              trigger={<Button>Approve</Button>}
              title="Approve this request?"
              description="Hope Community Kitchen will be the only recipient for 20 packs of bread. The other 2 pending requests will be declined."
              confirmLabel="Approve request"
              onConfirm={async () => {
                await wait(1000)
                toast({ variant: 'success', title: 'Request approved' })
              }}
            />
            <ConfirmDialog
              trigger={<Button variant="danger">Decline</Button>}
              title="Decline this request?"
              description="Hope Community Kitchen will be told their request was declined."
              confirmLabel="Decline request"
              tone="danger"
              onConfirm={async () => {
                await wait(1000)
                toast({ variant: 'success', title: 'Request declined' })
              }}
            />
            <ConfirmDialog
              trigger={<Button variant="secondary">Confirm that fails</Button>}
              title="Approve this request?"
              description="This one fails after a second, so the dialog stays open."
              confirmLabel="Approve request"
              onConfirm={async () => {
                await wait(1000)
                toast({
                  variant: 'error',
                  title: "Your approval wasn't saved because the connection dropped.",
                  description: 'Try again.',
                  action: { label: 'Try again', onClick: () => {} },
                })
                throw new Error('Simulated failure')
              }}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => toast({ variant: 'success', title: 'Listing published' })}>
              Success toast
            </Button>
            <Button variant="secondary" onClick={() => toast({ title: 'Updated just now' })}>
              Info toast
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast({
                  variant: 'error',
                  title: "Your listing wasn't published.",
                  description: 'Try again.',
                  action: { label: 'Try again', onClick: () => {} },
                })
              }
            >
              Error toast with action
            </Button>
          </div>
        </div>
      </Section>
    </div>
  )
}
