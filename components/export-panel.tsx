"use client"

import { useState } from "react" import { Button } from "@/components/ui/button" import { saveAs } from "file-saver" import { convertToTGS } from "@/utils/tgs-converter" import type { ImageLayer, AnimationState } from "@/app/page"

interface ExportPanelProps { layers: ImageLayer[] animationState: AnimationState canvasRef: React.RefObject<HTMLCanvasElement> }

export function ExportPanel({ layers, animationState, canvasRef }: ExportPanelProps) { const [exporting, setExporting] = useState(false)

const handleExportTGS = async () => { try { setExporting(true)

// Convert current layers and animation to Lottie-compliant JSON
  const tgsBuffer = await convertToTGS(layers, animationState)

  // Create a blob and download as .tgs (without gzip)
  const blob = new Blob([tgsBuffer], { type: "application/json" })
  saveAs(blob, "animated-sticker.tgs")
} catch (error) {
  console.error("Export failed:", error)
  alert("Failed to export .tgs")
} finally {
  setExporting(false)
}

}

return ( <div className="space-y-4"> <Button onClick={handleExportTGS} disabled={exporting}> {exporting ? "Exporting..." : ".tgs Export (Telegram)"} </Button> </div> ) }

                            
