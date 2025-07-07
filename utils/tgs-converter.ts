import pako from "pako"
import type { ImageLayer, AnimationState } from "@/app/page"

/**
 * Converts a single SVG-based image layer into a TGS file with basic animation support.
 */
export async function convertToTGS(
  layers: ImageLayer[],
  animationState: AnimationState
): Promise<Uint8Array> {
  const durationSeconds = animationState.duration / 1000
  const totalFrames = Math.round(durationSeconds * animationState.fps)

  const visibleLayer = layers.find((layer) => layer.visible && layer.src.startsWith("data:image/svg"))

  if (!visibleLayer) {
    throw new Error("No visible SVG image layer found.")
  }

  // Get the Base64-encoded data from the data URI
  const base64Data = visibleLayer.src.split(",")[1]

  // Embed image as Lottie asset
  const imageId = "svg_0"
  const assets = [
    {
      id: imageId,
      w: 512,
      h: 512,
      u: "",
      p: `data:image/svg+xml;base64,${base64Data}`,
      e: 1, // embed
    },
  ]

  // Add layer referencing the image
  const lottieLayer = {
    ddd: 0,
    ind: 1,
    ty: 2, // image layer
    nm: "SVG Layer",
    refId: imageId,
    ks: {
      o: { a: 0, k: 100 }, // opacity
      r: { a: 0, k: 0 },   // rotation
      p: { a: 0, k: [256, 256, 0] }, // position (center)
      a: { a: 0, k: [256, 256, 0] }, // anchor point
      s: { a: 0, k: [100, 100, 100] }, // scale (100%)
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
