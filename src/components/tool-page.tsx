'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Layers,
  Sparkles,
  Wand2,
  ChevronRight,
  Loader2,
  Cpu,
  Star,
  CheckCircle2,
  X,
  ArrowDown,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useUserPreferences } from '@/lib/user-preferences'
import { PrivacyBadge } from '@/components/privacy-badge'
import { Dropzone, type QueuedFile } from '@/components/dropzone'
import { ProcessingPanel } from '@/components/processing-panel'
import {
  ToolOptions,
  hasOptions,
  defaultOptions,
  type ToolOptionsMap,
} from '@/components/tool-options'
import { MergeView, type MergeFile } from '@/components/tools/merge-view'
import { SplitView, type SplitConfig } from '@/components/tools/split-view'
import { RotateView, type RotateConfig } from '@/components/tools/rotate-view'
import { ImagesToPdfView, type ImagesToPdfConfig } from '@/components/tools/images-to-pdf-view'
import { PdfToImageView, type PdfToImagesConfig } from '@/components/tools/pdf-to-images-view'
import { WordToPdfView, type WordFile } from '@/components/tools/word-to-pdf-view'
import { HtmlToPdfView, type HtmlToPdfConfig } from '@/components/tools/html-to-pdf-view'
import { HtmlToImageView, type HtmlToImageConfig } from '@/components/tools/html-to-image-view'
import * as htmlToImage from 'html-to-image'
import { PhotoEditorView, type PhotoEditorResult } from '@/components/tools/photo-editor-view'
import { PdfToExcelView } from '@/components/tools/pdf-to-excel-view'
import { PageNumbersPreview } from '@/components/tools/page-numbers-preview'
import { renderDocxToPages } from '@/lib/docx-renderer'
import { renderXlsxToPages } from '@/lib/xlsx-renderer'
import { OrganizePdfView, type OrganizeResult } from '@/components/tools/organize-view'
import { CropPdfView, type CropResult } from '@/components/tools/crop-view'
import { SignAnnotateView, type SignResult } from '@/components/tools/sign-view'
import { EditTextView, type EditResult } from '@/components/tools/edit-text-view'
import { CropImagesView, type CropImagesResult } from '@/components/tools/crop-images-view'
import { ConvertImagesView, type ConvertImagesResult } from '@/components/tools/convert-images-view'
import { CompressImagesView, type CompressImagesResult } from '@/components/tools/compress-images-view'
import { ResizeImagesView, type ResizeImagesResult } from '@/components/tools/resize-images-view'
import { FaviconGeneratorView, type FaviconResult } from '@/components/tools/favicon-view'
import {
  WatermarkImagesView,
  type WatermarkImagesResult,
} from '@/components/tools/watermark-images-view'
import {
  WatermarkPdfView,
  type WatermarkPdfResult,
} from '@/components/tools/watermark-pdf-view'
import { RotateImagesView, type RotateImagesResult } from '@/components/tools/rotate-images-view'
import { MemeMakerView, type MemeMakerResult } from '@/components/tools/meme-maker-view'
import { BlurFacesView, type BlurFacesResult } from '@/components/tools/blur-faces-view'
import { MorseCodeView } from '@/components/tools/morse-code-view'
import { RandomTextView } from '@/components/tools/random-text-view'
import { TransparentPngView } from '@/components/tools/transparent-png-view'
import { ensureMemeFonts } from '@/lib/meme-fonts'
import { useProcessing } from '@/hooks/use-processing'
import { getProcessor, isImplemented } from '@/lib/processing/registry'
import {
  type Tool,
  type ToolCategory,
  accentClasses,
  tools,
  categoryMeta,
} from '@/lib/tools'
import { cn } from '@/lib/utils'

interface ToolPageProps {
  tool: Tool
  onNavigate: (to: string) => void
  onBack: () => void
}

interface InputConfig {
  accept: string
  multiple: boolean
  hint: string
  mode: 'files' | 'text'
}

/** Load html2canvas from CDN once and wait until it is actually usable. */
async function ensureHtml2Canvas(): Promise<void> {
  const w = window as any
  if (w.html2canvas) return
  if (!document.querySelector('script[data-html2canvas="1"]')) {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
    s.setAttribute('data-html2canvas', '1')
    document.head.appendChild(s)
  }
  for (let i = 0; i < 50; i++) {
    if (w.html2canvas) return
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('Could not load the local rendering engine — check your connection and try again.')
}

function getInput(tool: Tool): InputConfig {
  switch (tool.id) {
    case 'crop-images':
      return { accept: 'image/jpeg,image/jpg,image/png,image/webp', multiple: true, hint: 'JPG, PNG, WEBP images', mode: 'files' }
    case 'convert-images':
      return { accept: 'image/*', multiple: true, hint: 'JPG, PNG, WEBP, GIF, BMP — any image format', mode: 'files' }
    case 'compress-images':
      return { accept: 'image/*', multiple: true, hint: 'JPG, PNG, WEBP, GIF, BMP — any image format', mode: 'files' }
    case 'resize-images':
      return { accept: 'image/*', multiple: true, hint: 'JPG, PNG, WEBP, GIF, BMP — any image format', mode: 'files' }
    case 'favicon-generator':
      return { accept: 'image/*', multiple: true, hint: 'JPG, PNG, WEBP, GIF, BMP — any image format', mode: 'files' }
    case 'watermark-images':
      return { accept: 'image/*', multiple: true, hint: 'JPG, PNG, WEBP, GIF, BMP — any image format', mode: 'files' }
    case 'rotate-images':
      return { accept: 'image/*', multiple: true, hint: 'JPG, PNG, WEBP, GIF, BMP — any image format', mode: 'files' }
    case 'meme-maker':
      return { accept: 'image/*', multiple: true, hint: 'JPG, PNG, WEBP, GIF, BMP — any image format', mode: 'files' }
    case 'blur-faces':
      return { accept: 'image/*', multiple: true, hint: 'JPG, PNG, WEBP, GIF, BMP — any image format', mode: 'files' }
    case 'images-to-pdf':
      return { accept: 'image/*', multiple: true, hint: 'JPG, PNG, WEBP, GIF', mode: 'files' }
    case 'word-to-pdf':
      return { accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document', multiple: true, hint: 'Word .docx files', mode: 'files' }
    case 'excel-to-pdf':
      return { accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', multiple: true, hint: 'Excel .xlsx files', mode: 'files' }
    case 'html-to-pdf':
      return { accept: '', multiple: false, hint: 'Paste your HTML', mode: 'text' }
    case 'html-to-image':
      return { accept: '', multiple: false, hint: 'Paste your HTML', mode: 'text' }
    case 'photo-editor':
      return { accept: 'image/*', multiple: false, hint: 'JPG, PNG, WEBP, GIF, BMP — any image format', mode: 'files' }
    case 'transparent-png':
      return { accept: 'image/*', multiple: true, hint: 'PNG, JPG, WEBP, GIF, BMP — any image format', mode: 'files' }
    case 'morse-code':
      return { accept: '', multiple: false, hint: 'Type or play Morse code', mode: 'text' }
    case 'random-text':
      return { accept: '', multiple: false, hint: 'Generate placeholder text', mode: 'text' }
    default:
      return { accept: 'application/pdf', multiple: tool.batch, hint: 'PDF files', mode: 'files' }
  }
}

const INTERACTIVE_TOOLS = ['organize', 'crop', 'sign-annotate', 'edit-text', 'crop-images', 'convert-images', 'compress-images', 'resize-images', 'favicon-generator', 'watermark-images', 'watermark', 'rotate-images', 'meme-maker', 'blur-faces', 'photo-editor', 'transparent-png', 'morse-code', 'random-text']

export function ToolPage({ tool, onNavigate, onBack }: ToolPageProps) {
  const a = accentClasses[tool.accent]
  const Icon = tool.icon
  const cfg = getInput(tool)
  const [files, setFiles] = React.useState<QueuedFile[]>([])
  const [html, setHtml] = React.useState('')
  const [options, setOptions] = React.useState<ToolOptionsMap>(() =>
    defaultOptions(tool.id)
  )
  const [interactiveResult, setInteractiveResult] = React.useState<
    OrganizeResult | CropResult | SignResult | EditResult | CropImagesResult | ConvertImagesResult | CompressImagesResult | ResizeImagesResult | FaviconResult | WatermarkImagesResult | WatermarkPdfResult | RotateImagesResult | MemeMakerResult | BlurFacesResult | PhotoEditorResult | null
  >(null)
  const [mergeOrder, setMergeOrder] = React.useState<string[]>([])
  const [wordOrder, setWordOrder] = React.useState<string[]>([])
  const addMoreInputRef = React.useRef<HTMLInputElement>(null)
  const implemented = isImplemented(tool.id)
  const preview = !implemented
  const isInteractive = INTERACTIVE_TOOLS.includes(tool.id)
  const isMerge = tool.id === 'merge'
  const isSplit = tool.id === 'split'
  const isRotate = tool.id === 'rotate'
  const isImagesToPdf = tool.id === 'images-to-pdf'
  const isPdfToImages = tool.id === 'pdf-to-images'
  const isWordToPdf = tool.id === 'word-to-pdf'
  const isExcelToPdf = tool.id === 'excel-to-pdf'
  const isHtmlToPdf = tool.id === 'html-to-pdf'
  const isHtmlToImage = tool.id === 'html-to-image'
  const isPhotoEditor = tool.id === 'photo-editor'
  const isPdfToExcel = tool.id === 'pdf-to-excel'
  const isPageNumbers = tool.id === 'page-numbers'
  const isCropImages = tool.id === 'crop-images'
  const isConvertImages = tool.id === 'convert-images'
  const isCompressImages = tool.id === 'compress-images'
  const isResizeImages = tool.id === 'resize-images'
  const isFaviconGenerator = tool.id === 'favicon-generator'
  const isWatermarkImages = tool.id === 'watermark-images'
  const isWatermark = tool.id === 'watermark'
  const isRotateImages = tool.id === 'rotate-images'
  const isMemeMaker = tool.id === 'meme-maker'
  const isBlurFaces = tool.id === 'blur-faces'
  const isTransparentPng = tool.id === 'transparent-png'
  const isMorseCode = tool.id === 'morse-code'
  const isRandomText = tool.id === 'random-text'
  const [splitConfig, setSplitConfig] = React.useState<SplitConfig>({ mode: 'each', ranges: '' })
  const [rotateConfig, setRotateConfig] = React.useState<RotateConfig>({ angle: 90 })
  const [imagesConfig, setImagesConfig] = React.useState<ImagesToPdfConfig>({
    pages: [], orientation: 'portrait', pageSize: 'fit', margin: 0, output: 'single', selectedIds: [],
  })
  const [pdfToImagesConfig, setPdfToImagesConfig] = React.useState<PdfToImagesConfig>({
    mode: 'pages', format: 'png', selectedPages: [], selectedImages: [], scale: 2,
  })
  const [htmlConfig, setHtmlConfig] = React.useState<HtmlToPdfConfig>({
    html: '', orientation: 'portrait', pageSize: 'a4',
    screenWidth: 'desktop', onePage: false, margin: 0,
  })
  const [htmlImageConfig, setHtmlImageConfig] = React.useState<HtmlToImageConfig>({
    html: '', sourceName: '', format: 'png', quality: 0.92,
    screenWidth: 'desktop', scale: 2, background: 'white',
  })

  const processing = useProcessing()
  // True while the main thread pre-renders pages / runs OCR (before run()).
  // Without this, the button shows no feedback during the ~30-60s OCR phase.
  const [preparing, setPreparing] = React.useState(false)
  const [prepareMsg, setPrepareMsg] = React.useState('')

  const related = tools
    .filter((t) => t.category === tool.category && t.id !== tool.id)
    .slice(0, 4)

  const { isFavorite, toggleFavorite, recordRecent } = useUserPreferences()

  React.useEffect(() => {
    recordRecent(tool.id)
  }, [tool.id, recordRecent])


  const cat = categoryMeta(tool.category as ToolCategory)

  // Reset state when switching tools.
  React.useEffect(() => {
    setFiles([])
    setHtml('')
    setOptions(defaultOptions(tool.id))
    setInteractiveResult(null)
    setMergeOrder([])
    setWordOrder([])
    setSplitConfig({ mode: 'each', ranges: '' })
    setRotateConfig({ angle: 90 })
    setImagesConfig({ pages: [], orientation: 'portrait', pageSize: 'fit', margin: 0, output: 'single', selectedIds: [] })
    setPdfToImagesConfig({ mode: 'pages', format: 'png', selectedPages: [], selectedImages: [], scale: 2 })
    setHtmlConfig({ html: '', orientation: 'portrait', pageSize: 'a4', screenWidth: 'desktop', onePage: false, margin: 0 })
    setHtmlImageConfig({ html: '', sourceName: '', format: 'png', quality: 0.92, screenWidth: 'desktop', scale: 2, background: 'white' })
  }, [tool.id])

  // Sync mergeOrder/wordOrder when files change
  React.useEffect(() => {
    if (isMerge || isWordToPdf) {
      const fileIds = new Set(files.map((f) => f.id))
      const setter = isMerge ? setMergeOrder : setWordOrder
      setter((prev) => {
        const kept = prev.filter((id) => fileIds.has(id))
        const newIds = files.filter((f) => !kept.includes(f.id)).map((f) => f.id)
        return [...kept, ...newIds]
      })
    }
  }, [files, isMerge, isWordToPdf])

  // Ordered merge files
  const mergeFiles: MergeFile[] = isMerge
    ? mergeOrder
        .map((id) => files.find((f) => f.id === id))
        .filter((f): f is QueuedFile => !!f)
        .map((f) => ({ id: f.id, file: f.file }))
    : []

  // Ordered word files (Word to PDF)
  const wordFiles: WordFile[] = isWordToPdf
    ? wordOrder
        .map((id) => files.find((f) => f.id === id))
        .filter((f): f is QueuedFile => !!f)
        .map((f) => ({ id: f.id, file: f.file }))
    : []

  // Interactive image tools (crop / convert): stable identity so the view's
  // emit effect does not loop.
  const stableImageFiles = React.useMemo(
    () => files.map((f) => ({ id: f.id, file: f.file })),
    [files]
  )

  const processingRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll down smoothly to processing panel whenever processing starts or completes
  React.useEffect(() => {
    if (processing.status !== 'idle') {
      const timer = setTimeout(() => {
        processingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 80)
      return () => clearTimeout(timer)
    }
  }, [processing.status])

  const canProcess =
    isHtmlToImage
      ? htmlImageConfig.html.trim().length > 0
      : isHtmlToPdf
        ? htmlConfig.html.trim().length > 0
        : cfg.mode === 'files'
          ? files.length > 0
          : html.trim().length > 0

  const needsPassword = tool.id === 'protect'
  const hasPassword = String(options.password ?? '').length > 0
  const interactiveReady = isInteractive ? interactiveResult !== null : true
  const runEnabled = canProcess && interactiveReady && (!needsPassword || hasPassword) && !processing.isWorking && !preparing

  /** Read a queued file's bytes defensively. A stale/unreadable file (e.g.
   * dropped from a location that no longer has it) must surface as a toast,
   * never as an unhandled NotFoundError that crashes the page. */
  const readInput = async (
    qf: QueuedFile
  ): Promise<{ fileName: string; data: ArrayBuffer; size: number } | null> => {
    try {
      const data = await qf.file.arrayBuffer()
      return { fileName: qf.file.name, data, size: qf.file.size }
    } catch (e) {
      console.error('[handleProcess] could not read file:', qf.file.name, e)
      toast.error(
        `Could not read "${qf.file.name}" — please remove it and add the file again.`
      )
      return null
    }
  }

  const handleProcess = async () => {
    if (!canProcess || processing.isWorking || preparing) return

    const processor = getProcessor(tool.id)
    let inputs: { fileName: string; data: ArrayBuffer; size: number }[] = []
    let mode: 'per-file' | 'single' = 'per-file'
    let singleLabel: string | undefined
    let runOptions = options
    let actualProcessor = processor

    // Tools that need main-thread pre-rendering before run() — show feedback.
    const needsPrepare = isHtmlToPdf || isHtmlToImage || isWordToPdf || isExcelToPdf
    if (needsPrepare) {
      setPreparing(true)
      setPrepareMsg(isHtmlToImage ? 'Rendering image…' : 'Rendering pages…')
      // Yield so React paints the preparing state before the heavy work starts.
      await new Promise((r) => setTimeout(r, 0))
    }

    if (isHtmlToImage) {
      // HTML to Image: render HTML visually in a hidden iframe, capture with
      // html2canvas, then encode straight to PNG/JPEG/WebP. The worker only
      // packages the finished bytes (see processors['html-to-image']).
      const htmlContent = htmlImageConfig.html.trim()
      if (!htmlContent) {
        toast.error('Please provide HTML content first.')
        return
      }

      const SCREEN_W = htmlImageConfig.screenWidth === 'mobile' ? 375 : htmlImageConfig.screenWidth === 'tablet' ? 768 : 1280
      const SCALE = htmlImageConfig.scale
      const mime = htmlImageConfig.format === 'jpeg' ? 'image/jpeg' : htmlImageConfig.format === 'webp' ? 'image/webp' : 'image/png'
      const transparent = htmlImageConfig.background === 'transparent' && htmlImageConfig.format !== 'jpeg'

      const iframe = document.createElement('iframe')
      iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${SCREEN_W}px;height:800px;border:none;`
      document.body.appendChild(iframe)

      try {
        await new Promise((r) => setTimeout(r, 100))
        const iframeDoc = iframe.contentDocument || iframe.contentWindow!.document
        const isFullDoc = /<html[\s>]/i.test(htmlContent)
        iframeDoc.open()
        if (isFullDoc) {
          iframeDoc.write(htmlContent)
        } else {
          iframeDoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
            html, body { margin:0; padding:0; }
            body { background:${transparent ? 'transparent' : '#ffffff'}; }
          </style></head><body>${htmlContent}</body></html>`)
        }
        iframeDoc.close()

        // Wait for content to render (fonts, images, layout)
        await new Promise((r) => setTimeout(r, 1200))

        const body = iframeDoc.body
        const html = iframeDoc.documentElement
        const contentH = Math.max(
          body ? body.scrollHeight : 0,
          body ? body.offsetHeight : 0,
          html ? html.clientHeight : 0,
          html ? html.scrollHeight : 0,
          html ? html.offsetHeight : 0,
          100
        )

        // Size iframe to fit the exact rendered content
        iframe.style.width = `${SCREEN_W}px`
        iframe.style.height = `${contentH}px`

        let blob: Blob | null = null
        try {
          console.log('[html-to-image] Rendering via html-to-image (SVG native engine):', SCREEN_W, 'x', contentH, 'scale', SCALE)
          const targetNode = iframeDoc.documentElement || iframeDoc.body
          const canvas = await htmlToImage.toCanvas(targetNode, {
            width: SCREEN_W,
            height: contentH,
            canvasWidth: SCREEN_W * SCALE,
            canvasHeight: contentH * SCALE,
            pixelRatio: SCALE,
            backgroundColor: transparent ? undefined : '#ffffff',
            skipFonts: false,
          })
          blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mime, htmlImageConfig.quality))
        } catch (err) {
          console.warn('[html-to-image] Primary engine encountered issue, falling back to html2canvas:', err)
          await ensureHtml2Canvas()
          const h2c = (window as any).html2canvas
          const canvas = await h2c(iframeDoc.documentElement, {
            scale: SCALE,
            useCORS: true,
            allowTaint: true,
            backgroundColor: transparent ? null : '#ffffff',
            width: SCREEN_W,
            height: contentH,
            windowWidth: SCREEN_W,
          })
          blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mime, htmlImageConfig.quality))
        }

        if (!blob) throw new Error('Could not encode the image — try a smaller render width or scale.')
        // Browsers silently fall back on unsupported encoders (e.g. WebP → PNG
        // on Safari) — trust the actual blob type for extension + mime.
        const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
        const ext = EXT[blob.type] || 'png'
        const data = await blob.arrayBuffer()
        const baseName =
          (htmlImageConfig.sourceName || 'html-to-image').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-') || 'html-to-image'
        inputs = [{ fileName: `${baseName}.${ext}`, data, size: data.byteLength }]
        actualProcessor = 'html-to-image'
        mode = 'per-file'
      } finally {
        iframe.remove()
      }
    } else if (isHtmlToPdf) {
      // HTML to PDF: render HTML visually in iframe, capture with html2canvas,
      // send page images to worker. Also send the raw HTML so the worker can
      // draw invisible selectable text on top of the images.
      const htmlContent = htmlConfig.html.trim()
      if (!htmlContent) {
        toast.error('Please provide HTML content first.')
        return
      }

      const SCREEN_W = htmlConfig.screenWidth === 'mobile' ? 375 : htmlConfig.screenWidth === 'tablet' ? 768 : 1280
      const DIMS: Record<string, [number, number]> = { a4: [595.28, 841.89], letter: [612, 792] }
      const dims = DIMS[htmlConfig.pageSize] || DIMS.a4
      const realW = htmlConfig.orientation === 'portrait' ? Math.min(dims[0], dims[1]) : Math.max(dims[0], dims[1])
      const realH = htmlConfig.orientation === 'portrait' ? Math.max(dims[0], dims[1]) : Math.min(dims[0], dims[1])
      const SCALE = 2

      // Create isolated iframe and render the HTML
      const iframe = document.createElement('iframe')
      iframe.style.cssText = `position:fixed;left:0;top:0;width:${SCREEN_W}px;height:${realH}px;border:none;z-index:-1;opacity:1;`
      document.body.appendChild(iframe)

      // Wait for iframe to be ready, then write content
      await new Promise(r => setTimeout(r, 100))
      const iframeDoc = iframe.contentDocument || iframe.contentWindow!.document
      iframeDoc.open()
      iframeDoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#fff; padding:${htmlConfig.margin}px; width:${SCREEN_W - htmlConfig.margin * 2}px; }
      </style></head><body>${htmlContent}</body></html>`)
      iframeDoc.close()

      // Wait for content to render (fonts, images, layout)
      await new Promise(r => setTimeout(r, 1500))

      // Load html2canvas into the MAIN window (not iframe) and capture
      // the iframe's document body by passing it as the target element
      if (!(window as any).html2canvas) {
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
        document.head.appendChild(s)
        await new Promise(r => setTimeout(r, 500))
      }
      const h2c = (window as any).html2canvas

      const contentH = iframeDoc.body.scrollHeight
      console.log('[html-to-pdf] Capturing iframe content:', SCREEN_W, 'x', contentH)

      // Use the iframe's document element as the target
      const canvas = await h2c(iframeDoc.documentElement, {
        scale: SCALE,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: SCREEN_W,
        height: contentH,
        windowWidth: SCREEN_W,
      })
      console.log('[html-to-pdf] Canvas captured:', canvas.width, 'x', canvas.height)

      document.body.removeChild(iframe)

      // Split into pages (or keep as one long page)
      const pageHScaled = realH * SCALE
      const pageImages: { dataUrl: string; w: number; h: number }[] = []

      if (htmlConfig.onePage) {
        // One long page — use the entire canvas as a single image
        pageImages.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), w: canvas.width, h: canvas.height })
      } else {
        let y = 0
        while (y < canvas.height) {
          const ph = Math.min(pageHScaled, canvas.height - y)
          const pc = document.createElement('canvas')
          pc.width = canvas.width
          pc.height = ph
          const pctx = pc.getContext('2d')!
          pctx.fillStyle = '#ffffff'
          pctx.fillRect(0, 0, pc.width, pc.height)
          pctx.drawImage(canvas, 0, y, canvas.width, ph, 0, 0, canvas.width, ph)
          pageImages.push({ dataUrl: pc.toDataURL('image/jpeg', 0.92), w: canvas.width, h: ph })
          y += ph
        }
      }

      // Send page images to worker — use images-to-pdf processor
      for (const page of pageImages) {
        const base64 = page.dataUrl.split(',')[1]
        const binary = atob(base64)
        const arr = new Uint8Array(binary.length)
        for (let j = 0; j < binary.length; j++) arr[j] = binary.charCodeAt(j)
        // Verify JPEG magic bytes
        if (arr[0] !== 0xff || arr[1] !== 0xd8) {
          throw new Error('Invalid JPEG data from canvas')
        }
        inputs.push({ fileName: 'page-' + (inputs.length + 1) + '.jpg', data: arr.buffer.slice(0), size: arr.buffer.byteLength })
      }

      actualProcessor = 'images-to-pdf'
      runOptions = {
        ...options,
        output: 'single',
        pageSize: 'fit',
        outputName: 'html-output',
      }
      mode = 'single'
      singleLabel = 'HTML → PDF output'
    } else if (cfg.mode === 'text') {
      const data = new TextEncoder().encode(html).buffer as ArrayBuffer
      inputs = [{ fileName: 'input.html', data, size: data.byteLength }]
      mode = 'single'
      singleLabel = 'HTML → PDF output'
    } else if (isWordToPdf) {
      // Word to PDF: pre-render DOCX to page images on the main thread
      // (using mammoth + html2canvas), then send images to the worker
      // which wraps them in a PDF. This makes the output look exactly like Word.
      const orderedFiles = wordFiles.map((wf) => files.find((f) => f.id === wf.id)!).filter(Boolean)
      let allRendered = true
      for (const qf of orderedFiles) {
        try {
          const pages = await renderDocxToPages(qf.file)
          if (pages.length === 0) throw new Error('No pages rendered')
          for (const page of pages) {
            // Convert data URL to ArrayBuffer
            const base64 = page.dataUrl.split(',')[1]
            const binary = atob(base64)
            const arr = new Uint8Array(binary.length)
            for (let j = 0; j < binary.length; j++) arr[j] = binary.charCodeAt(j)
            // Verify the JPEG starts with the correct magic bytes (0xFF 0xD8)
            if (arr[0] !== 0xff || arr[1] !== 0xd8) {
              throw new Error('Invalid JPEG data')
            }
            inputs.push({
              fileName: 'page-' + (inputs.length + 1) + '.jpg',
              data: arr.buffer,
              size: arr.buffer.byteLength,
            })
          }
        } catch (e) {
          // Fallback: send raw DOCX to the worker's word-to-pdf processor
          console.error('DOCX render failed, falling back:', e)
          allRendered = false
          const inp = await readInput(qf)
          if (inp) inputs.push(inp)
        }
      }
      if (allRendered) {
        // Use the images-to-pdf processor to wrap the page images in a PDF
        actualProcessor = 'images-to-pdf'
        const outputName = orderedFiles.length === 1
          ? orderedFiles[0].file.name.replace(/\.docx?$/i, '')
          : 'word-converted'
        runOptions = { ...options, output: 'single', pageSize: 'fit', outputName }
      } else {
        // Fallback: use the word-to-pdf processor with the raw DOCX
        actualProcessor = 'word-to-pdf'
        runOptions = options
      }
      mode = 'single'
      singleLabel = 'Word → PDF output'
    } else if (isExcelToPdf) {
      // Excel to PDF: pre-render XLSX to page images on the main thread
      // (preserving colors, merges, borders, fonts), then send images to worker
      for (const qf of files) {
        try {
          const pages = await renderXlsxToPages(qf.file)
          if (pages.length === 0) throw new Error('No pages rendered')
          for (const page of pages) {
            const base64 = page.dataUrl.split(',')[1]
            const binary = atob(base64)
            const arr = new Uint8Array(binary.length)
            for (let j = 0; j < binary.length; j++) arr[j] = binary.charCodeAt(j)
            if (arr[0] !== 0xff || arr[1] !== 0xd8) throw new Error('Invalid JPEG data')
            inputs.push({ fileName: 'page-' + (inputs.length + 1) + '.jpg', data: arr.buffer, size: arr.buffer.byteLength })
          }
          const outputName = qf.file.name.replace(/\.xlsx?$/i, '')
          actualProcessor = 'images-to-pdf'
          runOptions = { ...options, output: 'single', pageSize: 'fit', outputName }
        } catch (e) {
          console.error('XLSX render failed, falling back:', e)
          const inp = await readInput(qf)
          if (inp) inputs.push(inp)
          actualProcessor = 'excel-to-pdf'
          runOptions = options
        }
      }
      mode = 'single'
      singleLabel = 'Excel → PDF output'
    } else if (isPhotoEditor) {
      // Photo Editor: the view composites the edited photo live and emits the
      // finished PNG bytes — the worker only packages them for download.
      const res = interactiveResult as PhotoEditorResult | null
      if (!res || !res.data || res.data.byteLength === 0) {
        toast.error('The editor has no output yet — try again.')
        return
      }
      inputs = [{ fileName: res.fileName, data: res.data, size: res.data.byteLength }]
      actualProcessor = 'photo-editor'
      mode = 'per-file'
    } else if (isCropImages) {
      // Crop Images: only files with a drawn crop are processed, per-file.
      // Crops come from the interactive view in natural pixel coordinates.
      const cropRes = interactiveResult as CropImagesResult | null
      const cropMap = cropRes?.crops ?? {}
      for (const qf of files) {
        if (!cropMap[qf.file.name]) continue
        const inp = await readInput(qf)
        if (inp) inputs.push(inp)
      }
      runOptions = { ...options, crops: cropMap }
    } else if (isFaviconGenerator) {
      // Favicon Generator: every file becomes one multi-size .ico, per-file.
      const favRes = interactiveResult as FaviconResult | null
      for (const qf of files) {
        const inp = await readInput(qf)
        if (inp) inputs.push(inp)
      }
      runOptions = {
        ...options,
        sizes: favRes?.sizes ?? [16, 32, 48, 64, 128, 256],
      }
    } else if (isWatermarkImages) {
      // Watermark Image: every file keeps its size and format; layers carry
      // the stamping config (image layers are stripped to plain data and
      // carry the logo bytes for the worker).
      const wmRes = interactiveResult as WatermarkImagesResult | null
      for (const qf of files) {
        const inp = await readInput(qf)
        if (inp) inputs.push(inp)
      }
      const wmLayers: Record<string, unknown>[] = []
      for (const layer of wmRes?.layers ?? []) {
        const base: Record<string, unknown> = { ...layer, logo: null, logoUrl: '' }
        if (layer.type === 'image' && layer.logo) {
          try {
            base.logoData = await layer.logo.arrayBuffer()
            base.logoName = layer.logo.name
          } catch (e) {
            console.error('[handleProcess] could not read watermark logo:', layer.logo.name, e)
            toast.error(`Could not read logo "${layer.logo.name}" — please re-select it.`)
          }
        }
        wmLayers.push(base)
      }
      runOptions = { ...options, layers: wmLayers }
    } else if (isWatermark) {
      // Watermark PDF: layers carry the stamping config (image layers are
      // stripped to plain data and carry the logo bytes for the worker).
      const wmPdfRes = interactiveResult as WatermarkPdfResult | null
      for (const qf of files) {
        const inp = await readInput(qf)
        if (inp) inputs.push(inp)
      }
      const wmPdfLayers: Record<string, unknown>[] = []
      for (const layer of wmPdfRes?.layers ?? []) {
        const base: Record<string, unknown> = { ...layer, logo: null, logoUrl: '' }
        if (layer.type === 'image' && layer.logo) {
          try {
            base.logoData = await layer.logo.arrayBuffer()
            base.logoName = layer.logo.name
          } catch (e) {
            console.error('[handleProcess] could not read watermark logo:', layer.logo.name, e)
            toast.error(`Could not read logo "${layer.logo.name}" — please re-select it.`)
          }
        }
        wmPdfLayers.push(base)
      }
      runOptions = { layers: wmPdfLayers }
    } else if (isRotateImages) {
      // Rotate Image: every file is processed, per-file, each with its own
      // quarter-turn angle + flips chosen in the interactive view.
      const rotRes = interactiveResult as RotateImagesResult | null
      for (const qf of files) {
        const inp = await readInput(qf)
        if (inp) inputs.push(inp)
      }
      runOptions = {
        ...options,
        rotations: rotRes?.rotations ?? {},
      }
    } else if (isMemeMaker) {
      // Meme Maker: every file is processed, per-file, with its own text
      // layers + inside/outside mode from the interactive view. The bundled
      // font faces are passed along so the worker renders text identically
      // to the live preview.
      const memeRes = interactiveResult as MemeMakerResult | null
      for (const qf of files) {
        const inp = await readInput(qf)
        if (inp) inputs.push(inp)
      }
      let fontData: { family: string; weight: string; data: ArrayBuffer }[] = []
      try {
        fontData = await ensureMemeFonts()
      } catch (e) {
        console.error('[handleProcess] could not load meme fonts:', e)
      }
      runOptions = {
        ...options,
        memes: memeRes?.memes ?? {},
        fonts: fontData,
      }
    } else if (isBlurFaces) {
      // Blur Face: every file is processed, per-file, with its own blur
      // areas + the shared strength chosen in the interactive view.
      const blurRes = interactiveResult as BlurFacesResult | null
      for (const qf of files) {
        const inp = await readInput(qf)
        if (inp) inputs.push(inp)
      }
      runOptions = {
        ...options,
        shapes: blurRes?.shapes ?? {},
        strength: blurRes?.strength ?? 40,
      }
    } else if (isConvertImages) {
      // Convert Images: every file is processed, per-file, each with its own
      // target format chosen in the interactive view.
      const convRes = interactiveResult as ConvertImagesResult | null
      for (const qf of files) {
        const inp = await readInput(qf)
        if (inp) inputs.push(inp)
      }
      runOptions = {
        ...options,
        formats: convRes?.formats ?? {},
        quality: convRes?.quality ?? 0.92,
      }
    } else if (isCompressImages) {
      // Compress Image is fully automatic — no user options. The worker
      // re-encodes each file in its original format and never returns a
      // larger file (originals win when already optimized).
      for (const qf of files) {
        const inp = await readInput(qf)
        if (inp) inputs.push(inp)
      }
      runOptions = {}
    } else if (isResizeImages) {
      // Resize Image: every file is processed, per-file, with the shared
      // pixels/percentage settings chosen in the interactive view.
      const rszRes = interactiveResult as ResizeImagesResult | null
      for (const qf of files) {
        const inp = await readInput(qf)
        if (inp) inputs.push(inp)
      }
      runOptions = {
        ...options,
        mode: rszRes?.mode ?? 'pixels',
        width: rszRes?.width ?? 800,
        height: rszRes?.height ?? 600,
        maintainAspect: rszRes?.maintainAspect ?? true,
        noEnlarge: rszRes?.noEnlarge ?? true,
        scale: rszRes?.scale ?? 0.5,
      }
    } else {
      // For merge/word-to-pdf, use the drag-ordered files; otherwise use files as-is
      const orderedFiles = isMerge
        ? mergeFiles.map((mf) => files.find((f) => f.id === mf.id)!).filter(Boolean)
        : isWordToPdf
          ? wordFiles.map((wf) => files.find((f) => f.id === wf.id)!).filter(Boolean)
          : files
      for (const qf of orderedFiles) {
        const inp = await readInput(qf)
        if (!inp) continue
        inputs.push(inp)
        /* For PDF to Excel: send a second copy of the raw PDF bytes with a
           special filename so the worker can parse the raw content stream
           for colors + background rects (pdf.js detaches the first copy). */
        if (isPdfToExcel) {
          try {
            const rawCopy = await qf.file.arrayBuffer()
            inputs.push({ fileName: '__raw__' + qf.file.name, data: rawCopy, size: rawCopy.byteLength })
          } catch (e) {
            console.error('[handleProcess] raw copy read failed:', qf.file.name, e)
          }
        }
      }
      if (isMerge) {
        mode = 'single'
        singleLabel = 'Merged document'
      } else if (isPdfToExcel) {
        mode = 'single'
        singleLabel = 'PDF → Excel output'
      } else if (isSplit) {
        // Split uses the SplitView config instead of the generic options
        runOptions = { ...options, mode: splitConfig.mode, ranges: splitConfig.ranges }
      } else if (isRotate) {
        // Rotate uses the RotateView config
        runOptions = { ...options, angle: rotateConfig.angle }
      } else if (isImagesToPdf) {
        // Images to PDF uses the ImagesToPdfView config
        runOptions = {
          ...options,
          pages: imagesConfig.pages,
          orientation: imagesConfig.orientation,
          pageSize: imagesConfig.pageSize,
          margin: imagesConfig.margin,
          output: imagesConfig.output,
          selectedIds: imagesConfig.selectedIds,
        }
        if (imagesConfig.output === 'single') {
          mode = 'single'
          singleLabel = 'Combined image PDF'
        }
      } else if (isPdfToImages) {
        // PDF to Images uses the PdfToImageView config
        runOptions = {
          ...options,
          mode: pdfToImagesConfig.mode,
          format: pdfToImagesConfig.format,
          scale: pdfToImagesConfig.scale,
          selectedPages: pdfToImagesConfig.selectedPages,
          selectedImages: pdfToImagesConfig.selectedImages.length > 0 ? pdfToImagesConfig.selectedImages : null,
        }
      } else if (isInteractive) {
        mode = 'single'
        singleLabel = tool.name + ' output'
        runOptions = { ...options, ...(interactiveResult as object) }
      }
    }

    try {
      setPreparing(false)
      await processing.run({ processor: actualProcessor, mode, inputs, options: runOptions, singleLabel })
    } catch (e) {
      console.error('[handleProcess] run() failed:', e)
      toast.error('Conversion failed: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setPreparing(false)
      setPrepareMsg('')
    }
  }

  // Keyboard shortcut: Cmd/Ctrl + Enter to run, Escape to back
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (runEnabled) {
          e.preventDefault()
          void handleProcess()
        }
      } else if (e.key === 'Escape') {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          onBack()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [runEnabled, onBack])

  // Merge file handlers
  const handleMergeReorder = (reordered: MergeFile[]) => {
    setMergeOrder(reordered.map((f) => f.id))
  }
  const handleMergeRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }
  const handleWordReorder = (reordered: WordFile[]) => {
    setWordOrder(reordered.map((f) => f.id))
  }
  const handleWordRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }
  const handleAddMore = () => {
    addMoreInputRef.current?.click()
  }
  const handleAddMoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFiles: QueuedFile[] = Array.from(e.target.files).map((file) => ({
        id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
      }))
      setFiles((prev) => [...prev, ...newFiles])
    }
    e.target.value = ''
  }

  const buttonLabel = preparing
    ? prepareMsg
    : processing.isWorking
      ? 'Processing…'
      : implemented
        ? `Run ${tool.name}`
        : preview
          ? 'Run engine preview'
          : `Run ${tool.name}`

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Breadcrumb / back */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 py-1.5 transition-all hover:border-primary/40 hover:text-foreground active-push cursor-pointer glass-card"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All tools</span>
        </button>
        <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
        <button
          onClick={() => onNavigate(`/category/${tool.category}`)}
          className="rounded-full border border-border/80 bg-card px-3 py-1.5 transition-all hover:border-primary/40 hover:text-foreground active-push cursor-pointer glass-card"
        >
          {cat?.name}
        </button>
        <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
        <span className="font-semibold text-foreground px-1">{tool.name}</span>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <span
            className={cn(
              'grid h-16 w-16 shrink-0 place-items-center rounded-2xl ring-1 shadow-xs',
              a.badge,
              a.ring
            )}
          >
            <Icon className="h-8 w-8" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              {tool.name}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground leading-relaxed">
              {tool.description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleFavorite(tool.id)}
            className={cn(
              'rounded-full h-8 px-3.5 gap-1.5 text-xs font-semibold cursor-pointer active-push border-border/80',
              isFavorite(tool.id)
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Star className={cn('h-3.5 w-3.5', isFavorite(tool.id) && 'fill-amber-500')} />
            <span>{isFavorite(tool.id) ? 'Pinned' : 'Pin tool'}</span>
          </Button>

          {tool.batch && (
            <Badge variant="secondary" className="rounded-full font-mono text-[10px] uppercase tracking-wider">
              <Layers className="mr-1 h-3 w-3" /> Batch
            </Badge>
          )}
          {tool.tag && (
            <Badge className="rounded-full font-mono text-[10px] uppercase tracking-wider">{tool.tag}</Badge>
          )}
          {tool.locked && (
            <span
              title="Production verified"
              className="inline-flex items-center rounded-full bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400"
            >
              <Lock className="h-3 w-3" />
            </span>
          )}
          {preview && !isMorseCode && !isRandomText && !isTransparentPng && (
            <Badge variant="outline" className="rounded-full border-amber-500/40 text-amber-600 dark:text-amber-400 font-mono text-[10px]">
              <Sparkles className="mr-1 h-3 w-3" /> Step {tool.step}
            </Badge>
          )}
        </div>
      </motion.div>

      <div className="mt-5">
        <PrivacyBadge />
      </div>

      {/* Working area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 rounded-2xl border border-border/80 bg-card/80 p-5 glass-card sm:p-7 shadow-xs"
      >
        {/* Hidden input for "add more files" (merge) */}
        <input
          ref={addMoreInputRef}
          type="file"
          accept={isConvertImages || isFaviconGenerator || isWatermarkImages || isRotateImages || isMemeMaker || isBlurFaces || isTransparentPng ? 'image/*' : isWordToPdf ? '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document' : isExcelToPdf ? '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : isImagesToPdf || isCropImages ? 'image/jpeg,image/jpg,image/png,image/webp' : 'application/pdf'}
          multiple
          className="hidden"
          onChange={handleAddMoreChange}
        />

        {isMorseCode ? (
          <MorseCodeView />
        ) : isRandomText ? (
          <RandomTextView />
        ) : isTransparentPng && files.length > 0 ? (
          <TransparentPngView
            files={stableImageFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onAddMore={handleAddMore}
          />
        ) : isMerge && files.length > 0 ? (
          <MergeView
            files={mergeFiles}
            onReorder={handleMergeReorder}
            onRemove={handleMergeRemove}
            onAddMore={handleAddMore}
          />
        ) : isSplit && files.length > 0 ? (
          <SplitView
            file={files[0].file}
            config={splitConfig}
            onConfigChange={setSplitConfig}
          />
        ) : isRotate && files.length > 0 ? (
          <RotateView
            file={files[0].file}
            config={rotateConfig}
            onConfigChange={setRotateConfig}
            onRemoveFile={() => setFiles([])}
          />
        ) : isImagesToPdf && files.length > 0 ? (
          <ImagesToPdfView
            files={files.map((f) => ({ id: f.id, file: f.file }))}
            config={imagesConfig}
            onConfigChange={setImagesConfig}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onAddMore={handleAddMore}
          />
        ) : isPdfToImages && files.length > 0 ? (
          <PdfToImageView
            file={files[0].file}
            config={pdfToImagesConfig}
            onConfigChange={setPdfToImagesConfig}
            onRemoveFile={() => setFiles([])}
          />
        ) : isWordToPdf && files.length > 0 ? (
          <WordToPdfView
            files={wordFiles}
            onReorder={handleWordReorder}
            onRemove={handleWordRemove}
            onAddMore={handleAddMore}
          />
        ) : isPdfToExcel && files.length > 0 ? (
          <PdfToExcelView
            files={files}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
          />
        ) : isWatermark && files.length > 0 ? (
          <WatermarkPdfView
            files={stableImageFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onAddMore={handleAddMore}
            onChange={setInteractiveResult}
          />
        ) : isCropImages && files.length > 0 ? (
          <CropImagesView
            files={stableImageFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onAddMore={handleAddMore}
            onChange={setInteractiveResult}
          />
        ) : isConvertImages && files.length > 0 ? (
          <ConvertImagesView
            files={stableImageFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onAddMore={handleAddMore}
            onChange={setInteractiveResult}
          />
        ) : isCompressImages && files.length > 0 ? (
          <CompressImagesView
            files={stableImageFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onAddMore={handleAddMore}
            onChange={setInteractiveResult}
          />
        ) : isResizeImages && files.length > 0 ? (
          <ResizeImagesView
            files={stableImageFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onAddMore={handleAddMore}
            onChange={setInteractiveResult}
          />
        ) : isFaviconGenerator && files.length > 0 ? (
          <FaviconGeneratorView
            files={stableImageFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onAddMore={handleAddMore}
            onChange={setInteractiveResult}
          />
        ) : isWatermarkImages && files.length > 0 ? (
          <WatermarkImagesView
            files={stableImageFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onAddMore={handleAddMore}
            onChange={setInteractiveResult}
          />
        ) : isRotateImages && files.length > 0 ? (
          <RotateImagesView
            files={stableImageFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onAddMore={handleAddMore}
            onChange={setInteractiveResult}
          />
        ) : isMemeMaker && files.length > 0 ? (
          <MemeMakerView
            files={stableImageFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onAddMore={handleAddMore}
            onChange={setInteractiveResult}
          />
        ) : isBlurFaces && files.length > 0 ? (
          <BlurFacesView
            files={stableImageFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onAddMore={handleAddMore}
            onChange={setInteractiveResult}
          />
        ) : isPhotoEditor && files.length > 0 ? (
          <PhotoEditorView
            file={files[0].file}
            onChange={setInteractiveResult}
          />
        ) : isInteractive && files.length > 0 ? (
          <InteractiveEditor
            toolId={tool.id}
            file={files[0].file}
            onResultChange={setInteractiveResult}
            onRemoveFile={() => setFiles([])}
          />
        ) : isHtmlToImage ? (
          <HtmlToImageView
            config={htmlImageConfig}
            onConfigChange={setHtmlImageConfig}
          />
        ) : isHtmlToPdf ? (
          <HtmlToPdfView
            config={htmlConfig}
            onConfigChange={setHtmlConfig}
            onRemoveFile={() => setHtmlConfig({ ...htmlConfig, html: '' })}
          />
        ) : cfg.mode === 'files' ? (
          <Dropzone
            files={files}
            onFilesChange={setFiles}
            accept={cfg.accept}
            multiple={cfg.multiple}
            hint={cfg.hint}
          />
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-border bg-background p-6">
            <label className="mb-2 block text-sm font-medium">
              Paste your HTML markup
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder={'<h1>Hello PDF</h1>\n<p>Render this into a PDF…</p>'}
              className="min-h-[220px] w-full resize-y rounded-xl border border-border bg-card p-4 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              HTML rendering arrives in Step {tool.step}.
            </p>
          </div>
        )}

        {/* Tool-specific options */}
        {cfg.mode === 'files' && hasOptions(tool.id) && files.length > 0 && !isSplit && !isMerge && !isRotate && !isImagesToPdf && !isPdfToImages && !isWordToPdf && !isExcelToPdf && !isHtmlToPdf && !isHtmlToImage && !isPdfToExcel && (
          <div className="mt-5">
            <ToolOptions
              tool={tool}
              options={options}
              onChange={setOptions}
              disabled={processing.isWorking}
            />
          </div>
        )}

        {/* Page Numbers: real-time first-page preview with the number overlay.
            Larger size so the user can clearly see how the number looks. */}
        {isPageNumbers && files.length > 0 && (
          <div className="mt-6">
            <PageNumbersPreview
              file={files[0].file}
              config={{
                position: (options.position as string) || 'bottom-center',
                fontSize: Number(options.fontSize ?? 11),
                format: (options.format as string) || '{n}',
                startNumber: Number(options.startNumber ?? 1),
                margin: Number(options.margin ?? 28),
              }}
            />
          </div>
        )}

        {/* Action bar (hidden on standalone interactive tools like Morse, Random Text, and Transparent PNG) */}
        {!isMorseCode && !isRandomText && (!isTransparentPng || files.length === 0) && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-6 sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className={cn('h-2 w-2 rounded-full', runEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40')} />
              <span>
                {processing.isWorking
                  ? 'Processing locally in browser memory…'
                  : cfg.mode === 'files'
                    ? files.length === 0
                      ? 'Upload files above to begin'
                      : `${files.length} file${files.length > 1 ? 's' : ''} queued and ready`
                    : isHtmlToImage
                      ? htmlImageConfig.html.trim()
                        ? 'HTML ready to render'
                        : 'Paste code or upload an HTML file'
                      : html.trim()
                        ? 'HTML template ready'
                        : 'Paste HTML code to begin'}
              </span>
            </div>

            <Button
              size="lg"
              className="w-full sm:w-auto h-11 px-6 rounded-xl font-semibold gap-2.5 shadow-md shadow-primary/20 cursor-pointer active-push text-sm"
              disabled={!runEnabled}
              onClick={handleProcess}
            >
              {(processing.isWorking || preparing) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              <span>{buttonLabel}</span>
              {runEnabled && !processing.isWorking && !preparing && (
                <kbd className="hidden sm:inline-flex h-5 select-none items-center rounded-md bg-primary-foreground/20 px-1.5 font-mono text-[10px] font-medium text-primary-foreground">
                  ⌘↵
                </kbd>
              )}
            </Button>
          </div>
        )}

        {preview && !isMorseCode && !isRandomText && !isTransparentPng && !processing.isWorking && processing.status === 'idle' && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-300">
                Engine preview · real {tool.name} logic arrives in Step {tool.step}.
              </p>
              <p className="mt-0.5 text-muted-foreground">
                The full pipeline is live — drop files and hit “Run engine
                preview” to watch the Web Worker queue, live progress bars and
                ZIP download in action. Files are processed locally and never
                uploaded.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Processing panel */}
      <div ref={processingRef} id="processing-panel-section" className="scroll-mt-20">
        <AnimatePresence>
          {processing.status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="mt-8"
            >
              <ProcessingPanel
                items={processing.items}
                status={processing.status}
                overallProgress={processing.overallProgress}
                concurrency={processing.concurrency}
                isWorking={processing.isWorking}
                hasResults={processing.hasResults}
                onCancel={processing.cancel}
                onReset={processing.reset}
                onDownloadOne={processing.downloadOne}
                onDownloadAll={processing.downloadAll}
                preview={preview}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Processing Status HUD for instant feedback */}
      <AnimatePresence>
        {processing.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
          >
            <button
              onClick={() => {
                processingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              className={cn(
                'flex items-center gap-2.5 rounded-full px-4 py-2.5 text-xs font-semibold shadow-2xl backdrop-blur-xl border glass-card transition-all active-push cursor-pointer',
                processing.isWorking
                  ? 'border-primary/50 bg-background/95 text-foreground ring-2 ring-primary/20'
                  : processing.status === 'completed'
                    ? 'border-emerald-500/50 bg-background/95 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                    : 'border-destructive/50 bg-background/95 text-destructive ring-2 ring-destructive/20'
              )}
            >
              {processing.isWorking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Processing {Math.round(processing.overallProgress * 100)}%</span>
                  <span className="text-muted-foreground font-mono text-[10px] flex items-center gap-0.5">
                    · Jump to results <ArrowDown className="h-3 w-3" />
                  </span>
                </>
              ) : processing.status === 'completed' ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Completed</span>
                  <span className="text-muted-foreground font-mono text-[10px] flex items-center gap-0.5">
                    · Download files <ArrowDown className="h-3 w-3" />
                  </span>
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5 text-destructive" />
                  <span>Failed</span>
                  <span className="text-muted-foreground font-mono text-[10px] flex items-center gap-0.5">
                    · View errors <ArrowDown className="h-3 w-3" />
                  </span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Related tools */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Related tools</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((r) => {
              const RIcon = r.icon
              const ra = accentClasses[r.accent]
              return (
                <button
                  key={r.id}
                  onClick={() => onNavigate(`/${r.id}`)}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-border/70 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-lg ring-1',
                      ra.badge,
                      ra.ring
                    )}
                  >
                    <RIcon className="h-4.5 w-4.5" />
                  </span>
                  <span className="text-sm font-medium">{r.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function InteractiveEditor({
  toolId,
  file,
  onResultChange,
  onRemoveFile,
}: {
  toolId: string
  file: File
  onResultChange: (result: OrganizeResult | CropResult | SignResult | EditResult | null) => void
  onRemoveFile?: () => void
}) {
  if (toolId === 'organize') return <OrganizePdfView file={file} onResultChange={onResultChange} onRemoveFile={onRemoveFile} />
  if (toolId === 'crop') return <CropPdfView file={file} onResultChange={onResultChange} onRemoveFile={onRemoveFile} />
  if (toolId === 'sign-annotate') return <SignAnnotateView file={file} onResultChange={onResultChange} />
  if (toolId === 'edit-text') return <EditTextView file={file} onResultChange={onResultChange} />
  return null
}
