'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

interface SiteHeaderProps {
  current: string
  onNavigate: (to: string) => void
  onOpenSearch?: () => void
}

export function SiteHeader({ current, onNavigate, onOpenSearch }: SiteHeaderProps) {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="sticky top-3 sm:top-4 z-50 w-full px-3 sm:px-6 pointer-events-none">
      <div
        className={cn(
          'pointer-events-auto mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between gap-3 rounded-2xl sm:rounded-full px-4 sm:px-6 transition-all duration-300',
          'border border-border/40 bg-background/60 dark:bg-background/50 backdrop-blur-md shadow-xs',
          scrolled && 'border-border/70 bg-background/80 dark:bg-background/70 shadow-sm'
        )}
      >
        <button
          onClick={() => onNavigate('/')}
          className="group flex items-center transition-opacity hover:opacity-95 cursor-pointer active-push py-1"
          aria-label="ToolForge Home"
        >
          <Logo />
        </button>

        <div className="flex items-center gap-2">
          {/* Quick Search Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSearch}
            className="h-9 rounded-full border-border/50 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 gap-2 bg-secondary/20 hover:bg-secondary/40 active-push cursor-pointer shadow-2xs"
            aria-label="Search tools"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="font-medium">Search</span>
            <kbd className="pointer-events-none hidden h-4 select-none items-center gap-0.5 rounded border border-border/70 bg-muted/60 px-1.5 font-mono text-[9px] font-medium text-muted-foreground sm:inline-flex">
              <span>⌘</span>K
            </kbd>
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
