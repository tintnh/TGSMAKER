"use client"

import { useRef } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import type { ImageLayer, AnimationState, Keyframe } from "@/app/page"

interface TimelineProps {
  layers: ImageLayer[]
  selectedLayerId: string | null
  animationState: AnimationState
  onAnimationStateChange: (state: AnimationState) => void
  onLayerUpdate: (layerId: string, updates: Partial<ImageLayer>) => void
}

export function Timeline({
  layers,
  selectedLayerId,
  animationState,
  onAnimationStateChange,
  onLayerUpdate,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId)

  const updateDuration = (duration: number) => {
    onAnimationStateChange({
      ...animationState,
      duration: Math.max(100, duration),
    })
  }

  const updateCurrentTime = (time: number) => {
    onAnimationStateChange({
      ...animationState,
      currentTime: Math.max(0, Math.min(time, animationState.duration)),
    })
  }

  const addKeyframe = (time: number) => {
    if (!selectedLayer) return

    const newKeyframe: Keyframe = {
      time,
      x: selectedLayer.x,
      y: selectedLayer.y,
      rotation: selectedLayer.rotation,
      scaleX: selectedLayer.scaleX,
      scaleY: selectedLayer.scaleY,
      opacity: selectedLayer.opacity,
    }

    const newKeyframes = [...selectedLayer.keyframes, newKeyframe].sort((a, b) => a.time - b.time)

    onLayerUpdate(selectedLayer.id, { keyframes: newKeyframes })
  }

  const removeKeyframe = (keyframeIndex: number) => {
    if (!selectedLayer || selectedLayer.keyframes.length <= 1) return

    const newKeyframes = selectedLayer.keyframes.filter((_, index) => index !== keyframeIndex)
    onLayerUpdate(selectedLayer.id, { keyframes: newKeyframes })
  }

  const updateKeyframeTime = (keyframeIndex: number, newTime: number) => {
    if (!selectedLayer) return

    const newKeyframes = [...selectedLayer.keyframes]
    newKeyframes[keyframeIndex] = {
      ...newKeyframes[keyframeIndex],
      time: Math.max(0, Math.min(newTime, animationState.duration)),
    }
    newKeyframes.sort((a, b) => a.time - b.time)

    onLayerUpdate(selectedLayer.id, { keyframes: newKeyframes })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Timeline</h3>

        {/* Animation Settings */}
        <div className="space-y-3 mb-6">
          <div>
            <Label htmlFor="duration">Duration (ms)</Label>
            <Input
              id="duration"
              type="number"
              value={animationState.duration}
              onChange={(e) => updateDuration(Number(e.target.value))}
              min={100}
              max={10000}
              step={100}
              className="h-8"
            />
          </div>

          <div>
            <Label htmlFor="fps">FPS (max 60 for TGS)</Label>
            <Input
              id="fps"
              type="number"
              value={animationState.fps}
              onChange={(e) =>
                onAnimationStateChange({
                  ...animationState,
                  fps: Math.max(1, Math.min(60, Number(e.target.value))),
                })
              }
              min={1}
              max={60}
              className="h-8"
            />
          </div>
        </div>

        {/* Time Scrubber */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <Label>Current Time</Label>
            <span className="text-sm text-gray-500">
              {animationState.currentTime}ms / {animationState.duration}ms
            </span>
          </div>
          <Slider
            value={[animationState.currentTime]}
            onValueChange={([value]) => updateCurrentTime(value)}
            min={0}
            max={animationState.duration}
            step={1000 / animationState.fps}
            className="w-full"
          />
        </div>
      </div>

      {/* Layer Keyframes */}
      {selectedLayer && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Keyframes - {selectedLayer.name}</h4>
            <Button size="sm" onClick={() => addKeyframe(animationState.currentTime)}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedLayer.keyframes.map((keyframe, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-2 rounded border ${
                  Math.abs(keyframe.time - animationState.currentTime) < 50
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <Input
                  type="number"
                  value={keyframe.time}
                  onChange={(e) => updateKeyframeTime(index, Number(e.target.value))}
                  min={0}
                  max={animationState.duration}
                  step={1000 / animationState.fps}
                  className="h-8 w-20 text-xs"
                />
                <span className="text-xs text-gray-500 flex-1">
                  x:{Math.round(keyframe.x)} y:{Math.round(keyframe.y)}
                  r:{Math.round(keyframe.rotation)}° s:{keyframe.scaleX.toFixed(1)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateCurrentTime(keyframe.time)}
                  className="h-8 w-8 p-0"
                >
                  →
                </Button>
                {selectedLayer.keyframes.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeKeyframe(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedLayer && <p className="text-gray-500 text-center py-8">Select a layer to edit keyframes</p>}
    </div>
  )
}
