"use client"

import { useRef, useState } from "react"
import type { AnimationState, ImageLayer } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"

interface ExportPanelProps {
  layers: ImageLayer[]
  animationState: AnimationState
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function ExportPanel({ canvasRef }: ExportPanelProps) {
  const [quality, setQuality] = useState<number>(90)
  const [filename, setFilename] = useState("sticker.webp")
  const downloadingRef = useRef(false)

  const handleExport = async () => {
    const canvas = canvasRef.current
    if (!canvas) {
      toast.error("Canvas not ready")
      return
    }

    try {
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(
          (b) => resolve(b),
          "image/webp",
          quality / 100
        )
      )

      if (!blob) {
        toast.error("Export failed")
        return
      }

      // Check Telegram limit: <512KB
      if (blob.size > 512 * 1024) {
        toast.warning("Sticker may be too large for Telegram (>512KB)")
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename.endsWith(".webp") ? filename : `${filename}.webp`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      toast.success("Sticker exported!")
    } catch (err) {
      console.error(err)
      toast.error("Export error")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="filename">File name</Label>
        <Input
          id="filename"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="sticker.webp"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quality">Quality ({quality}%)</Label>
        <Slider
          id="quality"
          value={[quality]}
          min={10}
          max={100}
          step={5}
          onValueChange={(val) => setQuality(val[0])}
        />
      </div>

      <Button
        onClick={handleExport}
        disabled={downloadingRef.current}
        className="w-full"
      >
        Export as .webp
      </Button>
    </div>
  )
}
