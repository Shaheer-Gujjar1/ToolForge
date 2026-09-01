'use client'

import { ShieldCheck, Cpu, Layers } from 'lucide-react'
import { Logo } from '@/components/logo'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border/50 bg-secondary/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <Logo />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground font-mono">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> 100% In-Browser
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 text-amber-500" /> Multi-Core WASM
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-primary" /> Free Batch
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border/40 pt-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} ToolForge. Built for privacy.</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <span>A Product of</span>
            <a
              href="https://quantam-bio.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
            >
              Lumen Lab
            </a>
            <span>, Designed &amp; Developed by</span>
            <span className="font-semibold text-foreground">
              Shaheer Ahmed
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
