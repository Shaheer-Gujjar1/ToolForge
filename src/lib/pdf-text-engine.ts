/**
 * PDF Text & Font Engine
 * Utilities for extracting native PDF text with font classification,
 * running local in-browser OCR (Tesseract.js), and font attribute matching.
 */

export type StandardPdfFontFamily = 'Helvetica' | 'TimesRoman' | 'Courier'

export interface DetectedTextItem {
  id: string
  page: number // 0-based
  text: string
  x: number // PDF points from left
  y: number // PDF points from bottom
  width: number // PDF points
  height: number // PDF points
  fontSize: number // estimated pt
  fontFamily: StandardPdfFontFamily
  fontName: string
  bold: boolean
  italic: boolean
  color: { r: number; g: number; b: number } // 0..255
  source: 'native' | 'ocr'
  confidence?: number // 0..100 for OCR
  align?: 'left' | 'center' | 'right'
}

export interface PdfEditItem {
  id: string
  page: number // 0-based
  x: number
  y: number
  text: string
  size: number
  fontFamily: StandardPdfFontFamily
  bold: boolean
  italic: boolean
  color: { r: number; g: number; b: number }
  width?: number
  height?: number
  align?: 'left' | 'center' | 'right'
  whiteout?: {
    x: number
    y: number
    w: number
    h: number
  }
  whiteoutColor?: { r: number; g: number; b: number }
  originalText?: string
  originalBounds?: {
    x: number
    y: number
    w: number
    h: number
  }
  isErased?: boolean
  isRedaction?: boolean
}

/**
 * Classify a font name or font family string from PDF metadata into one of the
 * 3 standard PDF typography families, along with bold and italic flags.
 */
export function classifyPdfFont(
  rawFontName: string = '',
  rawFamily: string = '',
  explicitBold?: boolean,
  explicitItalic?: boolean
): {
  fontFamily: StandardPdfFontFamily
  bold: boolean
  italic: boolean
  cssFontFamily: string
} {
  const combined = `${rawFontName} ${rawFamily}`.toLowerCase()

  // Detect style attributes
  const bold =
    Boolean(explicitBold) ||
    combined.includes('bold') ||
    combined.includes('black') ||
    combined.includes('heavy') ||
    combined.includes('semibold') ||
    combined.includes('demibold') ||
    combined.includes('demi') ||
    combined.includes('boldmt') ||
    combined.includes('bolder') ||
    combined.includes('-b') ||
    combined.includes(',b') ||
    combined.includes('_b') ||
    combined.includes('+b') ||
    combined.includes('-bd') ||
    combined.includes(',bd') ||
    combined.includes('700') ||
    combined.includes('800') ||
    combined.includes('900') ||
    combined.includes('w6') ||
    combined.includes('w7') ||
    combined.includes('w8') ||
    combined.includes('w9')

  const italic =
    Boolean(explicitItalic) ||
    combined.includes('italic') ||
    combined.includes('oblique') ||
    combined.includes('slanted') ||
    combined.includes('italicmt') ||
    combined.includes('-i') ||
    combined.includes(',i') ||
    combined.includes('_i') ||
    combined.includes('+i') ||
    combined.includes('-it') ||
    combined.includes(',it')

  // Detect family
  let fontFamily: StandardPdfFontFamily = 'Helvetica'
  let cssFontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

  if (
    combined.includes('times') ||
    combined.includes('roman') ||
    combined.includes('serif') ||
    combined.includes('georgia') ||
    combined.includes('garamond') ||
    combined.includes('cambria') ||
    combined.includes('palatino') ||
    combined.includes('minion')
  ) {
    fontFamily = 'TimesRoman'
    cssFontFamily = '"Times New Roman", Times, Georgia, serif'
  } else if (
    combined.includes('courier') ||
    combined.includes('mono') ||
    combined.includes('consolas') ||
    combined.includes('menlo') ||
    combined.includes('code') ||
    combined.includes('terminal')
  ) {
    fontFamily = 'Courier'
    cssFontFamily = '"Courier New", Courier, monospace'
  }

  return { fontFamily, bold, italic, cssFontFamily }
}

/**
 * Sample average background color around the edges of a bounding box on a canvas
 */
export function sampleCanvasColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  mode: 'background' | 'foreground' = 'background'
): { r: number; g: number; b: number } {
  try {
    const pad = 2
    const sx = Math.max(0, Math.floor(x - pad))
    const sy = Math.max(0, Math.floor(y - pad))
    const sw = Math.min(ctx.canvas.width - sx, Math.ceil(w + pad * 2))
    const sh = Math.min(ctx.canvas.height - sy, Math.ceil(h + pad * 2))

    if (sw <= 0 || sh <= 0) return { r: 255, g: 255, b: 255 }

    const imgData = ctx.getImageData(sx, sy, sw, sh)
    const data = imgData.data

    if (mode === 'background') {
      // Sample the corners/edges which typically contain the background paper color
      let rSum = 0, gSum = 0, bSum = 0, count = 0

      for (let py = 0; py < sh; py++) {
        for (let px = 0; px < sw; px++) {
          // sample outer 2 pixels
          if (px <= 1 || px >= sw - 2 || py <= 1 || py >= sh - 2) {
            const idx = (py * sw + px) * 4
            if (data[idx + 3] > 200) { // non-transparent
              rSum += data[idx]
              gSum += data[idx + 1]
              bSum += data[idx + 2]
              count++
            }
          }
        }
      }

      if (count > 0) {
        return {
          r: Math.round(rSum / count),
          g: Math.round(gSum / count),
          b: Math.round(bSum / count),
        }
      }
      return { r: 255, g: 255, b: 255 }
    } else {
      // Foreground: Find the darkest / most contrastive pixels representing the text
      let darkestLuma = 255
      let bestR = 0, bestG = 0, bestB = 0
      let found = false

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 200) {
          const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          if (luma < darkestLuma && luma < 180) {
            darkestLuma = luma
            bestR = data[i]
            bestG = data[i + 1]
            bestB = data[i + 2]
            found = true
          }
        }
      }

      if (found) {
        return { r: bestR, g: bestG, b: bestB }
      }
      return { r: 15, g: 23, b: 42 } // default dark slate
    }
  } catch {
    return mode === 'background' ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }
  }
}

/**
 * Estimate if a text bounding box on canvas has heavy ink density (indicating bold weight)
 */
export function detectCanvasInkDensity(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): { isBold: boolean; density: number } {
  try {
    const pad = 1
    const sx = Math.max(0, Math.floor(x - pad))
    const sy = Math.max(0, Math.floor(y - pad))
    const sw = Math.min(ctx.canvas.width - sx, Math.ceil(w + pad * 2))
    const sh = Math.min(ctx.canvas.height - sy, Math.ceil(h + pad * 2))

    if (sw <= 2 || sh <= 2) return { isBold: false, density: 0 }

    const imgData = ctx.getImageData(sx, sy, sw, sh)
    const data = imgData.data
    let darkCount = 0
    let totalPixels = 0

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 120) {
        totalPixels++
        const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        if (luma < 165) {
          darkCount++
        }
      }
    }

    const density = totalPixels > 0 ? darkCount / totalPixels : 0
    // Density > 26% on text bounding box indicates bold/heavy weight
    return { isBold: density > 0.26, density }
  } catch {
    return { isBold: false, density: 0 }
  }
}

/**
 * Run in-browser Optical Character Recognition using Tesseract.js on an image or canvas.
 */
export async function runCanvasOcr(
  canvas: HTMLCanvasElement,
  pageIndex: number,
  pageWidthPdf: number,
  pageHeightPdf: number,
  language: string = 'eng',
  onProgress?: (percent: number, status: string) => void
): Promise<DetectedTextItem[]> {
  const { createWorker } = await import('tesseract.js')

  onProgress?.(5, 'Initializing local OCR engine...')
  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        const pct = Math.round(15 + m.progress * 80)
        onProgress?.(pct, `Scanning page (${Math.round(m.progress * 100)}%)...`)
      } else if (m.status) {
        onProgress?.(10, m.status)
      }
    },
  })

  try {
    onProgress?.(15, 'Scanning document image...')
    const result = await worker.recognize(canvas)
    onProgress?.(95, 'Structuring recognized text...')

    const items: DetectedTextItem[] = []
    const lines: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number }; confidence: number }> = []

    if (result.data.blocks) {
      for (const block of result.data.blocks) {
        if (block.paragraphs) {
          for (const para of block.paragraphs) {
            if (para.lines) {
              for (const line of para.lines) {
                lines.push(line)
              }
            }
          }
        }
      }
    } else if ((result.data as any).lines) {
      lines.push(...(result.data as any).lines)
    }

    const cWidth = canvas.width
    const cHeight = canvas.height

    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    lines.forEach((line, lIdx) => {
      const lineText = (line.text || '').trim()
      if (!lineText) return

      // Convert from canvas coordinate space (top-left) to PDF coordinate space (bottom-left)
      const x0 = line.bbox.x0
      const y0 = line.bbox.y0
      const x1 = line.bbox.x1
      const y1 = line.bbox.y1

      const w = x1 - x0
      const h = y1 - y0

      if (w <= 2 || h <= 2) return

      const pdfX = (x0 / cWidth) * pageWidthPdf
      const pdfW = (w / cWidth) * pageWidthPdf
      const pdfH = (h / cHeight) * pageHeightPdf
      // In PDF, Y is from bottom
      const pdfY = pageHeightPdf - ((y1 / cHeight) * pageHeightPdf)

      const fontSize = Math.max(8, Math.round(pdfH * 0.75))

      // Sample color
      const fgColor = ctx ? sampleCanvasColor(ctx, x0, y0, w, h, 'foreground') : { r: 15, g: 23, b: 42 }

      items.push({
        id: `ocr_${pageIndex}_${lIdx}_${Date.now()}`,
        page: pageIndex,
        text: lineText,
        x: Math.round(pdfX * 10) / 10,
        y: Math.round(pdfY * 10) / 10,
        width: Math.round(pdfW * 10) / 10,
        height: Math.round(pdfH * 10) / 10,
        fontSize,
        fontFamily: 'Helvetica',
        fontName: 'Helvetica (OCR detected)',
        bold: false,
        italic: false,
        color: fgColor,
        source: 'ocr',
        confidence: Math.round(line.confidence || 90),
      })
    })

    onProgress?.(100, 'OCR Complete')
    return items
  } finally {
    try {
      await worker.terminate()
    } catch {}
  }
}
