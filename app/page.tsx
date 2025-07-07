"use client"

import { useState, useRef, useCallback } from "react"
import { ImageUploader } from "@/components/image-uploader"
import { Canvas } from "@/components/canvas"
import { Timeline } from "@/components/timeline"
import { TransformTools } from "@/components/transform-tools"
import { PlaybackControls } from "@/components/playback-controls"
import { ExportPanel } from "@/components/export-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { compressImage } from "@/utils/compress-image"
import { LayerManager } from "@/components/layer-manager"

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
}

export interface Keyframe {
  time: number
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
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
        const isImage = file.type.startsWith("image/") || file.name.endsWith(".svg")

        if (!isImage) {
          alert(`⚠️ ${file.name} is not a supported image file.`)
          return
        }

        try {
          let src: string

          if (file.name.endsWith(".svg")) {
            // SVGs: use raw object URL
            src = URL.createObjectURL(file)
          } else {
            // Other images: compress before using
            src = await compressImage(file, {
              maxSize: 512,
              quality: 0.6,
            })
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
        } catch (error) {
          console.error("Failed to load image:", error)
          alert(`❌ Failed to load ${file.name}`)
        }
      })
    },
    [selectedLayerId]
  )

  const updateLayer = useCallback((layerId: string, updates: Partial<ImageLayer>) => {
    setLayers((prev) => prev.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer)))
  }, [])

  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId)

  const deleteLayer = useCallback(
    (layerId: string) => {
      setLayers((prev) => prev.filter((layer) => layer.id !== layerId))
      if (selectedLayerId === layerId) {
        setSelectedLayerId(null)
      }
    },
    [selectedLayerId]
  )

  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setLayers((prev) => {
      const newLayers = [...prev]
      const [movedLayer] = newLayers.splice(fromIndex, 1)
      newLayers.splice(toIndex, 0, movedLayer)
      return newLayers
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold text-gray-900">Animation Studio</h1>
        <p className="text-sm text-gray-600">Create animated stickers for Telegram</p>
      </header>

      {/* Main Content */}
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
            <PlaybackControls animationState={animationState} onAnimationStateChange={setAnimationState} />
          </Card>
        </div>

        {/* Side Panel */}
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
                <p className="text-gray-500 text-center py-8">Select a layer to edit</p>
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
              <ExportPanel layers={layers} animationState={animationState} canvasRef={canvasRef} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
    }
