"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, GripVertical, Trash2, Settings } from "lucide-react"
import type { ImageLayer } from "@/app/page"

interface LayerManagerProps {
  layers: ImageLayer[]
  selectedLayerId: string | null
  onLayerSelect: (layerId: string) => void
  onLayerUpdate: (layerId: string, updates: Partial<ImageLayer>) => void
  onLayerDelete: (layerId: string) => void
  onLayerReorder: (fromIndex: number, toIndex: number) => void
}

export function LayerManager({
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerUpdate,
  onLayerDelete,
  onLayerReorder,
}: LayerManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onLayerReorder(draggedIndex, dropIndex)
    }

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Layers</h4>
        <span className="text-sm text-gray-500">{layers.length} layers</span>
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto">
        {layers.map((layer, index) => (
          <Card
            key={layer.id}
            className={`p-2 cursor-pointer transition-all duration-200 ${
              selectedLayerId === layer.id
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            } ${dragOverIndex === index ? "border-green-500 bg-green-50" : ""} ${
              draggedIndex === index ? "opacity-50 scale-95" : ""
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onLayerSelect(layer.id)}
          >
            <div className="flex items-center gap-2">
              {/* Drag Handle */}
              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />

              {/* Layer Preview */}
              <div className="w-8 h-8 rounded border bg-gray-100 flex-shrink-0 overflow-hidden">
                {layer.src && (
                  <img src={layer.src || "/placeholder.svg"} alt={layer.name} className="w-full h-full object-cover" />
                )}
              </div>

              {/* Layer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{layer.name}</span>
                  <div className="flex items-center gap-1">
                    {/* Layer Index */}
                    <span className="text-xs text-gray-400 bg-gray-200 px-1 rounded">{index + 1}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {layer.keyframes.length} keyframes • {Math.round(layer.opacity * 100)}% opacity
                </div>
              </div>

              {/* Layer Controls */}
              <div className="flex items-center gap-1">
                {/* Visibility Toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-6 h-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onLayerUpdate(layer.id, { visible: !layer.visible })
                  }}
                >
                  {layer.visible ? (
                    <Eye className="w-3 h-3 text-blue-500" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-gray-400" />
                  )}
                </Button>

                {/* Delete Layer */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-6 h-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete layer "${layer.name}"?`)) {
                      onLayerDelete(layer.id)
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Transform Info */}
            {selectedLayerId === layer.id && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    X: {Math.round(layer.x)}, Y: {Math.round(layer.y)}
                  </div>
                  <div>Scale: {(layer.scaleX * 100).toFixed(0)}%</div>
                  <div>Rotation: {Math.round(layer.rotation)}°</div>
                  <div>Opacity: {Math.round(layer.opacity * 100)}%</div>
                </div>
              </div>
            )}
          </Card>
        ))}

        {layers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No layers yet</p>
            <p className="text-xs">Upload images to get started</p>
          </div>
        )}
      </div>

      {dragOverIndex !== null && <div className="text-xs text-green-600 text-center py-1">Drop to reorder layers</div>}
    </div>
  )
}
