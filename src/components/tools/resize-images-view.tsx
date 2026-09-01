'use client'

import * as React from 'react'
import { ImagePlus, Loader2, Scaling as ScalingIcon, X, Sparkles } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export type ResizeMode = 'pixels' | 'percentage'

export interface ResizeImagesResult {
  mode: ResizeMode
  /** Target box in px (mode: 'pixels'). */
  width: number
  height: number
  /** Fit each image inside width×height preserving its aspect ratio. */
  maintainAspect: boolean
  /** Never make an image larger than it already is. */
  noEnlarge: boolean
  /** Scale factor (mode: 'percentage'), 0.1..2. */
  scale: number
}

interface ResizeImagesViewProps {
  files: { id: string; file: File }[]
  onRemove: (id: string) => void
  onAddMore: () => void
  onChange: (result: ResizeImagesResult | null) => void
}

interface ImageMeta {
  url: string
  width: number
  height: number
}

const DEFAULTS: ResizeImagesResult = {
  mode: 'pixels',
  width: 800,
  height: 600,
  maintainAspect: true,
  noEnlarge: true,
  scale: 0.5,
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Compute the output size for one image — mirrors the worker math in
 * processors['resize-images'] (keep both in sync).
 */
export function computeTargetSize(
  w: number,
  h: number,
  r: Pick<ResizeImagesResult, 'mode' | 'width' | 'height' | 'maintainAspect' | 'noEnlarge' | 'scale'>
): { tw: number; th: number; changed: boolean } {
  let tw: number
  let th: number
  if (r.mode === 'percentage') {
    const s = r.noEnlarge ? Math.min(1, r.scale) : r.scale
    tw = Math.max(1, Math.round(w * s))
    th = Math.max(1, Math.round(h * s))
  } else if (r.maintainAspect) {
    const s = Math.min(r.width / w, r.height / h)
    const capped = r.noEnlarge ? Math.min(1, s) : s
    tw = Math.max(1, Math.round(w * capped))
    th = Math.max(1, Math.round(h * capped))
  } else {
    const wouldEnlarge = w <= r.width && h <= r.height
    if (r.noEnlarge && wouldEnlarge) {
      tw = w
      th = h
    } else {
      tw = Math.max(1, r.width)
      th = Math.max(1, r.height)
    }
  }
  return { tw, th, changed: tw !== w || th !== h }
}

export function ResizeImagesView({
  files,
  onRemove,
  onAddMore,
  onChange,
}: ResizeImagesViewProps) {
  const [meta, setMeta] = React.useState<Record<string, ImageMeta>>({})
  const [mode, setMode] = React.useState<ResizeMode>(DEFAULTS.mode)
  const [width, setWidth] = React.useState(DEFAULTS.width)
  const [height, setHeight] = React.useState(DEFAULTS.height)
  const [maintainAspect, setMaintainAspect] = React.useState(DEFAULTS.maintainAspect)
  const [noEnlarge, setNoEnlarge] = React.useState(DEFAULTS.noEnlarge)
  const [scalePct, setScalePct] = React.useState(DEFAULTS.scale * 100)

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

  /* ---------------- Emit result whenever settings change ---------------- */
  React.useEffect(() => {
    if (files.length === 0) {
      onChange(null)
      return
    }
    onChange({
      mode,
      width: Math.max(1, Math.round(width) || 1),
      height: Math.max(1, Math.round(height) || 1),
      maintainAspect,
      noEnlarge,
      scale: scalePct / 100,
    })
  }, [files, mode, width, height, maintainAspect, noEnlarge, scalePct, onChange])

  const settings = { mode, width, height, maintainAspect, noEnlarge, scale: scalePct / 100 }

  return (
    <div className="space-y-5">
      {/* Global settings */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 glass-card shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight border-b border-border/50 pb-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <ScalingIcon className="h-4 w-4" />
          </span>
          <span>Resize Options</span>
        </div>

        {/* Mode toggle */}
        <div className="inline-flex rounded-xl border border-border/70 bg-secondary/40 p-1">
          {(
            [
              { v: 'pixels', label: 'By Dimensions (px)' },
              { v: 'percentage', label: 'By Percentage (%)' },
            ] as { v: ResizeMode; label: string }[]
          ).map((m) => (
            <button
              key={m.v}
              type="button"
              onClick={() => setMode(m.v)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all active-push cursor-pointer',
                mode === m.v
                  ? 'bg-card text-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-pressed={mode === m.v}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'pixels' ? (
          <div className="space-y-4 pt-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="resize-width" className="text-xs font-semibold text-foreground">
                  Width (px)
                </Label>
                <Input
                  id="resize-width"
                  type="number"
                  min={1}
                  max={20000}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full sm:w-[160px] rounded-xl font-mono text-sm"
                  aria-label="Target width in pixels"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="resize-height" className="text-xs font-semibold text-foreground">
                  Height (px)
                </Label>
                <Input
                  id="resize-height"
                  type="number"
                  min={1}
                  max={20000}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full sm:w-[160px] rounded-xl font-mono text-sm"
                  aria-label="Target height in pixels"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2.5 pt-1">
              <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-foreground">
                <Checkbox
                  checked={maintainAspect}
                  onCheckedChange={(v) => setMaintainAspect(v === true)}
                  aria-label="Maintain aspect ratio"
                />
                <span>Maintain aspect ratio</span>
                <span className="text-[11px] text-muted-foreground">
                  (prevents image distortion)
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-foreground">
                <Checkbox
                  checked={noEnlarge}
                  onCheckedChange={(v) => setNoEnlarge(v === true)}
                  aria-label="Do not enlarge if smaller"
                />
                <span>Do not enlarge if already smaller</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Scale · <span className="font-mono text-primary">{scalePct}%</span>
              </Label>
              <p className="text-[11px] text-muted-foreground">
                50% halves both dimensions; aspect ratio is automatically preserved.
              </p>
              <Slider
                value={[scalePct]}
                min={10}
                max={200}
                step={5}
                onValueChange={(v) => setScalePct(v[0])}
                className="w-full sm:max-w-[280px] pt-1"
                aria-label="Scale percentage"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-foreground pt-1">
              <Checkbox
                checked={noEnlarge}
                onCheckedChange={(v) => setNoEnlarge(v === true)}
                aria-label="Do not enlarge if smaller"
              />
              <span>Do not enlarge beyond 100%</span>
            </label>
          </div>
        )}
      </div>

      {/* Per-image preview list */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
          Target Output Dimensions
        </p>
        <div className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
          {files.map((f) => {
            const m = meta[f.id]
            const target =
              m && m.width > 1 ? computeTargetSize(m.width, m.height, settings) : null
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
                    {m && m.width > 1
                      ? ` · ${m.width}×${m.height}px${
                          target
                            ? target.changed
                              ? ` → `
                              : ' · kept'
                            : ''
                        }`
                      : ''}
                    {target && target.changed && (
                      <span className="font-bold text-primary">
                        {target.tw}×{target.th}px
                      </span>
                    )}
                  </p>
                </div>
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
