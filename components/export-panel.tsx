"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AnimationState, ImageLayer } from "@/app/page"
import { exportTgsFromLayers } from "@/utils/export-tgs"

interface ExportPanelProps {
  layers: ImageLayer[]
  animationState: AnimationState
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function ExportPanel({ layers, animationState, canvasRef }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExportTGS = async () => {
    setExporting(true)
    setError(null)
    try {
      const blob = await exportTgsFromLayers(layers, animationState)

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "sticker.tgs"
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      setError("Failed to export .tgs")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Export Options</h3>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button onClick={handleExportTGS} disabled={exporting}>
        {exporting ? "Exporting..." : "Export .tgs for Telegram"}
      </Button>
    </div>
  )
}
