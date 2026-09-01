'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Github, Menu, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { categories } from '@/lib/tools'
import { parseRoute } from '@/lib/use-hash-route'
import { cn } from '@/lib/utils'

interface SiteHeaderProps {
  current: string
  onNavigate: (to: string) => void
  onOpenSearch?: () => void
}

export function SiteHeader({ current, onNavigate, onOpenSearch }: SiteHeaderProps) {
  const parsed = parseRoute(current)
  const isHome = parsed.route === 'home' && !parsed.category
  const activeCategory = parsed.category
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (to: string) => onNavigate(to)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'glass border-b border-border/60 shadow-sm'
          : 'border-b border-border/30 bg-background/80 backdrop-blur-md'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => go('/')}
          className="group flex items-center transition-opacity hover:opacity-90 cursor-pointer"
          aria-label="Go to homepage"
        >
          <Logo />
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 xl:flex">
          <button
            onClick={() => go('/')}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer',
              isHome
                ? 'bg-secondary text-secondary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            All tools
          </button>
          {categories.map((c) => {
            const isActive = activeCategory === c.id
            return (
              <button
                key={c.id}
                onClick={() => go(`/category/${c.id}`)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-secondary text-secondary-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {c.name}
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Quick Search Button (Cmd+K trigger) */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSearch}
            className="hidden sm:inline-flex h-9 rounded-full border-border/70 px-3 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 gap-2 bg-secondary/30"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search tools...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/80 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* Mobile search icon button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSearch}
            className="sm:hidden rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Search tools"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex rounded-full text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => go('/')}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
            100% Private
          </Button>

          <ThemeToggle />

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden rounded-full h-9 w-9"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex h-full flex-col gap-2 p-4">
                <SheetClose asChild>
                  <button
                    onClick={() => go('/')}
                    className="flex items-center justify-start mb-4"
                  >
                    <Logo />
                  </button>
                </SheetClose>

                {/* Mobile search trigger in drawer */}
                <Button
                  variant="outline"
                  onClick={() => {
                    if (onOpenSearch) onOpenSearch()
                  }}
                  className="justify-start gap-2 text-muted-foreground mb-3 rounded-xl"
                >
                  <Search className="h-4 w-4" />
                  <span>Search all tools...</span>
                </Button>

                <div className="flex flex-col gap-1">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Categories
                  </p>
                  <SheetClose asChild>
                    <Button
                      variant={isHome ? 'secondary' : 'ghost'}
                      className="justify-start rounded-xl font-medium"
                      onClick={() => go('/')}
                    >
                      All tools
                    </Button>
                  </SheetClose>
                  {categories.map((c) => {
                    const isActive = activeCategory === c.id
                    return (
                      <SheetClose asChild key={c.id}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={cn(
                            'justify-start font-normal rounded-xl',
                            isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'
                          )}
                          onClick={() => go(`/category/${c.id}`)}
                        >
                          {c.name}
                        </Button>
                      </SheetClose>
                    )
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
