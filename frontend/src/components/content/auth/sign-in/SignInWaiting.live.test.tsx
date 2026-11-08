// Signing in against a slow live service (mocks off, fetch stubbed): the service sleeps
// when idle and can take up to a minute to wake.
// - Opening sign in sends one cheap public read to start waking it.
// - While signing in, "Hang tight…" shows; after a few seconds it also says the service is
//   waking up. It is gone once sign-in answers, and never shows while idle.
// - Sign-in waits up to 90 seconds before giving up, longer than other calls (45).
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ROUTES } from '@/utilities/constants/routes'
import { SignInPage } from '@/app/pages/SignInPage'
import { renderRoutes } from '@/test/render'

vi.mock('@/configs/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

const HANG_TIGHT = /Hang tight, we’re getting things ready for you\./
const WAKING_UP = /FoodBridge is waking up, which can take up to a minute\./

const fetchMock = vi.fn<typeof fetch>()
const loginCalls = () =>
  fetchMock.mock.calls.map(([input]) => input).filter((input): input is Request => input instanceof Request)

// The login call never answers on its own, as with a service still waking up; it ends
// when its signal aborts (the timeout) or when the test answers it.
let answerLogin: (response: Response) => void = () => {}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  fetchMock.mockReset()
  fetchMock.mockImplementation((input) => {
    if (!(input instanceof Request)) return Promise.resolve(Response.json([]))
    return new Promise<Response>((resolve, reject) => {
      answerLogin = resolve
      input.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function startSignIn() {
  renderRoutes([
    { path: ROUTES.signIn, element: <SignInPage /> },
    { path: ROUTES.yourListings, element: <h1>Donor home</h1> },
  ], { initialEntries: [ROUTES.signIn] })
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  await user.click(screen.getByRole('textbox', { name: /Email address/ }))
  await user.paste('donor1@demo.foodbridge.invalid')
  await user.click(screen.getByLabelText(/^Password/))
  await user.paste('password')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('signing in while the service wakes up (live service)', () => {
  // First in this file: wakeService sends once per page load, and each test file gets
  // fresh modules.
  it('starts waking the service once when sign in opens', () => {
    const { unmount } = renderRoutes([{ path: ROUTES.signIn, element: <SignInPage /> }], {
      initialEntries: [ROUTES.signIn],
    })
    unmount()
    renderRoutes([{ path: ROUTES.signIn, element: <SignInPage /> }], { initialEntries: [ROUTES.signIn] })

    expect(fetchMock.mock.calls.map(([input]) => input)).toEqual(['https://api.test/api/listings?limit=1'])
  })

  it('shows no waiting message while idle', () => {
    renderRoutes([{ path: ROUTES.signIn, element: <SignInPage /> }], { initialEntries: [ROUTES.signIn] })

    expect(screen.queryByText(HANG_TIGHT)).not.toBeInTheDocument()
  })

  it('asks the user to hang tight, then explains the wait, then clears once signed in', async () => {
    await startSignIn()

    expect(await screen.findByRole('status')).toHaveTextContent(HANG_TIGHT)
    expect(screen.getByRole('status')).not.toHaveTextContent(WAKING_UP)

    await act(() => vi.advanceTimersByTimeAsync(5000))
    expect(screen.getByRole('status')).toHaveTextContent(WAKING_UP)

    answerLogin(
      Response.json({
        token: 'token-1',
        id: 'acc-donor',
        name: 'donor1',
        role: 'DONOR',
        organisationName: "Mama's Oven",
        email: 'donor1@demo.foodbridge.invalid',
      }),
    )

    expect(await screen.findByRole('heading', { name: 'Donor home' })).toBeInTheDocument()
    expect(screen.queryByText(HANG_TIGHT)).not.toBeInTheDocument()
  })

  it('keeps waiting past 45 seconds, and gives up after 90 with the unreachable message', async () => {
    await startSignIn()
    expect(await screen.findByText(HANG_TIGHT)).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(loginCalls()[0].signal.aborted).toBe(false)
    expect(screen.getByText(HANG_TIGHT)).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(31_000))
    expect(await screen.findByText("We can't reach FoodBridge right now. Try again in a moment.")).toBeInTheDocument()
    expect(screen.queryByText(HANG_TIGHT)).not.toBeInTheDocument()
  })
})
