'use client'

import * as React from 'react'
import { ImagePlus, Loader2, Shrink as ShrinkIcon, X, Sparkles, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/** No user options — compression is fully automatic. Emitted only so the
 *  tool page knows the file list is ready to process. */
export interface CompressImagesResult {
  readonly auto: true
}

interface CompressImagesViewProps {
  files: { id: string; file: File }[]
  onRemove: (id: string) => void
  onAddMore: () => void
  onChange: (result: CompressImagesResult | null) => void
}

interface ImageMeta {
  url: string
  width: number
  height: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function CompressImagesView({
  files,
  onRemove,
  onAddMore,
  onChange,
}: CompressImagesViewProps) {
  const [meta, setMeta] = React.useState<Record<string, ImageMeta>>({})

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

  /* ---------------- Emit readiness whenever the file list changes ------- */
  React.useEffect(() => {
    onChange(files.length > 0 ? { auto: true } : null)
  }, [files, onChange])

  return (
    <div className="space-y-5">
      {/* Auto banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 glass-card shadow-2xs">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <ShrinkIcon className="h-4 w-4" />
        </span>
        <div className="text-xs">
          <span className="font-semibold text-foreground">Smart Lossless &amp; Structural Compression</span>
          <p className="text-muted-foreground mt-0.5 leading-relaxed">
            Optimizes raster buffers locally in your browser. Dimensions and formats are preserved, and already-optimized images are kept untouched.
          </p>
        </div>
      </div>

      {/* File list */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
          Queued Images ({files.length})
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
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Auto-optimized</span>
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
