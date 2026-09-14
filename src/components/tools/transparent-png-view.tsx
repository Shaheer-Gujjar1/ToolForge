'use client'

import * as React from 'react'
import {
  Pipette,
  Check,
  Download,
  Sliders,
  Sparkles,
  Layers,
  ImagePlus,
  Loader2,
  X,
  RotateCcw,
  Eye,
  Eraser,
  Copy,
  Columns2,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { formatBytes, createZip, downloadBlob } from '@/lib/zip'
import { cn } from '@/lib/utils'

export interface TransparentPngResult {
  fileName: string
  data: ArrayBuffer
}

interface TransparentPngViewProps {
  files: { id: string; file: File }[]
  onRemove: (id: string) => void
  onAddMore: () => void
  onChange?: (result: TransparentPngResult | null) => void
}

interface RGBColor {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): RGBColor {
  let c = hex.replace(/^#/, '')
  if (c.length === 3) c = c.split('').map((x) => x + x).join('')
  const num = parseInt(c, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

const CHECKER_BG: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, rgba(128,128,128,0.2) 25%, transparent 25%), linear-gradient(-45deg, rgba(128,128,128,0.2) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(128,128,128,0.2) 75%), linear-gradient(-45deg, transparent 75%, rgba(128,128,128,0.2) 75%)',
  backgroundSize: '16px 16px',
}

export function TransparentPngView({
  files,
  onRemove,
  onAddMore,
  onChange,
}: TransparentPngViewProps) {
  const [activeId, setActiveId] = React.useState<string>(files[0]?.id || '')
  const [targetColorHex, setTargetColorHex] = React.useState<string>('#f8cb3c')
  const [similarity, setSimilarity] = React.useState<number>(10) // Tight 0 - 100%
  const [smoothEdges, setSmoothEdges] = React.useState<boolean>(false)
  const [smoothnessRadius, setSmoothnessRadius] = React.useState<number>(5)
  const [outerPixelsOnly, setOuterPixelsOnly] = React.useState<boolean>(false)
  const [viewLayout, setViewLayout] = React.useState<'dual' | 'output-only'>('dual')
  const [processingZip, setProcessingZip] = React.useState<boolean>(false)
  const [copied, setCopied] = React.useState<boolean>(false)
  const [hoverColor, setHoverColor] = React.useState<string | null>(null)
  const [hoverCoord, setHoverCoord] = React.useState<{ x: number; y: number } | null>(null)

  const activeFile = files.find((f) => f.id === activeId) || files[0]

  const inputCanvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const outputCanvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const origImageRef = React.useRef<HTMLImageElement | null>(null)

  // Core high-precision transparency computation
  const processImageTransparency = React.useCallback(
    (img: HTMLImageElement) => {
      const inputCanvas = inputCanvasRef.current
      const outputCanvas = outputCanvasRef.current
      if (!outputCanvas) return

      const w = img.naturalWidth
      const h = img.naturalHeight
      if (w === 0 || h === 0) return

      // Render original image on input canvas
      if (inputCanvas) {
        inputCanvas.width = w
        inputCanvas.height = h
        const inCtx = inputCanvas.getContext('2d')
        if (inCtx) {
          inCtx.clearRect(0, 0, w, h)
          inCtx.drawImage(img, 0, 0)
        }
      }

      // Render transparent image on output canvas
      outputCanvas.width = w
      outputCanvas.height = h
      const outCtx = outputCanvas.getContext('2d', { willReadFrequently: true })
      if (!outCtx) return

      outCtx.clearRect(0, 0, w, h)
      outCtx.drawImage(img, 0, 0)

      const imgData = outCtx.getImageData(0, 0, w, h)
      const data = imgData.data
      const targetRgb = hexToRgb(targetColorHex)

      // Calibrated Euclidean color threshold (max channel scale 255)
      const threshold = (similarity / 100) * 255
      const feather = smoothEdges ? Math.max(1, (smoothnessRadius / 100) * threshold) : 0

      // Case 1: Match Outer Pixels Only (BFS flood-fill from boundaries)
      if (outerPixelsOnly) {
        const visited = new Uint8Array(w * h)
        const queue = new Int32Array(w * h)
        let qHead = 0
        let qTail = 0

        const isColorMatch = (idx: number): boolean => {
          const p = idx * 4
          const a = data[p + 3]
          if (a === 0) return true
          const r = data[p]
          const g = data[p + 1]
          const b = data[p + 2]
          const dist = Math.sqrt(
            (r - targetRgb.r) ** 2 +
            (g - targetRgb.g) ** 2 +
            (b - targetRgb.b) ** 2
          )
          return dist <= threshold + feather
        }

        // Push perimeter edge pixels
        for (let x = 0; x < w; x++) {
          const tIdx = x
          if (!visited[tIdx] && isColorMatch(tIdx)) {
            visited[tIdx] = 1
            queue[qTail++] = tIdx
          }
          const bIdx = (h - 1) * w + x
          if (!visited[bIdx] && isColorMatch(bIdx)) {
            visited[bIdx] = 1
            queue[qTail++] = bIdx
          }
        }

        for (let y = 0; y < h; y++) {
          const lIdx = y * w
          if (!visited[lIdx] && isColorMatch(lIdx)) {
            visited[lIdx] = 1
            queue[qTail++] = lIdx
          }
          const rIdx = y * w + (w - 1)
          if (!visited[rIdx] && isColorMatch(rIdx)) {
            visited[rIdx] = 1
            queue[qTail++] = rIdx
          }
        }

        // Fast BFS traversal
        while (qHead < qTail) {
          const curr = queue[qHead++]
          const cx = curr % w
          const cy = (curr / w) | 0

          // Top
          if (cy > 0) {
            const n = curr - w
            if (!visited[n] && isColorMatch(n)) {
              visited[n] = 1
              queue[qTail++] = n
            }
          }
          // Bottom
          if (cy < h - 1) {
            const n = curr + w
            if (!visited[n] && isColorMatch(n)) {
              visited[n] = 1
              queue[qTail++] = n
            }
          }
          // Left
          if (cx > 0) {
            const n = curr - 1
            if (!visited[n] && isColorMatch(n)) {
              visited[n] = 1
              queue[qTail++] = n
            }
          }
          // Right
          if (cx < w - 1) {
            const n = curr + 1
            if (!visited[n] && isColorMatch(n)) {
              visited[n] = 1
              queue[qTail++] = n
            }
          }
        }

        // Apply alpha transparency to outer visited matching pixels
        for (let i = 0; i < visited.length; i++) {
          if (visited[i] === 1) {
            const p = i * 4
            const r = data[p]
            const g = data[p + 1]
            const b = data[p + 2]
            const a = data[p + 3]
            const dist = Math.sqrt(
              (r - targetRgb.r) ** 2 +
              (g - targetRgb.g) ** 2 +
              (b - targetRgb.b) ** 2
            )

            if (!smoothEdges || feather === 0) {
              if (dist <= threshold) {
                data[p + 3] = 0
              }
            } else {
              if (dist <= threshold - feather) {
                data[p + 3] = 0
              } else if (dist <= threshold + feather) {
                const factor = (dist - (threshold - feather)) / (feather * 2)
                data[p + 3] = Math.round(Math.max(0, Math.min(255, factor * a)))
              }
            }
          }
        }
      } else {
        // Case 2: Global Color Replacement across entire image
        const total = data.length
        for (let p = 0; p < total; p += 4) {
          const a = data[p + 3]
          if (a === 0) continue

          const r = data[p]
          const g = data[p + 1]
          const b = data[p + 2]
          const dist = Math.sqrt(
            (r - targetRgb.r) ** 2 +
            (g - targetRgb.g) ** 2 +
            (b - targetRgb.b) ** 2
          )

          if (!smoothEdges || feather === 0) {
            if (dist <= threshold) {
              data[p + 3] = 0 // 100% transparent
            }
          } else {
            if (dist <= threshold - feather) {
              data[p + 3] = 0
            } else if (dist <= threshold + feather) {
              const factor = (dist - (threshold - feather)) / (feather * 2)
              data[p + 3] = Math.round(Math.max(0, Math.min(255, factor * a)))
            }
          }
        }
      }

      outCtx.putImageData(imgData, 0, 0)
    },
    [targetColorHex, similarity, smoothEdges, smoothnessRadius, outerPixelsOnly]
  )

  // Load active image
  React.useEffect(() => {
    if (!activeFile) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const url = URL.createObjectURL(activeFile.file)

    img.onload = () => {
      origImageRef.current = img
      processImageTransparency(img)
      URL.revokeObjectURL(url)
    }

    img.src = url
  }, [activeFile, processImageTransparency])

  // Eyedropper on Input Canvas
  const handleInputCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = inputCanvasRef.current
    if (!canvas || !origImageRef.current) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = Math.floor((e.clientX - rect.left) * scaleX)
    const y = Math.floor((e.clientY - rect.top) * scaleY)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const p = ctx.getImageData(x, y, 1, 1).data
    const hex = rgbToHex(p[0], p[1], p[2])
    setTargetColorHex(hex)
    toast.success(`Selected color: ${hex.toUpperCase()} (RGB ${p[0]}, ${p[1]}, ${p[2]})`)
  }

  const handleInputCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = inputCanvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = Math.floor((e.clientX - rect.left) * scaleX)
    const y = Math.floor((e.clientY - rect.top) * scaleY)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      const p = ctx.getImageData(x, y, 1, 1).data
      setHoverColor(rgbToHex(p[0], p[1], p[2]))
      setHoverCoord({ x, y })
    } catch {
      setHoverColor(null)
    }
  }

  // Download single active PNG
  const handleDownloadActive = () => {
    const canvas = outputCanvasRef.current
    if (!canvas || !activeFile) return

    canvas.toBlob((blob) => {
      if (!blob) return
      const baseName = activeFile.file.name.replace(/\.[^.]+$/, '')
      downloadBlob(blob, `${baseName}-transparent.png`)
      toast.success(`Downloaded ${baseName}-transparent.png`)
    }, 'image/png')
  }

  // Copy transparent PNG to clipboard
  const handleCopyClipboard = () => {
    const canvas = outputCanvasRef.current
    if (!canvas) return

    canvas.toBlob(async (blob) => {
      if (!blob) return
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
        setCopied(true)
        toast.success('Transparent PNG copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error(err)
        toast.error('Clipboard copy failed — use Download instead.')
      }
    }, 'image/png')
  }

  // Batch process all images and export ZIP
  const handleDownloadAllZip = async () => {
    if (files.length === 0) return
    setProcessingZip(true)

    try {
      const outputFiles: { name: string; data: ArrayBuffer; mime: string }[] = []

      for (const f of files) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        const url = URL.createObjectURL(f.file)

        await new Promise<void>((resolve) => {
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const w = img.naturalWidth
            const h = img.naturalHeight
            canvas.width = w
            canvas.height = h

            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(img, 0, 0)
              const imgData = ctx.getImageData(0, 0, w, h)
              const data = imgData.data
              const targetRgb = hexToRgb(targetColorHex)
              const threshold = (similarity / 100) * 255
              const feather = smoothEdges ? Math.max(1, (smoothnessRadius / 100) * threshold) : 0

              if (outerPixelsOnly) {
                const visited = new Uint8Array(w * h)
                const queue = new Int32Array(w * h)
                let qHead = 0
                let qTail = 0

                const isColorMatch = (idx: number): boolean => {
                  const p = idx * 4
                  const a = data[p + 3]
                  if (a === 0) return true
                  const r = data[p]
                  const g = data[p + 1]
                  const b = data[p + 2]
                  const dist = Math.sqrt(
                    (r - targetRgb.r) ** 2 +
                    (g - targetRgb.g) ** 2 +
                    (b - targetRgb.b) ** 2
                  )
                  return dist <= threshold + feather
                }

                for (let x = 0; x < w; x++) {
                  const tIdx = x
                  if (!visited[tIdx] && isColorMatch(tIdx)) {
                    visited[tIdx] = 1
                    queue[qTail++] = tIdx
                  }
                  const bIdx = (h - 1) * w + x
                  if (!visited[bIdx] && isColorMatch(bIdx)) {
                    visited[bIdx] = 1
                    queue[qTail++] = bIdx
                  }
                }

                for (let y = 0; y < h; y++) {
                  const lIdx = y * w
                  if (!visited[lIdx] && isColorMatch(lIdx)) {
                    visited[lIdx] = 1
                    queue[qTail++] = lIdx
                  }
                  const rIdx = y * w + (w - 1)
                  if (!visited[rIdx] && isColorMatch(rIdx)) {
                    visited[rIdx] = 1
                    queue[qTail++] = rIdx
                  }
                }

                while (qHead < qTail) {
                  const curr = queue[qHead++]
                  const cx = curr % w
                  const cy = (curr / w) | 0

                  if (cy > 0) {
                    const n = curr - w
                    if (!visited[n] && isColorMatch(n)) {
                      visited[n] = 1
                      queue[qTail++] = n
                    }
                  }
                  if (cy < h - 1) {
                    const n = curr + w
                    if (!visited[n] && isColorMatch(n)) {
                      visited[n] = 1
                      queue[qTail++] = n
                    }
                  }
                  if (cx > 0) {
                    const n = curr - 1
                    if (!visited[n] && isColorMatch(n)) {
                      visited[n] = 1
                      queue[qTail++] = n
                    }
                  }
                  if (cx < w - 1) {
                    const n = curr + 1
                    if (!visited[n] && isColorMatch(n)) {
                      visited[n] = 1
                      queue[qTail++] = n
                    }
                  }
                }

                for (let i = 0; i < visited.length; i++) {
                  if (visited[i] === 1) {
                    const p = i * 4
                    const r = data[p]
                    const g = data[p + 1]
                    const b = data[p + 2]
                    const a = data[p + 3]
                    const dist = Math.sqrt(
                      (r - targetRgb.r) ** 2 +
                      (g - targetRgb.g) ** 2 +
                      (b - targetRgb.b) ** 2
                    )

                    if (!smoothEdges || feather === 0) {
                      if (dist <= threshold) {
                        data[p + 3] = 0
                      }
                    } else {
                      if (dist <= threshold - feather) {
                        data[p + 3] = 0
                      } else if (dist <= threshold + feather) {
                        const factor = (dist - (threshold - feather)) / (feather * 2)
                        data[p + 3] = Math.round(Math.max(0, Math.min(255, factor * a)))
                      }
                    }
                  }
                }
              } else {
                for (let p = 0; p < data.length; p += 4) {
                  const a = data[p + 3]
                  if (a === 0) continue
                  const r = data[p]
                  const g = data[p + 1]
                  const b = data[p + 2]
                  const dist = Math.sqrt(
                    (r - targetRgb.r) ** 2 +
                    (g - targetRgb.g) ** 2 +
                    (b - targetRgb.b) ** 2
                  )

                  if (!smoothEdges || feather === 0) {
                    if (dist <= threshold) {
                      data[p + 3] = 0
                    }
                  } else {
                    if (dist <= threshold - feather) {
                      data[p + 3] = 0
                    } else if (dist <= threshold + feather) {
                      const factor = (dist - (threshold - feather)) / (feather * 2)
                      data[p + 3] = Math.round(Math.max(0, Math.min(255, factor * a)))
                    }
                  }
                }
              }

              ctx.putImageData(imgData, 0, 0)

              canvas.toBlob((blob) => {
                if (blob) {
                  blob.arrayBuffer().then((buf) => {
                    const baseName = f.file.name.replace(/\.[^.]+$/, '')
                    outputFiles.push({
                      name: `${baseName}-transparent.png`,
                      data: buf,
                      mime: 'image/png',
                    })
                    URL.revokeObjectURL(url)
                    resolve()
                  })
                } else {
                  URL.revokeObjectURL(url)
                  resolve()
                }
              }, 'image/png')
            } else {
              URL.revokeObjectURL(url)
              resolve()
            }
          }
          img.src = url
        })
      }

      const zip = await createZip(outputFiles, 'transparent-images.zip')
      downloadBlob(zip.blob, zip.name)
      toast.success(`Exported ${outputFiles.length} transparent PNGs as ZIP`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to create ZIP export')
    } finally {
      setProcessingZip(false)
    }
  }

  if (files.length === 0) return null

  return (
    <div className="space-y-6">
      {/* Configuration Studio Controls */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-6 glass-card shadow-2xs space-y-5">
        {/* Color Picker & Presets Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <input
                type="color"
                value={targetColorHex}
                onChange={(e) => setTargetColorHex(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-xl border border-border/80 bg-card p-1 shadow-2xs active-push"
                title="Pick background color to remove"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Transparent Color
              </Label>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-sm font-bold text-foreground">
                  {targetColorHex.toUpperCase()}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  (Click any pixel on left image)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Color Swatches */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground mr-1">Presets:</span>
            {[
              { hex: '#ffffff', label: 'White (#FFFFFF)' },
              { hex: '#000000', label: 'Black (#000000)' },
              { hex: '#00ff00', label: 'Green Screen (#00FF00)' },
              { hex: '#0000ff', label: 'Blue Screen (#0000FF)' },
              { hex: '#f8cb3c', label: 'Yellow (#F8CB3C)' },
              { hex: '#e2e8f0', label: 'Light Gray (#E2E8F0)' },
            ].map((p) => (
              <button
                key={p.hex}
                onClick={() => setTargetColorHex(p.hex)}
                className={cn(
                  'h-6 w-6 rounded-full border shadow-2xs transition-all active-push cursor-pointer',
                  targetColorHex.toLowerCase() === p.hex.toLowerCase()
                    ? 'ring-2 ring-primary ring-offset-2 scale-110'
                    : 'border-border/80 hover:scale-105'
                )}
                style={{ backgroundColor: p.hex }}
                title={p.label}
              />
            ))}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-border/50">
          {/* Color Similarity Slider (Threshold) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Color Similarity Tolerance
              </Label>
              <span className="text-xs font-bold text-primary font-mono">{similarity}%</span>
            </div>
            <Slider
              value={[similarity]}
              min={0}
              max={60}
              step={1}
              onValueChange={(v) => setSimilarity(v[0])}
            />
            {/* Quick Tolerance Chips */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {[
                { label: 'Exact (0%)', val: 0 },
                { label: 'Tight (5%)', val: 5 },
                { label: 'Standard (10%)', val: 10 },
                { label: 'Medium (20%)', val: 20 },
                { label: 'Wide (30%)', val: 30 },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setSimilarity(chip.val)}
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[10px] font-mono transition-all active-push cursor-pointer border',
                    similarity === chip.val
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs'
                      : 'bg-secondary/50 text-muted-foreground hover:text-foreground border-border/60'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Smooth Edges & Radius */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={smoothEdges}
                  onCheckedChange={setSmoothEdges}
                  id="smooth-edges"
                />
                <Label htmlFor="smooth-edges" className="text-xs font-bold uppercase tracking-wider text-foreground font-mono cursor-pointer">
                  Smooth Edges (Anti-Aliasing)
                </Label>
              </div>
              {smoothEdges && (
                <span className="text-xs font-bold text-primary font-mono">{smoothnessRadius}%</span>
              )}
            </div>
            <Slider
              value={[smoothnessRadius]}
              min={1}
              max={25}
              step={1}
              disabled={!smoothEdges}
              onValueChange={(v) => setSmoothnessRadius(v[0])}
            />
            <p className="text-[11px] text-muted-foreground leading-tight">
              Makes boundary pixels semi-transparent to remove color halos without eating into the foreground.
            </p>
          </div>
        </div>

        {/* Match Outer Pixels Only Switch */}
        <div className="flex items-center justify-between border-t border-border/50 pt-4">
          <div className="flex items-start sm:items-center gap-3">
            <Switch
              checked={outerPixelsOnly}
              onCheckedChange={setOuterPixelsOnly}
              id="outer-only"
              className="mt-0.5 sm:mt-0"
            />
            <div>
              <Label htmlFor="outer-only" className="text-xs font-bold text-foreground cursor-pointer">
                Match Outer Pixels Only (Flood Fill from Edges)
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Removes only background touching the outer image edges, keeping inner subject areas with the same color intact (e.g. donut holes, white eyes/logos).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Viewport (Dual Input & Output Canvas like OnlinePNGTools) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-border/70 bg-card p-1 glass-card">
              <button
                onClick={() => setViewLayout('dual')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all active-push cursor-pointer',
                  viewLayout === 'dual' ? 'bg-primary text-primary-foreground font-bold shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Columns2 className="h-3.5 w-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                onClick={() => setViewLayout('output-only')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all active-push cursor-pointer',
                  viewLayout === 'output-only' ? 'bg-primary text-primary-foreground font-bold shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Transparent Result</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyClipboard}
              className="h-8 rounded-xl px-3 text-xs font-semibold gap-1.5 active-push cursor-pointer border-border/80"
              title="Copy transparent PNG to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy PNG'}</span>
            </Button>

            <Button
              size="sm"
              onClick={handleDownloadActive}
              className="h-8 rounded-xl px-3.5 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-2xs active-push cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PNG</span>
            </Button>

            {files.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAllZip}
                disabled={processingZip}
                className="h-8 rounded-xl px-3 text-xs font-semibold gap-1.5 active-push cursor-pointer border-border/80"
              >
                {processingZip ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                <span>Download All (.ZIP)</span>
              </Button>
            )}
          </div>
        </div>

        {/* Dual Canvas Stages */}
        <div className={cn('grid gap-4', viewLayout === 'dual' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
          {/* Left: Input Canvas */}
          {viewLayout === 'dual' && (
            <div className="flex flex-col space-y-2 rounded-2xl border border-border/80 bg-card/70 p-4 glass-card shadow-2xs">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <Pipette className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
                    Input PNG (Click on a color!)
                  </span>
                </div>
                {hoverColor && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/60 bg-secondary/50 text-[11px] font-mono">
                    <span className="h-2.5 w-2.5 rounded-full border border-black/20" style={{ backgroundColor: hoverColor }} />
                    <span>{hoverColor.toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-2">
                <canvas
                  ref={inputCanvasRef}
                  onClick={handleInputCanvasClick}
                  onMouseMove={handleInputCanvasMouseMove}
                  onMouseLeave={() => setHoverColor(null)}
                  className="max-h-[50vh] max-w-full rounded-lg shadow-sm cursor-crosshair transition-transform active:scale-[0.99]"
                  title="Click on any color to sample and remove it!"
                />
              </div>
              <p className="text-[11px] text-muted-foreground font-mono text-center">
                Click anywhere on the input image to set the transparent color.
              </p>
            </div>
          )}

          {/* Right: Output Canvas (Transparent PNG) */}
          <div className="flex flex-col space-y-2 rounded-2xl border border-border/80 bg-card/70 p-4 glass-card shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
                  Transparent PNG Output
                </span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                Live Transparency
              </span>
            </div>

            <div
              className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-border/60 p-2 shadow-inner"
              style={CHECKER_BG}
            >
              <canvas
                ref={outputCanvasRef}
                className="max-h-[50vh] max-w-full rounded-lg shadow-md"
              />
            </div>
            <p className="text-[11px] text-muted-foreground font-mono text-center">
              Real-time alpha transparency preview over checkerboard backdrop.
            </p>
          </div>
        </div>
      </div>

      {/* Batch Filmstrip (if multiple files queued) */}
      <div className="space-y-2.5 border-t border-border/60 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Queue Filmstrip ({files.length} image{files.length > 1 ? 's' : ''})
          </p>
          {files.length > 1 && (
            <span className="text-[11px] text-muted-foreground font-mono">
              Transparency settings apply to all items in queue
            </span>
          )}
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {files.map((f) => {
            const isActive = activeId === f.id
            const url = URL.createObjectURL(f.file)
            return (
              <div
                key={f.id}
                className={cn(
                  'group relative shrink-0 overflow-hidden rounded-2xl border-2 transition-all active-push glass-card',
                  isActive
                    ? 'border-primary ring-2 ring-primary/20 shadow-xs'
                    : 'border-border/80 hover:border-foreground/20'
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(f.id)}
                  className="block cursor-pointer"
                  aria-label={`Select ${f.file.name}`}
                >
                  <img
                    src={url}
                    alt={f.file.name}
                    className="h-20 w-28 bg-muted object-cover"
                    draggable={false}
                  />
                  <span className="absolute bottom-0 left-0 right-0 truncate bg-background/90 backdrop-blur-sm border-t border-border/50 px-2 py-0.5 text-left text-[9px] font-semibold text-foreground font-mono">
                    {f.file.name}
                  </span>
                </button>
                {files.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(f.id)}
                    className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-destructive hover:bg-destructive/10 group-hover:opacity-100 cursor-pointer"
                    aria-label={`Remove ${f.file.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )
          })}

          {/* Add more tile */}
          <button
            type="button"
            onClick={onAddMore}
            className="grid h-20 w-28 shrink-0 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border/80 text-muted-foreground transition-all hover:border-primary/50 hover:text-primary active-push glass-card"
            aria-label="Add more images"
          >
            <span className="flex flex-col items-center gap-1">
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px] font-semibold">Add more</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
