export type LayerType = "image" | "shape"

export interface ShapeData {
  type: "rect" | "ellipse" | "path"
  props: { [key: string]: any }
  fill: string
  stroke: string
}

export interface BaseLayer {
  id: string
  name: string
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
  visible: boolean
  keyframes: Keyframe[]
}

export interface ImageLayer extends BaseLayer {
  type: "image"
  src: string
}

export interface ShapeLayer extends BaseLayer {
  type: "shape"
  shape: ShapeData
}

export type Layer = ImageLayer | ShapeLayer
