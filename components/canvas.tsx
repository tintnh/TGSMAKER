"use client"

import { forwardRef, useEffect, useRef } from "react"
import type { AnimationState, ImageLayer } from "@/app/page"

interface CanvasProps {
  layers: ImageLayer[]
  selectedLayerId: string | null
  onLayerSelect: (id: string) => void
  onLayerUpdate: (id: string, updates: Partial<ImageLayer>) => void
  animationState: AnimationState
}

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  ({ layers, selectedLayerId, onLayerSelect, onLayerUpdate, animationState }, ref) => {
    const localRef = useRef<HTMLCanvasElement>(null)
    const canvasRef = (ref as any) || localRef
    const width = 512
    const height = 512

    useEffect(() => {
      const ctx = canvasRef.current?.getContext("2d")
      if (!ctx) return

      ctx.clearRect(0, 0, width, height)

      layers.forEach((layer) => {
        if (!layer.visible) return

        const img = new Image()
        img.src = layer.src

        img.onload = () => {
          ctx.save()

          ctx.translate(layer.x, layer.y)
          ctx.rotate((layer.rotation * Math.PI) / 180)
          ctx.scale(layer.scaleX, layer.scaleY)
          ctx.globalAlpha = layer.opacity

          // Draw centered image
          ctx.drawImage(img, -img.width / 2, -img.height / 2)

          ctx.restore()
        }

        img.onerror = () => {
          console.error("Failed to load image:", layer.name)
        }
      })
    }, [layers, animationState.currentTime])

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto border border-gray-300 rounded-md"
      />
    )
  }
)

Canvas.displayName = "Canvas"
