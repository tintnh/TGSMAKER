// TGS Converter - Vector shapes only (Telegram requirement)
import pako from "pako"
import { VectorTracer } from "./vector-tracer"

export interface TGSOptions {
  quality: number
  maxSize: number
  fps: number
  useVectorTracing: boolean
  tracingOptions?: {
    threshold: number
    simplify: number
    maxColors: number
  }
}

export class TGSConverter {
  private static readonly MAX_SIZE = 64 * 1024 // 64KB
  private static readonly MAX_FPS = 60

  // Create TGS with vector tracing or simple shapes
  static async convertLottieToTGS(animationData: any, options: TGSOptions): Promise<Blob> {
    try {
      const { layers, animationState } = animationData
      const frameRate = Math.min(options.fps, 60)
      const totalFrames = Math.ceil((animationState.duration / 1000) * frameRate)

      // Create TGS structure
      const tgsData = {
        tgs: 1,
        v: "5.5.7",
        fr: frameRate,
        ip: 0,
        op: totalFrames,
        w: 512,
        h: 512,
        nm: "Vector Animation",
        ddd: 0,
        assets: [],
        layers: await Promise.all(
          layers.map((layer: any, index: number) =>
            this.createVectorLayer(layer, index, animationState, totalFrames, options),
          ),
        ),
      }

      const jsonString = JSON.stringify(tgsData)
      const compressed = pako.gzip(jsonString, {
        level: 6,
        windowBits: 15,
        memLevel: 8,
        strategy: 0,
      })

      const blob = new Blob([compressed], {
        type: "application/x-tgsticker",
      })

      console.log(`TGS file created: ${(blob.size / 1024).toFixed(1)}KB`)
      return blob
    } catch (error) {
      console.error("TGS conversion failed:", error)
      throw error
    }
  }

  private static async createVectorLayer(
    layer: any,
    index: number,
    animationState: any,
    totalFrames: number,
    options: TGSOptions,
  ) {
    // Create keyframe data for transforms
    const createKeyframes = (property: string) => {
      if (layer.keyframes.length <= 1) {
        const value = this.getStaticValue(layer, property)
        return { a: 0, k: value }
      }

      return {
        a: 1,
        k: layer.keyframes.map((kf: any, kfIndex: number) => {
          const frameTime = (kf.time / animationState.duration) * totalFrames
          const value = this.getKeyframeValue(kf, property)

          return {
            i: { x: [0.833], y: [0.833] },
            o: { x: [0.167], y: [0.167] },
            t: Math.round(frameTime),
            s: value,
            ...(kfIndex === layer.keyframes.length - 1 ? {} : { n: "0p833_0p833_0p167_0p167" }),
          }
        }),
      }
    }

    // Get vector paths from image
    let shapes: any[] = []

    if (options.useVectorTracing && layer.src) {
      try {
        const paths = await VectorTracer.tracePNGToSVG(layer.src, options.tracingOptions)

        // Create shapes from traced paths
        shapes = paths.map((path, pathIndex) => ({
          ty: "gr",
          it: [
            {
              ind: pathIndex,
              ty: "sh", // Shape path
              ks: {
                a: 0,
                k: this.pathToLottieShape(path),
              },
            },
            {
              ty: "fl", // Fill
              c: { a: 0, k: this.getLayerColor(index, pathIndex) },
              o: { a: 0, k: 100 },
              r: 1,
              bm: 0,
            },
            {
              ty: "tr", // Transform
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
            },
          ],
          nm: `Shape ${pathIndex + 1}`,
          bm: 0,
        }))
      } catch (error) {
        console.warn(`Vector tracing failed for layer ${index}, using fallback shape`)
        shapes = [this.createFallbackShape(index)]
      }
    } else {
      // Use simple rectangle shape
      shapes = [this.createFallbackShape(index)]
    }

    return {
      ddd: 0,
      ind: index + 1,
      ty: 4, // Shape layer
      nm: layer.name || `Layer ${index + 1}`,
      sr: 1,
      ks: {
        o: createKeyframes("opacity"),
        r: createKeyframes("rotation"),
        p: createKeyframes("position"),
        a: { a: 0, k: [0, 0, 0] },
        s: createKeyframes("scale"),
      },
      ao: 0,
      shapes: shapes,
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    }
  }

  private static pathToLottieShape(svgPath: string): any {
    // Convert SVG path to Lottie shape format
    // This is a simplified conversion - in practice, you'd need a full SVG path parser

    // For now, extract coordinates from simple paths
    const coords = svgPath.match(/-?\d+\.?\d*/g)?.map(Number) || []

    if (coords.length < 6) {
      // Fallback to rectangle
      return {
        i: [
          [0, 0],
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        o: [
          [0, 0],
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        v: [
          [-40, -40],
          [40, -40],
          [40, 40],
          [-40, 40],
        ],
        c: true,
      }
    }

    // Create vertices from coordinates
    const vertices: number[][] = []
    for (let i = 0; i < coords.length - 1; i += 2) {
      vertices.push([coords[i], coords[i + 1]])
    }

    return {
      i: vertices.map(() => [0, 0]), // In tangents
      o: vertices.map(() => [0, 0]), // Out tangents
      v: vertices,
      c: true, // Closed path
    }
  }

  private static createFallbackShape(index: number): any {
    return {
      ty: "gr",
      it: [
        {
          ind: 0,
          ty: "sh",
          ks: {
            a: 0,
            k: {
              i: [
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
              ],
              o: [
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
              ],
              v: [
                [-40, -40],
                [40, -40],
                [40, 40],
                [-40, 40],
              ],
              c: true,
            },
          },
        },
        {
          ty: "fl",
          c: { a: 0, k: this.getLayerColor(index, 0) },
          o: { a: 0, k: 100 },
          r: 1,
          bm: 0,
        },
        {
          ty: "tr",
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
        },
      ],
      nm: `Rectangle ${index + 1}`,
      bm: 0,
    }
  }

  private static getLayerColor(layerIndex: number, shapeIndex: number): number[] {
    const baseColors = [
      [1, 0.27, 0.27, 1], // Red
      [0.13, 0.77, 0.37, 1], // Green
      [0.23, 0.51, 0.96, 1], // Blue
      [0.92, 0.7, 0.03, 1], // Yellow
      [0.93, 0.28, 0.6, 1], // Pink
      [0.02, 0.71, 0.83, 1], // Cyan
      [0.98, 0.45, 0.09, 1], // Orange
      [0.55, 0.36, 0.96, 1], // Purple
    ]

    const baseColor = baseColors[layerIndex % baseColors.length]

    // Vary color slightly for different shapes in the same layer
    const variation = shapeIndex * 0.1
    return [
      Math.min(1, baseColor[0] + variation),
      Math.min(1, baseColor[1] + variation),
      Math.min(1, baseColor[2] + variation),
      baseColor[3],
    ]
  }

  private static getStaticValue(layer: any, property: string) {
    switch (property) {
      case "opacity":
        return layer.opacity * 100
      case "rotation":
        return layer.rotation
      case "position":
        return [layer.x, layer.y, 0]
      case "scale":
        return [layer.scaleX * 100, layer.scaleY * 100, 100]
      default:
        return 0
    }
  }

  private static getKeyframeValue(keyframe: any, property: string) {
    switch (property) {
      case "opacity":
        return [keyframe.opacity * 100]
      case "rotation":
        return [keyframe.rotation]
      case "position":
        return [keyframe.x, keyframe.y, 0]
      case "scale":
        return [keyframe.scaleX * 100, keyframe.scaleY * 100, 100]
      default:
        return [0]
    }
  }

  static validateTGS(blob: Blob): { valid: boolean; errors: string[]; size: number } {
    const errors: string[] = []
    const size = blob.size

    if (size > this.MAX_SIZE) {
      errors.push(`File size ${(size / 1024).toFixed(1)}KB exceeds 64KB limit`)
    }

    return {
      valid: errors.length === 0,
      errors,
      size,
    }
  }
}

// Lottie Converter - With actual PNG images
export class LottieConverter {
  static async convertToLottie(animationData: any): Promise<any> {
    const { layers, animationState } = animationData
    const frameRate = Math.min(animationState.fps, 60)
    const totalFrames = Math.ceil((animationState.duration / 1000) * frameRate)

    const assets = layers.map((layer: any, index: number) => ({
      id: `image_${index}`,
      w: 512,
      h: 512,
      u: "",
      p: layer.src,
      e: 0,
    }))

    return {
      v: "5.7.4",
      fr: frameRate,
      ip: 0,
      op: totalFrames,
      w: 512,
      h: 512,
      nm: "PNG Animation",
      ddd: 0,
      assets: assets,
      layers: layers.map((layer: any, index: number) => ({
        ddd: 0,
        ind: index + 1,
        ty: 2,
        nm: layer.name,
        refId: `image_${index}`,
        sr: 1,
        ks: this.createImageKeyframes(layer, animationState, totalFrames),
        ao: 0,
        ip: 0,
        op: totalFrames,
        st: 0,
        bm: 0,
      })),
    }
  }

  private static createImageKeyframes(layer: any, animationState: any, totalFrames: number) {
    const createKeyframes = (property: string) => {
      if (layer.keyframes.length <= 1) {
        const value = this.getStaticValue(layer, property)
        return { a: 0, k: value }
      }

      return {
        a: 1,
        k: layer.keyframes.map((kf: any) => ({
          i: { x: 0.833, y: 0.833 },
          o: { x: 0.167, y: 0.167 },
          t: (kf.time / animationState.duration) * totalFrames,
          s: this.getKeyframeValue(kf, property),
        })),
      }
    }

    return {
      o: createKeyframes("opacity"),
      r: createKeyframes("rotation"),
      p: createKeyframes("position"),
      a: { a: 0, k: [0, 0] },
      s: createKeyframes("scale"),
    }
  }

  private static getStaticValue(layer: any, property: string) {
    switch (property) {
      case "opacity":
        return layer.opacity * 100
      case "rotation":
        return layer.rotation
      case "position":
        return [layer.x, layer.y]
      case "scale":
        return [layer.scaleX * 100, layer.scaleY * 100]
      default:
        return 0
    }
  }

  private static getKeyframeValue(keyframe: any, property: string) {
    switch (property) {
      case "opacity":
        return [keyframe.opacity * 100]
      case "rotation":
        return [keyframe.rotation]
      case "position":
        return [keyframe.x, keyframe.y]
      case "scale":
        return [keyframe.scaleX * 100, keyframe.scaleY * 100]
      default:
        return [0]
    }
  }
}
