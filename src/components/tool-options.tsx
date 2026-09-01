'use client'

import * as React from 'react'
import {
  Scissors,
  RotateCw,
  Images,
  FileArchive,
  LockOpen,
  Hash,
  Lock,
  FileImage,
  Sparkles,
  Zap,
  Flame,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { type Tool } from '@/lib/tools'
import { cn } from '@/lib/utils'

export type ToolOptionsMap = Record<string, unknown>

interface ToolOptionsProps {
  tool: Tool
  options: ToolOptionsMap
  onChange: (options: ToolOptionsMap) => void
  disabled?: boolean
}

export function hasOptions(toolId: string): boolean {
  return [
    'split', 'rotate', 'images-to-pdf', 'compress', 'unlock',
    'page-numbers', 'protect', 'pdf-to-images',
  ].includes(toolId)
}

export function defaultOptions(toolId: string): ToolOptionsMap {
  switch (toolId) {
    case 'split':
      return { mode: 'each', ranges: '' }
    case 'rotate':
      return { angle: 90 }
    case 'images-to-pdf':
      return { output: 'single', pageSize: 'fit' }
    case 'compress':
      return { level: 'normal' }
    case 'unlock':
      return { password: '' }
    case 'page-numbers':
      return { position: 'bottom-center', fontSize: 11, format: '{n}', startNumber: 1, margin: 28 }
    case 'protect':
      return { password: '' }
    case 'pdf-to-images':
      return { format: 'png', scale: 2 }
    default:
      return {}
  }
}

export function ToolOptions({ tool, options, onChange, disabled }: ToolOptionsProps) {
  const set = (key: string, value: unknown) =>
    onChange({ ...options, [key]: value })

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-6 glass-card shadow-2xs space-y-4',
        disabled && 'pointer-events-none opacity-60'
      )}
    >
      <div className="flex items-center gap-2 text-sm font-semibold tracking-tight border-b border-border/50 pb-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <SettingsIcon toolId={tool.id} />
        </span>
        <span>Tool Configuration</span>
      </div>

      {tool.id === 'split' && (
        <SplitOptions options={options} set={set} />
      )}
      {tool.id === 'rotate' && (
        <RotateOptions options={options} set={set} />
      )}
      {tool.id === 'images-to-pdf' && (
        <ImagesOptions options={options} set={set} />
      )}
      {tool.id === 'compress' && (
        <CompressOptions options={options} set={set} />
      )}
      {tool.id === 'unlock' && (
        <UnlockOptions options={options} set={set} />
      )}
      {tool.id === 'page-numbers' && (
        <PageNumberOptions options={options} set={set} />
      )}
      {tool.id === 'protect' && (
        <ProtectOptions options={options} set={set} />
      )}
      {tool.id === 'pdf-to-images' && (
        <PdfToImagesOptions options={options} set={set} />
      )}
    </div>
  )
}

function SettingsIcon({ toolId }: { toolId: string }) {
  if (toolId === 'split') return <Scissors className="h-4 w-4" />
  if (toolId === 'rotate') return <RotateCw className="h-4 w-4" />
  if (toolId === 'compress') return <FileArchive className="h-4 w-4" />
  if (toolId === 'unlock') return <LockOpen className="h-4 w-4" />
  if (toolId === 'page-numbers') return <Hash className="h-4 w-4" />
  if (toolId === 'protect') return <Lock className="h-4 w-4" />
  if (toolId === 'pdf-to-images') return <FileImage className="h-4 w-4" />
  return <Images className="h-4 w-4" />
}

function OptionRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center">
      <div>
        <Label className="text-xs font-semibold text-foreground">{label}</Label>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function RadioCard({
  value,
  label,
  desc,
}: {
  value: string
  label: string
  desc: string
}) {
  return (
    <Label
      htmlFor={`r-${value}`}
      className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/80 bg-card p-3 transition-all duration-150 glass-card hover:border-primary/40 active-push has-[:checked]:border-primary has-[:checked]:bg-primary/[0.06] has-[:checked]:shadow-2xs"
    >
      <RadioGroupItem value={value} id={`r-${value}`} className="mt-0.5 text-primary" />
      <span className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">{label}</span>
        <span className="text-xs text-muted-foreground mt-0.5">{desc}</span>
      </span>
    </Label>
  )
}

function SplitOptions({
  options,
  set,
}: {
  options: ToolOptionsMap
  set: (key: string, value: unknown) => void
}) {
  const mode = (options.mode as string) || 'each'
  return (
    <div className="space-y-4">
      <OptionRow label="Split mode" hint="How to divide pages.">
        <RadioGroup
          value={mode}
          onValueChange={(v) => set('mode', v)}
          className="grid grid-cols-2 gap-2"
        >
          <RadioCard value="each" label="Each page" desc="One PDF per page" />
          <RadioCard value="ranges" label="Custom ranges" desc="Define page groups" />
        </RadioGroup>
      </OptionRow>
      {mode === 'ranges' && (
        <OptionRow label="Page ranges" hint='e.g. "1-3, 5, 7-9" (comma separated)'>
          <Input
            value={(options.ranges as string) || ''}
            onChange={(e) => set('ranges', e.target.value)}
            placeholder="1-3, 5, 7-9"
            className="font-mono text-sm"
          />
        </OptionRow>
      )}
    </div>
  )
}

function RotateOptions({
  options,
  set,
}: {
  options: ToolOptionsMap
  set: (key: string, value: unknown) => void
}) {
  const angle = Number(options.angle ?? 90)
  return (
    <OptionRow label="Rotation" hint="Clockwise rotation angle.">
      <RadioGroup
        value={String(angle)}
        onValueChange={(v) => set('angle', Number(v))}
        className="grid grid-cols-3 gap-2"
      >
        <RadioCard value="90" label="90°" desc="Quarter turn" />
        <RadioCard value="180" label="180°" desc="Half turn" />
        <RadioCard value="270" label="270°" desc="Three quarter" />
      </RadioGroup>
    </OptionRow>
  )
}

function ImagesOptions({
  options,
  set,
}: {
  options: ToolOptionsMap
  set: (key: string, value: unknown) => void
}) {
  const output = (options.output as string) || 'single'
  const pageSize = (options.pageSize as string) || 'fit'
  return (
    <div className="space-y-4">
      <OptionRow label="Output" hint="One combined PDF or separate files.">
        <RadioGroup
          value={output}
          onValueChange={(v) => set('output', v)}
          className="grid grid-cols-2 gap-2"
        >
          <RadioCard value="single" label="Single PDF" desc="All images in one file" />
          <RadioCard value="multiple" label="One per image" desc="Separate PDF files" />
        </RadioGroup>
      </OptionRow>
      <OptionRow label="Page size" hint="How images fit on page.">
        <Select value={pageSize} onValueChange={(v) => set('pageSize', v)}>
          <SelectTrigger className="w-full sm:w-[220px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="fit">Fit to image dimensions</SelectItem>
            <SelectItem value="a4">A4 (portrait)</SelectItem>
            <SelectItem value="letter">US Letter (portrait)</SelectItem>
          </SelectContent>
        </Select>
      </OptionRow>
    </div>
  )
}

function CompressOptions({
  options,
  set,
}: {
  options: ToolOptionsMap
  set: (key: string, value: unknown) => void
}) {
  const level = (options.level as string) || 'normal'
  const levels = [
    {
      id: 'low',
      title: 'Low',
      desc: 'Lossless structural optimization. Text remains selectable.',
      reduction: '~5-15%',
      icon: Zap,
      color: 'emerald',
    },
    {
      id: 'normal',
      title: 'Normal',
      desc: 'Recompress images at medium quality. Recommended.',
      reduction: '~30-60%',
      icon: Sparkles,
      color: 'amber',
    },
    {
      id: 'extreme',
      title: 'Extreme',
      desc: 'Full page rasterization for smallest file size.',
      reduction: '~70-90%',
      icon: Flame,
      color: 'rose',
    },
  ] as const

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {levels.map((lv) => {
          const active = level === lv.id
          const IconComp = lv.icon
          return (
            <button
              key={lv.id}
              type="button"
              onClick={() => set('level', lv.id)}
              className={cn(
                'group relative flex flex-col items-start rounded-xl border p-4 text-left transition-all active-push cursor-pointer glass-card',
                active
                  ? lv.color === 'emerald'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-xs'
                    : lv.color === 'amber'
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30 shadow-xs'
                      : 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-500/30 shadow-xs'
                  : 'border-border/80 bg-card hover:border-primary/40 hover:shadow-2xs'
              )}
            >
              <div className="mb-2 flex w-full items-center justify-between">
                <span
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-lg ring-1',
                    lv.color === 'emerald' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
                    lv.color === 'amber' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
                    lv.color === 'rose' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20'
                  )}
                >
                  <IconComp className="h-4 w-4" />
                </span>
                {active && (
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full text-white',
                      lv.color === 'emerald' && 'bg-emerald-500',
                      lv.color === 'amber' && 'bg-amber-500',
                      lv.color === 'rose' && 'bg-rose-500'
                    )}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold">{lv.title}</span>
              <span className="mt-0.5 text-xs text-muted-foreground leading-snug">{lv.desc}</span>
              <span
                className={cn(
                  'mt-2.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider font-mono',
                  lv.color === 'emerald' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                  lv.color === 'amber' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                  lv.color === 'rose' && 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                )}
              >
                {lv.reduction}
              </span>
            </button>
          )
        })}
      </div>
      {level === 'extreme' ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <span>
            Pages are converted to high-resolution images — text won't be selectable after compression.
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-muted-foreground">
          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            Text stays fully selectable — only embedded images and document structures are optimized.
          </span>
        </div>
      )}
    </div>
  )
}

function UnlockOptions({
  options,
  set,
}: {
  options: ToolOptionsMap
  set: (key: string, value: unknown) => void
}) {
  const password = (options.password as string) || ''
  return (
    <div className="space-y-4">
      <OptionRow
        label="Password"
        hint="Only needed if the PDF requires a password to open."
      >
        <Input
          type="password"
          value={password}
          onChange={(e) => set('password', e.target.value)}
          placeholder="Leave empty for permission-only restrictions"
          autoComplete="off"
          className="rounded-xl text-sm"
        />
      </OptionRow>
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs text-muted-foreground">
        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
        <span>
          Removes owner-password restrictions (printing, copying, editing). PDFs that open without a password are unlocked instantly.
        </span>
      </div>
    </div>
  )
}

function PageNumberOptions({
  options,
  set,
}: {
  options: ToolOptionsMap
  set: (key: string, value: unknown) => void
}) {
  const position = (options.position as string) || 'bottom-center'
  const fontSize = Number(options.fontSize ?? 11)
  const format = (options.format as string) || '{n}'
  const startNumber = Number(options.startNumber ?? 1)
  const margin = Number(options.margin ?? 28)
  return (
    <div className="space-y-4">
      <OptionRow label="Position" hint="Where the page number is stamped.">
        <Select value={position} onValueChange={(v) => set('position', v)}>
          <SelectTrigger className="w-full sm:w-[220px] rounded-xl text-xs font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="bottom-center">Bottom Center</SelectItem>
            <SelectItem value="bottom-right">Bottom Right</SelectItem>
            <SelectItem value="bottom-left">Bottom Left</SelectItem>
            <SelectItem value="top-center">Top Center</SelectItem>
            <SelectItem value="top-right">Top Right</SelectItem>
            <SelectItem value="top-left">Top Left</SelectItem>
          </SelectContent>
        </Select>
      </OptionRow>
      <OptionRow label="Format" hint="Numbering template.">
        <Select value={format} onValueChange={(v) => set('format', v)}>
          <SelectTrigger className="w-full sm:w-[220px] rounded-xl text-xs font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl font-mono text-xs">
            <SelectItem value="{n}">1, 2, 3…</SelectItem>
            <SelectItem value="{n} / {total}">1 / 5, 2 / 5…</SelectItem>
            <SelectItem value="Page {n}">Page 1, Page 2…</SelectItem>
            <SelectItem value="- {n} -">– 1 –, – 2 –…</SelectItem>
            <SelectItem value="{roman}">i, ii, iii… (Roman)</SelectItem>
            <SelectItem value="{Roman}">I, II, III… (ROMAN)</SelectItem>
            <SelectItem value="{alpha}">a, b, c… (Letters)</SelectItem>
            <SelectItem value="{Alpha}">A, B, C… (LETTERS)</SelectItem>
          </SelectContent>
        </Select>
      </OptionRow>
      <OptionRow label="Start at" hint="First page index.">
        <Input
          type="number"
          min={1}
          value={startNumber}
          onChange={(e) => set('startNumber', Number(e.target.value) || 1)}
          className="w-full sm:w-[120px] rounded-xl font-mono"
        />
      </OptionRow>
      <OptionRow label={`Font size · ${fontSize}pt`} hint="Size in typographic points.">
        <Slider
          value={[fontSize]}
          min={7}
          max={24}
          step={1}
          onValueChange={(v) => set('fontSize', v[0])}
          className="w-full sm:w-[220px]"
        />
      </OptionRow>
      <OptionRow label={`Margin · ${margin}pt`} hint="Offset from page edge.">
        <Slider
          value={[margin]}
          min={10}
          max={80}
          step={1}
          onValueChange={(v) => set('margin', v[0])}
          className="w-full sm:w-[220px]"
        />
      </OptionRow>
    </div>
  )
}

function ProtectOptions({
  options,
  set,
}: {
  options: ToolOptionsMap
  set: (key: string, value: unknown) => void
}) {
  const password = (options.password as string) || ''
  const hasPwd = password.length > 0
  return (
    <div className="space-y-4">
      <OptionRow label="Password" hint="Required to open the protected document.">
        <Input
          type="password"
          value={password}
          onChange={(e) => set('password', e.target.value)}
          placeholder="Enter protection password"
          autoComplete="new-password"
          className="rounded-xl text-sm"
        />
      </OptionRow>
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border p-3.5 text-xs',
          hasPwd
            ? 'border-emerald-500/30 bg-emerald-500/5 text-muted-foreground'
            : 'border-amber-500/30 bg-amber-500/5 text-muted-foreground'
        )}
      >
        <Lock className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', hasPwd ? 'text-emerald-500' : 'text-amber-500')} />
        <span>
          {hasPwd
            ? 'Ready — the PDF will be encrypted with your password.'
            : 'Enter a password above to enable encryption.'}
        </span>
      </div>
    </div>
  )
}

function PdfToImagesOptions({
  options,
  set,
}: {
  options: ToolOptionsMap
  set: (key: string, value: unknown) => void
}) {
  const format = (options.format as string) || 'png'
  const scale = Number(options.scale ?? 2)
  return (
    <div className="space-y-4">
      <OptionRow label="Image format" hint="PNG is lossless; JPG is smaller.">
        <RadioGroup
          value={format}
          onValueChange={(v) => set('format', v)}
          className="grid grid-cols-2 gap-2"
        >
          <RadioCard value="png" label="PNG" desc="Lossless quality" />
          <RadioCard value="jpg" label="JPG" desc="Compressed photo" />
        </RadioGroup>
      </OptionRow>
      <OptionRow label={`Resolution · ${scale}×`} hint="Render multiplier.">
        <Slider
          value={[scale]}
          min={1}
          max={4}
          step={1}
          onValueChange={(v) => set('scale', v[0])}
          className="w-full sm:w-[220px]"
        />
      </OptionRow>
    </div>
  )
}
