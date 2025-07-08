"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { v4 as uuidv4 } from "uuid"

export type VectorShape = {
  id: string
  type: "rectangle" | "ellipse" | "path"
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string
  strokeWidth: number
  pathData?: string
}

interface VectorDrawerProps {
  shapes: VectorShape[]
  setShapes: (shapes: VectorShape[]) => void
}

export function VectorDrawer({ shapes, setShapes }: VectorDrawerProps) {
  const [currentType, setCurrentType] = useState<"rectangle" | "ellipse" | "path">("rectangle")

  const addShape = () => {
    const baseShape: VectorShape = {
      id: uuidv4(),
      type: currentType,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      fill: "#00bcd4",
      stroke: "#333",
      strokeWidth: 2,
    }

    if (currentType === "path") {
      baseShape.pathData = "M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80"
    }

    setShapes([...shapes, baseShape])
  }

  const updateShape = (id: string, updates: Partial<VectorShape>) => {
    setShapes(shapes.map(s => (s.id === id ? { ...s, ...updates } : s)))
  }

  const deleteShape = (id: string) => {
    setShapes(shapes.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          className="border p-1 rounded"
          value={currentType}
          onChange={(e) => setCurrentType(e.target.value as any)}
        >
          <option value="rectangle">Rectangle</option>
          <option value="ellipse">Ellipse</option>
          <option value="path">Path</option>
        </select>
        <Button onClick={addShape}>Add</Button>
      </div>

      <svg viewBox="0 0 512 512" width={512} height={512} className="border rounded bg-white">
        {shapes.map((shape) => {
          switch (shape.type) {
            case "rectangle":
              return (
                <rect
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                />
              )
            case "ellipse":
              return (
                <ellipse
                  key={shape.id}
                  cx={shape.x + shape.width / 2}
                  cy={shape.y + shape.height / 2}
                  rx={shape.width / 2}
                  ry={shape.height / 2}
                  fill={shape.fill}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                />
              )
            case "path":
              return (
                <path
                  key={shape.id}
                  d={shape.pathData || ""}
                  fill={shape.fill}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                />
              )
            default:
              return null
          }
        })}
      </svg>

      <div className="space-y-2">
        {shapes.map((shape) => (
          <div key={shape.id} className="border rounded p-2 space-y-1">
            <div className="flex justify-between">
              <strong>{shape.type}</strong>
              <Button variant="destructive" size="sm" onClick={() => deleteShape(shape.id)}>
                Delete
              </Button>
            </div>
            <div className="flex flex-col space-y-1">
              <label>
                Fill:
                <input
                  type="color"
                  value={shape.fill}
                  onChange={(e) => updateShape(shape.id, { fill: e.target.value })}
                />
              </label>
              <label>
                Stroke:
                <input
                  type="color"
                  value={shape.stroke}
                  onChange={(e) => updateShape(shape.id, { stroke: e.target.value })}
                />
              </label>
              <label>
                Stroke Width:
                <input
                  type="number"
                  value={shape.strokeWidth}
                  onChange={(e) => updateShape(shape.id, { strokeWidth: +e.target.value })}
                />
              </label>
              {shape.type === "path" && (
                <label>
                  Path Data:
                  <input
                    type="text"
                    value={shape.pathData}
                    onChange={(e) => updateShape(shape.id, { pathData: e.target.value })}
                    className="w-full border px-2 py-1 rounded"
                  />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
      }
