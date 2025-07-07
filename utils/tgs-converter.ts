import pako from "pako"
import type { ImageLayer, AnimationState } from "@/app/page"

/**
 * Renders an SVG data URI to a PNG data URI using an offscreen canvas
 */
async function convertSVGToPNG(svgDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject("No canvas context")

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, 512, 512)

      const pngDataUrl = canvas.toDataURL("image/png")
      resolve(pngDataUrl)
    }
    img.onerror = reject
    img.src = svgDataUrl
  })
}

/**
 * Convert image layers and animation state to a valid .tgs (Telegram sticker) file.
 */
export async function convertToTGS(
  layers: ImageLayer[],
  animationState: AnimationState
): Promise<Uint8Array> {
  const durationSeconds = animationState.duration / 1000
  const totalFrames = Math.round(durationSeconds * animationState.fps)

  const visibleLayer = layers.find(
    (layer) => layer.visible && layer.src.startsWith("data:image/svg")
  )

  if (!visibleLayer) {
    throw new Error("No visible SVG image layer found.")
  }

  const pngDataUrl = await convertSVGToPNG(visibleLayer.src)
  const base64Data = pngDataUrl.split(",")[1]

  const imageId = "img_0"
  const assets = [
    {
      id: imageId,
      w: 512,
      h: 512,
      u: "",
      p: `data:image/png;base64,${base64Data}`,
      e: 1,
    },
  ]

  const lottieLayer = {
    ddd: 0,
    ind: 1,
    ty: 2, // image layer
    nm: "Converted PNG Layer",
    refId: imageId,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [256, 256, 0] },
      a: { a: 0, k: [256, 256, 0] },
      s: { a: 0, k: [100, 100, 100] },
    },
    ao: 0,
    ip: 0,
    op: totalFrames,
    st: 0,
    bm: 0,
  }

  const lottieJson = {
    v: "5.7.4",
    fr: animationState.fps,
    ip: 0,
    op: totalFrames,
    w: 512,
    h: 512,
    nm: "Telegram Sticker",
    ddd: 0,
    assets,
    layers: [lottieLayer],
  }

  const stringified = JSON.stringify(lottieJson)
  return pako.gzip(stringified)
        }
