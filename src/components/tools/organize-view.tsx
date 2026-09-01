'use client'

import * as React from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { RotateCw, GripVertical, Loader2, FileText, X, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePdfThumbnails } from '@/hooks/use-pdf'
import { cn } from '@/lib/utils'

export interface OrganizePage {
  id: string
  sourceIndex: number
  rotation: number
  deleted: boolean
}

export interface OrganizeResult {
  pages: { source: number; rotation: number }[]
}

interface OrganizePdfViewProps {
  file: File
  onResultChange: (result: OrganizeResult | null) => void
  onRemoveFile?: () => void
}

export function OrganizePdfView({ file, onResultChange, onRemoveFile }: OrganizePdfViewProps) {
  const { pages: thumbnails, loading, error } = usePdfThumbnails(file, 50, 0.4)
  const [items, setItems] = React.useState<OrganizePage[]>([])

  React.useEffect(() => {
    if (thumbnails.length > 0) {
      setItems(thumbnails.map((t) => ({
        id: `page-${t.pageNum - 1}-${Date.now()}`,
        sourceIndex: t.pageNum - 1,
        rotation: 0,
        deleted: false,
      })))
    } else {
      setItems([])
    }
  }, [thumbnails])

  React.useEffect(() => {
    const active = items.filter((it) => !it.deleted)
    if (active.length === 0) onResultChange(null)
    else onResultChange({ pages: active.map((it) => ({ source: it.sourceIndex, rotation: it.rotation })) })
  }, [items, onResultChange])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id)
        const newIndex = prev.findIndex((i) => i.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground glass-card rounded-2xl border border-border/80">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-xs font-semibold uppercase tracking-wider font-mono">Rendering high-res page thumbnails…</p>
    </div>
  )
  if (error) return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-xs text-destructive glass-card">
      {error}
    </div>
  )

  const activeCount = items.filter((i) => !i.deleted).length
  const deletedCount = items.filter((i) => i.deleted).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-3 glass-card">
        <p className="text-xs text-muted-foreground font-mono">
          Drag cards to reorder sequence · Click rotate or delete per page
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full font-mono text-[10px]">
            {activeCount} active
          </Badge>
          {deletedCount > 0 && (
            <Badge variant="outline" className="rounded-full text-destructive border-destructive/40 font-mono text-[10px]">
              {deletedCount} deleted
            </Badge>
          )}
          {onRemoveFile && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRemoveFile}
              className="h-7 rounded-full px-3 text-xs gap-1 cursor-pointer active-push border-border/80"
            >
              <X className="h-3 w-3" />
              <span>Change file</span>
            </Button>
          )}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item, idx) => {
              const thumb = thumbnails[item.sourceIndex]
              return (
                <SortablePage
                  key={item.id}
                  item={item}
                  index={idx}
                  thumb={thumb?.dataUrl}
                  onRotate={(id) => setItems((p) => p.map((it) => it.id === id ? { ...it, rotation: (it.rotation + 90) % 360 } : it))}
                  onDelete={(id) => setItems((p) => p.map((it) => it.id === id ? { ...it, deleted: !it.deleted } : it))}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortablePage({ item, index, thumb, onRotate, onDelete }: {
  item: OrganizePage; index: number; thumb?: string
  onRotate: (id: string) => void; onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-2xl border bg-card p-3 transition-all duration-150 glass-card active-push',
        item.deleted
          ? 'border-destructive/40 bg-destructive/5 opacity-50'
          : isDragging
            ? 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10 z-10 scale-105'
            : 'border-border/80 hover:border-foreground/20 hover:shadow-xs'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none p-1 text-muted-foreground/60 hover:text-foreground active:cursor-grabbing rounded-md hover:bg-secondary"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="text-[11px] font-semibold text-muted-foreground font-mono">
          {item.deleted ? 'Deleted' : `Page ${index + 1}`}
        </span>
      </div>

      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted/50 border border-border/50">
        {thumb ? (
          <img
            src={thumb}
            alt={`Page ${item.sourceIndex + 1}`}
            className="h-full w-full object-contain p-1 transition-transform duration-200"
            style={{ transform: `rotate(${item.rotation}deg)` }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileText className="h-7 w-7 text-muted-foreground/40" />
          </div>
        )}
        {item.rotation > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded-md bg-primary/90 text-primary-foreground px-1.5 py-0.5 text-[9px] font-bold font-mono shadow-2xs">
            {item.rotation}°
          </span>
        )}
      </div>

      <div className="mt-2 flex gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 flex-1 gap-1 px-2 text-[11px] rounded-lg cursor-pointer active-push"
          onClick={() => onRotate(item.id)}
          disabled={item.deleted}
        >
          <RotateCw className="h-3 w-3" />
          <span>Rotate</span>
        </Button>
        <Button
          size="sm"
          variant={item.deleted ? 'outline' : 'ghost'}
          className={cn(
            'h-7 px-2 text-[11px] rounded-lg cursor-pointer active-push',
            item.deleted ? 'text-foreground' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
          )}
          onClick={() => onDelete(item.id)}
          title={item.deleted ? 'Restore page' : 'Delete page'}
        >
          {item.deleted ? <Undo2 className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  )
}
