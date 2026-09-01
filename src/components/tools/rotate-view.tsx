'use client'

import * as React from 'react'
import {
  RotateCw,
  RotateCcw,
  Loader2,
  FileText,
  X,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePdfThumbnails } from '@/hooks/use-pdf'
import { cn } from '@/lib/utils'

export interface RotateConfig {
  angle: number
}

interface RotateViewProps {
  file: File
  config: RotateConfig
  onConfigChange: (config: RotateConfig) => void
  onRemoveFile?: () => void
}

export function RotateView({ file, config, onConfigChange, onRemoveFile }: RotateViewProps) {
  const { pages, loading, error } = usePdfThumbnails(file, 1, 0.8)
  const page = pages[0]

  const rotateLeft = () => {
    const newAngle = (config.angle + 270) % 360
    onConfigChange({ angle: newAngle })
  }

  const rotateRight = () => {
    const newAngle = (config.angle + 90) % 360
    onConfigChange({ angle: newAngle })
  }

  const angleLabel = config.angle === 0 ? 'Original (0°)' : `${config.angle}° Clockwise`

  if (loading) return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground glass-card rounded-2xl border border-border/80">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-xs font-semibold uppercase tracking-wider font-mono">Rendering page preview…</p>
    </div>
  )
  if (error) return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-xs text-destructive glass-card">
      {error}
    </div>
  )
  if (!page) return null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-3 glass-card">
        <p className="text-xs text-muted-foreground font-mono">
          Rotates all pages in the PDF · Live interactive canvas preview
        </p>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary/80 border border-border/60 px-3 py-1 text-xs font-mono font-semibold text-foreground">
            {angleLabel}
          </span>
          {onRemoveFile && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRemoveFile}
              className="h-7 rounded-full px-3 text-xs gap-1 cursor-pointer active-push border-border/80"
            >
              <X className="h-3 w-3" />
              <span>Change file</span>
            </Button>
          )}
        </div>
      </div>

      {/* Preview + Controls */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
        {/* Page preview */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border-2 border-border/80 bg-muted/40 p-3 shadow-xs glass-card">
              <img
                src={page.dataUrl}
                alt="Page 1 preview"
                className="block max-h-[350px] max-w-full rounded-xl object-contain transition-transform duration-300"
                style={{ transform: `rotate(${config.angle}deg)` }}
              />
            </div>
            <span className="absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground font-mono shadow-xs">
              {config.angle}°
            </span>
          </div>
        </div>

        {/* Rotate controls — card buttons */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-card/60 p-5 glass-card shadow-2xs">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Rotation Angle Controls
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Rotate Left */}
            <button
              type="button"
              onClick={rotateLeft}
              className={cn(
                'group flex flex-col items-center gap-2 rounded-2xl border p-5 text-center transition-all cursor-pointer active-push glass-card',
                'border-border/80 bg-card hover:border-primary/40 hover:shadow-xs'
              )}
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <RotateCcw className="h-6 w-6" />
              </span>
              <span className="text-xs font-bold text-foreground">Rotate Left</span>
              <span className="text-[11px] text-muted-foreground font-mono">90° counter-clockwise</span>
            </button>

            {/* Rotate Right */}
            <button
              type="button"
              onClick={rotateRight}
              className={cn(
                'group flex flex-col items-center gap-2 rounded-2xl border p-5 text-center transition-all cursor-pointer active-push glass-card',
                'border-border/80 bg-card hover:border-primary/40 hover:shadow-xs'
              )}
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <RotateCw className="h-6 w-6" />
              </span>
              <span className="text-xs font-bold text-foreground">Rotate Right</span>
              <span className="text-[11px] text-muted-foreground font-mono">90° clockwise</span>
            </button>
          </div>

          {/* Quick angle presets */}
          <div className="pt-1">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Jump to direct orientation:</p>
            <div className="flex gap-2">
              {[0, 90, 180, 270].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => onConfigChange({ angle: a })}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2 text-xs font-mono font-bold transition-all active-push cursor-pointer',
                    config.angle === a
                      ? 'border-primary bg-primary text-primary-foreground shadow-2xs'
                      : 'border-border/80 bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                  )}
                >
                  {a === 0 ? '0°' : `${a}°`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
