'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative grid grid-cols-1 grid-rows-1 items-center h-10 sm:h-11 w-44 sm:w-52 cursor-pointer select-none overflow-visible',
        className
      )}
    >
      {/* 1st Base Logo - smoothly cross-fades out and in with bi-directional reverse animation */}
      <motion.img
        src="/Tool-Forge-Logo1.png"
        alt="ToolForge Logo"
        initial={false}
        animate={{
          opacity: hovered ? 0 : 1,
        }}
        transition={{
          duration: 0.35,
          ease: [0.2, 0, 0, 1],
        }}
        className="[grid-area:1/1] h-9 sm:h-10 w-auto max-w-[210px] object-left object-contain pointer-events-none"
      />

      {/* 2nd Hover Logo - smoothly unveils left-to-right on enter and retracts on leave */}
      <motion.img
        src="/Tool-Forge-Logo2.png"
        alt="ToolForge Logo Hover"
        initial={false}
        animate={{
          clipPath: hovered ? 'inset(0% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)',
          opacity: hovered ? 1 : 0,
        }}
        transition={{
          duration: hovered ? 0.45 : 0.35,
          ease: [0.2, 0, 0, 1],
        }}
        className="[grid-area:1/1] h-9 sm:h-10 w-auto max-w-[210px] object-left object-contain pointer-events-none"
      />
    </div>
  )
}
