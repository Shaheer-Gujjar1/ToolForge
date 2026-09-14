'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Binary,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Upload,
  Download,
  Code2,
  Sliders,
  Type,
  Table as TableIcon,
  Search,
  ArrowRightLeft,
  FileText,
  Eye,
  Terminal,
  Image as ImageIcon,
  CheckCircle2,
  Layers,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ==========================================
// --- Conversion Algorithms & Utilities ---
// ==========================================

export type Delimiter = 'space' | 'comma' | 'none' | 'colon'

function getDelimChar(d: Delimiter): string {
  switch (d) {
    case 'space': return ' '
    case 'comma': return ', '
    case 'colon': return ':'
    case 'none': return ''
  }
}

// 1. Text <-> Decimal
function textToDec(text: string, delim: Delimiter): string {
  const d = getDelimChar(delim)
  return Array.from(text)
    .map((c) => c.charCodeAt(0))
    .join(d)
}

function decToText(decStr: string): string {
  const nums = decStr.trim().split(/[\s,:]+/).filter(Boolean)
  let res = ''
  for (const n of nums) {
    const code = parseInt(n, 10)
    if (!isNaN(code) && code >= 0 && code <= 65535) {
      res += String.fromCharCode(code)
    }
  }
  return res
}

// 2. Text <-> Binary
function textToBin(text: string, delim: Delimiter): string {
  const d = getDelimChar(delim)
  return Array.from(text)
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(d)
}

function binToText(binStr: string): string {
  const clean = binStr.trim()
  let chunks: string[] = []
  if (clean.includes(' ') || clean.includes(',') || clean.includes(':')) {
    chunks = clean.split(/[\s,:]+/).filter(Boolean)
  } else {
    // Continuous 8-bit stream
    for (let i = 0; i < clean.length; i += 8) {
      chunks.push(clean.slice(i, i + 8))
    }
  }
  return chunks
    .map((b) => {
      const code = parseInt(b, 2)
      return !isNaN(code) ? String.fromCharCode(code) : ''
    })
    .join('')
}

// 3. Text <-> Hex
function textToHex(text: string, delim: Delimiter, prefix0x = false): string {
  const d = getDelimChar(delim)
  return Array.from(text)
    .map((c) => {
      const h = c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()
      return prefix0x ? `0x${h}` : h
    })
    .join(d)
}

function hexToText(hexStr: string): string {
  const clean = hexStr.replace(/0x/gi, '').trim()
  let chunks: string[] = []
  if (clean.includes(' ') || clean.includes(',') || clean.includes(':')) {
    chunks = clean.split(/[\s,:]+/).filter(Boolean)
  } else {
    for (let i = 0; i < clean.length; i += 2) {
      chunks.push(clean.slice(i, i + 2))
    }
  }
  return chunks
    .map((h) => {
      const code = parseInt(h, 16)
      return !isNaN(code) ? String.fromCharCode(code) : ''
    })
    .join('')
}

// 4. Text <-> Octal
function textToOct(text: string, delim: Delimiter): string {
  const d = getDelimChar(delim)
  return Array.from(text)
    .map((c) => c.charCodeAt(0).toString(8).padStart(3, '0'))
    .join(d)
}

function octToText(octStr: string): string {
  const nums = octStr.trim().split(/[\s,:]+/).filter(Boolean)
  return nums
    .map((o) => {
      const code = parseInt(o, 8)
      return !isNaN(code) ? String.fromCharCode(code) : ''
    })
    .join('')
}

// 5. Text <-> Base64
function textToBase64(text: string): string {
  try {
    return btoa(unescape(encodeURIComponent(text)))
  } catch {
    return ''
  }
}

function base64ToText(b64: string): string {
  try {
    return decodeURIComponent(escape(atob(b64.trim())))
  } catch {
    return ''
  }
}

// 6. Text <-> HTML Entities
function textToHtmlEntities(text: string): string {
  return Array.from(text)
    .map((c) => `&#${c.charCodeAt(0)};`)
    .join('')
}

// ==========================================
// --- Built-in ASCII Art Font Characters ---
// ==========================================

const ASCII_BANNER_FONTS: Record<string, Record<string, string[]>> = {
  block: {
    A: ['  █  ', ' █ █ ', '█████', '█   █', '█   █'],
    B: ['████ ', '█   █', '████ ', '█   █', '████ '],
    C: [' ████', '█    ', '█    ', '█    ', ' ████'],
    D: ['████ ', '█   █', '█   █', '█   █', '████ '],
    E: ['█████', '█    ', '████ ', '█    ', '█████'],
    F: ['█████', '█    ', '████ ', '█    ', '█    '],
    G: [' ████', '█    ', '█  ██', '█   █', ' ████'],
    H: ['█   █', '█   █', '█████', '█   █', '█   █'],
    I: ['███', ' █ ', ' █ ', ' █ ', '███'],
    J: ['  ███', '   █ ', '   █ ', '█  █ ', ' ██  '],
    K: ['█   █', '█  █ ', '███  ', '█  █ ', '█   █'],
    L: ['█    ', '█    ', '█    ', '█    ', '█████'],
    M: ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
    N: ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
    O: [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
    P: ['████ ', '█   █', '████ ', '█    ', '█    '],
    Q: [' ███ ', '█   █', '█ █ █', '█  ██', ' ████'],
    R: ['████ ', '█   █', '████ ', '█  █ ', '█   █'],
    S: [' ████', '█    ', ' ███ ', '    █', '████ '],
    T: ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
    U: ['█   █', '█   █', '█   █', '█   █', ' ███ '],
    V: ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
    W: ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
    X: ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
    Y: ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
    Z: ['█████', '   █ ', '  █  ', ' █   ', '█████'],
    '0': [' ███ ', '█  ██', '█ █ █', '██  █', ' ███ '],
    '1': [' ██  ', '  █  ', '  █  ', '  █  ', '████ '],
    '2': ['████ ', '    █', ' ████', '█    ', '█████'],
    '3': ['████ ', '    █', ' ███ ', '    █', '████ '],
    '4': ['█  █ ', '█  █ ', '█████', '   █ ', '   █ '],
    '5': ['█████', '█    ', '████ ', '    █', '████ '],
    '6': [' ████', '█    ', '████ ', '█   █', ' ████'],
    '7': ['█████', '    █', '   █ ', '  █  ', '  █  '],
    '8': [' ███ ', '█   █', ' ███ ', '█   █', ' ███ '],
    '9': [' ███ ', '█   █', ' ████', '    █', ' ███ '],
    ' ': ['   ', '   ', '   ', '   ', '   '],
    '!': ['█', '█', '█', ' ', '█'],
    '?': ['███ ', '   █', '  █ ', '    ', '  █ '],
    '.': [' ', ' ', ' ', ' ', '█'],
    '-': ['     ', '     ', '█████', '     ', '     '],
    '+': ['  █  ', '  █  ', '█████', '  █  ', '  █  '],
  },
  slant: {
    A: ['   ____ ', '  / __ \\', ' / /_/ /', '/ /_/ / ', '/_/  |_/ '],
    B: ['   ____ ', '  / __ )', ' / __  |', '/ /_/ / ', '/_____/  '],
    C: ['   ______', '  / ____/', ' / /     ', '/ /___   ', '\\____/   '],
    D: ['   ____  ', '  / __ \\ ', ' / / / / ', '/ /_/ /  ', '/_____/   '],
    E: ['   ______', '  / ____/', ' / __/   ', '/ /___   ', '/_____/  '],
    H: ['    __  __', '   / / / /', '  / /_/ / ', ' / __  /  ', '/_/ /_/   '],
    O: ['   ____  ', '  / __ \\ ', ' / / / / ', '/ /_/ /  ', '\\____/   '],
    P: ['   ____  ', '  / __ \\ ', ' / /_/ / ', '/ ____/  ', '/_/      '],
    R: ['   ____  ', '  / __ \\ ', ' / /_/ / ', '/ _, _/  ', '/_/ |_|  '],
    S: ['   _____', '  / ___/', '  \\__ \\ ', ' ___/ / ', '/____/  '],
    T: ['  ______', ' /_  __/', '  / /   ', ' / /    ', '/_/     '],
    ' ': ['    ', '    ', '    ', '    ', '    '],
  },
}

function renderAsciiBanner(text: string, fontKey = 'block'): string {
  const font = ASCII_BANNER_FONTS[fontKey] || ASCII_BANNER_FONTS.block
  const upper = text.toUpperCase()
  const lines: string[] = ['', '', '', '', '']

  for (const char of upper) {
    const glyph = font[char] || ASCII_BANNER_FONTS.block[char] || [
      ' ??? ', ' ? ? ', '  ?  ', '     ', '  ?  '
    ]
    for (let i = 0; i < 5; i++) {
      lines[i] += (glyph[i] || '     ') + ' '
    }
  }
  return lines.join('\n')
}

// Standard ASCII Table (0 - 127)
const ASCII_TABLE_DATA = Array.from({ length: 128 }, (_, i) => {
  let charDesc = ''
  let symbol = String.fromCharCode(i)
  let isControl = false

  if (i < 32 || i === 127) {
    isControl = true
    const controlNames: Record<number, [string, string]> = {
      0: ['NUL', 'Null char'],
      1: ['SOH', 'Start of Heading'],
      2: ['STX', 'Start of Text'],
      3: ['ETX', 'End of Text'],
      4: ['EOT', 'End of Transmission'],
      7: ['BEL', 'Bell / Alert'],
      8: ['BS', 'Backspace'],
      9: ['HT', 'Horizontal Tab'],
      10: ['LF', 'Line Feed (New line)'],
      13: ['CR', 'Carriage Return'],
      27: ['ESC', 'Escape'],
      32: ['SPACE', 'Space'],
      127: ['DEL', 'Delete'],
    }
    symbol = controlNames[i]?.[0] || `CTRL-${i}`
    charDesc = controlNames[i]?.[1] || 'Control character'
  }

  return {
    dec: i,
    hex: i.toString(16).padStart(2, '0').toUpperCase(),
    oct: i.toString(8).padStart(3, '0'),
    bin: i.toString(2).padStart(8, '0'),
    symbol,
    desc: charDesc || (symbol.match(/[a-zA-Z]/) ? 'Letter' : symbol.match(/[0-9]/) ? 'Digit' : 'Symbol'),
    isControl,
  }
})

// Quick test samples
const QUICK_SAMPLES = [
  'Hello World!',
  'ToolForge 2026',
  'Cyberpunk 2077',
  'ASCII Art',
  'Code is Poetry.',
]

export function AsciiConverterView() {
  const [activeTab, setActiveTab] = React.useState<'converter' | 'art' | 'image-ascii' | 'table'>('converter')
  const [delimiter, setDelimiter] = React.useState<Delimiter>('space')
  const [prefix0x, setPrefix0x] = React.useState<boolean>(false)
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)

  // Primary plain text drives all two-way conversions
  const [text, setText] = React.useState<string>('Hello World!')

  // Two-way input states
  const [decInput, setDecInput] = React.useState<string>('')
  const [binInput, setBinInput] = React.useState<string>('')
  const [hexInput, setHexInput] = React.useState<string>('')
  const [b64Input, setB64Input] = React.useState<string>('')

  // ASCII Banner Art States
  const [artText, setArtText] = React.useState<string>('TOOLFORGE')
  const [artFont, setArtFont] = React.useState<'block' | 'slant'>('block')

  // Image to ASCII Art States
  const [imageAscii, setImageAscii] = React.useState<string>('')
  const [asciiWidth, setAsciiWidth] = React.useState<number>(55)
  const [invertAscii, setInvertAscii] = React.useState<boolean>(false)
  const [isProcessingImg, setIsProcessingImg] = React.useState<boolean>(false)

  // ASCII Table Filter
  const [tableSearch, setTableSearch] = React.useState<string>('')

  // Live synchronizer: whenever `text`, `delimiter` or `prefix0x` changes, update sub-inputs
  React.useEffect(() => {
    setDecInput(textToDec(text, delimiter))
    setBinInput(textToBin(text, delimiter))
    setHexInput(textToHex(text, delimiter, prefix0x))
    setB64Input(textToBase64(text))
  }, [text, delimiter, prefix0x])

  // Copy with animation
  const copyToClipboard = (val: string, key: string) => {
    if (!val) return
    navigator.clipboard.writeText(val)
    setCopiedKey(key)
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev))
    }, 1800)
  }

  // Two-Way Event Handlers (editing sub-format updates master text)
  const handleDecChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setDecInput(v)
    setText(decToText(v))
  }

  const handleBinChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setBinInput(v)
    setText(binToText(v))
  }

  const handleHexChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setHexInput(v)
    setText(hexToText(v))
  }

  const handleB64Change = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setB64Input(v)
    setText(base64ToText(v))
  }

  // Image to ASCII rasterizer
  const handleImageToAscii = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingImg(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          const aspect = img.height / img.width
          const width = asciiWidth
          // Character height in terminal/pre tag is roughly 2x width, so scale height by 0.5
          const height = Math.max(10, Math.round(width * aspect * 0.52))

          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)

          const imgData = ctx.getImageData(0, 0, width, height).data
          const ramp = invertAscii
            ? '@%#*+=-:. '
            : ' .:-=+*#%@'

          let asciiResult = ''
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4
              const r = imgData[idx]
              const g = imgData[idx + 1]
              const b = imgData[idx + 2]
              const avg = 0.299 * r + 0.587 * g + 0.114 * b
              const charIdx = Math.floor((avg / 255) * (ramp.length - 1))
              asciiResult += ramp[charIdx]
            }
            asciiResult += '\n'
          }
          setImageAscii(asciiResult)
        } catch {
          // ignore
        } finally {
          setIsProcessingImg(false)
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Filtered ASCII table
  const filteredAsciiTable = React.useMemo(() => {
    if (!tableSearch.trim()) return ASCII_TABLE_DATA
    const q = tableSearch.toLowerCase()
    return ASCII_TABLE_DATA.filter(
      (row) =>
        row.dec.toString().includes(q) ||
        row.hex.toLowerCase().includes(q) ||
        row.symbol.toLowerCase().includes(q) ||
        row.desc.toLowerCase().includes(q)
    )
  }, [tableSearch])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* 1. Main Control Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs glass-card">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30">
                <Binary className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">
                    Universal ASCII Converter & Art Studio
                  </h2>
                  <span
                    title="Production verified"
                    className="inline-flex items-center rounded-full bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400"
                  >
                    <Lock className="h-3 w-3" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Live 2-way text to ASCII, binary, decimal, hexadecimal, Base64 & ASCII art
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setText('')}
                className="h-8 gap-1.5 rounded-xl text-xs font-medium cursor-pointer shadow-2xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear All</span>
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/40 p-1 w-fit">
            <button
              onClick={() => setActiveTab('converter')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                activeTab === 'converter'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>2-Way Converter</span>
            </button>

            <button
              onClick={() => setActiveTab('art')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                activeTab === 'art'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Type className="h-3.5 w-3.5" />
              <span>ASCII Banner Art</span>
            </button>

            <button
              onClick={() => setActiveTab('image-ascii')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                activeTab === 'image-ascii'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Image to ASCII</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                activeTab === 'table'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>ASCII Table (0-127)</span>
            </button>
          </div>

          {/* TAB 1: 2-WAY MULTI-FORMAT CONVERTER */}
          {activeTab === 'converter' && (
            <div className="space-y-6">
              {/* Quick Delimiter & Format Options */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Delimiter:
                  </span>
                  <div className="flex items-center gap-1">
                    {(['space', 'comma', 'colon', 'none'] as Delimiter[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDelimiter(d)}
                        className={cn(
                          'rounded-lg px-2.5 py-1 text-xs font-mono capitalize transition-colors cursor-pointer',
                          delimiter === d
                            ? 'bg-card text-foreground font-semibold shadow-2xs border border-border'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={prefix0x}
                      onChange={(e) => setPrefix0x(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span>0x Prefix for Hex</span>
                  </label>

                  {/* Sample Chips */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Quick test:</span>
                    {QUICK_SAMPLES.map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setText(sample)}
                        className="rounded-lg border border-border/60 bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-foreground transition-colors cursor-pointer"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Master Text Input */}
              <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-4 glass-card shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Plain Text (Bidirectional Master)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span>{text.length} chars</span>
                    <span>·</span>
                    <span>{new Blob([text]).size} bytes</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(text, 'text')}
                      className="h-7 text-xs ml-2"
                    >
                      {copiedKey === 'text' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedKey === 'text' ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type or paste any text to convert to ASCII, Binary, Hex, Decimal..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm font-sans placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 2-Way Code Output Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. ASCII Decimal */}
                <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-4 glass-card shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">DEC</Badge>
                      ASCII Decimal
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(decInput, 'dec')}
                      className="h-7 text-xs"
                    >
                      {copiedKey === 'dec' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedKey === 'dec' ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <textarea
                    rows={3}
                    value={decInput}
                    onChange={handleDecChange}
                    placeholder="72 101 108 108 111..."
                    className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary leading-relaxed"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Live 2-way: Edit decimal numbers to update plain text.
                  </p>
                </div>

                {/* 2. Binary (8-bit) */}
                <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-4 glass-card shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/30">BIN</Badge>
                      Binary (8-Bit)
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(binInput, 'bin')}
                      className="h-7 text-xs"
                    >
                      {copiedKey === 'bin' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedKey === 'bin' ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <textarea
                    rows={3}
                    value={binInput}
                    onChange={handleBinChange}
                    placeholder="01001000 01100101 01101100..."
                    className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary leading-relaxed"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Live 2-way: Paste binary bytes to decode to ASCII text.
                  </p>
                </div>

                {/* 3. Hexadecimal */}
                <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-4 glass-card shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">HEX</Badge>
                      Hexadecimal (Base 16)
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(hexInput, 'hex')}
                      className="h-7 text-xs"
                    >
                      {copiedKey === 'hex' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedKey === 'hex' ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <textarea
                    rows={3}
                    value={hexInput}
                    onChange={handleHexChange}
                    placeholder="48 65 6C 6C 6F..."
                    className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary leading-relaxed"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Live 2-way: Paste hex stream or 0x values to decode.
                  </p>
                </div>

                {/* 4. Base64 */}
                <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-4 glass-card shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">B64</Badge>
                      Base64 Encoding
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(b64Input, 'b64')}
                      className="h-7 text-xs"
                    >
                      {copiedKey === 'b64' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedKey === 'b64' ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <textarea
                    rows={3}
                    value={b64Input}
                    onChange={handleB64Change}
                    placeholder="SGVsbG8gV29ybGQh..."
                    className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary leading-relaxed"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Live 2-way: Paste Base64 string to decode to text.
                  </p>
                </div>

                {/* 5. Octal (Base 8) */}
                <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-4 glass-card shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/30">OCT</Badge>
                      Octal (Base 8)
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(textToOct(text, delimiter), 'oct')}
                      className="h-7 text-xs"
                    >
                      {copiedKey === 'oct' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedKey === 'oct' ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <textarea
                    rows={3}
                    value={textToOct(text, delimiter)}
                    onChange={(e) => setText(octToText(e.target.value))}
                    placeholder="110 145 154 154 157..."
                    className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary leading-relaxed"
                  />
                </div>

                {/* 6. HTML Numeric Entities */}
                <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-4 glass-card shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px] bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/30">HTML</Badge>
                      HTML Char Entities
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(textToHtmlEntities(text), 'html')}
                      className="h-7 text-xs"
                    >
                      {copiedKey === 'html' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedKey === 'html' ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <textarea
                    rows={3}
                    readOnly
                    value={textToHtmlEntities(text)}
                    placeholder="&#72;&#101;&#108;&#108;&#111;..."
                    className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary leading-relaxed cursor-default"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASCII BANNER ART */}
          {activeTab === 'art' && (
            <div className="space-y-5 rounded-2xl border border-border/70 bg-card/60 p-6 glass-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-foreground">
                    FIGlet ASCII Banner Generator
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Style:</span>
                  <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/40 p-0.5">
                    <button
                      onClick={() => setArtFont('block')}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors',
                        artFont === 'block' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground'
                      )}
                    >
                      Block Solid
                    </button>
                    <button
                      onClick={() => setArtFont('slant')}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors',
                        artFont === 'slant' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground'
                      )}
                    >
                      Slant 3D
                    </button>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(renderAsciiBanner(artText, artFont), 'banner')}
                    className="h-8 text-xs"
                  >
                    {copiedKey === 'banner' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey === 'banner' ? 'Copied' : 'Copy Art'}</span>
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Input text for ASCII banner:
                </label>
                <input
                  type="text"
                  value={artText}
                  onChange={(e) => setArtText(e.target.value)}
                  placeholder="TOOLFORGE..."
                  maxLength={24}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 font-mono text-sm font-bold uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* ASCII Banner Preview Screen */}
              <div className="relative rounded-2xl border border-border/80 bg-zinc-950 p-4 font-mono text-xs leading-none text-emerald-400 overflow-x-auto shadow-inner">
                <pre className="select-all font-mono whitespace-pre text-[11px] sm:text-xs">
                  {renderAsciiBanner(artText, artFont)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: IMAGE TO ASCII ART */}
          {activeTab === 'image-ascii' && (
            <div className="space-y-5 rounded-2xl border border-border/70 bg-card/60 p-6 glass-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Raster Image to ASCII Art Converter
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Upload any photo or icon to render it into custom ASCII characters
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Width:</span>
                    <input
                      type="range"
                      min={30}
                      max={90}
                      value={asciiWidth}
                      onChange={(e) => setAsciiWidth(Number(e.target.value))}
                      className="h-3 w-20 cursor-pointer accent-primary"
                    />
                    <span className="font-mono font-bold text-foreground">{asciiWidth}ch</span>
                  </div>

                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={invertAscii}
                      onChange={(e) => setInvertAscii(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span>Invert</span>
                  </label>

                  {imageAscii && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(imageAscii, 'img-ascii')}
                      className="h-8 text-xs"
                    >
                      {copiedKey === 'img-ascii' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedKey === 'img-ascii' ? 'Copied' : 'Copy ASCII'}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Upload Drop area */}
              <div className="rounded-2xl border-2 border-dashed border-border/80 bg-secondary/20 p-6 text-center">
                <label className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <Upload className="h-6 w-6 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Choose an image (PNG, JPG, WEBP)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Processes locally in your browser memory
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageToAscii}
                    className="hidden"
                  />
                </label>
              </div>

              {isProcessingImg && (
                <p className="text-center text-xs text-muted-foreground animate-pulse font-mono">
                  Rendering ASCII matrix…
                </p>
              )}

              {/* ASCII Output Canvas */}
              {imageAscii && (
                <div className="relative rounded-2xl border border-border/80 bg-zinc-950 p-4 font-mono leading-none text-emerald-400 overflow-x-auto shadow-inner text-center">
                  <pre className="inline-block select-all font-mono whitespace-pre text-[6px] sm:text-[7.5px] leading-[0.85] tracking-tighter">
                    {imageAscii}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ASCII TABLE (0 - 127) */}
          {activeTab === 'table' && (
            <div className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-5 glass-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Standard 7-bit ASCII Reference Table
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Complete decimal, hex, octal, and binary map for characters 0 to 127
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search char, dec, or hex..."
                    className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-1.5 text-xs font-mono placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[420px] scrollbar-thin border border-border/60 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-secondary/80 backdrop-blur-md border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Char</th>
                      <th className="py-2.5 px-3">Decimal</th>
                      <th className="py-2.5 px-3">Hex</th>
                      <th className="py-2.5 px-3">Octal</th>
                      <th className="py-2.5 px-3 font-mono">Binary</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono">
                    {filteredAsciiTable.map((row) => (
                      <tr
                        key={row.dec}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-2 px-3 font-bold text-foreground text-sm">
                          {row.symbol}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{row.dec}</td>
                        <td className="py-2 px-3 text-blue-500 font-semibold">{row.hex}</td>
                        <td className="py-2 px-3 text-muted-foreground">{row.oct}</td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">{row.bin}</td>
                        <td className="py-2 px-3 font-sans text-xs text-muted-foreground">{row.desc}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setText(String.fromCharCode(row.dec))
                              setActiveTab('converter')
                            }}
                            className="text-[11px] font-sans font-medium text-primary hover:underline cursor-pointer"
                          >
                            Load
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
