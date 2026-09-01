'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { UploadCloud, File as FileIcon, X, Trash2, CheckCircle2, ClipboardPaste } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface QueuedFile {
  id: string
  file: File
}

interface DropzoneProps {
  files: QueuedFile[]
  onFilesChange: (files: QueuedFile[]) => void
  accept?: string
  multiple?: boolean
  hint?: string
  className?: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

let counter = 0
function uid(): string {
  counter += 1
  return `f_${Date.now()}_${counter}_${Math.random().toString(36).slice(2, 7)}`
}

export function Dropzone({
  files,
  onFilesChange,
  accept = 'application/pdf',
  multiple = true,
  hint = 'PDF files supported',
  className,
}: DropzoneProps) {
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const addFiles = React.useCallback(
    async (incoming: FileList | File[], source: 'drop' | 'pick' | 'paste' = 'pick') => {
      const arr = Array.from(incoming)
      const next: QueuedFile[] = multiple
        ? [...files]
        : []
      let addedCount = 0

      for (const file of arr) {
        if (source === 'drop' || source === 'paste') {
          try {
            const buf = await file.arrayBuffer()
            next.push({
              id: uid(),
              file: new File([buf], file.name || `pasted_file_${Date.now()}.png`, {
                type: file.type,
                lastModified: file.lastModified || Date.now(),
              }),
            })
            addedCount++
          } catch {
            toast.error(
              `Could not read "${file.name}" — please try adding it again.`
            )
          }
        } else {
          next.push({ id: uid(), file })
          addedCount++
        }
      }

      if (source === 'paste' && addedCount > 0) {
        toast.success(`Pasted ${addedCount} file${addedCount > 1 ? 's' : ''} from clipboard!`)
      }

      onFilesChange(multiple ? next : next.slice(0, 1))
    },
    [files, multiple, onFilesChange]
  )

  // Listen to paste event on window
  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept paste in text areas / input fields
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return
      }

      if (e.clipboardData?.files?.length) {
        e.preventDefault()
        void addFiles(e.clipboardData.files, 'paste')
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [addFiles])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files, 'drop')
  }

  const remove = (id: string) =>
    onFilesChange(files.filter((f) => f.id !== id))

  const clear = () => onFilesChange([])

  const totalBytes = React.useMemo(() => {
    return files.reduce((acc, f) => acc + (f.file.size || 0), 0)
  }, [files])

  return (
    <div className={cn('w-full', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragging(false)
        }}
        onDrop={onDrop}
        className={cn(
          'group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 glass-card',
          dragging
            ? 'border-primary bg-primary/10 scale-[1.01] shadow-lg shadow-primary/10'
            : 'border-border/80 bg-card hover:border-primary/40 hover:bg-primary/[0.02]'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />

        <motion.div
          animate={dragging ? { scale: 1.15, y: -6 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className={cn(
            'mb-4 grid h-16 w-16 place-items-center rounded-2xl transition-all',
            dragging
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
              : 'bg-primary/10 text-primary group-hover:scale-105'
          )}
        >
          <UploadCloud className="h-8 w-8" />
        </motion.div>

        <p className="text-lg font-semibold tracking-tight">
          {dragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          or <span className="font-medium text-primary underline-offset-4 group-hover:underline">browse files</span> · {hint}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> 100% Local &amp; Private
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-medium">
            <ClipboardPaste className="h-3 w-3" /> Paste (Ctrl+V) supported
          </span>
          {multiple && (
            <span className="rounded-full bg-secondary px-2.5 py-1 font-medium">
              Batch ready
            </span>
          )}
        </div>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-2xs"
          >
            <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">
                  {files.length} file{files.length > 1 ? 's' : ''} queued
                </p>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground font-medium">
                  {formatBytes(totalBytes)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                className="h-8 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Clear all
              </Button>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {files.map((f, idx) => (
                  <motion.div
                    key={f.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-2.5 transition-colors hover:bg-secondary/60"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-medium text-xs">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {f.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(f.file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg"
                      onClick={() => remove(f.id)}
                      aria-label={`Remove ${f.file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
