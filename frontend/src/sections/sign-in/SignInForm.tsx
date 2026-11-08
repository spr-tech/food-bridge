// The sign-in form (spec S1): email and password with show/hide, then the demo accounts.
// Choosing a demo account fills in its email and the demo password and moves focus to
// Sign in, so the user still signs in themselves.
// On success the session is saved and SignInPage sends the user on (to ?next= or their
// home page). Wrong details keep the email filled in.
// While signing in, a message asks the user to hang on; the service sleeps when idle and
// can take up to a minute to wake, so after a few seconds it also says that.
import { useEffect, useRef, useState } from 'react'
import { Form, Formik } from 'formik'
import { saveSession } from '@/stores/sessionStore'
import { FocusFirstError, FormInput, FormPasswordInput } from '@/components/ui/form'
import { Button } from '@/components/ui/button/button'
import type { DemoAccount } from '@/utilities/constants/demoAccounts'
import { useAppDispatch } from '@/utilities/hooks/useAppStore'
import { signInSchema, type SignInValues } from '@/models/validations/authValidation'
import { DemoAccountsBox } from '@/sections/sign-in/DemoAccounts'
import { api } from '@/configs/serviceConfig'
import { useSignIn } from '@/services/auth'
import { errorStatus } from '@/utilities/helpers/apiErrors'

const WRONG_DETAILS = "That email or password isn't right. Check them and try again."
const UNREACHABLE = "We can't reach FoodBridge right now. Try again in a moment."
const SESSION_ENDED = 'Your session ended. Sign in again.'

const FIELD_ORDER = ['email', 'password']

const SIGNING_IN = 'Hang tight, we’re getting things ready for you.'
const WAKING_UP = 'FoodBridge is waking up, which can take up to a minute.'
// How long a sign-in takes before the message explains the wait.
const SLOW_SIGN_IN_MS = 5000

function SigningInMessage() {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_SIGN_IN_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <p role="status" className="text-center text-sm text-text-muted">
      {SIGNING_IN}
      {slow && <> {WAKING_UP}</>}
    </p>
  )
}

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
  const signInButton = useRef<HTMLButtonElement>(null)

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
        {({ isSubmitting, setValues }) => {
          function pick(account: DemoAccount) {
            void setValues({ email: account.email, password: account.password })
            signInButton.current?.focus()
          }
          return (
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
              <Button
                ref={signInButton}
                type="submit"
                size="lg"
                loading={isSubmitting}
                className="mt-1 w-full hover:cursor-pointer"
              >
                Sign in
              </Button>

              {isSubmitting && <SigningInMessage />}

              <DemoAccountsBox onPick={pick} />
            </Form>
          )
        }}
      </Formik>
    </>
  )
}

// ---------------------------------------------------------------------------
// Explanation
// - Picking a demo account fills in that account's own password (account.password).
//   The demo accounts are grouped Admin | Donor | Recipient, on phone and desktop alike.
// - The login contract now uses email, so the field keeps its email label and type.
