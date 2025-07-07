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

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      contextRef.current = ctx

      canvas.width = 512
      canvas.height = 512

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
    }, [])

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

    const getInterpolatedValues = (layer: ImageLayer) => {
      const { keyframes } = layer
      const t = animationState.currentTime
      if (keyframes.length === 0) return layer

      if (keyframes.length === 1 || t <= keyframes[0].time) return keyframes[0]
      if (t >= keyframes[keyframes.length - 1].time) return keyframes[keyframes.length - 1]

      let prev = keyframes[0], next = keyframes[keyframes.length - 1]
      for (let i = 0; i < keyframes.length - 1; i++) {
        if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
          prev = keyframes[i]
          next = keyframes[i + 1]
          break
        }
      }

      const k = (t - prev.time) / (next.time - prev.time)
      return {
        x: prev.x + (next.x - prev.x) * k,
        y: prev.y + (next.y - prev.y) * k,
        rotation: prev.rotation + (next.rotation - prev.rotation) * k,
        scaleX: prev.scaleX + (next.scaleX - prev.scaleX) * k,
        scaleY: prev.scaleY + (next.scaleY - prev.scaleY) * k,
        opacity: prev.opacity + (next.opacity - prev.opacity) * k,
      }
    }

    const renderCanvas = () => {
      const canvas = canvasRef.current
      const ctx = contextRef.current
      if (!canvas || !ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const checkSize = 20
      for (let x = 0; x < canvas.width; x += checkSize) {
        for (let y = 0; y < canvas.height; y += checkSize) {
          ctx.fillStyle = (x / checkSize + y / checkSize) % 2 === 0 ? "#f0f0f0" : "#ffffff"
          ctx.fillRect(x, y, checkSize, checkSize)
        }
      }

      layers.forEach((layer) => {
        if (!layer.visible) return

        const img = imagesRef.current.get(layer.id)
        if (!img) return

        const values = getInterpolatedValues(layer)

        ctx.save()
        ctx.globalAlpha = values.opacity
        ctx.translate(values.x, values.y)
        ctx.rotate((values.rotation * Math.PI) / 180)
        ctx.scale(values.scaleX, values.scaleY)

        const w = img.width
        const h = img.height
        ctx.drawImage(img, -w / 2, -h / 2, w, h)

        if (selectedLayerId === layer.id) {
          ctx.strokeStyle = "#3b82f6"
          ctx.lineWidth = 2 / Math.min(values.scaleX, values.scaleY)
          ctx.strokeRect(-w / 2, -h / 2, w, h)
        }

        ctx.restore()
      })
    }

    useEffect(() => {
      renderCanvas()
    }, [layers, selectedLayerId, animationState.currentTime])

    const getEventPos = (event: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current
      const rect = canvas?.getBoundingClientRect()
      const scaleX = canvas!.width / rect!.width
      const scaleY = canvas!.height / rect!.height

      let clientX, clientY
      if ("touches" in event) {
        clientX = event.touches[0]?.clientX || 0
        clientY = event.touches[0]?.clientY || 0
      } else {
        clientX = event.clientX
        clientY = event.clientY
      }

      return {
        x: (clientX - rect!.left) * scaleX,
        y: (clientY - rect!.top) * scaleY,
      }
    }

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
      const pos = getEventPos(e)
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i]
        if (!layer.visible) continue
        const img = imagesRef.current.get(layer.id)
        if (!img) continue

        const { x, y, scaleX, scaleY } = getInterpolatedValues(layer)
        const halfW = (img.width * scaleX) / 2
        const halfH = (img.height * scaleY) / 2

        if (pos.x >= x - halfW && pos.x <= x + halfW && pos.y >= y - halfH && pos.y <= y + halfH) {
          onLayerSelect(layer.id)
          isDragging.current = true
          dragOffset.current = { x: pos.x - x, y: pos.y - y }
          break
        }
      }
    }

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging.current || !selectedLayerId) return
      const pos = getEventPos(e)
      onLayerUpdate(selectedLayerId, {
        x: pos.x - dragOffset.current.x,
        y: pos.y - dragOffset.current.y,
      })
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
