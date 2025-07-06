// Vector tracing utility to convert PNG images to SVG paths
export interface TracingOptions {
  threshold: number // 0-255, lower = more detail
  simplify: number // 0-1, higher = simpler paths
  maxColors: number // Maximum number of colors to trace
}

export class VectorTracer {
  static async tracePNGToSVG(
    imageSrc: string,
    options: TracingOptions = {
      threshold: 128,
      simplify: 0.3,
      maxColors: 8,
    },
  ): Promise<string[]> {
    try {
      // Load image
      const img = await this.loadImage(imageSrc)

      // Create canvas and get image data
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      // Scale down for faster processing
      const maxSize = 256
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Extract dominant colors
      const colors = this.extractColors(imageData, options.maxColors)

      // Create paths for each color
      const paths: string[] = []

      for (const color of colors) {
        const path = this.createPathForColor(imageData, color, options)
        if (path) {
          paths.push(path)
        }
      }

      return paths
    } catch (error) {
      console.error("Vector tracing failed:", error)
      // Fallback to simple rectangle
      return ["M-40,-40 L40,-40 L40,40 L-40,40 Z"]
    }
  }

  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  private static extractColors(
    imageData: ImageData,
    maxColors: number,
  ): Array<{ r: number; g: number; b: number; a: number }> {
    const colorMap = new Map<string, { count: number; r: number; g: number; b: number; a: number }>()
    const data = imageData.data

    // Sample pixels (skip some for performance)
    for (let i = 0; i < data.length; i += 16) {
      // Sample every 4th pixel
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      // Skip transparent pixels
      if (a < 50) continue

      // Quantize colors to reduce variations
      const qr = Math.round(r / 32) * 32
      const qg = Math.round(g / 32) * 32
      const qb = Math.round(b / 32) * 32

      const key = `${qr},${qg},${qb}`

      if (colorMap.has(key)) {
        colorMap.get(key)!.count++
      } else {
        colorMap.set(key, { count: 1, r: qr, g: qg, b: qb, a: 255 })
      }
    }

    // Sort by frequency and take top colors
    return Array.from(colorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxColors)
  }

  private static createPathForColor(
    imageData: ImageData,
    targetColor: { r: number; g: number; b: number; a: number },
    options: TracingOptions,
  ): string | null {
    const { width, height, data } = imageData
    const tolerance = 50 // Color matching tolerance

    // Create binary mask for this color
    const mask: boolean[][] = []
    for (let y = 0; y < height; y++) {
      mask[y] = []
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]

        // Check if pixel matches target color
        const matches =
          a > 50 &&
          Math.abs(r - targetColor.r) < tolerance &&
          Math.abs(g - targetColor.g) < tolerance &&
          Math.abs(b - targetColor.b) < tolerance

        mask[y][x] = matches
      }
    }

    // Find contours and create simplified paths
    const contours = this.findContours(mask)
    if (contours.length === 0) return null

    // Convert largest contour to SVG path
    const largestContour = contours.reduce((a, b) => (a.length > b.length ? a : b))
    return this.contourToPath(largestContour, width, height, options.simplify)
  }

  private static findContours(mask: boolean[][]): Array<Array<{ x: number; y: number }>> {
    const height = mask.length
    const width = mask[0]?.length || 0
    const visited: boolean[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(false))
    const contours: Array<Array<{ x: number; y: number }>> = []

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y][x] && !visited[y][x]) {
          const contour = this.traceContour(mask, visited, x, y)
          if (contour.length > 10) {
            // Minimum contour size
            contours.push(contour)
          }
        }
      }
    }

    return contours
  }

  private static traceContour(
    mask: boolean[][],
    visited: boolean[][],
    startX: number,
    startY: number,
  ): Array<{ x: number; y: number }> {
    const contour: Array<{ x: number; y: number }> = []
    const stack = [{ x: startX, y: startY }]
    const height = mask.length
    const width = mask[0].length

    while (stack.length > 0) {
      const { x, y } = stack.pop()!

      if (x < 0 || x >= width || y < 0 || y >= height || visited[y][x] || !mask[y][x]) {
        continue
      }

      visited[y][x] = true
      contour.push({ x, y })

      // Add neighbors
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        stack.push({ x: x + dx, y: y + dy })
      }
    }

    return contour
  }

  private static contourToPath(
    contour: Array<{ x: number; y: number }>,
    width: number,
    height: number,
    simplify: number,
  ): string {
    if (contour.length === 0) return ""

    // Simplify contour (Douglas-Peucker algorithm simplified)
    const simplified = this.simplifyContour(contour, simplify)

    // Convert to centered coordinates (-256 to 256)
    const centerX = width / 2
    const centerY = height / 2
    const scale = 512 / Math.max(width, height)

    const scaledPoints = simplified.map((p) => ({
      x: (p.x - centerX) * scale,
      y: (p.y - centerY) * scale,
    }))

    if (scaledPoints.length === 0) return ""

    // Create SVG path
    let path = `M${scaledPoints[0].x.toFixed(1)},${scaledPoints[0].y.toFixed(1)}`

    for (let i = 1; i < scaledPoints.length; i++) {
      path += ` L${scaledPoints[i].x.toFixed(1)},${scaledPoints[i].y.toFixed(1)}`
    }

    path += " Z" // Close path

    return path
  }

  private static simplifyContour(
    points: Array<{ x: number; y: number }>,
    tolerance: number,
  ): Array<{ x: number; y: number }> {
    if (points.length <= 2) return points

    // Simple decimation - take every nth point based on tolerance
    const step = Math.max(1, Math.floor((points.length * tolerance) / 10))
    const simplified: Array<{ x: number; y: number }> = []

    for (let i = 0; i < points.length; i += step) {
      simplified.push(points[i])
    }

    // Always include the last point
    if (simplified[simplified.length - 1] !== points[points.length - 1]) {
      simplified.push(points[points.length - 1])
    }

    return simplified
  }
}
