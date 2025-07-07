import pako from "pako"
import type { ImageLayer, AnimationState } from "@/app/page"

/**
 * Convert image layers and animation state to a minimal TGS (Telegram animated sticker) file.
 * This version does not generate full animation data yet — it just prepares a valid TGS file.
 */
export async function convertToTGS(
  layers: ImageLayer[],
  animationState: AnimationState
): Promise<Uint8Array> {
  const durationSeconds = animationState.duration / 1000
  const totalFrames = Math.round(durationSeconds * animationState.fps)

  // Placeholder Lottie structure
  const lottieJson = {
    v: "5.7.4",
    fr: animationState.fps,
    ip: 0,
    op: totalFrames,
    w: 512,
    h: 512,
    nm: "Telegram Sticker",
    ddd: 0,
    assets: [],
    layers: [], // Animation layers can be added here
  }

  // Note: You can enhance this by exporting actual image layers or shapes into Lottie format

  // Convert to string
  const stringified = JSON.stringify(lottieJson)

  // Compress with GZIP (as required by Telegram)
  return pako.gzip(stringified)
}
