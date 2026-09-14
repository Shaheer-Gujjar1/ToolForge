'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  Clock,
  LayoutGrid,
  ListFilter,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolCard } from '@/components/tool-card'
import {
  categories,
  tools,
  type ToolCategory,
  type Tool,
  accentClasses,
} from '@/lib/tools'
import { useUserPreferences } from '@/lib/user-preferences'
import { cn } from '@/lib/utils'

interface HomeViewProps {
  onNavigate: (to: string) => void
  categoryFilter?: string
  onOpenSearch?: () => void
}

type FilterCategory = 'all' | 'favorites' | ToolCategory

export function HomeView({ onNavigate, categoryFilter, onOpenSearch }: HomeViewProps) {
  const [activeCategory, setActiveCategory] = React.useState<FilterCategory>('all')

  const {
    favorites,
    isFavorite,
    toggleFavorite,
    recents,
    viewMode,
    setViewMode,
  } = useUserPreferences()

  // Sync category filter from route
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

  // Keyboard shortcut '/' to open command palette search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        onOpenSearch?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpenSearch])

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
    let list = tools

    if (activeCategory === 'favorites') {
      list = tools.filter((t) => favorites.includes(t.id))
    } else if (activeCategory !== 'all') {
      list = tools.filter((t) => t.category === activeCategory)
    }

    // Sort: favorites on top when viewing all
    if (activeCategory === 'all') {
      return [...list].sort((a, b) => {
        const aFav = favorites.includes(a.id) ? 1 : 0
        const bFav = favorites.includes(b.id) ? 1 : 0
        return bFav - aFav
      })
    }

    return list
  }, [activeCategory, favorites])

  // Recently used tools
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
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Background ambient grid */}
      <div className="pointer-events-none absolute inset-0 -top-20 z-0 bg-subtle-grid bg-grid-fade opacity-30" />

      <div className="relative z-10">
        {/* 0. Hero Section (Controlled 4-element stack) */}
        <section className="mb-10 text-center sm:mb-14">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            className="flex flex-col items-center"
          >
            {/* 1. Eyebrow badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/70 px-3.5 py-1 text-xs font-medium backdrop-blur-md shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>100% In-Browser WASM</span>
              <span className="text-border">·</span>
              <span className="text-muted-foreground">Zero Server Uploads</span>
            </div>

            {/* 2. Headline (Max 2 lines, tight tracking) */}
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl max-w-3xl leading-[1.08]">
              Private file tools,{' '}
              <span className="text-primary underline decoration-primary/30 underline-offset-8">
                without compromises
              </span>
            </h1>

            {/* 3. Subtext (<20 words) */}
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base leading-relaxed">
              Convert, merge, crop, edit, and compress your PDFs and images instantly.
              Everything processes locally in your browser.
            </p>
          </motion.div>
        </section>

        {/* 1. Recently Used Tray (if any) */}
        {recentToolObjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-border/70 bg-card/60 p-3.5 glass-card"
          >
            <div className="mb-2.5 flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Recently Used</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {recentToolObjects.length} tools
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {recentToolObjects.map((t) => {
                const Icon = t.icon
                const a = accentClasses[t.accent]
                return (
                  <button
                    key={`rec-${t.id}`}
                    onClick={() => open(t.id)}
                    className="group flex shrink-0 items-center gap-2.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-left text-xs font-medium transition-all hover:border-primary/50 hover:bg-card/80 active-push cursor-pointer shadow-2xs"
                  >
                    <span
                      className={cn(
                        'grid h-6 w-6 place-items-center rounded-md ring-1',
                        a.badge,
                        a.ring
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-semibold group-hover:text-primary transition-colors">{t.name}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* 2. Controls & Categories Row */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSelectCategory('all')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active-push cursor-pointer',
                activeCategory === 'all'
                  ? 'bg-foreground text-background shadow-2xs font-semibold'
                  : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-border/50'
              )}
            >
              <span>All</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-mono',
                  activeCategory === 'all'
                    ? 'bg-background/20 text-background'
                    : 'bg-muted-foreground/15 text-muted-foreground'
                )}
              >
                {categoryCounts.all}
              </span>
            </button>

            {favorites.length > 0 && (
              <button
                onClick={() => handleSelectCategory('favorites')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active-push cursor-pointer',
                  activeCategory === 'favorites'
                    ? 'bg-amber-500 text-white shadow-2xs font-semibold'
                    : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-border/50'
                )}
              >
                <Star className={cn('h-3 w-3', activeCategory === 'favorites' ? 'fill-white' : 'fill-amber-500 text-amber-500')} />
                <span>Pinned</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-mono',
                    activeCategory === 'favorites'
                      ? 'bg-white/20 text-white'
                      : 'bg-muted-foreground/15 text-muted-foreground'
                  )}
                >
                  {categoryCounts.favorites}
                </span>
              </button>
            )}

            {categories.map((c) => {
              const isActive = activeCategory === c.id
              const count = categoryCounts[c.id] || 0
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCategory(c.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active-push cursor-pointer',
                    isActive
                      ? 'bg-foreground text-background shadow-2xs font-semibold'
                      : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-border/50'
                  )}
                >
                  <span>{c.name}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px] font-mono',
                      isActive
                        ? 'bg-background/20 text-background'
                        : 'bg-muted-foreground/15 text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* View switch */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <div className="flex items-center rounded-xl border border-border/80 bg-secondary/40 p-1">
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
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('sections')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer',
                  viewMode === 'sections'
                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Category Grouping"
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sections</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Results List */}
        {filtered.length > 0 ? (
          viewMode === 'grid' || activeCategory !== 'all' ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
            <div className="space-y-12">
              {categories.map((cat) => {
                const catTools = tools.filter((t) => t.category === cat.id)
                if (catTools.length === 0) return null

                return (
                  <div key={cat.id} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                      <div>
                        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                          <span>{cat.name}</span>
                          <span className="text-xs font-normal text-muted-foreground font-mono">
                            ({catTools.length})
                          </span>
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {cat.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">No tools found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              No tools available in this section.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveCategory('all')
                }}
                className="cursor-pointer"
              >
                Show all tools
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
