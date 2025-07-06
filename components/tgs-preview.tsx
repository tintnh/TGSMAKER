"use client"

import { useEffect, useRef } from "react"
import type { ImageLayer, AnimationState } from "@/app/page"

interface TGSPreviewProps {
  layers: ImageLayer[]
  animationState: AnimationState
  isPlaying: boolean
}

export function TGSPreview({ layers, animationState, isPlaying }: TGSPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  // Get interpolated values for current time
  const getInterpolatedValues = (layer: ImageLayer, time: number) => {
    const { keyframes } = layer

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

    if (keyframes.length === 1 || time <= keyframes[0].time) {
      return keyframes[0]
    }

    if (time >= keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1]
    }

    // Find surrounding keyframes
    let prevKeyframe = keyframes[0]
    let nextKeyframe = keyframes[keyframes.length - 1]

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        prevKeyframe = keyframes[i]
        nextKeyframe = keyframes[i + 1]
        break
      }
    }

    // Linear interpolation
    const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time)

    return {
      x: prevKeyframe.x + (nextKeyframe.x - prevKeyframe.x) * t,
      y: prevKeyframe.y + (nextKeyframe.y - prevKeyframe.y) * t,
      rotation: prevKeyframe.rotation + (nextKeyframe.rotation - prevKeyframe.rotation) * t,
      scaleX: prevKeyframe.scaleX + (nextKeyframe.scaleX - prevKeyframe.scaleX) * t,
      scaleY: prevKeyframe.scaleY + (nextKeyframe.scaleY - prevKeyframe.scaleY) * t,
      opacity: prevKeyframe.opacity + (nextKeyframe.opacity - prevKeyframe.opacity) * t,
    }
  }

  const renderFrame = (time: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")!

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

    // Layer colors (same as TGS export)
    const colors = [
      "#ef4444", // Red
      "#22c55e", // Green
      "#3b82f6", // Blue
      "#eab308", // Yellow
      "#ec4899", // Pink
      "#06b6d4", // Cyan
      "#f97316", // Orange
      "#8b5cf6", // Purple
    ]

    // Draw layers as colored rectangles (TGS preview)
    layers.forEach((layer, index) => {
      if (!layer.visible) return

      const values = getInterpolatedValues(layer, time)
      const color = colors[index % colors.length]

      ctx.save()

      // Set opacity
      ctx.globalAlpha = values.opacity

      // Transform
      ctx.translate(values.x, values.y)
      ctx.rotate((values.rotation * Math.PI) / 180)
      ctx.scale(values.scaleX, values.scaleY)

      // Draw colored rectangle (representing the TGS shape)
      ctx.fillStyle = color
      ctx.fillRect(-40, -40, 80, 80)

      // Draw border
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2 / Math.min(values.scaleX, values.scaleY)
      ctx.strokeRect(-40, -40, 80, 80)

      ctx.restore()
    })

    // Draw time indicator
    ctx.fillStyle = "#000000"
    ctx.font = "12px monospace"
    ctx.fillText(`${time.toFixed(0)}ms / ${animationState.duration}ms`, 10, 20)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = 512
    canvas.height = 512

    renderFrame(animationState.currentTime)
  }, [layers, animationState.currentTime])

  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - animationState.currentTime

      const animate = () => {
        const elapsed = Date.now() - startTime
        const loopTime = elapsed % animationState.duration

        renderFrame(loopTime)

        if (isPlaying) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, animationState.duration])

  return (
    <div className="flex flex-col items-center space-y-2">
      <h4 className="font-medium">TGS Preview (Vector Shapes)</h4>
      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded-lg shadow-sm"
        style={{ width: "256px", height: "256px" }}
      />
      <p className="text-xs text-gray-500 text-center">
        This shows how your animation will look as TGS
        <br />
        (PNG images become colored rectangles)
      </p>
    </div>
  )
}
