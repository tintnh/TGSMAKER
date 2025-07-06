export interface CompressOptions {
  maxSize: number // longest edge in px (default 512)
  quality: number // 0-1 for WebP
}

/**
 * Compress a PNG to WebP and scale it down so it’s Telegram-friendly.
 * Returns a base64 data-URL string ready to embed in Lottie.
 */
export async function compressImage(
  file: File,
  { maxSize = 512, quality = 0.6 }: Partial<CompressOptions> = {},
): Promise<string> {
  // Read file
  const arrayBuffer = await file.arrayBuffer()
  const blob = new Blob([arrayBuffer], { type: file.type })
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = URL.createObjectURL(blob)
  })

  // Calculate target size (keep aspect ratio)
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const targetW = Math.round(img.width * scale)
  const targetH = Math.round(img.height * scale)

  // Draw into an off-screen canvas
  const canvas = document.createElement("canvas")
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0, targetW, targetH)

  // Encode to WebP (falls back to PNG if browser can’t)
  const mime =
    canvas.toDataURL("image/webp", quality).length < canvas.toDataURL("image/png").length ? "image/webp" : "image/png"
  return canvas.toDataURL(mime, quality)
}
