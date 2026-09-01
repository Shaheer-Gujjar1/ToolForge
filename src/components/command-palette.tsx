'use client'

import * as React from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { useTheme } from 'next-themes'
import { tools, categories, accentClasses, type Tool } from '@/lib/tools'
import { getStoredRecents } from '@/lib/user-preferences'
import {
  Sparkles,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  Home,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTool: (toolId: string) => void
  onNavigateHome: (category?: string) => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onSelectTool,
  onNavigateHome,
}: CommandPaletteProps) {
  const { theme, setTheme } = useTheme()
  const [recents, setRecents] = React.useState<string[]>([])

  React.useEffect(() => {
    if (open) {
      setRecents(getStoredRecents())
    }
  }, [open])

  const recentTools = React.useMemo(() => {
    return recents
      .map((id) => tools.find((t) => t.id === id))
      .filter((t): t is Tool => !!t)
  }, [recents])

  const handleSelect = (toolId: string) => {
    onOpenChange(false)
    onSelectTool(toolId)
  }

  const handleCategorySelect = (categoryId: string) => {
    onOpenChange(false)
    onNavigateHome(categoryId)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search ToolForge"
      description="Quickly find and launch any PDF or Image tool"
      className="max-w-2xl rounded-2xl border border-border/80 bg-popover/95 p-0 shadow-2xl backdrop-blur-xl"
    >
      <CommandInput
        placeholder="Type a tool name, action (e.g. crop, compress, meme, merge)..."
        className="h-13 text-base"
      />
      <CommandList className="max-h-[380px] p-2">
        <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
          <p className="font-medium">No tools found.</p>
          <p className="mt-1 text-xs">Try searching for PDF, image, watermark, convert, or compress.</p>
        </CommandEmpty>

        {/* Quick Navigation / Category Shortcuts */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onNavigateHome()
            }}
            className="cursor-pointer gap-2.5 rounded-xl py-2"
          >
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Home className="h-4 w-4" />
            </div>
            <div className="flex flex-1 items-center justify-between">
              <span className="font-medium">All Tools</span>
              <span className="text-xs text-muted-foreground">Go to homepage</span>
            </div>
          </CommandItem>
        </CommandGroup>

        {/* Recently Used */}
        {recentTools.length > 0 && (
          <>
            <CommandSeparator className="my-1.5" />
            <CommandGroup heading="Recently Used">
              {recentTools.map((t) => {
                const Icon = t.icon
                const a = accentClasses[t.accent]
                return (
                  <CommandItem
                    key={`recent-${t.id}`}
                    value={`recent ${t.name} ${t.description} ${t.category}`}
                    onSelect={() => handleSelect(t.id)}
                    className="cursor-pointer gap-3 rounded-xl py-2.5"
                  >
                    <div
                      className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1',
                        a.badge,
                        a.ring
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{t.name}</span>
                        {t.batch && (
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-secondary-foreground">
                            Batch
                          </span>
                        )}
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {t.description}
                      </span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}

        {/* Tools by Category */}
        {categories.map((cat) => {
          const categoryTools = tools.filter((t) => t.category === cat.id)
          if (categoryTools.length === 0) return null

          return (
            <React.Fragment key={cat.id}>
              <CommandSeparator className="my-1.5" />
              <CommandGroup heading={cat.name}>
                {categoryTools.map((t) => {
                  const Icon = t.icon
                  const a = accentClasses[t.accent]
                  return (
                    <CommandItem
                      key={t.id}
                      value={`${t.name} ${t.description} ${cat.name} ${t.tag || ''}`}
                      onSelect={() => handleSelect(t.id)}
                      className="cursor-pointer gap-3 rounded-xl py-2.5"
                    >
                      <div
                        className={cn(
                          'grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1',
                          a.badge,
                          a.ring
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{t.name}</span>
                          {t.batch && (
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-secondary-foreground">
                              Batch
                            </span>
                          )}
                          {t.tag && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                              {t.tag}
                            </span>
                          )}
                        </div>
                        <span className="truncate text-xs text-muted-foreground">
                          {t.description}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </React.Fragment>
          )
        })}

        {/* Quick Settings */}
        <CommandSeparator className="my-1.5" />
        <CommandGroup heading="Theme & Preferences">
          <CommandItem
            onSelect={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark')
              onOpenChange(false)
            }}
            className="cursor-pointer gap-2.5 rounded-xl py-2"
          >
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-secondary-foreground">
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-primary" />}
            </div>
            <div className="flex flex-1 items-center justify-between">
              <span className="font-medium">
                Toggle Theme (Currently {theme === 'dark' ? 'Dark' : 'Light'})
              </span>
              <span className="text-xs text-muted-foreground">Switch mode</span>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
