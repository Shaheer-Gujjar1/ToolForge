'use client'

import * as React from 'react'

const FAVORITES_KEY = 'toolforge_favorites_v1'
const RECENTS_KEY = 'toolforge_recents_v1'
const VIEW_MODE_KEY = 'toolforge_view_mode_v1'

export type ViewMode = 'grid' | 'sections'

export function getStoredFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getStoredRecents(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getStoredViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'grid'
  try {
    const raw = localStorage.getItem(VIEW_MODE_KEY)
    return raw === 'sections' ? 'sections' : 'grid'
  } catch {
    return 'grid'
  }
}

export function useUserPreferences() {
  const [favorites, setFavorites] = React.useState<string[]>([])
  const [recents, setRecents] = React.useState<string[]>([])
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setFavorites(getStoredFavorites())
    setRecents(getStoredRecents())
    setViewMode(getStoredViewMode())
    setMounted(true)
  }, [])

  const toggleFavorite = React.useCallback((toolId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const recordRecent = React.useCallback((toolId: string) => {
    setRecents((prev) => {
      const filtered = prev.filter((id) => id !== toolId)
      const next = [toolId, ...filtered].slice(0, 6)
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const updateViewMode = React.useCallback((mode: ViewMode) => {
    setViewMode(mode)
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode)
    } catch {
      // ignore
    }
  }, [])

  return {
    mounted,
    favorites,
    isFavorite: (toolId: string) => favorites.includes(toolId),
    toggleFavorite,
    recents,
    recordRecent,
    viewMode,
    setViewMode: updateViewMode,
  }
}
