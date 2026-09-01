'use client'

import * as React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Plus,
  Loader2,
  FileText,
  X,
  FileCheck2,
} from 'lucide-react'
import { usePdfFirstPages } from '@/hooks/use-pdf'
import { formatBytes } from '@/lib/zip'
import { cn } from '@/lib/utils'

export interface MergeFile {
  id: string
  file: File
}

interface MergeViewProps {
  files: MergeFile[]
  onReorder: (files: MergeFile[]) => void
  onRemove: (id: string) => void
  onAddMore: () => void
}

export function MergeView({ files, onReorder, onRemove, onAddMore }: MergeViewProps) {
  const { thumbs, loading } = usePdfFirstPages(files)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id)
      const newIndex = files.findIndex((f) => f.id === over.id)
      onReorder(arrayMove(files, oldIndex, newIndex))
    }
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={files.map((f) => f.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {files.map((mf, idx) => {
              const thumb = thumbs.get(mf.id)
              return (
                <SortableMergeCard
                  key={mf.id}
                  mf={mf}
                  index={idx}
                  thumb={thumb}
                  onRemove={onRemove}
                />
              )
            })}

            {/* Add more files card */}
            <button
              onClick={onAddMore}
              className="flex min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-border/80 bg-card/40 p-4 text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/[0.03] hover:text-primary active-push cursor-pointer glass-card"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Plus className="h-6 w-6" />
              </span>
              <span className="text-xs font-semibold">Add more PDFs</span>
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-3 glass-card text-xs">
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <FileCheck2 className="h-4 w-4 text-emerald-500" />
          )}
          <span className="font-semibold">{files.length} PDF{files.length > 1 ? 's' : ''}</span>
          <span className="text-muted-foreground font-mono">
            ({formatBytes(files.reduce((acc, f) => acc + f.file.size, 0))} total)
          </span>
        </div>
        <p className="text-muted-foreground font-mono">
          Drag cards to reorder sequence
        </p>
      </div>
    </div>
  )
}

interface SortableMergeCardProps {
  mf: MergeFile
  index: number
  thumb?: { id: string; dataUrl: string | null; pageCount: number; loading: boolean }
  onRemove: (id: string) => void
}

function SortableMergeCard({ mf, index, thumb, onRemove }: SortableMergeCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mf.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-2xl border bg-card p-3 transition-all duration-150 glass-card active-push',
        isDragging
          ? 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10 z-10 scale-105'
          : 'border-border/80 hover:border-foreground/20 hover:shadow-xs'
      )}
    >
      {/* Top bar */}
      <div className="mb-2 flex items-center justify-between">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none p-1 text-muted-foreground/60 hover:text-foreground active:cursor-grabbing rounded-md hover:bg-secondary"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground font-mono">
          {index + 1}
        </span>
        <button
          onClick={() => onRemove(mf.id)}
          className="p-1 text-muted-foreground/60 transition-colors hover:text-destructive hover:bg-destructive/10 rounded-md cursor-pointer"
          aria-label="Remove file"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* First-page thumbnail */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted/50 border border-border/50">
        {thumb?.loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
          </div>
        ) : thumb?.dataUrl ? (
          <img
            src={thumb.dataUrl}
            alt={mf.file.name}
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileText className="h-7 w-7 text-muted-foreground/40" />
          </div>
        )}
        {thumb?.pageCount ? (
          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-background/90 backdrop-blur-sm border border-border/60 px-1.5 py-0.5 text-[9px] font-semibold text-foreground font-mono">
            {thumb.pageCount}p
          </span>
        ) : null}
      </div>

      {/* Filename + size */}
      <div className="mt-2.5 min-w-0">
        <p className="truncate text-xs font-semibold">{mf.file.name}</p>
        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{formatBytes(mf.file.size)}</p>
      </div>
    </div>
  )
}
