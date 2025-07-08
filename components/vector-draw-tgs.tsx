"use client"

import React, { useRef, useState } from "react"

interface VectorDrawerProps {
  onAddVectorLayer: (vectorData: VectorShapeData) => void
}

export interface VectorShapeData {
  type: "path"
  path: string
  stroke: string
  strokeWidth: number
  fill: string
}

export default function VectorDrawer({ onAddVectorLayer }: VectorDrawerProps) {
  const [paths, setPaths] = useState<string[]>([])
  const [currentPath, setCurrentPath] = useState<string>("")
  const svgRef = useRef<SVGSVGElement>(null)

  const [stroke, setStroke] = useState("#000000")
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [fill, setFill] = useState("none")

  // Handle pointer down: start new path
  const onPointerDown = (e: React.PointerEvent) => {
    const svg = svgRef.current
    if (!svg) return

    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())

    setCurrentPath(`M${svgP.x.toFixed(2)} ${svgP.y.toFixed(2)}`)
  }

  // Handle pointer move: add line segments to current path
  const onPointerMove = (e: React.PointerEvent) => {
    if (!currentPath) return
    const svg = svgRef.current
    if (!svg) return

    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())

    setCurrentPath((prev) => prev + ` L${svgP.x.toFixed(2)} ${svgP.y.toFixed(2)}`)
  }

  // Handle pointer up: finish current path and add to paths array
  const onPointerUp = () => {
    if (currentPath) {
      setPaths((prev) => [...prev, currentPath])
      setCurrentPath("")
    }
  }

  // Clear all drawn paths
  const clearPaths = () => {
    setPaths([])
    setCurrentPath("")
  }

  // Add last path (or all paths combined) as vector layer
  const addShape = () => {
    const combinedPath = [...paths, currentPath].filter(Boolean).join(" ")
    if (!combinedPath) return

    onAddVectorLayer({
      type: "path",
      path: combinedPath,
      stroke,
      strokeWidth,
      fill,
    })

    clearPaths()
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-2">
        <label className="flex items-center space-x-1">
          <span>Stroke:</span>
          <input
            type="color"
            value={stroke}
            onChange={(e) => setStroke(e.target.value)}
            className="w-10 h-6 p-0 border rounded"
          />
        </label>
        <label className="flex items-center space-x-1">
          <span>Stroke Width:</span>
          <input
            type="number"
            min={1}
            max={10}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-16 p-1 border rounded"
          />
        </label>
        <label className="flex items-center space-x-1">
          <span>Fill:</span>
          <input
            type="color"
            value={fill === "none" ? "#ffffff" : fill}
            onChange={(e) => setFill(e.target.value)}
            className="w-10 h-6 p-0 border rounded"
          />
          <button
            type="button"
            onClick={() => setFill("none")}
            className="ml-2 px-2 py-1 border rounded text-sm"
          >
            None
          </button>
        </label>
      </div>

      <svg
        ref={svgRef}
        className="border rounded bg-white touch-none select-none"
        style={{ width: "100%", height: "300px", touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {paths.map((d, i) => (
          <path key={i} d={d} stroke={stroke} strokeWidth={strokeWidth} fill={fill} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {currentPath && (
          <path d={currentPath} stroke={stroke} strokeWidth={strokeWidth} fill={fill} strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>

      <div className="flex space-x-2">
        <button
          onClick={addShape}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Shape
        </button>
        <button
          onClick={clearPaths}
          className="px-4 py-2 border rounded-md hover:bg-gray-100"
        >
          Clear
        </button>
      </div>
    </div>
  )
    }
