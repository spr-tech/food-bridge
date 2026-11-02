// compressPhoto: a photo the service will accept (under 900 KB), drawn no larger than
// 1600px and at the highest quality that fits. jsdom has no image decoding or canvas
// encoding, so both are stubbed: a JPEG's size here grows with its pixels and quality.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { compressPhoto, UPLOAD_MAX_BYTES } from '@/lib/photo'

const close = vi.fn()
const encoded: { width: number; height: number; quality: number }[] = []
let bytesPerPixel = 0.6

beforeEach(() => {
  close.mockReset()
  encoded.length = 0
  bytesPerPixel = 0.6
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 4000, height: 3000, close })))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    _type?: string,
    quality = 1,
  ) {
    encoded.push({ width: this.width, height: this.height, quality })
    const size = Math.round(this.width * this.height * quality * bytesPerPixel)
    // A JPEG too large to send is only measured, so it needn't be built.
    callback(
      size > UPLOAD_MAX_BYTES
        ? ({ size, type: 'image/jpeg' } as Blob)
        : new Blob([new Uint8Array(size)], { type: 'image/jpeg' }),
    )
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const photo = (bytes: number, name = 'bread.png') => new File([new Uint8Array(bytes)], name, { type: 'image/png' })

describe('compressPhoto', () => {
  it('sends a photo that is already small enough as it is', async () => {
    const small = photo(500 * 1024)

    expect(await compressPhoto(small)).toBe(small)
    expect(createImageBitmap).not.toHaveBeenCalled()
  })

  it('draws a large photo at 1600px and lowers the quality until it fits under 900 KB', async () => {
    // 1600×1200 at 0.85 is about 979 KB; at 0.75 about 864 KB.
    const result = await compressPhoto(photo(4 * 1024 * 1024))

    expect(result.size).toBeLessThanOrEqual(UPLOAD_MAX_BYTES)
    expect(result.type).toBe('image/jpeg')
    expect(result.name).toBe('bread.jpg')
    expect(encoded).toEqual([
      { width: 1600, height: 1200, quality: 0.85 },
      { width: 1600, height: 1200, quality: 0.75 },
    ])
    expect(close).toHaveBeenCalledOnce()
  })

  it('draws it smaller when even the lowest quality is too large', async () => {
    bytesPerPixel = 1.2
    const result = await compressPhoto(photo(5 * 1024 * 1024))

    expect(result.size).toBeLessThanOrEqual(UPLOAD_MAX_BYTES)
    expect(encoded.at(-1)!.width).toBeLessThan(1600)
  })

  it('gives up, rather than sending a file the service would refuse, if nothing fits', async () => {
    bytesPerPixel = 1000

    await expect(compressPhoto(photo(5 * 1024 * 1024))).rejects.toThrow()
    expect(close).toHaveBeenCalledOnce()
  })
})
