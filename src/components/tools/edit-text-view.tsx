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
  Palette,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Undo2,
  Redo2,
  MousePointer,
  Eraser,
  Copy,
  GripVertical,
  Heading,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadPdfJs } from '@/hooks/use-pdf'
import {
  classifyPdfFont,
  detectCanvasInkDensity,
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
  { label: 'Amber', hex: '#d97706', rgb: { r: 217, g: 119, b: 6 } },
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

  // Extracted text items per page (detected original text)
  const [pageTextMap, setPageTextMap] = React.useState<Record<number, DetectedTextItem[]>>({})
  const [ocrRunning, setOcrRunning] = React.useState(false)
  const [ocrProgress, setOcrProgress] = React.useState({ pct: 0, msg: '' })
  const [ocrLang, setOcrLang] = React.useState('eng')

  // Applied edits list
  const [edits, setEdits] = React.useState<PdfEditItem[]>([])

  // Undo / Redo history
  const [history, setHistory] = React.useState<{
    past: PdfEditItem[][]
    future: PdfEditItem[][]
  }>({ past: [], future: [] })

  // Active Tool: select (Canva pointer) | add-text | eraser (whiteout/redact)
  const [activeTool, setActiveTool] = React.useState<'select' | 'add-text' | 'eraser'>('select')

  // Selected element ID (either an edit id or detected native item id)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  // Inline typing mode (when user double-clicks to type text directly inside box)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  // Dragging state
  const dragRef = React.useRef<{
    id: string
    startPdfX: number
    startPdfY: number
    startClientX: number
    startClientY: number
    hasMoved: boolean
    snapshot: PdfEditItem[]
  } | null>(null)

  // Resizing state
  const resizeRef = React.useRef<{
    id: string
    handle: 'nw' | 'ne' | 'sw' | 'se' | 'e' | 'w'
    startPdfX: number
    startPdfY: number
    startWidth: number
    startHeight: number
    startFontSize: number
    startClientX: number
    startClientY: number
    snapshot: PdfEditItem[]
  } | null>(null)

  // Eraser drawing state (drag marquee to redact)
  const [eraserBox, setEraserBox] = React.useState<{
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)

  // Typography state
  const [selectedFont, setSelectedFont] = React.useState<StandardPdfFontFamily>('Helvetica')
  const [selectedSize, setSelectedSize] = React.useState<number>(14)
  const [selectedBold, setSelectedBold] = React.useState<boolean>(false)
  const [selectedItalic, setSelectedItalic] = React.useState<boolean>(false)
  const [selectedColor, setSelectedColor] = React.useState<{ r: number; g: number; b: number }>({
    r: 0,
    g: 0,
    b: 0,
  })
  const [showColorPicker, setShowColorPicker] = React.useState(false)

  const [hoveredOriginalId, setHoveredOriginalId] = React.useState<string | null>(null)

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const baseCanvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inlineInputRef = React.useRef<HTMLTextAreaElement>(null)

  // Place caret at the right-most (end of text) when entering edit mode
  React.useEffect(() => {
    if (editingId && inlineInputRef.current) {
      const el = inlineInputRef.current
      el.focus()
      const len = el.value.length
      el.setSelectionRange(len, len)
    }
  }, [editingId])

  const pageIdx = currentPage - 1

  // Push history snapshot before mutation
  const pushHistory = React.useCallback(
    (newEdits: PdfEditItem[]) => {
      setHistory((prev) => ({
        past: [...prev.past.slice(-25), edits],
        future: [],
      }))
      setEdits(newEdits)
    },
    [edits]
  )

  const handleUndo = React.useCallback(() => {
    if (history.past.length === 0) return
    const prev = history.past[history.past.length - 1]
    setHistory((h) => ({
      past: h.past.slice(0, -1),
      future: [edits, ...h.future],
    }))
    setEdits(prev)
    setEditingId(null)
  }, [history, edits])

  const handleRedo = React.useCallback(() => {
    if (history.future.length === 0) return
    const next = history.future[0]
    setHistory((h) => ({
      past: [...h.past, edits],
      future: h.future.slice(1),
    }))
    setEdits(next)
    setEditingId(null)
  }, [history, edits])

  // 1. Load PDF Document once
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setPageLoading(true)
        // Reset state for new uploaded document
        setDoc(null)
        setEdits([])
        setPageTextMap({})
        setSelectedId(null)
        setEditingId(null)
        setHistory({ past: [], future: [] })
        baseCanvasRef.current = null
        setPageDim(null)

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

  // Fast Canvas Compositor: Draw base canvas + whiteouts + replacement text
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
    const pageEdits = edits.filter((e) => e.page === pageIdx)

    // 2. Draw whiteouts first (masks original texts or redacts regions)
    for (const edit of pageEdits) {
      if (edit.whiteout && typeof edit.whiteout.w === 'number' && typeof edit.whiteout.h === 'number') {
        const woCanvasX = edit.whiteout.x * scale
        const woCanvasY = (pageDim.pdfHeight - (edit.whiteout.y + edit.whiteout.h)) * scale
        const woCanvasW = edit.whiteout.w * scale
        const woCanvasH = edit.whiteout.h * scale

        const woColor = edit.whiteoutColor || { r: 255, g: 255, b: 255 }
        ctx.fillStyle = `rgb(${woColor.r}, ${woColor.g}, ${woColor.b})`
        ctx.fillRect(woCanvasX, woCanvasY, woCanvasW, woCanvasH)

        // If it's a redaction/whiteout box and selected, paint a subtle dashed boundary
        if (edit.isRedaction && edit.id === selectedId) {
          ctx.strokeStyle = '#8b5cf6'
          ctx.lineWidth = 1.5
          ctx.setLineDash([4, 4])
          ctx.strokeRect(woCanvasX, woCanvasY, woCanvasW, woCanvasH)
          ctx.setLineDash([])
        }
      }
    }

    // 3. Draw replacement / added texts (skip currently actively inline edited text so input matches)
    for (const edit of pageEdits) {
      if (edit.text && edit.text.trim() && edit.id !== editingId) {
        const textCanvasX = edit.x * scale
        const fontSizePx = edit.size * scale
        const textBaselineY = (pageDim.pdfHeight - edit.y) * scale

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

        // Handle multi-line strings
        const lines = edit.text.split('\n')
        const lineHeightPx = fontSizePx * 1.25
        lines.forEach((line, lineIdx) => {
          ctx.fillText(line, textCanvasX, textBaselineY + lineIdx * lineHeightPx)
        })
      }
    }
  }, [edits, pageIdx, pageDim, editingId, selectedId])

  React.useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

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

        // Immediately paint rendered base canvas to visible canvas so it is NEVER blank!
        const visibleCtx = visibleCanvas.getContext('2d')
        if (visibleCtx) {
          visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height)
          visibleCtx.drawImage(baseCanvas, 0, 0)
        }

        const dim = {
          width: viewport.width,
          height: viewport.height,
          pdfWidth: unscaledViewport.width,
          pdfHeight: unscaledViewport.height,
        }
        setPageDim(dim)

        // Extract native text if not already loaded for this page
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

            // Inspect page.commonObjs and page.objs for the real loaded font
            let realFontName = it.fontName || ''
            let explicitBold = false
            let explicitItalic = false

            try {
              const fontObj =
                (page as any).commonObjs?._objs?.[it.fontName]?.data ||
                (typeof (page as any).commonObjs?.get === 'function' && (page as any).commonObjs.has?.(it.fontName) ? (page as any).commonObjs.get(it.fontName) : null) ||
                (page as any).objs?._objs?.[it.fontName]?.data ||
                (typeof (page as any).objs?.get === 'function' && (page as any).objs.has?.(it.fontName) ? (page as any).objs.get(it.fontName) : null)

              if (fontObj) {
                realFontName = fontObj.name || fontObj.fallbackName || fontObj.loadedName || realFontName
                if (fontObj.bold || fontObj.black || fontObj.isBold || fontObj.weight >= 600 || fontObj.weight === 'bold') {
                  explicitBold = true
                }
                if (fontObj.italic || fontObj.isItalic || fontObj.oblique) {
                  explicitItalic = true
                }
              }
            } catch (_) {}

            // Sample color around text on canvas
            const canvasX = (tx / unscaledViewport.width) * viewport.width
            const canvasY = ((unscaledViewport.height - ty - h) / unscaledViewport.height) * viewport.height
            const canvasW = (w / unscaledViewport.width) * viewport.width
            const canvasH = (h / unscaledViewport.height) * viewport.height

            let fgColor = { r: 15, g: 23, b: 42 }
            if (canvasW > 2 && canvasH > 2) {
              try {
                fgColor = sampleCanvasColor(
                  baseCtx,
                  canvasX,
                  canvasY,
                  canvasW,
                  canvasH,
                  'foreground'
                )

                // Visual density check on canvas: if ink density is heavy, it's bold!
                const visualDensity = detectCanvasInkDensity(baseCtx, canvasX, canvasY, canvasW, canvasH)
                if (visualDensity.isBold) {
                  explicitBold = true
                }
              } catch (_) {}
            }

            const fontMeta = classifyPdfFont(realFontName, style?.fontFamily, explicitBold, explicitItalic)

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
              fontName: realFontName || it.fontName || fontMeta.fontFamily,
              bold: fontMeta.bold,
              italic: fontMeta.italic,
              color: fgColor,
              source: 'native',
            })
          })

          setPageTextMap((prev) => ({ ...prev, [pageIdx]: items }))
        }

        setPageLoading(false)
        redrawCanvas()
      } catch (e) {
        console.error('Error rendering PDF page in editor:', e)
        if (!cancelled) setPageLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [doc, currentPage, pageScale, redrawCanvas])



  // 4. Emit Edits to Tool Pipeline for PDF Export
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

  // Helper: Sample background paper color from base canvas for an item
  const getPaperColor = React.useCallback(
    (x: number, y: number, w: number, h: number): { r: number; g: number; b: number } => {
      if (!baseCanvasRef.current || !pageDim) return { r: 255, g: 255, b: 255 }
      const ctx = baseCanvasRef.current.getContext('2d', { willReadFrequently: true })
      if (!ctx) return { r: 255, g: 255, b: 255 }
      const scale = pageDim.width / pageDim.pdfWidth
      return sampleCanvasColor(
        ctx,
        x * scale,
        (pageDim.pdfHeight - (y + h)) * scale,
        w * scale,
        h * scale,
        'background'
      )
    },
    [pageDim]
  )

  // Current page original text items that have NOT been converted to an edit yet
  const currentTextItems = pageTextMap[pageIdx] || []
  const activeOriginalItems = currentTextItems.filter(
    (item) =>
      !edits.some(
        (e) =>
          e.page === pageIdx &&
          ((e.originalBounds &&
            Math.abs(e.originalBounds.x - item.x) < 3 &&
            Math.abs(e.originalBounds.y - item.y) < 3) ||
            e.id === `edit_${item.id}` ||
            e.id === item.id)
      )
  )

  // Current page edits
  const currentPageEdits = edits.filter((e) => e.page === pageIdx)

  // The currently selected edit (if any)
  const selectedEdit = currentPageEdits.find((e) => e.id === selectedId) || null

  // Convert an original detected text item into a full PdfEditItem
  const promoteOriginalToEdit = React.useCallback(
    (item: DetectedTextItem, initialAction?: 'erase' | 'select' | 'edit'): PdfEditItem => {
      const fontSize = item.fontSize
      const descender = fontSize * 0.28
      const totalHeight = fontSize * 1.32
      const woX = Math.max(0, item.x - 2)
      const woY = Math.max(0, item.y - descender)
      const woW = Math.max(item.width + 4, 20)
      const woH = Math.max(item.height, totalHeight)

      const paperColor = getPaperColor(woX, woY, woW, woH)

      const editItem: PdfEditItem = {
        id: `edit_${item.id}`,
        page: item.page,
        x: item.x,
        y: item.y,
        width: item.width,
        height: totalHeight,
        text: initialAction === 'erase' ? '' : item.text,
        size: fontSize,
        fontFamily: item.fontFamily,
        bold: item.bold,
        italic: item.italic,
        color: item.color,
        originalText: item.text,
        originalBounds: { x: woX, y: woY, w: woW, h: woH },
        whiteout: { x: woX, y: woY, w: woW, h: woH },
        whiteoutColor: paperColor,
        isErased: initialAction === 'erase',
      }

      return editItem
    },
    [getPaperColor]
  )

  // 5. Select or click an original detected text item
  const handleSelectOriginal = (item: DetectedTextItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const newEdit = promoteOriginalToEdit(item, 'select')
    pushHistory([...edits, newEdit])
    setSelectedId(newEdit.id)
    setSelectedFont(newEdit.fontFamily)
    setSelectedSize(newEdit.size)
    setSelectedBold(newEdit.bold)
    setSelectedItalic(newEdit.italic)
    setSelectedColor(newEdit.color)
  }

  // Double click original item to edit immediately
  const handleDoubleClickOriginal = (item: DetectedTextItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const newEdit = promoteOriginalToEdit(item, 'edit')
    pushHistory([...edits, newEdit])
    setSelectedId(newEdit.id)
    setEditingId(newEdit.id)
    setSelectedFont(newEdit.fontFamily)
    setSelectedSize(newEdit.size)
    setSelectedBold(newEdit.bold)
    setSelectedItalic(newEdit.italic)
    setSelectedColor(newEdit.color)
  }

  // 6. Erase / Delete Selected Item (or active element)
  const handleDeleteSelected = () => {
    if (!selectedId) return

    const targetEdit = edits.find((e) => e.id === selectedId)
    if (!targetEdit) return

    if (targetEdit.originalText && targetEdit.originalBounds) {
      // It's an original text item: mark it as ERASED so whiteout stays over original text!
      const updated = edits.map((e) =>
        e.id === selectedId
          ? {
              ...e,
              text: '',
              isErased: true,
              whiteout: e.originalBounds,
            }
          : e
      )
      pushHistory(updated)
    } else {
      // It's a newly added text or custom redaction box: remove it completely
      const updated = edits.filter((e) => e.id !== selectedId)
      pushHistory(updated)
    }

    setSelectedId(null)
    setEditingId(null)
  }

  // Restore an erased original text element
  const handleRestoreErased = (id: string) => {
    const updated = edits.filter((e) => e.id !== id)
    pushHistory(updated)
    if (selectedId === id) setSelectedId(null)
  }

  // 7. Duplicate selected item
  const handleDuplicateSelected = () => {
    if (!selectedEdit || !pageDim) return
    const offset = 15 // points
    const newId = `edit_dup_${Date.now()}`
    const duplicated: PdfEditItem = {
      ...selectedEdit,
      id: newId,
      x: selectedEdit.x + offset,
      y: selectedEdit.y - offset,
      originalText: undefined,
      originalBounds: undefined,
      whiteout: selectedEdit.isRedaction
        ? {
            x: (selectedEdit.whiteout?.x ?? selectedEdit.x) + offset,
            y: (selectedEdit.whiteout?.y ?? selectedEdit.y) - offset,
            w: selectedEdit.whiteout?.w ?? 100,
            h: selectedEdit.whiteout?.h ?? 30,
          }
        : undefined,
      isErased: false,
    }

    pushHistory([...edits, duplicated])
    setSelectedId(newId)
  }

  // 8. Add New Text (Canva style: Heading / Subheading / Body)
  const handleAddTextPreset = (type: 'heading' | 'subheading' | 'body') => {
    if (!pageDim) return

    const scale = pageDim.width / pageDim.pdfWidth
    const cx = Math.round(pageDim.pdfWidth / 2 - 80)
    const cy = Math.round(pageDim.pdfHeight / 2)

    let text = 'Heading Text'
    let size = 24
    let bold = true

    if (type === 'subheading') {
      text = 'Subheading Text'
      size = 18
      bold = true
    } else if (type === 'body') {
      text = 'Click here to edit text'
      size = 12
      bold = false
    }

    const newId = `edit_add_${Date.now()}`
    const newEdit: PdfEditItem = {
      id: newId,
      page: pageIdx,
      x: cx,
      y: cy,
      width: Math.max(text.length * size * 0.55, 120),
      height: size * 1.35,
      text,
      size,
      fontFamily: selectedFont,
      bold,
      italic: false,
      color: selectedColor,
      isErased: false,
    }

    pushHistory([...edits, newEdit])
    setSelectedId(newId)
    setEditingId(newId)
    setActiveTool('select')
  }

  // 9. Dragging an Edit Item (Canva Drag & Drop)
  const handleStartDrag = (
    e: React.PointerEvent,
    id: string,
    currentX: number,
    currentY: number
  ) => {
    if (editingId === id || activeTool === 'eraser') return
    e.stopPropagation()
    e.preventDefault()

    setSelectedId(id)

    dragRef.current = {
      id,
      startPdfX: currentX,
      startPdfY: currentY,
      startClientX: e.clientX,
      startClientY: e.clientY,
      hasMoved: false,
      snapshot: edits,
    }

    const handlePointerMove = (moveEvt: PointerEvent) => {
      if (!dragRef.current || !pageDim) return
      const scale = pageDim.width / pageDim.pdfWidth
      const dx = (moveEvt.clientX - dragRef.current.startClientX) / scale
      const dy = -(moveEvt.clientY - dragRef.current.startClientY) / scale // PDF coords: Y is from bottom

      if (Math.hypot(dx, dy) > 2) {
        dragRef.current.hasMoved = true
      }

      const newX = Math.round((dragRef.current.startPdfX + dx) * 10) / 10
      const newY = Math.round((dragRef.current.startPdfY + dy) * 10) / 10

      setEdits((prev) =>
        prev.map((item) => {
          if (item.id !== dragRef.current?.id) return item
          // If it's a custom whiteout/redaction, move both x,y and whiteout.x,y
          if (item.isRedaction && item.whiteout) {
            return {
              ...item,
              x: newX,
              y: newY,
              whiteout: { ...item.whiteout, x: newX, y: newY },
            }
          }
          // If it was an original text box being moved, its whiteout stays at originalBounds!
          return {
            ...item,
            x: newX,
            y: newY,
          }
        })
      )
    }

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      const currentDrag = dragRef.current
      if (currentDrag?.hasMoved && currentDrag.snapshot) {
        const snap = currentDrag.snapshot
        setHistory((h) => ({
          past: [...h.past.slice(-25), snap],
          future: [],
        }))
      }
      dragRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  // 10. Corner / Side Resizing Handles (Canva Resize & Font Scaling)
  const handleStartResize = (
    e: React.PointerEvent,
    id: string,
    handle: 'nw' | 'ne' | 'sw' | 'se' | 'e' | 'w'
  ) => {
    e.stopPropagation()
    e.preventDefault()

    const item = edits.find((it) => it.id === id)
    if (!item || !pageDim) return

    resizeRef.current = {
      id,
      handle,
      startPdfX: item.x,
      startPdfY: item.y,
      startWidth: item.width || (item.text.length * item.size * 0.55 + 20),
      startHeight: item.height || item.size * 1.3,
      startFontSize: item.size,
      startClientX: e.clientX,
      startClientY: e.clientY,
      snapshot: edits,
    }

    const handlePointerMove = (moveEvt: PointerEvent) => {
      if (!resizeRef.current || !pageDim) return
      const scale = pageDim.width / pageDim.pdfWidth
      const dx = (moveEvt.clientX - resizeRef.current.startClientX) / scale
      const dy = -(moveEvt.clientY - resizeRef.current.startClientY) / scale

      const isCorner = ['nw', 'ne', 'sw', 'se'].includes(handle)

      if (isCorner) {
        // Corner resize: Scale font size and dimensions proportionally (Canva style)
        const scaleFactor = Math.max(0.4, 1 + (handle.includes('e') ? dx : -dx) / resizeRef.current.startWidth)
        const newSize = Math.max(8, Math.min(96, Math.round(resizeRef.current.startFontSize * scaleFactor)))
        const newW = Math.max(20, Math.round(resizeRef.current.startWidth * scaleFactor))
        const newH = Math.max(16, Math.round(resizeRef.current.startHeight * scaleFactor))

        setEdits((prev) =>
          prev.map((it) =>
            it.id === resizeRef.current?.id
              ? {
                  ...it,
                  size: newSize,
                  width: newW,
                  height: newH,
                  whiteout: it.isRedaction
                    ? { ...it.whiteout!, w: newW, h: newH }
                    : it.whiteout,
                }
              : it
          )
        )
      } else {
        // Side handle: Adjust box width
        const newW = Math.max(
          20,
          Math.round(resizeRef.current.startWidth + (handle === 'e' ? dx : -dx))
        )
        setEdits((prev) =>
          prev.map((it) =>
            it.id === resizeRef.current?.id
              ? {
                  ...it,
                  width: newW,
                  whiteout: it.isRedaction
                    ? { ...it.whiteout!, w: newW }
                    : it.whiteout,
                }
              : it
          )
        )
      }
    }

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      const currentResize = resizeRef.current
      if (currentResize?.snapshot) {
        const snap = currentResize.snapshot
        setHistory((h) => ({
          past: [...h.past.slice(-25), snap],
          future: [],
        }))
      }
      resizeRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  // 11. Eraser / Whiteout Tool Interaction (Draw marquee over canvas to redact)
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !pageDim) return

    const rect = containerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    if (activeTool === 'eraser') {
      setEraserBox({
        startX: clickX,
        startY: clickY,
        currentX: clickX,
        currentY: clickY,
      })
      return
    }

    if (activeTool === 'add-text') {
      const scale = pageDim.width / pageDim.pdfWidth
      const pdfX = Math.round(clickX / scale)
      const pdfY = Math.round(pageDim.pdfHeight - clickY / scale - selectedSize * 0.8)

      const newId = `edit_text_${Date.now()}`
      const newEdit: PdfEditItem = {
        id: newId,
        page: pageIdx,
        x: pdfX,
        y: pdfY,
        width: 140,
        height: selectedSize * 1.35,
        text: 'New Text',
        size: selectedSize,
        fontFamily: selectedFont,
        bold: selectedBold,
        italic: selectedItalic,
        color: selectedColor,
        isErased: false,
      }

      pushHistory([...edits, newEdit])
      setSelectedId(newId)
      setEditingId(newId)
      setActiveTool('select')
      return
    }

    // Clicking blank canvas background: deselect
    setSelectedId(null)
    setEditingId(null)
  }

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!eraserBox || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setEraserBox({
      ...eraserBox,
      currentX: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      currentY: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    })
  }

  const handleCanvasPointerUp = () => {
    if (!eraserBox || !pageDim) {
      setEraserBox(null)
      return
    }

    const scale = pageDim.width / pageDim.pdfWidth
    const x1 = Math.min(eraserBox.startX, eraserBox.currentX)
    const x2 = Math.max(eraserBox.startX, eraserBox.currentX)
    const y1 = Math.min(eraserBox.startY, eraserBox.currentY)
    const y2 = Math.max(eraserBox.startY, eraserBox.currentY)

    const w = x2 - x1
    const h = y2 - y1

    if (w > 8 && h > 8) {
      const pdfX = Math.round(x1 / scale)
      const pdfY = Math.round(pageDim.pdfHeight - y2 / scale)
      const pdfW = Math.round(w / scale)
      const pdfH = Math.round(h / scale)

      const paperColor = getPaperColor(pdfX, pdfY, pdfW, pdfH)

      const newWhiteout: PdfEditItem = {
        id: `whiteout_${Date.now()}`,
        page: pageIdx,
        x: pdfX,
        y: pdfY,
        width: pdfW,
        height: pdfH,
        text: '',
        size: 12,
        fontFamily: 'Helvetica',
        bold: false,
        italic: false,
        color: { r: 0, g: 0, b: 0 },
        whiteout: {
          x: pdfX,
          y: pdfY,
          w: pdfW,
          h: pdfH,
        },
        whiteoutColor: paperColor,
        isRedaction: true,
      }

      pushHistory([...edits, newWhiteout])
      setSelectedId(newWhiteout.id)
      setActiveTool('select')
    }

    setEraserBox(null)
  }

  // 12. Keyboard Shortcuts (Delete/Backspace, Undo/Redo, Nudge)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is actively typing in a textarea/input
      const activeEl = document.activeElement
      const isTyping =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable

      if (isTyping && editingId) {
        if (e.key === 'Escape') {
          setEditingId(null)
        }
        return
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
        return
      }

      // Redo: Ctrl+Y or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault()
        handleRedo()
        return
      }

      // Duplicate: Ctrl+D / Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault()
        handleDuplicateSelected()
        return
      }

      // Delete / Backspace: Remove selected box
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !isTyping) {
        e.preventDefault()
        handleDeleteSelected()
        return
      }

      // Deselect: Escape
      if (e.key === 'Escape') {
        setSelectedId(null)
        setEditingId(null)
        setActiveTool('select')
        return
      }

      // Nudge with Arrow Keys
      if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isTyping) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowDown' ? -step : e.key === 'ArrowUp' ? step : 0

        setEdits((prev) =>
          prev.map((item) => {
            if (item.id !== selectedId) return item
            const newX = item.x + dx
            const newY = item.y + dy
            return {
              ...item,
              x: newX,
              y: newY,
              whiteout: item.isRedaction && item.whiteout
                ? { ...item.whiteout, x: newX, y: newY }
                : item.whiteout,
            }
          })
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedId,
    editingId,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleUndo,
    handleRedo,
  ])

  // Update typography properties for selected item and global state
  const updateActiveFontFamily = (family: StandardPdfFontFamily) => {
    setSelectedFont(family)
    if (selectedId) {
      setEdits((prev) =>
        prev.map((it) => (it.id === selectedId ? { ...it, fontFamily: family } : it))
      )
    }
  }

  const updateActiveFontSize = (delta: number) => {
    if (selectedEdit) {
      const newSize = Math.max(6, Math.min(96, selectedEdit.size + delta))
      setSelectedSize(newSize)
      setEdits((prev) =>
        prev.map((it) => (it.id === selectedId ? { ...it, size: newSize } : it))
      )
    } else {
      setSelectedSize((s) => Math.max(6, Math.min(96, s + delta)))
    }
  }

  const toggleActiveBold = () => {
    const nextVal = selectedEdit ? !selectedEdit.bold : !selectedBold
    setSelectedBold(nextVal)
    if (selectedId) {
      setEdits((prev) =>
        prev.map((it) => (it.id === selectedId ? { ...it, bold: nextVal } : it))
      )
    }
  }

  const toggleActiveItalic = () => {
    const nextVal = selectedEdit ? !selectedEdit.italic : !selectedItalic
    setSelectedItalic(nextVal)
    if (selectedId) {
      setEdits((prev) =>
        prev.map((it) => (it.id === selectedId ? { ...it, italic: nextVal } : it))
      )
    }
  }

  const updateActiveColor = (rgb: { r: number; g: number; b: number }) => {
    setSelectedColor(rgb)
    if (selectedId) {
      setEdits((prev) =>
        prev.map((it) => (it.id === selectedId ? { ...it, color: rgb } : it))
      )
    }
    setShowColorPicker(false)
  }

  // Clear all edits
  const handleClearAll = () => {
    if (edits.length === 0) return
    if (confirm('Are you sure you want to reset all edits on this document?')) {
      pushHistory([])
      setSelectedId(null)
      setEditingId(null)
    }
  }

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

  // Helper to calculate canvas pixel position and dimensions for an edit item
  const getCanvasBounds = (item: PdfEditItem) => {
    if (!pageDim) return { left: 0, top: 0, width: 0, height: 0, scale: 1 }
    const scale = pageDim.width / pageDim.pdfWidth

    if (item.isRedaction && item.whiteout) {
      return {
        left: item.whiteout.x * scale,
        top: (pageDim.pdfHeight - (item.whiteout.y + item.whiteout.h)) * scale,
        width: item.whiteout.w * scale,
        height: item.whiteout.h * scale,
        scale,
      }
    }

    const fontSizePx = item.size * scale
    const left = item.x * scale
    const top = (pageDim.pdfHeight - item.y) * scale - fontSizePx * 0.95
    const width = Math.max(
      (item.width || (item.text ? item.text.length * item.size * 0.55 : 40) + 12) * scale,
      36
    )
    const height = Math.max((item.height || item.size * 1.3) * scale, fontSizePx * 1.25)

    return { left, top, width, height, scale }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Main Top Canva-Style Navigation & Tools Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/80 p-2.5 backdrop-blur-md shadow-xs">
        {/* Left: Page Switcher & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => {
                setSelectedId(null)
                setEditingId(null)
                setCurrentPage((p) => Math.max(1, p - 1))
              }}
              disabled={currentPage <= 1 || pageLoading}
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[85px] text-center text-xs font-semibold text-foreground">
              {currentPage} / {numPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => {
                setSelectedId(null)
                setEditingId(null)
                setCurrentPage((p) => Math.min(numPages, p + 1))
              }}
              disabled={currentPage >= numPages || pageLoading}
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-5 w-px bg-border/60" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => setPageScale((s) => Math.max(0.6, Math.round((s - 0.2) * 100) / 100))}
              disabled={pageScale <= 0.6}
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="w-11 text-center text-[11px] font-semibold text-muted-foreground">
              {Math.round(pageScale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => setPageScale((s) => Math.min(2.5, Math.round((s + 0.2) * 100) / 100))}
              disabled={pageScale >= 2.5}
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-5 w-px bg-border/60" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={handleUndo}
              disabled={history.past.length === 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={handleRedo}
              disabled={history.future.length === 0}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Center: Canva Primary Tool Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/50 p-1">
          <Button
            size="sm"
            variant={activeTool === 'select' ? 'default' : 'ghost'}
            onClick={() => {
              setActiveTool('select')
            }}
            className="h-7 text-xs gap-1.5 px-2.5"
            title="Select & Move elements (V)"
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span>Select</span>
          </Button>

          <Button
            size="sm"
            variant={activeTool === 'add-text' ? 'default' : 'ghost'}
            onClick={() => {
              setActiveTool(activeTool === 'add-text' ? 'select' : 'add-text')
            }}
            className="h-7 text-xs gap-1.5 px-2.5"
            title="Click on page to place text (T)"
          >
            <Type className="h-3.5 w-3.5" />
            <span>Add Text</span>
          </Button>

          <Button
            size="sm"
            variant={activeTool === 'eraser' ? 'default' : 'ghost'}
            onClick={() => {
              setActiveTool(activeTool === 'eraser' ? 'select' : 'eraser')
            }}
            className={cn(
              'h-7 text-xs gap-1.5 px-2.5',
              activeTool === 'eraser' && 'bg-rose-600 hover:bg-rose-700 text-white'
            )}
            title="Drag a rectangle to whiteout/erase anything (E)"
          >
            <Eraser className="h-3.5 w-3.5" />
            <span>Eraser / Whiteout</span>
          </Button>
        </div>

        {/* Right: Actions (OCR & Reset) */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRunOcr}
            disabled={ocrRunning || pageLoading}
            className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
            title="Detect text in scanned images with local OCR"
          >
            {ocrRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>{ocrProgress.msg || 'Scanning...'}</span>
              </>
            ) : (
              <>
                <ScanText className="h-3.5 w-3.5 text-primary" />
                <span>Scan OCR</span>
              </>
            )}
          </Button>

          {edits.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearAll}
              className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
              title="Reset all edits"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset ({edits.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* OCR Progress Bar */}
      {ocrRunning && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-xs text-primary shadow-xs">
          <Sparkles className="h-4 w-4 animate-pulse shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between font-semibold">
              <span>Local OCR Text Recognition Engine</span>
              <span>{ocrProgress.pct}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${ocrProgress.pct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Canva Workspace: Canvas + Sidebar */}
      <div className="grid gap-4 lg:grid-cols-[1fr_290px]">
        {/* PDF Canvas Viewport */}
        <div className="relative flex flex-col items-center justify-start overflow-auto rounded-2xl border border-border/80 bg-muted/25 p-4 shadow-inner min-h-[540px]">
          {pageLoading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2.5 bg-background/80 backdrop-blur-xs rounded-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-semibold text-foreground">
                Rendering PDF Page {currentPage}…
              </p>
            </div>
          )}

          {/* Canvas Wrapper */}
          <div
            ref={containerRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            className={cn(
              'relative inline-block select-none rounded-lg shadow-lg transition-shadow',
              activeTool === 'eraser' && 'cursor-crosshair',
              activeTool === 'add-text' && 'cursor-text'
            )}
            style={{
              width: pageDim ? pageDim.width : 'auto',
              height: pageDim ? pageDim.height : 'auto',
            }}
          >
            {/* The Master Canvas (holds rendered clean PDF + painted whiteout + edited text) */}
            <canvas ref={canvasRef} className="block rounded-lg bg-white" />

            {/* Live Eraser Marquee Drag Box */}
            {eraserBox && (
              <div
                className="absolute border-2 border-dashed border-rose-500 bg-rose-500/20 pointer-events-none z-30"
                style={{
                  left: `${Math.min(eraserBox.startX, eraserBox.currentX)}px`,
                  top: `${Math.min(eraserBox.startY, eraserBox.currentY)}px`,
                  width: `${Math.abs(eraserBox.currentX - eraserBox.startX)}px`,
                  height: `${Math.abs(eraserBox.currentY - eraserBox.startY)}px`,
                }}
              />
            )}

            {/* Untouched Original Text Hotspots (Click to select, double click to edit, drag to move) */}
            {pageDim &&
              activeTool === 'select' &&
              activeOriginalItems.map((item) => {
                const scale = pageDim.width / pageDim.pdfWidth
                const descender = item.fontSize * 0.28
                const totalHeight = item.fontSize * 1.32
                const left = (item.x - 2) * scale
                const top = (pageDim.pdfHeight - (item.y - descender + totalHeight)) * scale
                const width = Math.max((item.width + 4) * scale, 15)
                const height = Math.max(totalHeight * scale, 14)

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredOriginalId(item.id)}
                    onMouseLeave={() => setHoveredOriginalId(null)}
                    onClick={(e) => handleSelectOriginal(item, e)}
                    onDoubleClick={(e) => handleDoubleClickOriginal(item, e)}
                    onPointerDown={(e) => {
                      // Promote to edit immediately on pointer down so user can directly drag an original box!
                      e.stopPropagation()
                      const newEdit = promoteOriginalToEdit(item, 'select')
                      pushHistory([...edits, newEdit])
                      handleStartDrag(e, newEdit.id, newEdit.x, newEdit.y)
                    }}
                    className={cn(
                      'absolute cursor-grab rounded-[1px] transition-all duration-75',
                      hoveredOriginalId === item.id &&
                        'bg-violet-500/15 ring-1 ring-violet-500/40'
                    )}
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                    }}
                    title="Click to select or drag text"
                  />
                )
              })}

            {/* Active Edits / Whiteouts Overlays on Canvas */}
            {pageDim &&
              currentPageEdits.map((item) => {
                // If it's an erased original item, skip rendering visible text overlay
                if (item.isErased && !item.isRedaction) return null

                const bounds = getCanvasBounds(item)
                const isSelected = selectedId === item.id
                const isEditing = editingId === item.id

                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedId(item.id)
                      setSelectedFont(item.fontFamily)
                      setSelectedSize(item.size)
                      setSelectedBold(item.bold)
                      setSelectedItalic(item.italic)
                      setSelectedColor(item.color)
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      if (!item.isRedaction) {
                        setSelectedId(item.id)
                        setEditingId(item.id)
                        setSelectedFont(item.fontFamily)
                        setSelectedSize(item.size)
                        setSelectedBold(item.bold)
                        setSelectedItalic(item.italic)
                        setSelectedColor(item.color)
                      }
                    }}
                    onPointerDown={(e) => handleStartDrag(e, item.id, item.x, item.y)}
                    className={cn(
                      'absolute group transition-colors select-none',
                      isSelected ? 'z-30 cursor-move' : 'z-20 cursor-pointer',
                      item.isRedaction && 'cursor-move'
                    )}
                    style={{
                      left: `${bounds.left}px`,
                      top: `${bounds.top}px`,
                      width: `${bounds.width}px`,
                      height: `${bounds.height}px`,
                    }}
                  >
                    {/* Canva Bounding Box Frame */}
                    {isSelected && (
                      <>
                        <div
                          className={cn(
                            'absolute inset-0 pointer-events-none rounded-[2px] border-2 shadow-xs',
                            item.isRedaction
                              ? 'border-rose-500 ring-2 ring-rose-500/30'
                              : 'border-violet-600 ring-2 ring-violet-500/30'
                          )}
                        />

                        {/* Canva Corner Resize Handles */}
                        <div
                          onPointerDown={(e) => handleStartResize(e, item.id, 'nw')}
                          className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full border-2 border-violet-600 bg-white shadow-xs cursor-nwse-resize pointer-events-auto"
                          title="Resize font & box"
                        />
                        <div
                          onPointerDown={(e) => handleStartResize(e, item.id, 'ne')}
                          className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full border-2 border-violet-600 bg-white shadow-xs cursor-nesw-resize pointer-events-auto"
                          title="Resize font & box"
                        />
                        <div
                          onPointerDown={(e) => handleStartResize(e, item.id, 'sw')}
                          className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full border-2 border-violet-600 bg-white shadow-xs cursor-nesw-resize pointer-events-auto"
                          title="Resize font & box"
                        />
                        <div
                          onPointerDown={(e) => handleStartResize(e, item.id, 'se')}
                          className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full border-2 border-violet-600 bg-white shadow-xs cursor-nwse-resize pointer-events-auto"
                          title="Resize font & box"
                        />

                        {/* Canva Side Handles (Width stretch) */}
                        <div
                          onPointerDown={(e) => handleStartResize(e, item.id, 'w')}
                          className="absolute top-1/2 -left-1 -translate-y-1/2 h-4 w-1.5 rounded-full border border-violet-600 bg-white shadow-xs cursor-ew-resize pointer-events-auto"
                          title="Adjust width"
                        />
                        <div
                          onPointerDown={(e) => handleStartResize(e, item.id, 'e')}
                          className="absolute top-1/2 -right-1 -translate-y-1/2 h-4 w-1.5 rounded-full border border-violet-600 bg-white shadow-xs cursor-ew-resize pointer-events-auto"
                          title="Adjust width"
                        />

                        {/* Floating Canva Mini Action Bar */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.preventDefault()}
                          className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full border border-border/80 bg-background/95 px-2 py-1 shadow-xl backdrop-blur-md text-xs font-medium select-none whitespace-nowrap"
                        >
                          {/* Drag handle icon */}
                          <div
                            onPointerDown={(e) => handleStartDrag(e, item.id, item.x, item.y)}
                            className="cursor-grab p-1 text-muted-foreground hover:text-foreground"
                            title="Drag element"
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </div>

                          {!item.isRedaction && (
                            <>
                              {/* Font Selector */}
                              <select
                                value={item.fontFamily}
                                onChange={(e) =>
                                  updateActiveFontFamily(e.target.value as StandardPdfFontFamily)
                                }
                                className="h-6 rounded border border-border/60 bg-muted/40 px-1.5 text-[11px] font-semibold outline-hidden"
                              >
                                <option value="Helvetica">Helvetica</option>
                                <option value="TimesRoman">Times</option>
                                <option value="Courier">Courier</option>
                              </select>

                              {/* Font Size Stepper */}
                              <div className="flex items-center rounded border border-border/60 bg-muted/40 px-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateActiveFontSize(-1)}
                                  className="px-1 text-[11px] font-bold text-muted-foreground hover:text-foreground"
                                >
                                  -
                                </button>
                                <span className="w-5 text-center text-[11px] font-bold">
                                  {item.size}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateActiveFontSize(1)}
                                  className="px-1 text-[11px] font-bold text-muted-foreground hover:text-foreground"
                                >
                                  +
                                </button>
                              </div>

                              {/* Bold & Italic */}
                              <button
                                type="button"
                                onClick={toggleActiveBold}
                                className={cn(
                                  'h-6 w-6 rounded flex items-center justify-center transition-colors',
                                  item.bold
                                    ? 'bg-primary text-primary-foreground font-bold'
                                    : 'hover:bg-muted text-foreground'
                                )}
                                title="Bold"
                              >
                                <Bold className="h-3 w-3" />
                              </button>

                              <button
                                type="button"
                                onClick={toggleActiveItalic}
                                className={cn(
                                  'h-6 w-6 rounded flex items-center justify-center transition-colors',
                                  item.italic
                                    ? 'bg-primary text-primary-foreground italic'
                                    : 'hover:bg-muted text-foreground'
                                )}
                                title="Italic"
                              >
                                <Italic className="h-3 w-3" />
                              </button>

                              {/* Color Dot Swatch */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setShowColorPicker(!showColorPicker)}
                                  className="h-5 w-5 rounded-full border border-border/60 shadow-xs transition-transform hover:scale-110"
                                  style={{
                                    backgroundColor: `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`,
                                  }}
                                  title="Text Color"
                                />

                                {showColorPicker && (
                                  <div className="absolute top-7 -left-12 z-50 flex items-center gap-1 rounded-xl border border-border/80 bg-background/95 p-2 shadow-2xl backdrop-blur-md">
                                    {PRESET_COLORS.map((c) => (
                                      <button
                                        key={c.label}
                                        type="button"
                                        onClick={() => updateActiveColor(c.rgb)}
                                        className="h-5 w-5 rounded-full border border-border/40 hover:scale-125 transition-transform"
                                        style={{ backgroundColor: c.hex }}
                                        title={c.label}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </>
                          )}

                          <div className="h-3.5 w-px bg-border/60" />

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={handleDuplicateSelected}
                            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                            title="Duplicate (Ctrl+D)"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete / Erase (The solution to removing original text!) */}
                          <button
                            type="button"
                            onClick={handleDeleteSelected}
                            className="p-1 text-muted-foreground hover:text-rose-600 rounded transition-colors"
                            title={
                              item.originalText
                                ? 'Erase original text (Del)'
                                : 'Delete element (Del)'
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500 hover:text-rose-700" />
                          </button>
                        </div>
                      </>
                    )}

                    {/* Inline Textarea / Input when actively editing text */}
                    {isEditing && (
                      <textarea
                        ref={inlineInputRef}
                        autoFocus
                        value={item.text}
                        onFocus={(e) => {
                          const len = e.currentTarget.value.length
                          e.currentTarget.setSelectionRange(len, len)
                        }}
                        onChange={(e) => {
                          const val = e.target.value
                          setEdits((prev) =>
                            prev.map((it) => (it.id === item.id ? { ...it, text: val } : it))
                          )
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            setEditingId(null)
                          } else if (e.key === 'Escape') {
                            setEditingId(null)
                          }
                        }}
                        onBlur={() => setEditingId(null)}
                        className="absolute inset-0 z-40 p-0 m-0 border-0 outline-hidden resize-none bg-transparent"
                        style={{
                          fontFamily:
                            item.fontFamily === 'TimesRoman'
                              ? '"Times New Roman", Times, Georgia, serif'
                              : item.fontFamily === 'Courier'
                              ? '"Courier New", Courier, monospace'
                              : 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          fontSize: `${item.size * (pageDim.width / pageDim.pdfWidth)}px`,
                          fontWeight: item.bold ? '700' : '400',
                          fontStyle: item.italic ? 'italic' : 'normal',
                          color: `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`,
                          caretColor: `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`,
                          lineHeight: 1.25,
                        }}
                      />
                    )}
                  </div>
                )
              })}
          </div>

          {/* Canva Workspace Tip */}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>
              Click any text to select & drag • Double-click to type • Hit{' '}
              <kbd className="font-mono text-[10px] bg-muted px-1 rounded">Delete</kbd> to erase
              original text • Use <kbd className="font-mono text-[10px] bg-muted px-1 rounded">Ctrl+Z</kbd> to undo
            </span>
          </div>
        </div>

        {/* 2. Right Sidebar: Canva Quick Presets & Document Layers */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs">
          {/* Quick Canva Presets */}
          <div className="space-y-2 border-b border-border/60 pb-3">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Type className="h-4 w-4 text-primary" />
              <span>Add Typography</span>
            </h4>

            <div className="grid grid-cols-1 gap-1.5 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddTextPreset('heading')}
                className="justify-start h-9 text-xs font-bold gap-2"
              >
                <Heading className="h-4 w-4 text-primary" />
                <span>Add a heading</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddTextPreset('subheading')}
                className="justify-start h-8 text-xs font-semibold gap-2"
              >
                <Type className="h-3.5 w-3.5 text-primary" />
                <span>Add a subheading</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddTextPreset('body')}
                className="justify-start h-8 text-xs font-normal text-muted-foreground gap-2"
              >
                <Type className="h-3 w-3" />
                <span>Add body text</span>
              </Button>
            </div>
          </div>

          {/* Document Layers & Edits List */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-semibold text-foreground">
                Layers & Edits ({edits.length})
              </h4>
            </div>
            {edits.length > 0 && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Ready to export
              </span>
            )}
          </div>

          {edits.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground">No edits made yet</p>
              <p className="text-[11px] text-muted-foreground/80">
                Click any word on the page to drag, edit, or erase it just like Canva.
              </p>
            </div>
          ) : (
            <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
              {edits.map((edit) => {
                const isSelected = selectedId === edit.id

                return (
                  <div
                    key={edit.id}
                    onClick={() => {
                      setCurrentPage(edit.page + 1)
                      setSelectedId(edit.id)
                    }}
                    className={cn(
                      'flex items-start justify-between rounded-xl border p-2.5 text-xs transition-all cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border/60 bg-muted/20 hover:border-border'
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="font-bold text-foreground">Pg {edit.page + 1}</span>
                        <span>•</span>
                        {edit.isErased ? (
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            Erased
                          </span>
                        ) : edit.isRedaction ? (
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            Whiteout / Redaction
                          </span>
                        ) : (
                          <>
                            <span>{edit.fontFamily}</span>
                            <span>•</span>
                            <span>{edit.size}pt</span>
                          </>
                        )}
                      </div>

                      {/* Original text crossed out */}
                      {edit.originalText && (
                        <div className="text-[11px] text-muted-foreground line-through truncate">
                          "{edit.originalText}"
                        </div>
                      )}

                      {/* Replacement or status */}
                      <div className="font-semibold text-foreground truncate">
                        {edit.isErased ? (
                          <span className="italic text-rose-500 font-normal">
                            Original text removed
                          </span>
                        ) : edit.isRedaction ? (
                          <span className="text-muted-foreground font-normal">
                            Redacted {edit.width}×{edit.height}pt
                          </span>
                        ) : edit.text ? (
                          <span>"{edit.text}"</span>
                        ) : (
                          <span className="italic text-muted-foreground font-normal">
                            (Empty text)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="ml-2 flex items-center gap-1 shrink-0">
                      {edit.isErased ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestoreErased(edit.id)
                          }}
                          className="px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors"
                          title="Restore original text"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedId(edit.id)
                            handleDeleteSelected()
                          }}
                          className="p-1 text-muted-foreground hover:text-rose-600 transition-colors"
                          title="Delete element"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
