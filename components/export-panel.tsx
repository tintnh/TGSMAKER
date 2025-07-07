"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { convertToTGS } from "@/utils/tgs-converter"
import { ImageLayer, AnimationState } from "@/app/page"
import { saveAs } from "file-saver"

interface ExportPanelProps {
  layers: ImageLayer[]
  animationState: AnimationState
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function ExportPanel({ layers, animationState, canvasRef }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false)
  const [fileName, setFileName] = useState("sticker")

  const handleExportTGS = async () => {
    try {
      setExporting(true)

      // Convert animation data to compressed TGS format
      const tgsBlob = await convertToTGS(layers, animationState)

      // ✅ Force file extension as .tgs, not .gz
      saveAs(tgsBlob, `${fileName.trim() || "sticker"}.tgs`)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Check console for details.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">File Name</label>
        <Input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="Enter file name"
          className="w-full"
        />
      </div>

      <Button
        onClick={handleExportTGS}
        disabled={exporting}
        className="w-full"
      >
        {exporting ? "Exporting..." : "Export .tgs"}
      </Button>
    </div>
  )
}
