"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square, SkipBack, SkipForward } from "lucide-react"
import type { AnimationState } from "@/app/page"

interface PlaybackControlsProps {
  animationState: AnimationState
  onAnimationStateChange: (state: AnimationState) => void
}

export function PlaybackControls({ animationState, onAnimationStateChange }: PlaybackControlsProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (animationState.isPlaying) {
      intervalRef.current = setInterval(() => {
        onAnimationStateChange((prev) => {
          const nextTime = prev.currentTime + 1000 / prev.fps
          if (nextTime >= prev.duration) {
            return { ...prev, currentTime: 0 } // Loop
          }
          return { ...prev, currentTime: nextTime }
        })
      }, 1000 / animationState.fps)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [animationState.isPlaying, animationState.fps, onAnimationStateChange])

  const togglePlayback = () => {
    onAnimationStateChange({
      ...animationState,
      isPlaying: !animationState.isPlaying,
    })
  }

  const stop = () => {
    onAnimationStateChange({
      ...animationState,
      isPlaying: false,
      currentTime: 0,
    })
  }

  const skipToStart = () => {
    onAnimationStateChange({
      ...animationState,
      currentTime: 0,
    })
  }

  const skipToEnd = () => {
    onAnimationStateChange({
      ...animationState,
      currentTime: animationState.duration,
    })
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" onClick={skipToStart}>
        <SkipBack className="w-4 h-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={togglePlayback}>
        {animationState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>

      <Button variant="outline" size="sm" onClick={stop}>
        <Square className="w-4 h-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={skipToEnd}>
        <SkipForward className="w-4 h-4" />
      </Button>

      <div className="ml-4 text-sm text-gray-600">
        {Math.round(animationState.currentTime)}ms / {animationState.duration}ms
      </div>
    </div>
  )
}
