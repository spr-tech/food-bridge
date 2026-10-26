// Shrinks a chosen photo to at most 600px on its longest side and returns it as a JPEG
// data URL, small enough to keep with the listing.
// TEMPORARY: how photos reach the service is TBC (spec S2); until then the simulated
// store keeps this data URL. With the real upload, send the file instead.
const MAX_SIDE = 600

export async function shrinkPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No canvas')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.8)
}
