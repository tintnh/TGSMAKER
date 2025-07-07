"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ImageLayer, AnimationState } from "@/app/page"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { deflate } from "pako"

interface ExportPanelProps {
  layers: ImageLayer[]
  animationState: AnimationState
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function ExportPanel({ layers, animationState, canvasRef }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false)

  const downloadTGS = async () => {
    setExporting(true)
    try {
      const lottieJson = convertToLottie(layers, animationState)

      // Gzip compress using pako
      const tgsData = deflate(JSON.stringify(lottieJson))
      const blob = new Blob([tgsData], { type: "application/gzip" })

      saveAs(blob, "sticker.tgs")
    } catch (err) {
      console.error("TGS export failed:", err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={downloadTGS} disabled={exporting}>
        {exporting ? "Exporting..." : "Export .tgs (Telegram)"}
      </Button>
    </div>
  )
}

// ✅ Converts ImageLayer + Keyframes to Lottie JSON
function convertToLottie(layers: ImageLayer[], animationState: AnimationState): any {
  const width = 512
  const height = 512
  const framerate = animationState.fps
  const durationInFrames = Math.floor((animationState.duration / 1000) * framerate)

  const assets: any[] = []
  const layerDefs: any[] = []

  layers.forEach((layer, index) => {
    // Add image to assets
    assets.push({
      id: `image_${index}`,
      w: width,
      h: height,
      u: "",
      p: layer.src,
      e: 0,
    })

    // Create Lottie layer
    const lottieLayer = {
      ddd: 0,
      ind: index + 1,
      ty: 2, // image layer
      nm: layer.name,
      refId: `image_${index}`,
      ks: {
        o: keyframeTrack(layer, "opacity", animationState),
        r: keyframeTrack(layer, "rotation", animationState),
        p: keyframeTrackPosition(layer, animationState),
        a: { a: 0, k: [0, 0, 0] },
        s: keyframeTrackScale(layer, animationState),
      },
      ao: 0,
      ip: 0,
      op: durationInFrames,
      st: 0,
      bm: 0,
    }

    layerDefs.push(lottieLayer)
  })

  return {
    v: "5.7.4",
    fr: framerate,
    ip: 0,
    op: durationInFrames,
    w: width,
    h: height,
    nm: "Telegram Sticker",
    ddd: 0,
    assets,
    layers: layerDefs,
  }
}

// Helper: Create position keyframes
function keyframeTrackPosition(layer: ImageLayer, state: AnimationState) {
  if (!layer.keyframes.length) return { a: 0, k: [layer.x, layer.y, 0] }

  return {
    a: 1,
    k: layer.keyframes.map((kf) => ({
      t: Math.floor((kf.time / 1000) * state.fps),
      s: [kf.x, kf.y, 0],
      e: [kf.x, kf.y, 0],
    })),
  }
}

// Helper: Create scale keyframes
function keyframeTrackScale(layer: ImageLayer, state: AnimationState) {
  if (!layer.keyframes.length) return { a: 0, k: [100, 100, 100] }

  return {
    a: 1,
    k: layer.keyframes.map((kf) => ({
      t: Math.floor((kf.time / 1000) * state.fps),
      s: [kf.scaleX * 100, kf.scaleY * 100, 100],
      e: [kf.scaleX * 100, kf.scaleY * 100, 100],
    })),
  }
}

// Helper: Create rotation and opacity keyframes
function keyframeTrack(layer: ImageLayer, prop: "rotation" | "opacity", state: AnimationState) {
  if (!layer.keyframes.length) {
    return { a: 0, k: prop === "rotation" ? 0 : layer.opacity * 100 }
  }

  return {
    a: 1,
    k: layer.keyframes.map((kf) => ({
      t: Math.floor((kf.time / 1000) * state.fps),
      s: [prop === "rotation" ? kf.rotation : kf.opacity * 100],
      e: [prop === "rotation" ? kf.rotation : kf.opacity * 100],
    })),
  }
}
