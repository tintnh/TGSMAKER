"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { downloadFile } from "@/utils/download-file"
import { convertToTGS } from "@/utils/tgs-converter"
import type { ImageLayer, AnimationState } from "@/app/page"

interface ExportPanelProps {
  layers: ImageLayer[]
  animationState: AnimationState
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function ExportPanel({ layers, animationState, canvasRef }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExportTGS = async () => {
    setIsExporting(true)
    setError(null)

    try {
      const tgsData = await convertToTGS(layers, animationState)

      const blob = new Blob([tgsData], { type: "application/gzip" })
      downloadFile(blob, "animation.tgs")
    } catch (err: any) {
      console.error("TGS Export failed:", err)
      setError("Failed to export .tgs. Check console for details.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Export Options</h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex flex-col space-y-2">
        <Button onClick={handleExportTGS} disabled={isExporting}>
          {isExporting ? "Exporting..." : "Export as .tgs (Telegram)"}
        </Button>
      </div>
    </div>
  )
}
