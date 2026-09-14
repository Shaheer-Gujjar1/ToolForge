'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Layers, Lock, Star, Sparkles } from 'lucide-react'
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
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.2), ease: [0.2, 0, 0, 1] }}
      whileHover={{ y: -3 }}
      className={cn(
        'group relative flex h-full w-full cursor-pointer flex-col items-start rounded-2xl border border-border/80 bg-card p-5 text-left transition-all duration-200 glass-card',
        'hover:border-foreground/20 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/25 active-push',
        'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary'
      )}
    >
      {/* Top row */}
      <div className="mb-3.5 flex w-full items-start justify-between">
        <span
          className={cn(
            'grid h-11 w-11 place-items-center rounded-xl ring-1 transition-all duration-200 group-hover:scale-105',
            a.badge,
            a.ring
          )}
        >
          <Icon className="h-5 w-5" />
        </span>

        <div className="flex items-center gap-1.5">
          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={cn(
                'grid h-6 w-6 place-items-center rounded-full transition-all duration-150 cursor-pointer',
                isFavorite
                  ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25'
                  : 'text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:bg-secondary hover:text-foreground'
              )}
              title={isFavorite ? 'Unpin tool' : 'Pin tool'}
              aria-label={isFavorite ? 'Unpin tool' : 'Pin tool'}
            >
              <Star
                className={cn('h-3 w-3', isFavorite && 'fill-amber-500')}
              />
            </button>
          )}

          {tool.batch && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-secondary-foreground font-mono">
              <Layers className="h-2.5 w-2.5" /> Batch
            </span>
          )}
          {tool.tag && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider font-mono',
                tool.tag.toLowerCase() === 'perfect'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {tool.tag.toLowerCase() === 'perfect' && <Sparkles className="h-2.5 w-2.5" />}
              {tool.tag}
            </span>
          )}
          {!ready && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground font-mono">
              Soon
            </span>
          )}
          {tool.locked && (
            <span
              title="Verified WASM engine"
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
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
        {tool.description}
      </p>

      <div className="mt-auto pt-3.5 flex w-full items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5">
          Launch
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </motion.div>
  )
}
