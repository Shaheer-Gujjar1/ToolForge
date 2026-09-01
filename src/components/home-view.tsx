'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Lock,
  Cpu,
  Layers,
  Star,
  Clock,
  LayoutGrid,
  ListFilter,
  X,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PrivacyBadge } from '@/components/privacy-badge'
import { ToolCard } from '@/components/tool-card'
import {
  categories,
  tools,
  type ToolCategory,
  type Tool,
  accentClasses,
} from '@/lib/tools'
import { useUserPreferences, type ViewMode } from '@/lib/user-preferences'
import { cn } from '@/lib/utils'

interface HomeViewProps {
  onNavigate: (to: string) => void
  categoryFilter?: string
  onOpenSearch?: () => void
}

type FilterCategory = 'all' | 'favorites' | ToolCategory

export function HomeView({ onNavigate, categoryFilter, onOpenSearch }: HomeViewProps) {
  const [query, setQuery] = React.useState('')
  const [activeCategory, setActiveCategory] = React.useState<FilterCategory>('all')
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const {
    favorites,
    isFavorite,
    toggleFavorite,
    recents,
    viewMode,
    setViewMode,
  } = useUserPreferences()

  // Sync category filter from route if passed
  React.useEffect(() => {
    if (categoryFilter) {
      if (categoryFilter === 'favorites') {
        setActiveCategory('favorites')
      } else {
        const found = categories.find((c) => c.id === categoryFilter)
        if (found) {
          setActiveCategory(found.id)
        }
      }
    } else {
      setActiveCategory('all')
    }
  }, [categoryFilter])

  // Keyboard shortcut '/' to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Calculate tool counts per category
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: tools.length,
      favorites: favorites.length,
    }
    for (const cat of categories) {
      counts[cat.id] = tools.filter((t) => t.category === cat.id).length
    }
    return counts
  }, [favorites])

  // Filtered tools list
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = tools

    if (activeCategory === 'favorites') {
      list = tools.filter((t) => favorites.includes(t.id))
    } else if (activeCategory !== 'all') {
      list = tools.filter((t) => t.category === activeCategory)
    }

    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.tag && t.tag.toLowerCase().includes(q))
      )
    }

    // Sort: favorites on top when viewing all
    if (activeCategory === 'all' && !q) {
      return [...list].sort((a, b) => {
        const aFav = favorites.includes(a.id) ? 1 : 0
        const bFav = favorites.includes(b.id) ? 1 : 0
        return bFav - aFav
      })
    }

    return list
  }, [query, activeCategory, favorites])

  // Recently used tool objects
  const recentToolObjects = React.useMemo(() => {
    return recents
      .map((id) => tools.find((t) => t.id === id))
      .filter((t): t is Tool => !!t)
  }, [recents])

  const open = (id: string) => onNavigate(`/${id}`)

  const handleSelectCategory = (catId: FilterCategory) => {
    setActiveCategory(catId)
    if (catId === 'all') {
      onNavigate('/')
    } else if (catId === 'favorites') {
      onNavigate('/category/favorites')
    } else {
      onNavigate(`/category/${catId}`)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Hero section */}
      <div className="relative mb-10 text-center sm:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          {/* Top trust badge */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              100% Client-Side WASM
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              <Zap className="h-3 w-3 text-amber-500" /> 26 Instant Tools
            </span>
          </div>

          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-3xl">
            Every tool you need,{' '}
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              100% in your browser
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base leading-relaxed">
            Convert, merge, crop, edit, watermark, and compress your PDFs &amp; images locally.
            No server uploads, zero file size caps, and unlimited batch operations.
          </p>
        </motion.div>
      </div>

      {/* Recently Used Tray (if any) */}
      {recentToolObjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-border/60 bg-secondary/30 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Recently Used</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {recentToolObjects.length} tools
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {recentToolObjects.map((t) => {
              const Icon = t.icon
              const a = accentClasses[t.accent]
              return (
                <button
                  key={`rec-${t.id}`}
                  onClick={() => open(t.id)}
                  className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border/70 bg-card px-3.5 py-2 text-left text-xs font-medium shadow-2xs transition-all hover:border-primary/40 hover:bg-card/80 hover:shadow-sm cursor-pointer"
                >
                  <span
                    className={cn(
                      'grid h-7 w-7 place-items-center rounded-lg ring-1',
                      a.badge,
                      a.ring
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold">{t.name}</span>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Search & Control Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all 26 tools (press '/' to focus)..."
            className="h-12 rounded-2xl border-border/80 pl-11 pr-10 text-sm shadow-xs transition-all focus-visible:ring-primary"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
              /
            </kbd>
          )}
        </div>

        {/* View Mode & Quick Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center rounded-xl border border-border/80 bg-secondary/50 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('sections')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer',
                viewMode === 'sections'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Grouped by Category"
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Categories</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {/* All tools */}
        <button
          onClick={() => handleSelectCategory('all')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer',
            activeCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          <span>All Tools</span>
          <span
            className={cn(
              'rounded-full px-1.5 py-0.2 text-[10px]',
              activeCategory === 'all'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted-foreground/15 text-muted-foreground'
            )}
          >
            {categoryCounts.all}
          </span>
        </button>

        {/* Favorites pill (if any) */}
        {favorites.length > 0 && (
          <button
            onClick={() => handleSelectCategory('favorites')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer',
              activeCategory === 'favorites'
                ? 'bg-amber-500 text-white shadow-xs font-semibold'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            <Star className={cn('h-3 w-3', activeCategory === 'favorites' ? 'fill-white' : 'fill-amber-500 text-amber-500')} />
            <span>Pinned</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.2 text-[10px]',
                activeCategory === 'favorites'
                  ? 'bg-white/20 text-white'
                  : 'bg-muted-foreground/15 text-muted-foreground'
              )}
            >
              {categoryCounts.favorites}
            </span>
          </button>
        )}

        {/* Category pills */}
        {categories.map((c) => {
          const isActive = activeCategory === c.id
          const count = categoryCounts[c.id] || 0
          return (
            <button
              key={c.id}
              onClick={() => handleSelectCategory(c.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              <span>{c.name}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px]',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted-foreground/15 text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Results Header when searching */}
      {query && (
        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Found <strong>{filtered.length}</strong> matching tool{filtered.length !== 1 ? 's' : ''} for “{query}”
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuery('')}
            className="h-7 text-xs"
          >
            Reset search
          </Button>
        </div>
      )}

      {/* Main Tool Content Display */}
      {filtered.length > 0 ? (
        viewMode === 'grid' || query || activeCategory !== 'all' ? (
          /* Standard Responsive Grid View */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((tool, i) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onOpen={open}
                index={i}
                isFavorite={isFavorite(tool.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          /* Category Sections Grouped View */
          <div className="space-y-10">
            {categories.map((cat) => {
              const catTools = tools.filter((t) => t.category === cat.id)
              if (catTools.length === 0) return null

              return (
                <div key={cat.id} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                        <span>{cat.name}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          ({catTools.length})
                        </span>
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {cat.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {catTools.map((tool, i) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        onOpen={open}
                        index={i}
                        isFavorite={isFavorite(tool.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">No tools found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            We couldn’t find any tools matching “{query}”.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setQuery('')
                setActiveCategory('all')
              }}
            >
              Clear filters &amp; search
            </Button>
            <Button onClick={onOpenSearch}>
              Open Command Palette
            </Button>
          </div>
        </div>
      )}

      {/* Trust & Performance Footer Details */}
      <div className="mt-16 rounded-3xl border border-border/60 bg-secondary/20 p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold">100% Private &amp; Secure</h4>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                Your files never touch any remote server. Everything executes locally in WebAssembly &amp; Canvas.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Cpu className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold">Multi-core WASM Engine</h4>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                Parallel processing with Web Workers to handle large PDFs and multi-image batches swiftly.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold">Unlimited Batch Processing</h4>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                Process dozens of files simultaneously and download all results cleanly in a single ZIP package.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
