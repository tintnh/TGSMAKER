"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { saveAs } from "file-saver"
import { convertToTGS } from "@/utils/tgs-converter"
import type { ImageLayer, AnimationState } from "@/app/page"

interface ExportPanelProps {
  layers: ImageLayer[]
  animationState: AnimationState
}

export function ExportPanel({ layers, animationState }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false)

  const handleTGSExport = async () => {
    setExporting(true)
    try {
      const tgsData = await convertToTGS(layers, animationState)

      // ✅ Save the file with a .tgs extension and custom name
      const blob = new Blob([tgsData], { type: "application/gzip" })
      saveAs(blob, "sticker.tgs")

      toast.success("TGS exported successfully!")
    } catch (err) {
      console.error("Export failed", err)
      toast.error("TGS export failed.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <h2 className="text-lg font-semibold mb-2">Export</h2>
      <Button onClick={handleTGSExport} disabled={exporting}>
        {exporting ? "Exporting..." : "Export .tgs"}
      </Button>
    </div>
  )
}
