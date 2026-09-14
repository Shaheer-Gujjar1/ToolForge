'use client'

import * as React from 'react'
import {
  Loader2,
  Plus,
  Trash2,
  Type,
  ScanText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bold,
  Italic,
  RotateCcw,
  Check,
  Palette,
  Eraser,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Undo,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadPdfJs } from '@/hooks/use-pdf'
import {
  classifyPdfFont,
  runCanvasOcr,
  sampleCanvasColor,
  type DetectedTextItem,
  type PdfEditItem,
  type StandardPdfFontFamily,
} from '@/lib/pdf-text-engine'
import { cn } from '@/lib/utils'

export interface EditResult {
  edits: {
    page: number
    x: number
    y: number
    text: string
    size: number
    fontFamily?: StandardPdfFontFamily
    bold?: boolean
    italic?: boolean
    color?: { r: number; g: number; b: number }
    whiteout?: { x: number; y: number; w: number; h: number }
    whiteoutColor?: { r: number; g: number; b: number }
  }[]
}

interface EditTextViewProps {
  file: File
  onResultChange: (result: EditResult | null) => void
}

const PRESET_COLORS = [
  { label: 'Black', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } },
  { label: 'Slate', hex: '#334155', rgb: { r: 51, g: 65, b: 85 } },
  { label: 'Navy', hex: '#1e3a8a', rgb: { r: 30, g: 58, b: 138 } },
  { label: 'Blue', hex: '#2563eb', rgb: { r: 37, g: 99, b: 235 } },
  { label: 'Crimson', hex: '#dc2626', rgb: { r: 220, g: 38, b: 38 } },
  { label: 'Emerald', hex: '#059669', rgb: { r: 5, g: 150, b: 105 } },
  { label: 'Purple', hex: '#7c3aed', rgb: { r: 124, g: 58, b: 237 } },
]

export function EditTextView({ file, onResultChange }: EditTextViewProps) {
  const [doc, setDoc] = React.useState<any>(null)
  const [numPages, setNumPages] = React.useState(1)
  const [currentPage, setCurrentPage] = React.useState(1) // 1-based
  const [pageScale, setPageScale] = React.useState(1.25)
  const [pageDim, setPageDim] = React.useState<{
    width: number
    height: number
    pdfWidth: number
    pdfHeight: number
  } | null>(null)
  const [pageLoading, setPageLoading] = React.useState(true)

  // Extracted text items per page
  const [pageTextMap, setPageTextMap] = React.useState<Record<number, DetectedTextItem[]>>({})
  const [ocrRunning, setOcrRunning] = React.useState(false)
  const [ocrProgress, setOcrProgress] = React.useState({ pct: 0, msg: '' })
  const [ocrLang, setOcrLang] = React.useState('eng')

  // Applied edits list
  const [edits, setEdits] = React.useState<PdfEditItem[]>([])

  // Active inline editor state (directly on the PDF)
  const [activeInline, setActiveInline] = React.useState<{
    id: string
    isNew: boolean
    page: number
    x: number // PDF x
    y: number // PDF y (baseline)
    w: number // PDF width
    h: number // PDF height
    originalText: string
    text: string
    fontFamily: StandardPdfFontFamily
    fontSize: number
    bold: boolean
    italic: boolean
    color: { r: number; g: number; b: number }
    whiteoutColor: { r: number; g: number; b: number }
    canvasX: number
    canvasY: number
    canvasW: number
    canvasH: number
  } | null>(null)

  const [hoveredItemId, setHoveredItemId] = React.useState<string | null>(null)
  const [addMode, setAddMode] = React.useState(false)

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const baseCanvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inlineInputRef = React.useRef<HTMLInputElement>(null)

  // 1. Load PDF Document once
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setPageLoading(true)
        const pdfjs = await loadPdfJs()
        const buf = await file.arrayBuffer()
        const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise
        if (!cancelled) {
          setDoc(pdfDoc)
          setNumPages(pdfDoc.numPages)
          setCurrentPage(1)
        }
      } catch (err) {
        console.error('Failed to load PDF in editor:', err)
        if (!cancelled) setPageLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [file])

  // 2. Render Page Canvas & Extract Native Text
  React.useEffect(() => {
    if (!doc) return
    let cancelled = false

    ;(async () => {
      try {
        setPageLoading(true)
        const page = await doc.getPage(currentPage)
        const unscaledViewport = page.getViewport({ scale: 1.0 })
        const viewport = page.getViewport({ scale: pageScale })

        const visibleCanvas = canvasRef.current
        if (!visibleCanvas) return
        visibleCanvas.width = Math.ceil(viewport.width)
        visibleCanvas.height = Math.ceil(viewport.height)

        // Render base clean PDF page into an offscreen canvas
        const baseCanvas = document.createElement('canvas')
        baseCanvas.width = visibleCanvas.width
        baseCanvas.height = visibleCanvas.height
        const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true })
        if (!baseCtx) return

        await page.render({ canvasContext: baseCtx, viewport }).promise
        if (cancelled) return

        baseCanvasRef.current = baseCanvas

        const dim = {
          width: viewport.width,
          height: viewport.height,
          pdfWidth: unscaledViewport.width,
          pdfHeight: unscaledViewport.height,
        }
        setPageDim(dim)

        // Extract native text if not already loaded for this page
        const pageIdx = currentPage - 1
        if (!pageTextMap[pageIdx]) {
          const content = await page.getTextContent()
          const items: DetectedTextItem[] = []

          content.items.forEach((it: any, i: number) => {
            const str = (it.str || '').trim()
            if (!str) return

            const tx = it.transform[4]
            const ty = it.transform[5]
            const fontSize = Math.max(8, Math.round(Math.hypot(it.transform[0], it.transform[1]) || it.height || 12))
            const w = it.width || fontSize * str.length * 0.55
            const h = it.height || fontSize

            const style = content.styles ? content.styles[it.fontName] : null
            const fontMeta = classifyPdfFont(it.fontName, style?.fontFamily)

            // Sample color around text on canvas
            const canvasX = (tx / unscaledViewport.width) * viewport.width
            const canvasY = ((unscaledViewport.height - ty - h) / unscaledViewport.height) * viewport.height
            const fgColor = sampleCanvasColor(
              baseCtx,
              canvasX,
              canvasY,
              (w / unscaledViewport.width) * viewport.width,
              (h / unscaledViewport.height) * viewport.height,
              'foreground'
            )

            items.push({
              id: `native_${pageIdx}_${i}`,
              page: pageIdx,
              text: it.str,
              x: Math.round(tx * 10) / 10,
              y: Math.round(ty * 10) / 10,
              width: Math.round(w * 10) / 10,
              height: Math.round(h * 10) / 10,
              fontSize,
              fontFamily: fontMeta.fontFamily,
              fontName: it.fontName || fontMeta.fontFamily,
              bold: fontMeta.bold,
              italic: fontMeta.italic,
              color: fgColor,
              source: 'native',
            })
          })

          setPageTextMap((prev) => ({ ...prev, [pageIdx]: items }))
        }

        setPageLoading(false)
      } catch (e) {
        console.error('Error rendering PDF page in editor:', e)
        if (!cancelled) setPageLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [doc, currentPage, pageScale])

  // 3. Fast Canvas Compositor: Draw base canvas + whiteout + new text
  const redrawCanvas = React.useCallback(() => {
    const visibleCanvas = canvasRef.current
    const baseCanvas = baseCanvasRef.current
    if (!visibleCanvas || !baseCanvas || !pageDim) return

    const ctx = visibleCanvas.getContext('2d')
    if (!ctx) return

    // 1. Copy original clean PDF page
    ctx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height)
    ctx.drawImage(baseCanvas, 0, 0)

    const scale = visibleCanvas.width / pageDim.pdfWidth
    const pageIdx = currentPage - 1
    const pageEdits = edits.filter((e) => e.page === pageIdx)

    // 2. Draw whiteouts and new texts
    for (const edit of pageEdits) {
      // Whiteout original text
      if (edit.whiteout) {
        const woCanvasX = edit.whiteout.x * scale
        const woCanvasY = (pageDim.pdfHeight - (edit.whiteout.y + edit.whiteout.h)) * scale
        const woCanvasW = edit.whiteout.w * scale
        const woCanvasH = edit.whiteout.h * scale

        const woColor = edit.whiteoutColor || { r: 255, g: 255, b: 255 }
        ctx.fillStyle = `rgb(${woColor.r}, ${woColor.g}, ${woColor.b})`
        ctx.fillRect(woCanvasX, woCanvasY, woCanvasW, woCanvasH)
      }

      // Draw replacement text (unless actively editing this exact edit inline)
      if (edit.text && (!activeInline || activeInline.id !== edit.id)) {
        const textCanvasX = edit.x * scale
        const textBaselineY = (pageDim.pdfHeight - edit.y) * scale
        const fontSizePx = edit.size * scale

        const fontCss =
          edit.fontFamily === 'TimesRoman'
            ? '"Times New Roman", Times, Georgia, serif'
            : edit.fontFamily === 'Courier'
            ? '"Courier New", Courier, monospace'
            : 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

        ctx.font = `${edit.italic ? 'italic ' : ''}${edit.bold ? 'bold ' : ''}${fontSizePx}px ${fontCss}`
        ctx.textBaseline = 'alphabetic'
        const c = edit.color || { r: 0, g: 0, b: 0 }
        ctx.fillStyle = `rgb(${c.r}, ${c.g}, ${c.b})`
        ctx.fillText(edit.text, textCanvasX, textBaselineY)
      }
    }

    // If an item is being actively edited inline, also whiteout its background on canvas
    if (activeInline && activeInline.page === pageIdx) {
      const woCanvasX = activeInline.canvasX
      const woCanvasY = activeInline.canvasY
      const woCanvasW = activeInline.canvasW
      const woCanvasH = activeInline.canvasH
      const woColor = activeInline.whiteoutColor || { r: 255, g: 255, b: 255 }
      ctx.fillStyle = `rgb(${woColor.r}, ${woColor.g}, ${woColor.b})`
      ctx.fillRect(woCanvasX, woCanvasY, woCanvasW, woCanvasH)
    }
  }, [edits, activeInline, currentPage, pageDim])

  React.useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // 4. Emit Edits to Tool Pipeline
  React.useEffect(() => {
    if (edits.length > 0) {
      onResultChange({
        edits: edits.map((e) => ({
          page: e.page,
          x: e.x,
          y: e.y,
          text: e.text,
          size: e.size,
          fontFamily: e.fontFamily,
          bold: e.bold,
          italic: e.italic,
          color: e.color,
          whiteout: e.whiteout,
          whiteoutColor: e.whiteoutColor,
        })),
      })
    } else {
      onResultChange(null)
    }
  }, [edits, onResultChange])

  // Current page text items
  const pageIdx = currentPage - 1
  const currentTextItems = pageTextMap[pageIdx] || []
  const currentEdits = edits.filter((e) => e.page === pageIdx)

  // Run OCR on current page canvas
  const handleRunOcr = async () => {
    const baseCanvas = baseCanvasRef.current
    if (!baseCanvas || !pageDim) return

    setOcrRunning(true)
    setOcrProgress({ pct: 5, msg: 'Starting OCR Engine...' })

    try {
      const ocrItems = await runCanvasOcr(
        baseCanvas,
        pageIdx,
        pageDim.pdfWidth,
        pageDim.pdfHeight,
        ocrLang,
        (pct, msg) => setOcrProgress({ pct, msg })
      )

      setPageTextMap((prev) => {
        const existing = prev[pageIdx] || []
        return {
          ...prev,
          [pageIdx]: [...existing, ...ocrItems],
        }
      })
    } catch (err) {
      console.error('OCR failed:', err)
      alert('OCR failed to process the page. Please ensure your browser supports Web Workers.')
    } finally {
      setOcrRunning(false)
      setOcrProgress({ pct: 0, msg: '' })
    }
  }

  // Handle clicking on an existing text item to edit in-place
  const handleSelectTextItem = (item: DetectedTextItem) => {
    if (addMode || !pageDim) return

    // If an existing inline edit is open, commit it first
    if (activeInline) {
      commitActiveInline()
    }

    const scale = pageDim.width / pageDim.pdfWidth

    // Check if an existing edit already modified this text
    const existingEdit = edits.find(
      (e) => e.page === item.page && Math.abs(e.x - item.x) < 2 && Math.abs(e.y - item.y) < 2
    )

    // Accurate typography bounds
    const fontSize = existingEdit ? existingEdit.size : item.fontSize
    const descender = fontSize * 0.28
    const totalHeight = fontSize * 1.32

    const woX = Math.max(0, item.x - 2)
    const woY = Math.max(0, item.y - descender)
    const woW = Math.max(item.width + 4, 20)
    const woH = Math.max(item.height, totalHeight)

    // Sample background paper color from base canvas
    let sampledBg = { r: 255, g: 255, b: 255 }
    if (baseCanvasRef.current) {
      const ctx = baseCanvasRef.current.getContext('2d', { willReadFrequently: true })
      if (ctx) {
        sampledBg = sampleCanvasColor(
          ctx,
          woX * scale,
          (pageDim.pdfHeight - (woY + woH)) * scale,
          woW * scale,
          woH * scale,
          'background'
        )
      }
    }

    const canvasX = woX * scale
    const canvasY = (pageDim.pdfHeight - (woY + woH)) * scale
    const canvasW = woW * scale
    const canvasH = woH * scale

    setActiveInline({
      id: existingEdit ? existingEdit.id : `edit_${Date.now()}`,
      isNew: false,
      page: item.page,
      x: item.x,
      y: item.y,
      w: woW,
      h: woH,
      originalText: existingEdit?.originalText ?? item.text,
      text: existingEdit ? existingEdit.text : item.text,
      fontFamily: existingEdit ? existingEdit.fontFamily : item.fontFamily,
      fontSize,
      bold: existingEdit ? existingEdit.bold : item.bold,
      italic: existingEdit ? existingEdit.italic : item.italic,
      color: existingEdit ? existingEdit.color : item.color,
      whiteoutColor: existingEdit?.whiteoutColor ?? sampledBg,
      canvasX,
      canvasY,
      canvasW,
      canvasH,
    })

    setTimeout(() => {
      inlineInputRef.current?.focus()
      inlineInputRef.current?.select()
    }, 50)
  }

  // Handle clicking on page canvas to place freeform text
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pageDim || !containerRef.current) return

    // If clicking outside while inline editing, commit the edit
    if (activeInline) {
      commitActiveInline()
      return
    }

    if (!addMode) return

    const rect = containerRef.current.getBoundingClientRect()
    const clickCanvasX = e.clientX - rect.left
    const clickCanvasY = e.clientY - rect.top

    const scale = pageDim.width / pageDim.pdfWidth
    const pdfX = Math.round(clickCanvasX / scale)
    const fontSize = 12
    // Baseline in PDF coordinates
    const pdfY = Math.round(pageDim.pdfHeight - (clickCanvasY / scale) - fontSize * 0.8)

    const woW = 120
    const woH = fontSize * 1.35
    const woX = pdfX
    const woY = pdfY - fontSize * 0.28

    const canvasX = woX * scale
    const canvasY = (pageDim.pdfHeight - (woY + woH)) * scale
    const canvasW = woW * scale
    const canvasH = woH * scale

    const id = `edit_${Date.now()}`
    setActiveInline({
      id,
      isNew: true,
      page: pageIdx,
      x: pdfX,
      y: pdfY,
      w: woW,
      h: woH,
      originalText: '',
      text: 'New Text',
      fontFamily: 'Helvetica',
      fontSize,
      bold: false,
      italic: false,
      color: { r: 0, g: 0, b: 0 },
      whiteoutColor: { r: 255, g: 255, b: 255 },
      canvasX,
      canvasY,
      canvasW,
      canvasH,
    })

    setAddMode(false)
    setTimeout(() => {
      inlineInputRef.current?.focus()
      inlineInputRef.current?.select()
    }, 50)
  }

  // Commit and save active inline edit
  const commitActiveInline = () => {
    if (!activeInline) return

    const trimmed = activeInline.text.trim()
    const hasOriginal = Boolean(activeInline.originalText)

    // If it's a new empty item, don't save
    if (!trimmed && !hasOriginal) {
      setActiveInline(null)
      return
    }

    const descender = activeInline.fontSize * 0.28
    const totalHeight = activeInline.fontSize * 1.32

    const woX = Math.max(0, activeInline.x - 2)
    const woY = Math.max(0, activeInline.y - descender)
    const woW = Math.max(activeInline.w, 20)
    const woH = Math.max(activeInline.h, totalHeight)

    const newEditItem: PdfEditItem = {
      id: activeInline.id,
      page: activeInline.page,
      x: activeInline.x,
      y: activeInline.y,
      text: activeInline.text,
      size: activeInline.fontSize,
      fontFamily: activeInline.fontFamily,
      bold: activeInline.bold,
      italic: activeInline.italic,
      color: activeInline.color,
      whiteout: hasOriginal
        ? {
            x: woX,
            y: woY,
            w: woW,
            h: woH,
          }
        : undefined,
      whiteoutColor: activeInline.whiteoutColor,
      originalText: activeInline.originalText,
    }

    setEdits((prev) => {
      const idx = prev.findIndex((e) => e.id === activeInline.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = newEditItem
        return next
      }
      return [...prev, newEditItem]
    })

    setActiveInline(null)
  }

  // Remove an edit and restore original text
  const handleRemoveEdit = (id: string) => {
    setEdits((prev) => prev.filter((e) => e.id !== id))
    if (activeInline?.id === id) {
      setActiveInline(null)
    }
  }

  // Clear all edits
  const handleClearAll = () => {
    setEdits([])
    setActiveInline(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm shadow-xs">
        {/* Page Switcher */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              if (activeInline) commitActiveInline()
              setCurrentPage((p) => Math.max(1, p - 1))
            }}
            disabled={currentPage <= 1 || pageLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[110px] text-center text-xs font-medium text-foreground">
            Page {currentPage} of {numPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              if (activeInline) commitActiveInline()
              setCurrentPage((p) => Math.min(numPages, p + 1))
            }}
            disabled={currentPage >= numPages || pageLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPageScale((s) => Math.max(0.75, Math.round((s - 0.25) * 100) / 100))}
            disabled={pageScale <= 0.75}
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="w-12 text-center text-[11px] font-medium text-muted-foreground">
            {Math.round(pageScale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPageScale((s) => Math.min(2.0, Math.round((s + 0.25) * 100) / 100))}
            disabled={pageScale >= 2.0}
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Action Buttons: Add Text & OCR */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={addMode ? 'default' : 'outline'}
            onClick={() => {
              if (activeInline) commitActiveInline()
              setAddMode(!addMode)
            }}
            className="text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {addMode ? 'Click on PDF to place' : 'Add New Text'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleRunOcr}
            disabled={ocrRunning || pageLoading}
            className="gap-1.5 text-xs font-medium shadow-xs"
            title="Run OCR to detect text in scanned pages and images"
          >
            {ocrRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>{ocrProgress.msg || 'Recognizing...'}</span>
              </>
            ) : (
              <>
                <ScanText className="h-3.5 w-3.5 text-primary" />
                <span>Run OCR Detection</span>
              </>
            )}
          </Button>

          {edits.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-destructive gap-1"
              title="Reset all edits"
            >
              <RotateCcw className="h-3 w-3" />
              Reset ({edits.length})
            </Button>
          )}
        </div>
      </div>

      {/* OCR Scanning Progress Bar */}
      {ocrRunning && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs text-primary">
          <Sparkles className="h-4 w-4 animate-pulse shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between font-medium">
              <span>Local In-Browser OCR Scanning...</span>
              <span>{ocrProgress.pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${ocrProgress.pct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main PDF Workspace + Sidebar */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* PDF Canvas with Inline Direct Editor */}
        <div className="relative flex flex-col items-center justify-start overflow-auto rounded-xl border border-border/80 bg-muted/20 p-4 shadow-inner min-h-[500px]">
          {pageLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-xs">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Loading PDF page {currentPage}…</p>
            </div>
          )}

          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            className={cn(
              'relative inline-block select-none rounded-lg shadow-md transition-all duration-150',
              addMode && 'cursor-crosshair ring-2 ring-primary/40 ring-offset-2'
            )}
            style={{
              width: pageDim ? pageDim.width : 'auto',
              height: pageDim ? pageDim.height : 'auto',
            }}
          >
            {/* The Master Canvas (holds rendered PDF page + painted whiteout + edited text) */}
            <canvas ref={canvasRef} className="block rounded-lg bg-white" />

            {/* Clickable Hover Overlays for detected text blocks */}
            {pageDim &&
              !activeInline &&
              currentTextItems.map((item) => {
                const scale = pageDim.width / pageDim.pdfWidth
                const isHovered = hoveredItemId === item.id

                const descender = item.fontSize * 0.28
                const totalHeight = item.fontSize * 1.32
                const left = (item.x - 2) * scale
                const top = (pageDim.pdfHeight - (item.y - descender + totalHeight)) * scale
                const width = Math.max((item.width + 4) * scale, 15)
                const height = Math.max(totalHeight * scale, 14)

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectTextItem(item)
                    }}
                    className={cn(
                      'absolute cursor-pointer transition-all duration-100 rounded-[2px]',
                      'border border-transparent hover:border-primary/50 hover:bg-primary/10 hover:shadow-xs'
                    )}
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                    }}
                    title="Click to edit in-place"
                  >
                    {/* Hover font-matcher badge */}
                    {isHovered && (
                      <div className="pointer-events-none absolute -top-6 left-0 z-30 flex items-center gap-1 whitespace-nowrap rounded bg-foreground/90 px-1.5 py-0.5 text-[9px] font-medium text-background shadow-md">
                        <Type className="h-2.5 w-2.5" />
                        <span>
                          {item.fontFamily} · {item.fontSize}pt
                          {item.bold ? ' Bold' : ''}
                          {item.italic ? ' Italic' : ''}
                          {item.source === 'ocr' ? ' (OCR)' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}

            {/* LIVE IN-PLACE EDITOR (Rendered directly on top of the text on the PDF) */}
            {activeInline && pageDim && (
              <div
                className="absolute z-30 flex flex-col"
                style={{
                  left: `${activeInline.canvasX}px`,
                  top: `${activeInline.canvasY}px`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Floating Quick Typography Bar */}
                <div className="absolute -top-11 left-0 z-40 flex items-center gap-1.5 rounded-lg border border-border/80 bg-popover/95 p-1 text-popover-foreground shadow-lg backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-150">
                  {/* Font Triad Selector */}
                  <select
                    value={activeInline.fontFamily}
                    onChange={(e) =>
                      setActiveInline({
                        ...activeInline,
                        fontFamily: e.target.value as StandardPdfFontFamily,
                      })
                    }
                    className="h-7 rounded border border-border/60 bg-background px-1.5 text-[11px] font-medium outline-hidden"
                  >
                    <option value="Helvetica">Helvetica (Sans)</option>
                    <option value="TimesRoman">Times (Serif)</option>
                    <option value="Courier">Courier (Mono)</option>
                  </select>

                  {/* Font Size Stepper */}
                  <div className="flex items-center rounded border border-border/60 bg-background">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveInline({
                          ...activeInline,
                          fontSize: Math.max(6, activeInline.fontSize - 1),
                        })
                      }
                      className="px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-[10px] font-semibold">{activeInline.fontSize}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveInline({
                          ...activeInline,
                          fontSize: Math.min(72, activeInline.fontSize + 1),
                        })
                      }
                      className="px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      +
                    </button>
                  </div>

                  {/* Bold & Italic */}
                  <button
                    type="button"
                    onClick={() => setActiveInline({ ...activeInline, bold: !activeInline.bold })}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded border transition-colors',
                      activeInline.bold
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/60 hover:bg-muted'
                    )}
                    title="Bold"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInline({ ...activeInline, italic: !activeInline.italic })}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded border transition-colors',
                      activeInline.italic
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/60 hover:bg-muted'
                    )}
                    title="Italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>

                  {/* Quick Color Swatches */}
                  <div className="flex items-center gap-1 pl-0.5 pr-1">
                    {PRESET_COLORS.slice(0, 4).map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => setActiveInline({ ...activeInline, color: c.rgb })}
                        className={cn(
                          'h-4.5 w-4.5 rounded-full border border-border/40 transition-transform',
                          activeInline.color.r === c.rgb.r &&
                            activeInline.color.g === c.rgb.g &&
                            activeInline.color.b === c.rgb.b &&
                            'scale-120 ring-2 ring-primary ring-offset-1'
                        )}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      />
                    ))}
                  </div>

                  {/* Commit Button */}
                  <Button
                    size="sm"
                    onClick={commitActiveInline}
                    className="h-7 px-2 text-[11px] font-medium gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Done
                  </Button>
                </div>

                {/* Direct In-Place Input */}
                <input
                  ref={inlineInputRef}
                  type="text"
                  value={activeInline.text}
                  onChange={(e) => setActiveInline({ ...activeInline, text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      commitActiveInline()
                    } else if (e.key === 'Escape') {
                      setActiveInline(null)
                    }
                  }}
                  className="rounded-[2px] border border-primary px-1 py-0 shadow-sm outline-hidden ring-2 ring-primary/30"
                  style={{
                    minWidth: `${Math.max(activeInline.canvasW, 80)}px`,
                    height: `${Math.max(activeInline.canvasH, 20)}px`,
                    fontFamily:
                      activeInline.fontFamily === 'TimesRoman'
                        ? '"Times New Roman", Times, Georgia, serif'
                        : activeInline.fontFamily === 'Courier'
                        ? '"Courier New", Courier, monospace'
                        : 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: `${activeInline.fontSize * (pageDim.width / pageDim.pdfWidth)}px`,
                    fontWeight: activeInline.bold ? '700' : '400',
                    fontStyle: activeInline.italic ? 'italic' : 'normal',
                    color: `rgb(${activeInline.color.r}, ${activeInline.color.g}, ${activeInline.color.b})`,
                    backgroundColor: `rgb(${activeInline.whiteoutColor.r}, ${activeInline.whiteoutColor.g}, ${activeInline.whiteoutColor.b})`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Usage Tip */}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>
              Click any text on the page to edit directly in-place in matching font. Press <kbd className="font-mono text-[10px] bg-muted px-1 rounded">Enter</kbd> to save.
            </span>
          </div>
        </div>

        {/* Sidebar: Edits History & Detail Inspector */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold text-foreground">
                  Applied Edits ({edits.length})
                </h4>
              </div>
              {edits.length > 0 && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Active
                </span>
              )}
            </div>

            {edits.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">No edits on document</p>
                <p className="text-[11px] text-muted-foreground/80">
                  Click any word or line on the PDF canvas to edit it in-place.
                </p>
              </div>
            ) : (
              <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
                {edits.map((edit) => (
                  <div
                    key={edit.id}
                    onClick={() => {
                      setCurrentPage(edit.page + 1)
                      const item = currentTextItems.find((t) => Math.abs(t.x - edit.x) < 2)
                      if (item) handleSelectTextItem(item)
                    }}
                    className="flex items-start justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs transition-colors hover:border-border cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="font-semibold text-foreground">Pg {edit.page + 1}</span>
                        <span>•</span>
                        <span>{edit.fontFamily}</span>
                        <span>•</span>
                        <span>{edit.size}pt</span>
                        {edit.bold && <span>• Bold</span>}
                      </div>

                      {edit.originalText && (
                        <div className="text-[11px] text-muted-foreground line-through truncate">
                          "{edit.originalText}"
                        </div>
                      )}

                      <div className="font-medium text-foreground truncate">
                        {edit.text ? (
                          <span>"{edit.text}"</span>
                        ) : (
                          <span className="italic text-muted-foreground">(Erased)</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveEdit(edit.id)
                      }}
                      className="ml-2 shrink-0 p-1 text-muted-foreground hover:text-destructive"
                      title="Revert edit"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
