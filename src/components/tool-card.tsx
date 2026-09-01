'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Layers, Lock, Star } from 'lucide-react'
import { type Tool, accentClasses } from '@/lib/tools'
import { isImplemented } from '@/lib/processing/registry'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  tool: Tool
  onOpen: (id: string) => void
  index?: number
  isFavorite?: boolean
  onToggleFavorite?: (id: string) => void
}

export function ToolCard({
  tool,
  onOpen,
  index = 0,
  isFavorite = false,
  onToggleFavorite,
}: ToolCardProps) {
  const Icon = tool.icon
  const a = accentClasses[tool.accent]
  const ready = isImplemented(tool.id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.(tool.id)
  }

  return (
    <motion.div
      tabIndex={0}
      role="button"
      onClick={() => onOpen(tool.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(tool.id)
        }
      }}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.025, 0.25), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={cn(
        'group relative flex h-full w-full cursor-pointer flex-col items-start rounded-2xl border border-border/70 bg-card p-5 text-left shadow-xs transition-all duration-300',
        'hover:border-border hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary',
        a.glow
      )}
    >
      {/* Top row */}
      <div className="mb-3.5 flex w-full items-start justify-between">
        <span
          className={cn(
            'grid h-12 w-12 place-items-center rounded-xl ring-1 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md',
            a.badge,
            a.ring
          )}
        >
          <Icon className="h-6 w-6" />
        </span>

        <div className="flex items-center gap-1.5">
          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={cn(
                'grid h-7 w-7 place-items-center rounded-full transition-all duration-200 cursor-pointer',
                isFavorite
                  ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25'
                  : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:bg-secondary hover:text-foreground'
              )}
              title={isFavorite ? 'Remove from favorites' : 'Pin to favorites'}
              aria-label={isFavorite ? 'Remove from favorites' : 'Pin to favorites'}
            >
              <Star
                className={cn('h-3.5 w-3.5', isFavorite && 'fill-amber-500')}
              />
            </button>
          )}

          {tool.batch && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground">
              <Layers className="h-2.5 w-2.5" /> Batch
            </span>
          )}
          {tool.tag && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              {tool.tag}
            </span>
          )}
          {!ready && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Soon
            </span>
          )}
          {tool.locked && (
            <span
              title="Verified Client-side WASM Engine"
              className="inline-flex items-center rounded-full bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400"
            >
              <Lock className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
      </div>

      <h3 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors">
        {tool.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
        {tool.description}
      </p>

      <div className="mt-auto pt-4 flex w-full items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5">
          Open tool
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.div>
  )
}
