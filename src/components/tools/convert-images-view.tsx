'use client'

import * as React from 'react'
import { ImagePlus, Loader2, Repeat as RepeatIcon, X, Sparkles } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type ConvertTarget = 'png' | 'jpg' | 'jpeg' | 'webp'

export interface ConvertImagesResult {
  /** Target format per image, keyed by file name. */
  formats: Record<string, ConvertTarget>
  /** 0..1 — quality for lossy targets (JPG/JPEG/WEBP). PNG ignores it. */
  quality: number
}

interface ConvertImagesViewProps {
  files: { id: string; file: File }[]
  onRemove: (id: string) => void
  onAddMore: () => void
  onChange: (result: ConvertImagesResult | null) => void
}

interface ImageMeta {
  url: string
  width: number
  height: number
}

const TARGETS: { value: ConvertTarget; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WEBP' },
]

const DEFAULT_TARGET: ConvertTarget = 'png'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function sourceExt(name: string): string {
  const ext = (name.split('.').pop() || '').toLowerCase()
  return ext || '?'
}

export function ConvertImagesView({
  files,
  onRemove,
  onAddMore,
  onChange,
}: ConvertImagesViewProps) {
  const [meta, setMeta] = React.useState<Record<string, ImageMeta>>({})
  const [formats, setFormats] = React.useState<Record<string, ConvertTarget>>({})
  const [qualityPct, setQualityPct] = React.useState(92)

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

  /* ---------------- Emit result whenever formats/quality change --------- */
  React.useEffect(() => {
    if (files.length === 0) {
      onChange(null)
      return
    }
    const result: Record<string, ConvertTarget> = {}
    for (const f of files) {
      result[f.file.name] = formats[f.id] ?? DEFAULT_TARGET
    }
    onChange({ formats: result, quality: qualityPct / 100 })
  }, [files, formats, qualityPct, onChange])

  const setFormat = (id: string, target: ConvertTarget) =>
    setFormats((prev) => ({ ...prev, [id]: target }))

  const setFormatForAll = (target: ConvertTarget) =>
    setFormats(Object.fromEntries(files.map((f) => [f.id, target])))

  return (
    <div className="space-y-5">
      {/* Global settings */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 glass-card shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight border-b border-border/50 pb-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <RepeatIcon className="h-4 w-4" />
          </span>
          <span>Batch Conversion Settings</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Same Format for All</Label>
            <p className="text-[11px] text-muted-foreground">
              Overrides the per-image formats below.
            </p>
            <Select onValueChange={(v) => setFormatForAll(v as ConvertTarget)}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-xl text-xs font-medium" aria-label="Set the same output format for all images">
                <SelectValue placeholder="Select target format…" />
              </SelectTrigger>
              <SelectContent className="rounded-xl font-mono text-xs">
                {TARGETS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Quality · <span className="font-mono text-primary">{qualityPct}%</span>
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Used by JPG and WEBP only (PNG is lossless).
            </p>
            <Slider
              value={[qualityPct]}
              min={50}
              max={100}
              step={1}
              onValueChange={(v) => setQualityPct(v[0])}
              className="w-full sm:max-w-[200px] pt-1"
              aria-label="Output quality for JPG and WEBP"
            />
          </div>
        </div>
      </div>

      {/* Per-image format list */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
          Individual Image Targets
        </p>
        <div className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
          {files.map((f) => {
            const m = meta[f.id]
            const fmt = formats[f.id] ?? DEFAULT_TARGET
            const src = sourceExt(f.file.name).toUpperCase()
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
                    <span className="font-semibold text-muted-foreground">{src}</span>
                    {' → '}
                    <span className="font-bold text-primary">
                      {fmt.toUpperCase()}
                    </span>
                  </p>
                </div>
                <Select
                  value={fmt}
                  onValueChange={(v) => setFormat(f.id, v as ConvertTarget)}
                >
                  <SelectTrigger
                    className="h-8 w-[100px] shrink-0 rounded-xl font-mono text-xs font-semibold"
                    aria-label={`Output format for ${f.file.name}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl font-mono text-xs">
                    {TARGETS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
