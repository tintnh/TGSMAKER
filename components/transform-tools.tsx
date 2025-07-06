"use client"

import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RotateCcw, Move, Scale, Eye } from "lucide-react"
import type { ImageLayer, AnimationState } from "@/app/page"

interface TransformToolsProps {
  layer: ImageLayer
  onUpdate: (updates: Partial<ImageLayer>) => void
  animationState: AnimationState
}

export function TransformTools({ layer, onUpdate, animationState }: TransformToolsProps) {
  const addKeyframe = () => {
    const newKeyframe = {
      time: animationState.currentTime,
      x: layer.x,
      y: layer.y,
      rotation: layer.rotation,
      scaleX: layer.scaleX,
      scaleY: layer.scaleY,
      opacity: layer.opacity,
    }

    const existingIndex = layer.keyframes.findIndex((kf) => kf.time === animationState.currentTime)

    if (existingIndex >= 0) {
      // Update existing keyframe
      const newKeyframes = [...layer.keyframes]
      newKeyframes[existingIndex] = newKeyframe
      onUpdate({ keyframes: newKeyframes })
    } else {
      // Add new keyframe and sort by time
      const newKeyframes = [...layer.keyframes, newKeyframe].sort((a, b) => a.time - b.time)
      onUpdate({ keyframes: newKeyframes })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transform</h3>
        <Button onClick={addKeyframe} size="sm">
          Add Keyframe
        </Button>
      </div>

      {/* Position */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4" />
          <Label>Position</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="x" className="text-xs">
              X
            </Label>
            <Input
              id="x"
              type="number"
              value={Math.round(layer.x)}
              onChange={(e) => onUpdate({ x: Number(e.target.value) })}
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="y" className="text-xs">
              Y
            </Label>
            <Input
              id="y"
              type="number"
              value={Math.round(layer.y)}
              onChange={(e) => onUpdate({ y: Number(e.target.value) })}
              className="h-8"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          <Label>Rotation</Label>
          <span className="text-sm text-gray-500 ml-auto">{Math.round(layer.rotation)}°</span>
        </div>
        <Slider
          value={[layer.rotation]}
          onValueChange={([value]) => onUpdate({ rotation: value })}
          min={-180}
          max={180}
          step={1}
          className="w-full"
        />
      </div>

      {/* Scale */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4" />
          <Label>Scale</Label>
        </div>
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Width: {(layer.scaleX * 100).toFixed(0)}%</Label>
            <Slider
              value={[layer.scaleX]}
              onValueChange={([value]) => onUpdate({ scaleX: value })}
              min={0.1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
          <div>
            <Label className="text-xs">Height: {(layer.scaleY * 100).toFixed(0)}%</Label>
            <Slider
              value={[layer.scaleY]}
              onValueChange={([value]) => onUpdate({ scaleY: value })}
              min={0.1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <Label>Opacity</Label>
          <span className="text-sm text-gray-500 ml-auto">{Math.round(layer.opacity * 100)}%</span>
        </div>
        <Slider
          value={[layer.opacity]}
          onValueChange={([value]) => onUpdate({ opacity: value })}
          min={0}
          max={1}
          step={0.01}
          className="w-full"
        />
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        onClick={() =>
          onUpdate({
            x: 256,
            y: 256,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
          })
        }
        className="w-full"
      >
        Reset Transform
      </Button>
    </div>
  )
}
