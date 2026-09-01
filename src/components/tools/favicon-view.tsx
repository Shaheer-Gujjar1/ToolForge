'use client'

import * as React from 'react'
import { Globe as GlobeIcon, ImagePlus, Loader2, X, Sparkles, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FaviconResult {
  /** Square sizes (px) embedded in the .ico, ascending. */
  sizes: number[]
}

interface FaviconViewProps {
  files: { id: string; file: File }[]
  onRemove: (id: string) => void
  onAddMore: () => void
  onChange: (result: FaviconResult | null) => void
}

interface ImageMeta {
  url: string
  width: number
  height: number
}

const SIZE_OPTIONS = [16, 32, 48, 64, 128, 256]
const CLASSIC_SIZES = [16, 32, 48]
const FULL_SIZES = [16, 32, 48, 64, 128, 256]
const PREVIEW_SIZES = [16, 32, 48]

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/** Draws the image contain-fitted at 16/32/48 px — a live "browser tab" preview. */
function FaviconPreview({ url }: { url: string }) {
  const refs = React.useRef<(HTMLCanvasElement | null)[]>([])

  React.useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      for (let i = 0; i < PREVIEW_SIZES.length; i++) {
        const canvas = refs.current[i]
        if (!canvas) continue
        const size = PREVIEW_SIZES[i]
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) continue
        ctx.clearRect(0, 0, size, size)
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        const k = Math.min(size / img.naturalWidth, size / img.naturalHeight)
        const dw = Math.max(1, Math.round(img.naturalWidth * k))
        const dh = Math.max(1, Math.round(img.naturalHeight * k))
        ctx.drawImage(
          img,
          Math.floor((size - dw) / 2),
          Math.floor((size - dh) / 2),
          dw,
          dh
        )
      }
    }
    img.src = url
    return () => {
      cancelled = true
    }
  }, [url])

  return (
    <div className="flex items-end gap-2" aria-hidden>
      {PREVIEW_SIZES.map((size, i) => (
        <div key={size} className="flex flex-col items-center gap-1">
          <canvas
            ref={(el) => {
              refs.current[i] = el
            }}
            style={{ width: size, height: size }}
            className="rounded-md border border-border/70 bg-secondary/50 shadow-2xs"
          />
          <span className="text-[9px] leading-none text-muted-foreground font-mono">
            {size}px
          </span>
        </div>
      ))}
    </div>
  )
}

export function FaviconGeneratorView({
  files,
  onRemove,
  onAddMore,
  onChange,
}: FaviconViewProps) {
  const [meta, setMeta] = React.useState<Record<string, ImageMeta>>({})
  const [sizes, setSizes] = React.useState<number[]>(FULL_SIZES)

  const urlsRef = React.useRef<Record<string, string>>({})

  /* ---------------- Load image metadata (size + object URL) ------------- */
  React.useEffect(() => {
    let cancelled = false

    setMeta((prev) => {
      const next: Record<string, ImageMeta> = {}
      for (const f of files) {
        if (prev[f.id]) next[f.id] = prev[f.id]
      }
      for (const id of Object.keys(urlsRef.current)) {
        if (!next[id] && urlsRef.current[id]) {
          URL.revokeObjectURL(urlsRef.current[id])
          delete urlsRef.current[id]
        }
      }
      return next
    })

    const missing = files.filter((f) => !urlsRef.current[f.id])
    for (const f of missing) {
      const url = URL.createObjectURL(f.file)
      urlsRef.current[f.id] = url
      const img = new Image()
      img.onload = () => {
        if (cancelled) return
        setMeta((prev) => ({
          ...prev,
          [f.id]: {
            url,
            width: img.naturalWidth || 1,
            height: img.naturalHeight || 1,
          },
        }))
      }
      img.onerror = () => {
        if (cancelled) return
        setMeta((prev) => ({
          ...prev,
          [f.id]: { url, width: 1, height: 1 },
        }))
      }
      img.src = url
    }

    return () => {
      cancelled = true
    }
  }, [files])

  // Revoke everything on unmount.
  React.useEffect(() => {
    const urls = urlsRef.current
    return () => {
      for (const id of Object.keys(urls)) URL.revokeObjectURL(urls[id])
    }
  }, [])

  /* ---------------- Emit result whenever sizes change -------------------- */
  React.useEffect(() => {
    if (files.length === 0 || sizes.length === 0) {
      onChange(null)
      return
    }
    onChange({ sizes: [...sizes].sort((a, b) => a - b) })
  }, [files, sizes, onChange])

  const toggleSize = (size: number) =>
    setSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size].sort((a, b) => a - b)
    )

  return (
    <div className="space-y-5">
      {/* Icon sizes */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 glass-card shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight border-b border-border/50 pb-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <GlobeIcon className="h-4 w-4" />
          </span>
          <span>Target Favicon Sizes</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSizes(CLASSIC_SIZES)}
            className="rounded-full bg-secondary/80 px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-all hover:bg-secondary active-push cursor-pointer border border-border/60"
          >
            Classic · 16 / 32 / 48 px
          </button>
          <button
            type="button"
            onClick={() => setSizes(FULL_SIZES)}
            className="rounded-full bg-secondary/80 px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-all hover:bg-secondary active-push cursor-pointer border border-border/60"
          >
            Full Package · 16 – 256 px
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {SIZE_OPTIONS.map((size) => {
            const active = sizes.includes(size)
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold font-mono transition-all active-push cursor-pointer',
                  active
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'bg-card text-muted-foreground border border-border/80 hover:text-foreground hover:border-foreground/20'
                )}
              >
                {active && <Check className="h-3 w-3" />}
                <span>{size}px</span>
              </button>
            )
          })}
        </div>
        {sizes.length === 0 && (
          <p className="text-xs font-medium text-destructive">
            Pick at least one size to enable generation.
          </p>
        )}
      </div>

      {/* Per-image list with live previews */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
          Browser Tab Previews
        </p>
        <div className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
          {files.map((f) => {
            const m = meta[f.id]
            return (
              <div
                key={f.id}
                className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/80 p-3.5 glass-card"
              >
                {m ? (
                  <img
                    src={m.url}
                    alt={f.file.name}
                    className="h-14 w-14 shrink-0 rounded-xl border border-border/60 bg-muted object-contain p-1"
                    draggable={false}
                  />
                ) : (
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-border/60 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{f.file.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground font-mono">
                    {formatBytes(f.file.size)}
                    {m && m.width > 1 ? ` · ${m.width}×${m.height}px` : ''}
                    {' · '}
                    <span className="font-semibold text-primary">
                      {sizes.length > 0
                        ? `${sizes.join('/')} → .ico + ${sizes.length} PNGs`
                        : '.ico'}
                    </span>
                  </p>
                </div>
                {m && m.width > 1 && <FaviconPreview url={m.url} />}
                <button
                  type="button"
                  onClick={() => onRemove(f.id)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  aria-label={`Remove ${f.file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add more tile */}
      <button
        type="button"
        onClick={onAddMore}
        className={cn(
          'flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/80 py-3.5 text-xs font-semibold text-muted-foreground transition-all glass-card active-push',
          'hover:border-primary/50 hover:text-primary hover:bg-primary/[0.02]'
        )}
        aria-label="Add more images"
      >
        <ImagePlus className="h-4 w-4" />
        <span>Add more images</span>
      </button>
    </div>
  )
}
