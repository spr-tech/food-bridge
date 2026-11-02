// Making a chosen photo smaller in the browser, before it is kept or sent.
// - shrinkPhoto: at most 600px on its longest side, as a JPEG data URL, small enough for
//   the simulated store to keep with the listing.
// - compressPhoto: a file the service will accept. It allows uploads of 1 MB (Spring's
//   default; no larger limit is configured), while people may choose photos up to 5 MB.
const MAX_SIDE = 600

// Kept under 1 MB with room to spare.
export const UPLOAD_MAX_BYTES = 900 * 1024
const UPLOAD_MAX_SIDE = 1600
const UPLOAD_QUALITIES = [0.85, 0.75, 0.65]
// Each further attempt draws the photo this much smaller.
const SHRINK_STEP = 0.75
const MAX_ATTEMPTS = 6

function draw(bitmap: ImageBitmap, maxSide: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No canvas')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No image'))), 'image/jpeg', quality)
  })
}

export async function shrinkPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const canvas = draw(bitmap, MAX_SIDE)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.8)
}

// The file itself when it is already small enough; otherwise a JPEG of at most 1600px,
// at lower quality and then smaller sizes until it is under UPLOAD_MAX_BYTES.
export async function compressPhoto(file: File): Promise<File> {
  if (file.size <= UPLOAD_MAX_BYTES) return file

  const bitmap = await createImageBitmap(file)
  const name = file.name.replace(/\.[^.]*$/, '') + '.jpg'
  let maxSide = Math.min(UPLOAD_MAX_SIDE, Math.max(bitmap.width, bitmap.height))

  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const canvas = draw(bitmap, maxSide)
      for (const quality of UPLOAD_QUALITIES) {
        const blob = await toJpeg(canvas, quality)
        if (blob.size <= UPLOAD_MAX_BYTES) return new File([blob], name, { type: 'image/jpeg' })
      }
      maxSide = Math.round(maxSide * SHRINK_STEP)
    }
  } finally {
    bitmap.close()
  }
  throw new Error('The photo could not be made small enough to upload.')
}
