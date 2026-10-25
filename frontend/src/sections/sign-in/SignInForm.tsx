// The sign-in form (spec S1): email and password with show/hide, then the demo accounts.
// On success the session is saved and SignInPage sends the user on (to ?next= or their
// home page). Wrong details keep the email filled in.
import { useState } from 'react'
import { Form, Formik } from 'formik'
import { saveSession } from '@/app/session'
import { FocusFirstError, FormInput, FormPasswordInput, focusField } from '@/components/form'
import { Button } from '@/components/ui/button'
import { useAppDispatch } from '@/hooks/useAppStore'
import { signInSchema, type SignInValues } from '@/schema/signInSchema'
import { DemoAccountChips, DemoAccountsBox } from '@/sections/sign-in/DemoAccounts'
import { api } from '@/services/api'
import { useSignIn } from '@/services/auth'
import { errorStatus } from '@/services/errors'

const WRONG_DETAILS = "That email or password isn't right. Check them and try again."
const UNREACHABLE = "We can't reach FoodBridge right now. Try again in a moment."
const SESSION_ENDED = 'Your session ended. Sign in again.'

const FIELD_ORDER = ['email', 'password']

function MailIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function SignInForm({ sessionEnded }: { sessionEnded: boolean }) {
  const [signIn] = useSignIn()
  const dispatch = useAppDispatch()
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(values: SignInValues) {
    setFormError(null)
    try {
      const session = await signIn({ email: values.email.trim(), password: values.password }).unwrap()
      // Nothing cached from an earlier account may show to this one.
      dispatch(api.util.resetApiState())
      saveSession(session)
    } catch (error) {
      setFormError(errorStatus(error) === 401 ? WRONG_DETAILS : UNREACHABLE)
    }
  }

  return (
    <>
      <h1 className="text-[26px] lg:text-[38px]">Welcome back</h1>
      <p className="mt-2 mb-4 leading-[1.55] text-text-muted lg:mb-6">Sign in to your FoodBridge account.</p>

      {sessionEnded && !formError && (
        <p role="status" className="mb-4 rounded-md border border-border-input bg-surface px-4 py-3 text-sm">
          {SESSION_ENDED}
        </p>
      )}
      <div role="alert">
        {formError && (
          <p className="mb-4 rounded-md border-2 border-danger bg-surface px-4 py-3 text-sm font-medium text-danger">
            <span aria-hidden="true">! </span>
            {formError}
          </p>
        )}
      </div>

      <Formik<SignInValues>
        initialValues={{ email: '', password: '' }}
        validationSchema={signInSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, setFieldValue }) => (
          <Form noValidate className="flex flex-col gap-4 lg:gap-5">
            <FocusFirstError order={FIELD_ORDER} />
            <FormInput
              name="email"
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@organisation.test"
              icon={<MailIcon />}
              autoFocus
            />
            <FormPasswordInput
              name="password"
              label="Password"
              autoComplete="current-password"
              icon={<LockIcon />}
            />
            <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
              Sign in
            </Button>

            <div className="lg:hidden">
              <DemoAccountChips
                onPick={(email) => {
                  void setFieldValue('email', email)
                  focusField('password')
                }}
              />
            </div>
          </Form>
        )}
      </Formik>

      <div className="hidden lg:block">
        <DemoAccountsBox />
      </div>
    </>
  )
}
