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

export function ExportPanel({ layers, animationState }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false)
  const [fileName, setFileName] = useState("sticker")

  const handleExportTGS = async () => {
    try {
      setExporting(true)

      const tgsData = await convertToTGS(layers, animationState)

      const name = fileName.trim().replace(/\.tgs$/i, "") || "sticker"

      // ✅ Use correct MIME type and .tgs extension
      const blob = new Blob([tgsData], {
        type: "application/x-tgs", // important: not application/gzip
      })

      saveAs(blob, `${name}.tgs`)
    } catch (err) {
      console.error("TGS export failed:", err)
      alert("Export failed. Check console for details.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">File name</label>
        <Input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="sticker"
        />
      </div>

      <Button
        onClick={handleExportTGS}
        disabled={exporting}
        className="w-full"
      >
        {exporting ? "Exporting..." : "Export as .tgs"}
      </Button>
    </div>
  )
}
