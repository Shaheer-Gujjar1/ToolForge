'use client'

import * as React from 'react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PrivacyBadgeProps {
  className?: string
  variant?: 'solid' | 'soft' | 'minimal'
  size?: 'sm' | 'md'
}

export function PrivacyBadge({
  className,
  variant = 'soft',
  size = 'sm',
}: PrivacyBadgeProps) {
  const pad = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-xs'
  const styles =
    variant === 'solid'
      ? 'bg-emerald-600 text-white shadow-2xs'
      : variant === 'minimal'
        ? 'text-emerald-600 dark:text-emerald-400 font-mono'
        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 glass-card'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium tracking-tight',
        pad,
        styles,
        className
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
      <span>Processed 100% locally in your browser memory · Zero uploads</span>
    </span>
  )
}
