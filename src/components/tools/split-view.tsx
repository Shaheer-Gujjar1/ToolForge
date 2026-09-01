'use client'

import * as React from 'react'
import { Loader2, FileText, Scissors } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePdfThumbnails } from '@/hooks/use-pdf'
import { cn } from '@/lib/utils'

export interface SplitConfig {
  mode: 'each' | 'ranges'
  ranges: string
}

interface SplitViewProps {
  file: File
  config: SplitConfig
  onConfigChange: (config: SplitConfig) => void
}

/** Parse "1-3, 5, 7-9" into groups of 0-indexed page indices. */
function parseRanges(text: string, pageCount: number): number[][] {
  const groups: number[][] = []
  const parts = text.split(',')
  for (const raw of parts) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const dash = trimmed.indexOf('-')
    let start: number, end: number
    if (dash >= 0) {
      start = parseInt(trimmed.slice(0, dash), 10)
      end = parseInt(trimmed.slice(dash + 1), 10)
    } else {
      start = end = parseInt(trimmed, 10)
    }
    if (isNaN(start) || isNaN(end) || start < 1 || end < 1) continue
    if (start > end) { const t = start; start = end; end = t }
    const group: number[] = []
    for (let p = start; p <= end && p <= pageCount; p++) group.push(p - 1)
    if (group.length) groups.push(group)
  }
  return groups
}

export function SplitView({ file, config, onConfigChange }: SplitViewProps) {
  const { pages, loading, error } = usePdfThumbnails(file, 50, 0.35)
  const pageCount = pages.length

  // Parse ranges in real-time for the preview
  const parsedGroups = React.useMemo(() => {
    if (config.mode !== 'ranges' || !config.ranges.trim()) return []
    return parseRanges(config.ranges, pageCount)
  }, [config.mode, config.ranges, pageCount])

  if (loading) return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground glass-card rounded-2xl border border-border/80">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-xs font-semibold uppercase tracking-wider font-mono">Rendering page thumbnails…</p>
    </div>
  )
  if (error) return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-xs text-destructive glass-card">
      {error}
    </div>
  )
  if (pageCount === 0) return null

  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 glass-card shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight border-b border-border/50 pb-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Scissors className="h-4 w-4" />
          </span>
          <span>Split Configuration</span>
        </div>

        <RadioGroup
          value={config.mode}
          onValueChange={(v) => onConfigChange({ ...config, mode: v as 'each' | 'ranges' })}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <Label
            htmlFor="r-each"
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-card p-3.5 transition-all duration-150 glass-card hover:border-primary/40 active-push has-[:checked]:border-primary has-[:checked]:bg-primary/[0.06] has-[:checked]:shadow-2xs"
          >
            <RadioGroupItem value="each" id="r-each" className="mt-0.5 text-primary" />
            <span className="flex flex-col">
              <span className="text-xs font-semibold leading-tight text-foreground">Each Page</span>
              <span className="text-[11px] text-muted-foreground font-mono mt-0.5">One PDF per page ({pageCount} files)</span>
            </span>
          </Label>
          <Label
            htmlFor="r-ranges"
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-card p-3.5 transition-all duration-150 glass-card hover:border-primary/40 active-push has-[:checked]:border-primary has-[:checked]:bg-primary/[0.06] has-[:checked]:shadow-2xs"
          >
            <RadioGroupItem value="ranges" id="r-ranges" className="mt-0.5 text-primary" />
            <span className="flex flex-col">
              <span className="text-xs font-semibold leading-tight text-foreground">Custom Ranges</span>
              <span className="text-[11px] text-muted-foreground font-mono mt-0.5">Define custom page groups</span>
            </span>
          </Label>
        </RadioGroup>

        {/* Range input (only for custom ranges mode) */}
        {config.mode === 'ranges' && (
          <div className="space-y-1.5 pt-2 border-t border-border/50">
            <Label className="text-xs font-semibold text-foreground">Page Range Pattern</Label>
            <Input
              value={config.ranges}
              onChange={(e) => onConfigChange({ ...config, ranges: e.target.value })}
              placeholder="e.g. 1-3, 5, 7-9"
              className="font-mono text-sm rounded-xl max-w-md"
            />
            <p className="text-[11px] text-muted-foreground">
              Comma-separated numbers or ranges. Total document pages: <span className="font-semibold text-foreground font-mono">{pageCount}</span>.
            </p>
          </div>
        )}
      </div>

      {/* Page previews */}
      {config.mode === 'each' ? (
        /* Each page mode: show ALL page thumbnails */
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Output File Previews ({pages.length})
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {pages.map((page) => (
              <div key={page.pageNum} className="rounded-xl border border-border/80 bg-card/80 p-2 glass-card">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted/50 border border-border/50">
                  <img src={page.dataUrl} alt={`Page ${page.pageNum}`} className="h-full w-full object-contain p-1" />
                  <span className="absolute bottom-1 right-1 rounded-md bg-background/90 backdrop-blur-sm border border-border/60 px-1.5 py-0.5 text-[9px] font-semibold text-foreground font-mono">
                    {page.pageNum}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-center text-[10px] text-muted-foreground font-mono">
                  page-{page.pageNum}.pdf
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Custom ranges mode */
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            {parsedGroups.length > 0
              ? `Range Output Groups (${parsedGroups.length})`
              : 'Enter page ranges above to visualize groups'}
          </p>
          {parsedGroups.length > 0 ? (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {parsedGroups.map((group, idx) => {
                const startPage = group[0] + 1
                const endPage = group[group.length - 1] + 1
                const startThumb = pages[group[0]]
                const endThumb = pages[group[group.length - 1]]
                const isSinglePage = startPage === endPage
                return (
                  <div key={idx} className="rounded-2xl border border-border/80 bg-card/80 p-3.5 glass-card">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground font-mono">
                        Output {idx + 1}
                      </span>
                      <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-semibold font-mono">
                        {isSinglePage ? `Page ${startPage}` : `Pages ${startPage}–${endPage}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2.5 py-1">
                      {/* Start page thumbnail */}
                      <div className="relative">
                        <div className="relative aspect-[3/4] w-20 overflow-hidden rounded-xl border border-border/60 bg-muted/50 sm:w-24">
                          {startThumb ? (
                            <img src={startThumb.dataUrl} alt={`Page ${startPage}`} className="h-full w-full object-contain p-1" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <FileText className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <span className="absolute bottom-1 right-1 rounded-md bg-background/90 backdrop-blur-sm border border-border/60 px-1 py-0.2 text-[8px] font-semibold text-foreground font-mono">
                          {startPage}
                        </span>
                      </div>
                      {!isSinglePage && (
                        <>
                          <span className="text-sm text-muted-foreground font-mono font-bold">→</span>
                          <div className="relative">
                            <div className="relative aspect-[3/4] w-20 overflow-hidden rounded-xl border border-border/60 bg-muted/50 sm:w-24">
                              {endThumb ? (
                                <img src={endThumb.dataUrl} alt={`Page ${endPage}`} className="h-full w-full object-contain p-1" />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <FileText className="h-5 w-5 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                            <span className="absolute bottom-1 right-1 rounded-md bg-background/90 backdrop-blur-sm border border-border/60 px-1 py-0.2 text-[8px] font-semibold text-foreground font-mono">
                              {endPage}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="mt-2 truncate text-center text-[10px] text-muted-foreground font-mono">
                      → {isSinglePage
                        ? `page-${startPage}.pdf`
                        : `pages-${startPage}-${endPage}.pdf`}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 py-12 text-center glass-card">
              <p className="text-xs text-muted-foreground font-mono">
                Enter page ranges above (e.g. 1-3, 5, 7-9) to see a live visual group preview.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
