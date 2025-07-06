"use client"

import type React from "react"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import type { ImageLayer, AnimationState } from "@/app/page"

interface CanvasProps {
  layers: ImageLayer[]
  selectedLayerId: string | null
  onLayerSelect: (layerId: string) => void
  onLayerUpdate: (layerId: string, updates: Partial<ImageLayer>) => void
  animationState: AnimationState
}

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  ({ layers, selectedLayerId, onLayerSelect, onLayerUpdate, animationState }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const contextRef = useRef<CanvasRenderingContext2D | null>(null)
    const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
    const isDragging = useRef(false)
    const dragOffset = useRef({ x: 0, y: 0 })

    useImperativeHandle(ref, () => canvasRef.current!, [])

    // Initialize canvas
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      contextRef.current = ctx

      // Set canvas size to 512x512 (Telegram sticker size)
      canvas.width = 512
      canvas.height = 512

      // Enable image smoothing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
    }, [])

    // Load images
    useEffect(() => {
      layers.forEach((layer) => {
        if (!imagesRef.current.has(layer.id)) {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => {
            imagesRef.current.set(layer.id, img)
            renderCanvas()
          }
          img.src = layer.src
        }
      })
    }, [layers])

    // Get interpolated values for current time
    const getInterpolatedValues = (layer: ImageLayer) => {
      const { keyframes } = layer
      const currentTime = animationState.currentTime

      if (keyframes.length === 0) {
        return {
          x: layer.x,
          y: layer.y,
          rotation: layer.rotation,
          scaleX: layer.scaleX,
          scaleY: layer.scaleY,
          opacity: layer.opacity,
        }
      }

      if (keyframes.length === 1 || currentTime <= keyframes[0].time) {
        return keyframes[0]
      }

      if (currentTime >= keyframes[keyframes.length - 1].time) {
        return keyframes[keyframes.length - 1]
      }

      // Find surrounding keyframes
      let prevKeyframe = keyframes[0]
      let nextKeyframe = keyframes[keyframes.length - 1]

      for (let i = 0; i < keyframes.length - 1; i++) {
        if (currentTime >= keyframes[i].time && currentTime <= keyframes[i + 1].time) {
          prevKeyframe = keyframes[i]
          nextKeyframe = keyframes[i + 1]
          break
        }
      }

      // Linear interpolation
      const t = (currentTime - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time)

      return {
        x: prevKeyframe.x + (nextKeyframe.x - prevKeyframe.x) * t,
        y: prevKeyframe.y + (nextKeyframe.y - prevKeyframe.y) * t,
        rotation: prevKeyframe.rotation + (nextKeyframe.rotation - prevKeyframe.rotation) * t,
        scaleX: prevKeyframe.scaleX + (nextKeyframe.scaleX - prevKeyframe.scaleX) * t,
        scaleY: prevKeyframe.scaleY + (nextKeyframe.scaleY - prevKeyframe.scaleY) * t,
        opacity: prevKeyframe.opacity + (nextKeyframe.opacity - prevKeyframe.opacity) * t,
      }
    }

    // Render canvas
    const renderCanvas = () => {
      const canvas = canvasRef.current
      const ctx = contextRef.current
      if (!canvas || !ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw checkerboard background
      const checkSize = 20
      for (let x = 0; x < canvas.width; x += checkSize) {
        for (let y = 0; y < canvas.height; y += checkSize) {
          ctx.fillStyle = (x / checkSize + y / checkSize) % 2 === 0 ? "#f0f0f0" : "#ffffff"
          ctx.fillRect(x, y, checkSize, checkSize)
        }
      }

      // Draw layers
      layers.forEach((layer) => {
        if (!layer.visible) return

        const img = imagesRef.current.get(layer.id)
        if (!img) return

        const values = getInterpolatedValues(layer)

        ctx.save()

        // Set opacity
        ctx.globalAlpha = values.opacity

        // Transform
        ctx.translate(values.x, values.y)
        ctx.rotate((values.rotation * Math.PI) / 180)
        ctx.scale(values.scaleX, values.scaleY)

        // Draw image centered
        const width = img.width
        const height = img.height
        ctx.drawImage(img, -width / 2, -height / 2, width, height)

        // Draw selection outline
        if (selectedLayerId === layer.id) {
          ctx.strokeStyle = "#3b82f6"
          ctx.lineWidth = 2 / Math.min(values.scaleX, values.scaleY)
          ctx.strokeRect(-width / 2, -height / 2, width, height)
        }

        ctx.restore()
      })
    }

    // Render when dependencies change
    useEffect(() => {
      renderCanvas()
    }, [layers, selectedLayerId, animationState.currentTime])

    // Mouse/touch event handlers
    const getEventPos = (event: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      let clientX, clientY
      if ("touches" in event) {
        clientX = event.touches[0]?.clientX || event.changedTouches[0]?.clientX || 0
        clientY = event.touches[0]?.clientY || event.changedTouches[0]?.clientY || 0
      } else {
        clientX = event.clientX
        clientY = event.clientY
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      }
    }

    const handlePointerDown = (event: React.MouseEvent | React.TouchEvent) => {
      const pos = getEventPos(event)

      // Find clicked layer (reverse order for top-to-bottom)
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i]
        if (!layer.visible) continue

        const img = imagesRef.current.get(layer.id)
        if (!img) continue

        const values = getInterpolatedValues(layer)

        // Check if click is within image bounds
        const halfWidth = (img.width * values.scaleX) / 2
        const halfHeight = (img.height * values.scaleY) / 2

        if (
          pos.x >= values.x - halfWidth &&
          pos.x <= values.x + halfWidth &&
          pos.y >= values.y - halfHeight &&
          pos.y <= values.y + halfHeight
        ) {
          onLayerSelect(layer.id)
          isDragging.current = true
          dragOffset.current = {
            x: pos.x - values.x,
            y: pos.y - values.y,
          }
          break
        }
      }
    }

    const handlePointerMove = (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging.current || !selectedLayerId) return

      const pos = getEventPos(event)
      const newX = pos.x - dragOffset.current.x
      const newY = pos.y - dragOffset.current.y

      onLayerUpdate(selectedLayerId, { x: newX, y: newY })
    }

    const handlePointerUp = () => {
      isDragging.current = false
    }

    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded-lg shadow-sm max-w-full max-h-full cursor-pointer touch-none"
            style={{ aspectRatio: "1/1" }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            512×512px
          </div>
        </div>
      </div>
    )
  },
)

Canvas.displayName = "Canvas"
