"use client"

import React, { forwardRef, useEffect, useRef } from "react" import type { Layer, AnimationState } from "@/app/page"

interface CanvasProps { layers: Layer[] selectedLayerId: string | null onLayerSelect: (id: string) => void onLayerUpdate: (id: string, updates: Partial<Layer>) => void animationState: AnimationState }

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>( ({ layers, selectedLayerId, onLayerSelect, onLayerUpdate, animationState }, ref) => { const internalRef = useRef<HTMLCanvasElement>(null) const canvasRef = (ref as React.RefObject<HTMLCanvasElement>) || internalRef

useEffect(() => {
  const canvas = canvasRef.current
  const ctx = canvas?.getContext("2d")
  if (!canvas || !ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Calculate current frame state
  const time = animationState.currentTime

  for (const layer of layers) {
    if (!layer.visible) continue

    // Interpolate keyframe values
    const frame = interpolateKeyframes(layer, time)

    ctx.save()
    ctx.translate(frame.x, frame.y)
    ctx.rotate((frame.rotation * Math.PI) / 180)
    ctx.scale(frame.scaleX, frame.scaleY)
    ctx.globalAlpha = frame.opacity

    if (layer.type === "image") {
      const image = new Image()
      image.src = layer.src
      image.onload = () => {
        ctx.drawImage(image, -image.width / 2, -image.height / 2)
      }
    } else if (layer.type === "vector") {
      ctx.fillStyle = layer.color || "black"
      for (const path of layer.paths) {
        const svgPath = new Path2D(path)
        ctx.fill(svgPath)
      }
    }

    ctx.restore()
  }
}, [layers, animationState.currentTime])

return (
  <canvas
    ref={canvasRef}
    width={512}
    height={512}
    className="border w-full max-w-full aspect-square bg-white"
  />
)

} ) Canvas.displayName = "Canvas"

function interpolateKeyframes(layer: Layer, time: number) { const frames = layer.keyframes if (frames.length === 0) { return { x: layer.x, y: layer.y, rotation: layer.rotation, scaleX: layer.scaleX, scaleY: layer.scaleY, opacity: layer.opacity, } }

const before = [...frames].reverse().find((kf) => kf.time <= time) || frames[0] const after = frames.find((kf) => kf.time >= time) || frames[frames.length - 1]

if (before === after) return before

const progress = (time - before.time) / (after.time - before.time) const lerp = (a: number, b: number) => a + (b - a) * progress

return { x: lerp(before.x, after.x), y: lerp(before.y, after.y), rotation: lerp(before.rotation, after.rotation), scaleX: lerp(before.scaleX, after.scaleX), scaleY: lerp(before.scaleY, after.scaleY), opacity: lerp(before.opacity, after.opacity), } }

                       
