'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Copy,
  Check,
  Pipette,
  Shuffle,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  XCircle,
  Eye,
  Image as ImageIcon,
  Upload,
  Download,
  Code2,
  Layers,
  Sparkle,
  Sun,
  Moon,
  Info,
  SlidersHorizontal,
  FileCode,
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ==========================================
// --- Advanced Color Types & Math Helpers ---
// ==========================================

interface HsvColor {
  h: number // 0 - 360
  s: number // 0 - 100
  v: number // 0 - 100
  a: number // 0 - 1
}

interface RgbColor {
  r: number // 0 - 255
  g: number // 0 - 255
  b: number // 0 - 255
  a: number // 0 - 1
}

interface HslColor {
  h: number // 0 - 360
  s: number // 0 - 100
  l: number // 0 - 100
  a: number // 0 - 1
}

interface CmykColor {
  c: number // 0 - 100
  m: number // 0 - 100
  y: number // 0 - 100
  k: number // 0 - 100
}

function hsvToRgb(h: number, s: number, v: number, a = 1): RgbColor {
  s = Math.max(0, Math.min(100, s)) / 100
  v = Math.max(0, Math.min(100, v)) / 100
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c

  let r1 = 0, g1 = 0, b1 = 0
  if (h >= 0 && h < 60) {
    r1 = c; g1 = x; b1 = 0
  } else if (h >= 60 && h < 120) {
    r1 = x; g1 = c; b1 = 0
  } else if (h >= 120 && h < 180) {
    r1 = 0; g1 = c; b1 = x
  } else if (h >= 180 && h < 240) {
    r1 = 0; g1 = x; b1 = c
  } else if (h >= 240 && h < 300) {
    r1 = x; g1 = 0; b1 = c
  } else {
    r1 = c; g1 = 0; b1 = x
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
    a,
  }
}

function rgbToHsv(r: number, g: number, b: number, a = 1): HsvColor {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    } else if (max === g) {
      h = ((b - r) / d + 2) * 60
    } else {
      h = ((r - g) / d + 4) * 60
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
    a,
  }
}

function rgbToHsl(r: number, g: number, b: number, a = 1): HslColor {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    } else if (max === g) {
      h = ((b - r) / d + 2) * 60
    } else {
      h = ((r - g) / d + 4) * 60
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a,
  }
}

function rgbToHex(r: number, g: number, b: number, a = 1): string {
  const rHex = Math.max(0, Math.min(255, r)).toString(16).padStart(2, '0')
  const gHex = Math.max(0, Math.min(255, g)).toString(16).padStart(2, '0')
  const bHex = Math.max(0, Math.min(255, b)).toString(16).padStart(2, '0')
  if (a < 1) {
    const aHex = Math.round(a * 255).toString(16).padStart(2, '0')
    return `#${rHex}${gHex}${bHex}${aHex}`.toUpperCase()
  }
  return `#${rHex}${gHex}${bHex}`.toUpperCase()
}

function rgbToCmyk(r: number, g: number, b: number): CmykColor {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  const k = 1 - Math.max(rNorm, gNorm, bNorm)

  if (k >= 1) {
    return { c: 0, m: 0, y: 0, k: 100 }
  }

  const c = (1 - rNorm - k) / (1 - k)
  const m = (1 - gNorm - k) / (1 - k)
  const y = (1 - bNorm - k) / (1 - k)

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  }
}

// Approximate OKLCH conversion
function rgbToOklch(r: number, g: number, b: number): string {
  const rL = r / 255
  const gL = g / 255
  const bL = b / 255
  // Approximate lightness
  const l = Math.sqrt(0.299 * rL * rL + 0.587 * gL * gL + 0.114 * bL * bL)
  const max = Math.max(rL, gL, bL)
  const min = Math.min(rL, gL, bL)
  const c = (max - min) * 0.4
  let h = 0
  if (max !== min) {
    if (max === rL) h = ((gL - bL) / (max - min)) * 60
    else if (max === gL) h = (2 + (bL - rL) / (max - min)) * 60
    else h = (4 + (rL - gL) / (max - min)) * 60
    if (h < 0) h += 360
  }
  return `oklch(${l.toFixed(2)} ${c.toFixed(2)} ${Math.round(h)})`
}

function parseHexToRgb(hex: string): RgbColor | null {
  let cleaned = hex.trim().replace(/^#/, '')
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('')
  }
  if (cleaned.length === 6) {
    const num = parseInt(cleaned, 16)
    if (isNaN(num)) return null
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
      a: 1,
    }
  }
  if (cleaned.length === 8) {
    const num = parseInt(cleaned, 16)
    if (isNaN(num)) return null
    return {
      r: (num >> 24) & 255,
      g: (num >> 16) & 255,
      b: (num >> 8) & 255,
      a: Math.round(((num & 255) / 255) * 100) / 100,
    }
  }
  return null
}

function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

function getContrast(rgb: RgbColor, onWhite: boolean): number {
  const lum1 = getLuminance(rgb.r, rgb.g, rgb.b)
  const lum2 = onWhite ? 1 : 0
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

// Closest Tailwind CSS color name helper
const TAILWIND_COLORS: Record<string, string> = {
  '#EF4444': 'red-500',
  '#F97316': 'orange-500',
  '#F59E0B': 'amber-500',
  '#EAB308': 'yellow-500',
  '#84CC16': 'lime-500',
  '#22C55E': 'green-500',
  '#10B981': 'emerald-500',
  '#14B8A6': 'teal-500',
  '#06B6D4': 'cyan-500',
  '#0EA5E9': 'sky-500',
  '#3B82F6': 'blue-500',
  '#6366F1': 'indigo-500',
  '#8B5CF6': 'violet-500',
  '#A855F7': 'purple-500',
  '#D946EF': 'fuchsia-500',
  '#EC4899': 'pink-500',
  '#F43F5E': 'rose-500',
  '#64748B': 'slate-500',
  '#71717A': 'zinc-500',
}

function findClosestTailwind(r: number, g: number, b: number): string {
  let closest = 'custom'
  let minDistance = Infinity

  for (const [hexVal, name] of Object.entries(TAILWIND_COLORS)) {
    const p = parseHexToRgb(hexVal)
    if (!p) continue
    const dist = Math.hypot(r - p.r, g - p.g, b - p.b)
    if (dist < minDistance) {
      minDistance = dist
      closest = dist < 50 ? name : `~${name}`
    }
  }
  return closest
}

// Preset Canva-style color palettes
const PRESET_PALETTES = {
  modern: {
    name: 'Modern Tech & SaaS',
    colors: [
      '#6366F1', '#3B82F6', '#06B6D4', '#10B981',
      '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
    ],
  },
  pastel: {
    name: 'Pastel Aesthetic',
    colors: [
      '#FECDD3', '#FDE68A', '#A7F3D0', '#BAE6FD',
      '#C7D2FE', '#DDD6FE', '#FBCFE8', '#FED7AA',
    ],
  },
  warm: {
    name: 'Warm Autumn & Earth',
    colors: [
      '#78350F', '#B45309', '#D97706', '#F59E0B',
      '#FBBF24', '#CA8A04', '#EAB308', '#FEF08A',
    ],
  },
  neon: {
    name: 'Cyberpunk & Neon',
    colors: [
      '#00F0FF', '#7000FF', '#FF007B', '#FFE600',
      '#00FF66', '#FF3300', '#00FFFF', '#FF00A0',
    ],
  },
  slate: {
    name: 'Monochrome & Dark Mode',
    colors: [
      '#09090B', '#18181B', '#27272A', '#3F3F46',
      '#71717A', '#A1A1AA', '#E4E4E7', '#FFFFFF',
    ],
  },
}

export function ColorPickerView() {
  // HSV state drives the Canva picker smoothly
  const [hsv, setHsv] = React.useState<HsvColor>({
    h: 239,
    s: 59,
    v: 95,
    a: 1,
  })
  const [copiedFormat, setCopiedFormat] = React.useState<string | null>(null)
  const [savedColors, setSavedColors] = React.useState<string[]>([
    '#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  ])
  const [customInput, setCustomInput] = React.useState<string>('#6366F1')
  const [inputError, setInputError] = React.useState<boolean>(false)
  const [activeTab, setActiveTab] = React.useState<'picker' | 'image-extract' | 'export'>('picker')
  const [extractedPalette, setExtractedPalette] = React.useState<string[]>([])
  const [isExtracting, setIsExtracting] = React.useState<boolean>(false)

  // Derived color formats
  const rgb = React.useMemo(() => hsvToRgb(hsv.h, hsv.s, hsv.v, hsv.a), [hsv])
  const hsl = React.useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b, rgb.a), [rgb])
  const hex = React.useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb])
  const hexWithAlpha = React.useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b, rgb.a), [rgb])
  const cmyk = React.useMemo(() => rgbToCmyk(rgb.r, rgb.g, rgb.b), [rgb])
  const oklch = React.useMemo(() => rgbToOklch(rgb.r, rgb.g, rgb.b), [rgb])
  const tailwindName = React.useMemo(() => findClosestTailwind(rgb.r, rgb.g, rgb.b), [rgb])

  // Sync custom input text
  React.useEffect(() => {
    setCustomInput(hexWithAlpha)
    setInputError(false)
  }, [hexWithAlpha])

  // Load saved colors from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('toolforge_saved_colors')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedColors(parsed.slice(0, 18))
        }
      }
    } catch {
      // ignore
    }
  }, [])

  const saveCurrentColor = () => {
    setSavedColors((prev) => {
      const next = [hexWithAlpha, ...prev.filter((c) => c !== hexWithAlpha)].slice(0, 18)
      try {
        localStorage.setItem('toolforge_saved_colors', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const removeSavedColor = (colorToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSavedColors((prev) => {
      const next = prev.filter((c) => c !== colorToRemove)
      try {
        localStorage.setItem('toolforge_saved_colors', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  // Copy helper with animation
  const copyValue = (val: string, formatId: string) => {
    navigator.clipboard.writeText(val)
    setCopiedFormat(formatId)
    setTimeout(() => {
      setCopiedFormat((prev) => (prev === formatId ? null : prev))
    }, 1800)
  }

  // EyeDropper API support (Canva-style screen sampling)
  const handleEyeDropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper()
        const result = await eyeDropper.open()
        if (result?.sRGBHex) {
          const parsed = parseHexToRgb(result.sRGBHex)
          if (parsed) {
            setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b, 1))
          }
        }
      } catch {
        // User cancelled eyedropper
      }
    } else {
      alert('The EyeDropper screen sampler is supported in Chromium browsers (Chrome, Edge, Opera, Brave). You can also click any palette swatch, upload an image below, or paste your hex value!')
    }
  }

  // Random color generator
  const handleRandomColor = () => {
    setHsv({
      h: Math.floor(Math.random() * 360),
      s: Math.floor(40 + Math.random() * 60),
      v: Math.floor(60 + Math.random() * 40),
      a: 1,
    })
  }

  // Parse direct user input
  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCustomInput(val)
    const parsed = parseHexToRgb(val)
    if (parsed) {
      setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b, parsed.a))
      setInputError(false)
    } else {
      setInputError(true)
    }
  }

  // 2D Saturation / Value Canvas interaction (Canva style)
  const satValRef = React.useRef<HTMLDivElement>(null)
  const isDraggingSatVal = React.useRef(false)

  const updateSatValFromEvent = React.useCallback(
    (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
      if (!satValRef.current) return
      const rect = satValRef.current.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top))

      const s = Math.round((x / rect.width) * 100)
      const v = Math.round((1 - y / rect.height) * 100)

      setHsv((prev) => ({ ...prev, s, v }))
    },
    []
  )

  const handleSatValMouseDown = (e: React.MouseEvent) => {
    isDraggingSatVal.current = true
    updateSatValFromEvent(e)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingSatVal.current) {
        updateSatValFromEvent(moveEvent)
      }
    }

    const handleMouseUp = () => {
      isDraggingSatVal.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleSatValTouchStart = (e: React.TouchEvent) => {
    isDraggingSatVal.current = true
    updateSatValFromEvent(e)

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (isDraggingSatVal.current) {
        updateSatValFromEvent(moveEvent)
      }
    }

    const handleTouchEnd = () => {
      isDraggingSatVal.current = false
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }

    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)
  }

  // Calculate pure hue color for the 2D background
  const pureHueRgb = React.useMemo(() => hsvToRgb(hsv.h, 100, 100), [hsv.h])
  const pureHueHex = rgbToHex(pureHueRgb.r, pureHueRgb.g, pureHueRgb.b)

  // Contrast scores
  const contrastOnWhite = getContrast(rgb, true)
  const contrastOnBlack = getContrast(rgb, false)

  // WCAG Compliance evaluation
  const wcagAaNormal = contrastOnWhite >= 4.5 || contrastOnBlack >= 4.5
  const wcagAaLarge = contrastOnWhite >= 3.0 || contrastOnBlack >= 3.0
  const wcagAaaNormal = contrastOnWhite >= 7.0 || contrastOnBlack >= 7.0

  // Generated Shades, Tints & Tones
  const harmonyTints = React.useMemo(() => {
    const tints: string[] = []
    for (let factor = 0.15; factor <= 0.95; factor += 0.16) {
      const tintRgb = hsvToRgb(hsv.h, Math.round(hsv.s * factor), Math.round(hsv.v + (100 - hsv.v) * (1 - factor)))
      tints.push(rgbToHex(tintRgb.r, tintRgb.g, tintRgb.b))
    }
    return tints
  }, [hsv.h, hsv.s, hsv.v])

  const harmonyShades = React.useMemo(() => {
    const shades: string[] = []
    for (let factor = 0.9; factor >= 0.15; factor -= 0.15) {
      const shadeRgb = hsvToRgb(hsv.h, hsv.s, Math.round(hsv.v * factor))
      shades.push(rgbToHex(shadeRgb.r, shadeRgb.g, shadeRgb.b))
    }
    return shades
  }, [hsv.h, hsv.s, hsv.v])

  // Color Harmonies: Complementary, Triadic, Analogous, Split
  const harmonies = React.useMemo(() => {
    const getHex = (hueShift: number) => {
      const newH = (hsv.h + hueShift + 360) % 360
      const c = hsvToRgb(newH, hsv.s, hsv.v)
      return rgbToHex(c.r, c.g, c.b)
    }

    return {
      complementary: [hex, getHex(180)],
      analogous: [getHex(-30), hex, getHex(30)],
      triadic: [hex, getHex(120), getHex(240)],
      splitComp: [hex, getHex(150), getHex(210)],
      tetradic: [hex, getHex(90), getHex(180), getHex(270)],
    }
  }, [hsv.h, hsv.s, hsv.v, hex])

  // Color codes object for formatting
  const colorCodes = [
    {
      id: 'hex',
      label: 'HEX',
      value: hex,
      cssFormat: hex,
      badge: 'Web Standard',
    },
    {
      id: 'hexa',
      label: 'HEXA',
      value: hexWithAlpha,
      cssFormat: hexWithAlpha,
      badge: hsv.a < 1 ? 'Alpha' : undefined,
    },
    {
      id: 'rgb',
      label: 'RGB',
      value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      cssFormat: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    },
    {
      id: 'rgba',
      label: 'RGBA',
      value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${hsv.a})`,
      cssFormat: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${hsv.a})`,
    },
    {
      id: 'hsl',
      label: 'HSL',
      value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      cssFormat: `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`,
    },
    {
      id: 'hsla',
      label: 'HSLA',
      value: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsv.a})`,
      cssFormat: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsv.a})`,
    },
    {
      id: 'hsv',
      label: 'HSV / HSB',
      value: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
      cssFormat: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
    },
    {
      id: 'cmyk',
      label: 'CMYK',
      value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
      cssFormat: `device-cmyk(${cmyk.c / 100} ${cmyk.m / 100} ${cmyk.y / 100} ${cmyk.k / 100})`,
    },
    {
      id: 'oklch',
      label: 'OKLCH',
      value: oklch,
      cssFormat: oklch,
      badge: 'Modern CSS',
    },
    {
      id: 'css-var',
      label: 'CSS Var',
      value: `--color-primary: ${hexWithAlpha};`,
      cssFormat: `--color-primary: ${hexWithAlpha};`,
    },
    {
      id: 'tailwind',
      label: 'Tailwind',
      value: `bg-${tailwindName}`,
      cssFormat: `bg-${tailwindName}`,
      badge: 'Utility',
    },
  ]

  const applyColorFromHex = (targetHex: string) => {
    const parsed = parseHexToRgb(targetHex)
    if (parsed) {
      setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b, parsed.a))
    }
  }

  // --- Image Palette Extractor (Canva Feature) ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsExtracting(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          // Downsample image for speedy pixel processing
          const width = Math.min(100, img.width)
          const height = Math.min(100, img.height)
          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)

          const imageData = ctx.getImageData(0, 0, width, height).data
          const colorBuckets: Record<string, number> = {}

          // Sample pixels in steps
          for (let i = 0; i < imageData.length; i += 16) {
            const r = imageData[i]
            const g = imageData[i + 1]
            const b = imageData[i + 2]
            const a = imageData[i + 3]
            if (a < 128) continue

            // Quantize to reduce space (step of 24)
            const qr = Math.round(r / 24) * 24
            const qg = Math.round(g / 24) * 24
            const qb = Math.round(b / 24) * 24
            const hexKey = rgbToHex(qr, qg, qb)
            colorBuckets[hexKey] = (colorBuckets[hexKey] || 0) + 1
          }

          // Sort by frequency and pick top 8 distinct colors
          const sorted = Object.entries(colorBuckets)
            .sort((a, b) => b[1] - a[1])
            .map(([hexVal]) => hexVal)
            .slice(0, 8)

          if (sorted.length > 0) {
            setExtractedPalette(sorted)
            applyColorFromHex(sorted[0])
          }
        } catch {
          // ignore
        } finally {
          setIsExtracting(false)
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Export palette formatted as CSS or Tailwind
  const exportCss = React.useMemo(() => {
    return `:root {\n  --color-primary: ${hex};\n  --color-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};\n  --color-hsl: ${hsl.h} ${hsl.s}% ${hsl.l}%;\n  --color-oklch: ${oklch};\n}`
  }, [hex, rgb, hsl, oklch])

  const exportTailwind = React.useMemo(() => {
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        brand: '${hex}',\n      }\n    }\n  }\n}`
  }, [hex])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* 1. Main Color Studio Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs glass-card">
        {/* Subtle dynamic glow from selected color */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-20 blur-3xl transition-colors duration-300"
          style={{ backgroundColor: hex }}
        />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Top Bar with Tools & Eyedropper */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-10 w-10 place-items-center rounded-xl shadow-xs transition-colors duration-200 ring-1 ring-border"
                style={{ backgroundColor: hex }}
              >
                <Palette
                  className="h-5 w-5"
                  style={{ color: contrastOnWhite > 4.5 ? '#ffffff' : '#000000' }}
                />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">
                    HTML Color Picker Studio
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-mono border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10">
                    Canva-Style Pro
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Interactive 2D picker, eyedropper, live codes, harmonies & contrast analyzer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEyeDropper}
                className="h-8 gap-1.5 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs hover:border-primary"
                title="Sample any pixel from your screen"
              >
                <Pipette className="h-3.5 w-3.5 text-primary" />
                <span>EyeDropper</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomColor}
                className="h-8 gap-1.5 rounded-xl text-xs font-medium cursor-pointer shadow-2xs"
                title="Generate random vibrant color"
              >
                <Shuffle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Random</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setHsv({ h: 239, s: 59, v: 95, a: 1 })}
                className="h-8 gap-1.5 rounded-xl text-xs font-medium cursor-pointer shadow-2xs"
                title="Reset to default brand indigo"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/40 p-1 w-fit">
            <button
              onClick={() => setActiveTab('picker')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                activeTab === 'picker'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Studio Picker</span>
            </button>
            <button
              onClick={() => setActiveTab('image-extract')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                activeTab === 'image-extract'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Extract from Image</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                activeTab === 'export'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Export Code</span>
            </button>
          </div>

          {/* TAB 1: STUDIO PICKER */}
          {activeTab === 'picker' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* LEFT 7 COLS: The Visual Canva Picker (2D Area + Sliders + Channel Inputs) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Canva 2D Saturation/Value Board */}
                <div
                  ref={satValRef}
                  onMouseDown={handleSatValMouseDown}
                  onTouchStart={handleSatValTouchStart}
                  className="relative h-60 sm:h-72 w-full select-none rounded-2xl cursor-crosshair overflow-hidden shadow-inner border border-border/80"
                  style={{
                    backgroundColor: pureHueHex,
                    backgroundImage: `
                      linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0) 100%),
                      linear-gradient(to top, #000000 0%, rgba(0,0,0,0) 100%)
                    `,
                  }}
                >
                  {/* Pointer thumb */}
                  <div
                    className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/40 transition-transform duration-75"
                    style={{
                      left: `${hsv.s}%`,
                      top: `${100 - hsv.v}%`,
                      backgroundColor: hex,
                    }}
                  />
                </div>

                {/* Slider 1: Hue Rainbow Strip */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Hue: {hsv.h}°</span>
                    <span className="font-mono text-[11px]">{hsv.h}° / 360°</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={hsv.h}
                      onChange={(e) =>
                        setHsv((prev) => ({ ...prev, h: Number(e.target.value) }))
                      }
                      className="h-5 w-full cursor-pointer appearance-none rounded-full border border-border/60 focus:outline-hidden"
                      style={{
                        background:
                          'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                      }}
                    />
                  </div>
                </div>

                {/* Slider 2: Opacity / Alpha Strip with checkerboard */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Opacity: {Math.round(hsv.a * 100)}%</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Alpha: {hsv.a}
                    </span>
                  </div>
                  <div
                    className="relative flex items-center rounded-full overflow-hidden border border-border/60"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #ccc 25%, transparent 25%),
                        linear-gradient(-45deg, #ccc 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #ccc 75%),
                        linear-gradient(-45deg, transparent 75%, #ccc 75%)
                      `,
                      backgroundSize: '10px 10px',
                      backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                    }}
                  >
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(hsv.a * 100)}
                      onChange={(e) =>
                        setHsv((prev) => ({
                          ...prev,
                          a: Math.round(Number(e.target.value)) / 100,
                        }))
                      }
                      className="h-5 w-full cursor-pointer appearance-none rounded-full focus:outline-hidden"
                      style={{
                        background: `linear-gradient(to right, transparent, ${hex})`,
                      }}
                    />
                  </div>
                </div>

                {/* Precision Channel Inputs (RGB & HSL) */}
                <div className="grid grid-cols-3 gap-2 pt-1 sm:grid-cols-6 text-xs">
                  <div className="rounded-xl border border-border/70 bg-secondary/30 p-1.5 text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground">R</span>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={rgb.r}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(255, Number(e.target.value) || 0))
                        setHsv(rgbToHsv(val, rgb.g, rgb.b, hsv.a))
                      }}
                      className="w-full bg-transparent text-center font-mono font-bold text-foreground focus:outline-hidden"
                    />
                  </div>

                  <div className="rounded-xl border border-border/70 bg-secondary/30 p-1.5 text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground">G</span>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={rgb.g}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(255, Number(e.target.value) || 0))
                        setHsv(rgbToHsv(rgb.r, val, rgb.b, hsv.a))
                      }}
                      className="w-full bg-transparent text-center font-mono font-bold text-foreground focus:outline-hidden"
                    />
                  </div>

                  <div className="rounded-xl border border-border/70 bg-secondary/30 p-1.5 text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground">B</span>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={rgb.b}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(255, Number(e.target.value) || 0))
                        setHsv(rgbToHsv(rgb.r, rgb.g, val, hsv.a))
                      }}
                      className="w-full bg-transparent text-center font-mono font-bold text-foreground focus:outline-hidden"
                    />
                  </div>

                  <div className="rounded-xl border border-border/70 bg-secondary/30 p-1.5 text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground">H°</span>
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={hsv.h}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(360, Number(e.target.value) || 0))
                        setHsv((prev) => ({ ...prev, h: val }))
                      }}
                      className="w-full bg-transparent text-center font-mono font-bold text-foreground focus:outline-hidden"
                    />
                  </div>

                  <div className="rounded-xl border border-border/70 bg-secondary/30 p-1.5 text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground">S%</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={hsv.s}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                        setHsv((prev) => ({ ...prev, s: val }))
                      }}
                      className="w-full bg-transparent text-center font-mono font-bold text-foreground focus:outline-hidden"
                    />
                  </div>

                  <div className="rounded-xl border border-border/70 bg-secondary/30 p-1.5 text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground">L%</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={hsl.l}
                      disabled
                      className="w-full bg-transparent text-center font-mono font-bold text-foreground focus:outline-hidden opacity-80 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Direct Hex Input + Save Button */}
                <div className="mt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={customInput}
                      onChange={handleCustomInputChange}
                      placeholder="#6366F1"
                      className={cn(
                        'h-10 w-full rounded-xl border bg-background px-3.5 font-mono text-sm font-semibold uppercase tracking-wider focus:outline-hidden focus:ring-2',
                        inputError
                          ? 'border-destructive focus:ring-destructive'
                          : 'border-border focus:ring-primary'
                      )}
                    />
                    <span
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border border-border shadow-xs"
                      style={{ backgroundColor: hexWithAlpha }}
                    />
                  </div>

                  <Button
                    variant="secondary"
                    onClick={saveCurrentColor}
                    className="h-10 gap-1.5 rounded-xl px-4 text-xs font-semibold shadow-2xs cursor-pointer active-push"
                    title="Save to document palette"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Save Color</span>
                  </Button>
                </div>
              </div>

              {/* RIGHT 5 COLS: Live Swatch, Contrast & All Formats with Copy */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Big Preview Swatch Card */}
                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs glass-card space-y-3">
                  <div
                    className="relative flex h-24 w-full items-center justify-center rounded-xl border border-border/60 shadow-inner overflow-hidden"
                    style={{
                      backgroundColor: hexWithAlpha,
                    }}
                  >
                    {/* Subtle checkerboard behind transparent alpha */}
                    <div
                      className="absolute inset-0 -z-10 opacity-30"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #999 25%, transparent 25%),
                          linear-gradient(-45deg, #999 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #999 75%),
                          linear-gradient(-45deg, transparent 75%, #999 75%)
                        `,
                        backgroundSize: '12px 12px',
                      }}
                    />
                    <span
                      className="font-mono text-xl font-bold tracking-wider drop-shadow-sm select-all"
                      style={{
                        color: contrastOnWhite > 4.5 ? '#ffffff' : '#000000',
                      }}
                    >
                      {hexWithAlpha}
                    </span>
                  </div>

                  {/* WCAG Contrast Ratio Checker */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-white border border-border" />
                        White:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold">
                          {contrastOnWhite.toFixed(1)}:1
                        </span>
                        {contrastOnWhite >= 4.5 ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-black border border-border" />
                        Black:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold">
                          {contrastOnBlack.toFixed(1)}:1
                        </span>
                        {contrastOnBlack >= 4.5 ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Color Codes with COPY BUTTONS */}
                <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-2xs glass-card space-y-1.5 max-h-[340px] overflow-y-auto scrollbar-thin">
                  <div className="px-2 py-1 flex items-center justify-between border-b border-border/40 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Formats & Color Codes
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const allCodes = colorCodes
                          .map((c) => `${c.label}: ${c.value}`)
                          .join('\n')
                        copyValue(allCodes, 'all')
                      }}
                      className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      {copiedFormat === 'all' ? 'Copied All!' : 'Copy All'}
                    </button>
                  </div>

                  {colorCodes.map((code) => {
                    const isCopied = copiedFormat === code.id
                    return (
                      <div
                        key={code.id}
                        className="group flex items-center justify-between gap-2 rounded-xl border border-transparent px-2.5 py-1.5 hover:border-border/70 hover:bg-secondary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-14 shrink-0 text-[11px] font-semibold text-muted-foreground">
                            {code.label}
                          </span>
                          <span className="font-mono text-xs text-foreground font-medium truncate">
                            {code.value}
                          </span>
                          {code.badge && (
                            <span className="hidden sm:inline-flex rounded-full bg-secondary px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground">
                              {code.badge}
                            </span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant={isCopied ? 'default' : 'secondary'}
                          onClick={() => copyValue(code.value, code.id)}
                          className="h-7 shrink-0 gap-1 rounded-lg px-2 text-[11px] font-medium shadow-2xs cursor-pointer active-push"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXTRACT PALETTE FROM IMAGE */}
          {activeTab === 'image-extract' && (
            <div className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-6 glass-card">
              <div className="text-center max-w-md mx-auto space-y-2">
                <ImageIcon className="h-8 w-8 mx-auto text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Canva-Style Image Palette Generator
                </h3>
                <p className="text-xs text-muted-foreground">
                  Upload or drop any image (photo, logo, banner) to automatically extract its dominant color palette.
                </p>
                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs cursor-pointer active-push">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {isExtracting && (
                <p className="text-center text-xs text-muted-foreground animate-pulse">
                  Analyzing pixels and extracting color palette…
                </p>
              )}

              {extractedPalette.length > 0 && (
                <div className="pt-4 border-t border-border/60 space-y-3">
                  <span className="text-xs font-semibold text-foreground">
                    Extracted Palette (Click to load into picker):
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                    {extractedPalette.map((color, i) => (
                      <button
                        key={`${color}-${i}`}
                        type="button"
                        onClick={() => {
                          applyColorFromHex(color)
                          setActiveTab('picker')
                        }}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border/80 bg-card hover:border-primary transition-all cursor-pointer shadow-2xs group"
                      >
                        <span
                          className="h-10 w-full rounded-lg shadow-inner group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                          {color}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPORT CODE */}
          {activeTab === 'export' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2 glass-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    CSS Variables (:root)
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyValue(exportCss, 'css-exp')}
                    className="h-7 text-xs"
                  >
                    {copiedFormat === 'css-exp' ? 'Copied!' : 'Copy CSS'}
                  </Button>
                </div>
                <pre className="p-3 rounded-xl bg-background border border-border font-mono text-xs overflow-x-auto text-muted-foreground">
                  {exportCss}
                </pre>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2 glass-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Tailwind CSS Config
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyValue(exportTailwind, 'tw-exp')}
                    className="h-7 text-xs"
                  >
                    {copiedFormat === 'tw-exp' ? 'Copied!' : 'Copy Tailwind'}
                  </Button>
                </div>
                <pre className="p-3 rounded-xl bg-background border border-border font-mono text-xs overflow-x-auto text-muted-foreground">
                  {exportTailwind}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Canva-Style Saved & Document Colors */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs glass-card space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">
              Document & Saved Colors
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              ({savedColors.length})
            </span>
          </div>

          {savedColors.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSavedColors([])
                localStorage.removeItem('toolforge_saved_colors')
              }}
              className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              Clear saved
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add color button */}
          <button
            type="button"
            onClick={saveCurrentColor}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-dashed border-border/80 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
            title="Save current color"
          >
            <Plus className="h-4 w-4" />
          </button>

          {savedColors.map((savedColor, i) => (
            <div
              key={`${savedColor}-${i}`}
              className="group relative flex items-center"
            >
              <button
                type="button"
                onClick={() => applyColorFromHex(savedColor)}
                className={cn(
                  'h-9 w-9 rounded-xl border border-black/10 dark:border-white/10 shadow-xs transition-transform hover:scale-110 active-push cursor-pointer',
                  hex === savedColor && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                )}
                style={{ backgroundColor: savedColor }}
                title={`Select ${savedColor}`}
              />
              <button
                type="button"
                onClick={(e) => removeSavedColor(savedColor, e)}
                className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-xs cursor-pointer"
                title="Remove"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Color Harmonies (Adobe Color / Canva Style) */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs glass-card space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Color Harmonies & Pairings
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Click any harmony swatch to select
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Complementary */}
          <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3.5 space-y-2">
            <span className="text-xs font-semibold text-foreground">Complementary (180°)</span>
            <div className="flex items-center gap-1.5">
              {harmonies.complementary.map((c, idx) => (
                <button
                  key={`comp-${idx}`}
                  type="button"
                  onClick={() => applyColorFromHex(c)}
                  className="h-10 flex-1 rounded-xl shadow-xs transition-transform hover:scale-105 active-push cursor-pointer"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Analogous */}
          <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3.5 space-y-2">
            <span className="text-xs font-semibold text-foreground">Analogous (±30°)</span>
            <div className="flex items-center gap-1.5">
              {harmonies.analogous.map((c, idx) => (
                <button
                  key={`analog-${idx}`}
                  type="button"
                  onClick={() => applyColorFromHex(c)}
                  className="h-10 flex-1 rounded-xl shadow-xs transition-transform hover:scale-105 active-push cursor-pointer"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Triadic */}
          <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3.5 space-y-2">
            <span className="text-xs font-semibold text-foreground">Triadic (120°)</span>
            <div className="flex items-center gap-1.5">
              {harmonies.triadic.map((c, idx) => (
                <button
                  key={`triad-${idx}`}
                  type="button"
                  onClick={() => applyColorFromHex(c)}
                  className="h-10 flex-1 rounded-xl shadow-xs transition-transform hover:scale-105 active-push cursor-pointer"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Tetradic */}
          <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3.5 space-y-2">
            <span className="text-xs font-semibold text-foreground">Tetradic (90°)</span>
            <div className="flex items-center gap-1.5">
              {harmonies.tetradic.map((c, idx) => (
                <button
                  key={`tetrad-${idx}`}
                  type="button"
                  onClick={() => applyColorFromHex(c)}
                  className="h-10 flex-1 rounded-xl shadow-xs transition-transform hover:scale-105 active-push cursor-pointer"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tints & Shades Scale */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs glass-card space-y-4">
        <div className="border-b border-border/60 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            Dynamic Tints & Shades Scale
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            Derived from {hex}
          </span>
        </div>

        <div className="space-y-3">
          {/* Lighter Tints */}
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              Lighter Tints (+White)
            </span>
            <div className="grid grid-cols-6 gap-2">
              {harmonyTints.map((tint, idx) => (
                <button
                  key={`tint-${idx}`}
                  type="button"
                  onClick={() => applyColorFromHex(tint)}
                  className="flex flex-col items-center gap-1 rounded-xl p-1.5 border border-border/60 hover:border-primary transition-colors cursor-pointer"
                >
                  <span
                    className="h-7 w-full rounded-lg shadow-inner"
                    style={{ backgroundColor: tint }}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {tint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Darker Shades */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-muted-foreground font-medium">
              Darker Shades (+Black)
            </span>
            <div className="grid grid-cols-6 gap-2">
              {harmonyShades.map((shade, idx) => (
                <button
                  key={`shade-${idx}`}
                  type="button"
                  onClick={() => applyColorFromHex(shade)}
                  className="flex flex-col items-center gap-1 rounded-xl p-1.5 border border-border/60 hover:border-primary transition-colors cursor-pointer"
                >
                  <span
                    className="h-7 w-full rounded-lg shadow-inner"
                    style={{ backgroundColor: shade }}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {shade}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Curated Canva Color Palettes */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs glass-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Sliders className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Curated Trending Palettes
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(PRESET_PALETTES).map(([key, palette]) => (
            <div
              key={key}
              className="rounded-2xl border border-border/70 bg-secondary/30 p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span>{palette.name}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {palette.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => applyColorFromHex(c)}
                    className={cn(
                      'h-7 w-7 rounded-lg border border-black/10 dark:border-white/10 transition-transform hover:scale-115 active-push cursor-pointer shadow-2xs',
                      hex.toUpperCase() === c.toUpperCase() &&
                        'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110'
                    )}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Live UI Component Mockup Preview */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs glass-card space-y-4">
        <div className="border-b border-border/60 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Live UI Preview
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            See how your color looks on actual interface elements
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Button Mockup */}
          <div className="rounded-2xl border border-border/60 p-4 flex flex-col items-center justify-center gap-2 bg-secondary/20">
            <span className="text-xs text-muted-foreground">Primary Button</span>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-transform active:scale-95 cursor-pointer"
              style={{
                backgroundColor: hex,
                color: contrastOnWhite > 4.5 ? '#ffffff' : '#000000',
              }}
            >
              Click Action
            </button>
          </div>

          {/* Badge & Chip Mockup */}
          <div className="rounded-2xl border border-border/60 p-4 flex flex-col items-center justify-center gap-2 bg-secondary/20">
            <span className="text-xs text-muted-foreground">Pill & Badge</span>
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${hex}25`,
                  color: hex,
                }}
              >
                Active Tag
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                style={{
                  borderColor: hex,
                  color: hex,
                }}
              >
                Outline
              </span>
            </div>
          </div>

          {/* Card Border / Glow Mockup */}
          <div
            className="rounded-2xl border-2 p-4 flex flex-col justify-center bg-card shadow-md transition-colors"
            style={{
              borderColor: hex,
            }}
          >
            <span className="text-xs font-bold" style={{ color: hex }}>
              Active Card
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Styled with your selected color accents.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
