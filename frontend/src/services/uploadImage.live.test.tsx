// Uploading a listing photo against the live service (mocks off, fetch stubbed): the
// photo is compressed first (lib/photo.ts, tested there), because the service accepts
// 1 MB while people may choose up to 5 MB. If the browser can't redraw it, the photo is
// sent as chosen. The reply's imageUrl becomes the listing's photo.
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '@/app/store'
import { compressPhoto } from '@/utilities/helpers/photo'
import { useUploadListingImage } from '@/services/listings'
import { signInAs } from '@/test/render'

vi.mock('@/config/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

vi.mock('@/utilities/helpers/photo', () => ({
  compressPhoto: vi.fn(),
  shrinkPhoto: vi.fn(),
}))

const IMAGE_URL = 'https://res.cloudinary.com/demo/image/upload/foodbridge/bread.jpg'
const fetchMock = vi.fn<typeof fetch>()

// What was put in the upload form, read where it is built: the stubbed fetch can't parse
// jsdom's multipart body back.
let appended: [string, FormDataEntryValue][] = []

beforeEach(() => {
  appended = []
  const append = FormData.prototype.append
  vi.spyOn(FormData.prototype, 'append').mockImplementation(function (
    this: FormData,
    name: string,
    value: string | Blob,
  ) {
    appended.push([name, value as FormDataEntryValue])
    return Reflect.apply(append, this, [name, value])
  })
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(Response.json({ imageUrl: IMAGE_URL }))
  vi.stubGlobal('fetch', fetchMock)
  signInAs('donor')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function upload(file: File) {
  const store = makeStore()
  const { result } = renderHook(() => useUploadListingImage(), {
    wrapper: ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>,
  })
  let url: string | undefined
  await act(async () => {
    url = await result.current[0](file).unwrap()
  })
  const request = fetchMock.mock.calls[0][0] as Request
  const sent = appended.find(([name]) => name === 'file')?.[1] as File
  return { url, request, sent }
}

describe('uploading a listing photo (live service)', () => {
  it('sends the compressed photo to POST /api/listings/images', async () => {
    const chosen = new File([new Uint8Array(4 * 1024 * 1024)], 'bread.png', { type: 'image/png' })
    vi.mocked(compressPhoto).mockResolvedValue(
      new File([new Uint8Array(800 * 1024)], 'bread.jpg', { type: 'image/jpeg' }),
    )

    const { url, request, sent } = await upload(chosen)

    expect(compressPhoto).toHaveBeenCalledWith(chosen)
    expect(request.method).toBe('POST')
    expect(request.url).toBe('https://api.test/api/listings/images')
    expect(sent.name).toBe('bread.jpg')
    expect(sent.size).toBe(800 * 1024)
    expect(url).toBe(IMAGE_URL)
  })

  it("sends the photo as chosen when it can't be compressed", async () => {
    const chosen = new File([new Uint8Array(1024)], 'bread.png', { type: 'image/png' })
    vi.mocked(compressPhoto).mockRejectedValue(new Error('No canvas'))

    const { url, sent } = await upload(chosen)

    expect(sent.name).toBe('bread.png')
    expect(url).toBe(IMAGE_URL)
  })
})
