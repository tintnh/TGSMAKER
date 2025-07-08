"use client"

import { useRef, useState, useCallback } from "react"
import { ImageUploader } from "@/components/image-uploader"
import { Canvas } from "@/components/canvas"
import { Timeline } from "@/components/timeline"
import { TransformTools } from "@/components/transform-tools"
import { PlaybackControls } from "@/components/playback-controls"
import { ExportPanel } from "@/components/export-panel"
import { LayerManager } from "@/components/layer-manager"
import { VectorDrawTGS } from "@/components/vector-draw-tgs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { compressImage } from "@/utils/compress-image"

export interface Keyframe {
  time: number
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
}

export interface ImageLayer {
  id: string
  name: string
  src: string
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
  visible: boolean
  keyframes: Keyframe[]
  isVector?: boolean
  vectorData?: string
}

export interface AnimationState {
  currentTime: number
  duration: number
  isPlaying: boolean
  fps: number
}

export default function AnimationStudio() {
  const [layers, setLayers] = useState<ImageLayer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [animationState, setAnimationState] = useState<AnimationState>({
    currentTime: 0,
    duration: 3000,
    isPlaying: false,
    fps: 30,
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const addImages = useCallback(
    (files: File[]) => {
      files.forEach(async (file, index) => {
        let src: string

        if (file.type === "image/svg+xml") {
          const svgText = await file.text()
          const svgBlob = new Blob([svgText], { type: "image/svg+xml" })
          src = URL.createObjectURL(svgBlob)
        } else {
          src = await compressImage(file, { maxSize: 512, quality: 0.6 })
        }

        const newLayer: ImageLayer = {
          id: `layer-${Date.now()}-${index}`,
          name: file.name,
          src,
          x: 256 + index * 20,
          y: 256 + index * 20,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          visible: true,
          keyframes: [
            {
              time: 0,
              x: 256 + index * 20,
              y: 256 + index * 20,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
            },
          ],
        }

        setLayers((prev) => [...prev, newLayer])
        if (!selectedLayerId) {
          setSelectedLayerId(newLayer.id)
        }
      })
    },
    [selectedLayerId],
  )

  const addVectorShape = useCallback((svgPathData: string) => {
    const newLayer: ImageLayer = {
      id: `vector-${Date.now()}`,
      name: "Vector Shape",
      src: "",
      x: 256,
      y: 256,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      isVector: true,
      vectorData: svgPathData,
      keyframes: [
        {
          time: 0,
          x: 256,
          y: 256,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
        },
      ],
    }

    setLayers((prev) => [...prev, newLayer])
    setSelectedLayerId(newLayer.id)
  }, [])

  const updateLayer = useCallback((layerId: string, updates: Partial<ImageLayer>) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer)),
    )
  }, [])

  const deleteLayer = useCallback(
    (layerId: string) => {
      setLayers((prev) => prev.filter((layer) => layer.id !== layerId))
      if (selectedLayerId === layerId) {
        setSelectedLayerId(null)
      }
    },
    [selectedLayerId],
  )

  const reorderLayers = useCallback((from: number, to: number) => {
    setLayers((prev) => {
      const copy = [...prev]
      const [moved] = copy.splice(from, 1)
      copy.splice(to, 0, moved)
      return copy
    })
  }, [])

  const selectedLayer = layers.find((l) => l.id === selectedLayerId)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold text-gray-900">TGS Maker</h1>
        <p className="text-sm text-gray-600">Import images or draw SVG vectors, animate, and export as .tgs</p>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Canvas Area */}
        <div className="flex-1 p-4 space-y-4">
          <Card className="flex-1">
            <Canvas
              ref={canvasRef}
              layers={layers}
              selectedLayerId={selectedLayerId}
              onLayerSelect={setSelectedLayerId}
              onLayerUpdate={updateLayer}
              animationState={animationState}
            />
          </Card>
          <Card className="p-4">
            <PlaybackControls
              animationState={animationState}
              onAnimationStateChange={setAnimationState}
            />
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200">
          <Tabs defaultValue="layers" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="transform">Transform</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="layers" className="p-4 space-y-4">
              <ImageUploader onImagesAdded={addImages} />
              <VectorDrawTGS onShapeComplete={addVectorShape} />
              <LayerManager
                layers={layers}
                selectedLayerId={selectedLayerId}
                onLayerSelect={setSelectedLayerId}
                onLayerUpdate={updateLayer}
                onLayerDelete={deleteLayer}
                onLayerReorder={reorderLayers}
              />
            </TabsContent>

            <TabsContent value="transform" className="p-4">
              {selectedLayer ? (
                <TransformTools
                  layer={selectedLayer}
                  onUpdate={(updates) => updateLayer(selectedLayer.id, updates)}
                  animationState={animationState}
                />
              ) : (
                <p className="text-center text-gray-400 py-8">Select a layer to edit</p>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="p-4">
              <Timeline
                layers={layers}
                selectedLayerId={selectedLayerId}
                animationState={animationState}
                onAnimationStateChange={setAnimationState}
                onLayerUpdate={updateLayer}
              />
            </TabsContent>

            <TabsContent value="export" className="p-4">
              <ExportPanel
                layers={layers}
                animationState={animationState}
                canvasRef={canvasRef}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
