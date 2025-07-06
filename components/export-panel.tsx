"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Download, FileJson, Zap, Info, AlertCircle, ImageIcon, Play, Pause } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ImageLayer, AnimationState } from "@/app/page"
import { TGSConverter, LottieConverter } from "@/utils/tgs-converter"
import { TGSPreview } from "@/components/tgs-preview"

interface ExportPanelProps {
  layers: ImageLayer[]
  animationState: AnimationState
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function ExportPanel({ layers, animationState, canvasRef }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [exportedData, setExportedData] = useState<{
    lottie?: any
    tgs?: Blob
    size?: number
  } | null>(null)

  // Add vector tracing option to the export
  const [useVectorTracing, setUseVectorTracing] = useState(true)

  const exportTGS = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      setExportProgress(20)

      const animationData = {
        layers: layers.filter((layer) => layer.visible),
        animationState,
      }

      setExportProgress(40)

      // Update the exportTGS function to use vector tracing
      const tgsBlob = await TGSConverter.convertLottieToTGS(animationData, {
        quality: 90,
        maxSize: 64 * 1024,
        fps: Math.min(animationState.fps, 60),
        useVectorTracing: useVectorTracing,
        tracingOptions: {
          threshold: 128,
          simplify: 0.3,
          maxColors: 6,
        },
      })

      setExportProgress(70)

      // Create Lottie with PNG images
      const lottieData = await LottieConverter.convertToLottie(animationData)

      setExportProgress(90)

      const validation = TGSConverter.validateTGS(tgsBlob)

      if (!validation.valid) {
        throw new Error(`TGS validation failed: ${validation.errors.join(", ")}`)
      }

      setExportedData({
        lottie: lottieData,
        tgs: tgsBlob,
        size: validation.size,
      })

      setExportProgress(100)
      console.log("Export successful!")
    } catch (error) {
      console.error("Export failed:", error)
      alert(`Export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const downloadTGS = () => {
    if (!exportedData?.tgs) return

    const url = URL.createObjectURL(exportedData.tgs)
    const a = document.createElement("a")
    a.href = url
    a.download = "telegram_sticker.tgs"
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadLottie = () => {
    if (!exportedData?.lottie) return

    const blob = new Blob([JSON.stringify(exportedData.lottie, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "animation_with_pngs.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const visibleLayers = layers.filter((l) => l.visible)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Export & Preview</h3>

      {/* TGS Preview */}
      {visibleLayers.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">TGS Preview</h4>
            <Button size="sm" variant="outline" onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}>
              {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPreviewPlaying ? "Pause" : "Play"}
            </Button>
          </div>
          <TGSPreview layers={visibleLayers} animationState={animationState} isPlaying={isPreviewPlaying} />
        </Card>
      )}

      {/* Format Explanation */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Two Export Options:</strong>
          <br />• <strong>TGS</strong> - For Telegram (vector shapes only, no PNG images)
          <br />• <strong>Lottie JSON</strong> - With your actual PNG images (for web/apps)
        </AlertDescription>
      </Alert>

      {/* Animation Status */}
      <Card className="p-4">
        <h4 className="font-medium mb-2">Export Status</h4>
        <div className="space-y-1 text-sm">
          <div className={`flex items-center gap-2 ${visibleLayers.length > 0 ? "text-green-600" : "text-red-600"}`}>
            <div className={`w-2 h-2 rounded-full ${visibleLayers.length > 0 ? "bg-green-500" : "bg-red-500"}`} />
            Layers: {visibleLayers.length} visible / {layers.length} total
          </div>
          <div className={`flex items-center gap-2 ${animationState.fps <= 60 ? "text-green-600" : "text-red-600"}`}>
            <div className={`w-2 h-2 rounded-full ${animationState.fps <= 60 ? "bg-green-500" : "bg-red-500"}`} />
            FPS: {animationState.fps}/60 {animationState.fps <= 60 ? "✓" : "✗"}
          </div>
          <div
            className={`flex items-center gap-2 ${animationState.duration <= 3000 ? "text-green-600" : "text-red-600"}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${animationState.duration <= 3000 ? "bg-green-500" : "bg-red-500"}`}
            />
            Duration: {(animationState.duration / 1000).toFixed(1)}s/3s {animationState.duration <= 3000 ? "✓" : "✗"}
          </div>
          {exportedData?.size && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              TGS Size: {(exportedData.size / 1024).toFixed(1)}KB/64KB ✓
            </div>
          )}
        </div>
      </Card>

      {/* Add vector tracing toggle before the export button */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium">Vector Tracing</h4>
          <p className="text-sm text-gray-600">Convert PNG images to vector paths</p>
        </div>
        <Button
          variant={useVectorTracing ? "default" : "outline"}
          size="sm"
          onClick={() => setUseVectorTracing(!useVectorTracing)}
        >
          {useVectorTracing ? "ON" : "OFF"}
        </Button>
      </div>

      {/* Export Button */}
      <Button onClick={exportTGS} disabled={isExporting || visibleLayers.length === 0} className="w-full">
        {isExporting ? (
          <>
            <Zap className="w-4 h-4 mr-2 animate-spin" />
            Creating Exports...
          </>
        ) : (
          <>
            <FileJson className="w-4 h-4 mr-2" />
            Export Animation
          </>
        )}
      </Button>

      {/* Progress */}
      {isExporting && <Progress value={exportProgress} className="w-full" />}

      {/* Download Buttons */}
      {exportedData && (
        <div className="space-y-2">
          <Button onClick={downloadTGS} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Download TGS for Telegram ({(exportedData.size! / 1024).toFixed(1)}KB)
          </Button>

          <Button onClick={downloadLottie} variant="outline" className="w-full bg-transparent">
            <ImageIcon className="w-4 h-4 mr-2" />
            Download Lottie with PNG Images
          </Button>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>TGS Ready!</strong> The TGS file contains vector shapes (as previewed above). The Lottie JSON
              contains your actual PNG images for other uses.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {visibleLayers.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Add some images and make sure they're visible to export.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
