'use client'

import * as React from 'react'
import {
  Copy,
  Check,
  Play,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowRightLeft,
  Sparkles,
  BookOpen,
  Download,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/* Morse Code Dictionary                                                      */
/* -------------------------------------------------------------------------- */

const MORSE_MAP: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
  ' ': '/',
}

const REVERSE_MORSE_MAP: Record<string, string> = Object.entries(MORSE_MAP).reduce(
  (acc, [char, code]) => {
    acc[code] = char
    return acc
  },
  {} as Record<string, string>
)

export function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map((char) => MORSE_MAP[char] || char)
    .join(' ')
}

export function morseToText(morse: string): string {
  return morse
    .trim()
    .split(' ')
    .map((code) => {
      if (code === '/' || code === '') return ' '
      return REVERSE_MORSE_MAP[code] || code
    })
    .join('')
    .replace(/\s+/g, ' ')
}

export function MorseCodeView() {
  const [textInput, setTextInput] = React.useState('Hello World SOS')
  const [morseInput, setMorseInput] = React.useState('.... . .-.. .-.. --- / .-- --- .-. .-.. -.. / ... --- ...')
  const [lastEdited, setLastEdited] = React.useState<'text' | 'morse'>('text')
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [wpm, setWpm] = React.useState(18) // Words per minute
  const [frequency, setFrequency] = React.useState(650) // Hz
  const [copiedText, setCopiedText] = React.useState(false)
  const [copiedMorse, setCopiedMorse] = React.useState(false)
  const [showCheatSheet, setShowCheatSheet] = React.useState(false)
  const [isLightActive, setIsLightActive] = React.useState(false)

  const audioCtxRef = React.useRef<AudioContext | null>(null)
  const playbackTimeoutRef = React.useRef<NodeJS.Timeout[]>([])

  // Live 2-way sync
  const handleTextChange = (val: string) => {
    setTextInput(val)
    setLastEdited('text')
    setMorseInput(textToMorse(val))
  }

  const handleMorseChange = (val: string) => {
    setMorseInput(val)
    setLastEdited('morse')
    setTextInput(morseToText(val))
  }

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(textInput)
    setCopiedText(true)
    toast.success('Text copied to clipboard!')
    setTimeout(() => setCopiedText(false), 2000)
  }

  const handleCopyMorse = async () => {
    await navigator.clipboard.writeText(morseInput)
    setCopiedMorse(true)
    toast.success('Morse code copied to clipboard!')
    setTimeout(() => setCopiedMorse(false), 2000)
  }

  const handleDownloadTxt = () => {
    const content = `ToolForge Morse Code Translation\n===============================\n\nPlain Text:\n${textInput}\n\nMorse Code:\n${morseInput}\n`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'morse-code-translation.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded translation as .txt')
  }

  // Audio Playback
  const stopAudio = React.useCallback(() => {
    playbackTimeoutRef.current.forEach(clearTimeout)
    playbackTimeoutRef.current = []
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    setIsPlaying(false)
    setIsLightActive(false)
  }, [])

  React.useEffect(() => {
    return () => stopAudio()
  }, [stopAudio])

  const playMorseAudio = async () => {
    stopAudio()
    if (!morseInput.trim()) return

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextClass()
    audioCtxRef.current = ctx
    setIsPlaying(true)

    // Standard Morse timing: dot = 1 unit, dash = 3 units, intra-char gap = 1 unit, char gap = 3 units, word gap = 7 units
    const dotDuration = 1.2 / wpm // seconds
    let currentTime = ctx.currentTime + 0.05

    const symbols = morseInput.split('')

    symbols.forEach((symbol, index) => {
      if (symbol === '.') {
        // Play dot
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(frequency, currentTime)

        gain.gain.setValueAtTime(0, currentTime)
        gain.gain.linearRampToValueAtTime(0.3, currentTime + 0.005)
        gain.gain.setValueAtTime(0.3, currentTime + dotDuration - 0.005)
        gain.gain.linearRampToValueAtTime(0, currentTime + dotDuration)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(currentTime)
        osc.stop(currentTime + dotDuration)

        // Visual flash trigger
        const t1 = setTimeout(() => setIsLightActive(true), (currentTime - ctx.currentTime) * 1000)
        const t2 = setTimeout(() => setIsLightActive(false), (currentTime - ctx.currentTime + dotDuration) * 1000)
        playbackTimeoutRef.current.push(t1, t2)

        currentTime += dotDuration * 2 // dot + 1 unit pause
      } else if (symbol === '-') {
        // Play dash
        const dashDuration = dotDuration * 3
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(frequency, currentTime)

        gain.gain.setValueAtTime(0, currentTime)
        gain.gain.linearRampToValueAtTime(0.3, currentTime + 0.005)
        gain.gain.setValueAtTime(0.3, currentTime + dashDuration - 0.005)
        gain.gain.linearRampToValueAtTime(0, currentTime + dashDuration)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(currentTime)
        osc.stop(currentTime + dashDuration)

        const t1 = setTimeout(() => setIsLightActive(true), (currentTime - ctx.currentTime) * 1000)
        const t2 = setTimeout(() => setIsLightActive(false), (currentTime - ctx.currentTime + dashDuration) * 1000)
        playbackTimeoutRef.current.push(t1, t2)

        currentTime += dotDuration * 4 // dash + 1 unit pause
      } else if (symbol === ' ') {
        currentTime += dotDuration * 3
      } else if (symbol === '/') {
        currentTime += dotDuration * 7
      }
    })

    const totalTimeMs = (currentTime - ctx.currentTime) * 1000
    const endTimeout = setTimeout(() => {
      setIsPlaying(false)
      setIsLightActive(false)
    }, totalTimeMs)
    playbackTimeoutRef.current.push(endTimeout)
  }

  const samplePhrases = [
    'SOS',
    'Hello World',
    'Stay safe and keep hacking',
    'Knowledge is power',
    'May the force be with you',
  ]

  return (
    <div className="space-y-6">
      {/* Top Controls & Audio Player HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 glass-card shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={isPlaying ? stopAudio : playMorseAudio}
            className={cn(
              'h-9 rounded-xl font-semibold gap-2 active-push cursor-pointer transition-all',
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 animate-pulse'
                : 'bg-primary text-primary-foreground shadow-2xs'
            )}
          >
            {isPlaying ? (
              <>
                <Square className="h-3.5 w-3.5 fill-white" />
                <span>Stop Beeping</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Play Sound</span>
              </>
            )}
          </Button>

          {/* Audio Flash Light indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/60 bg-secondary/40">
            <span
              className={cn(
                'h-3 w-3 rounded-full transition-all duration-75',
                isLightActive
                  ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] scale-125'
                  : 'bg-muted-foreground/30'
              )}
            />
            <span className="text-[11px] font-mono text-muted-foreground">Flasher</span>
          </div>
        </div>

        {/* Audio Tuning Sliders */}
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-mono text-muted-foreground whitespace-nowrap">
              Speed: <span className="font-semibold text-foreground">{wpm} WPM</span>
            </Label>
            <Slider
              value={[wpm]}
              min={5}
              max={35}
              step={1}
              onValueChange={(v) => setWpm(v[0])}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs font-mono text-muted-foreground whitespace-nowrap">
              Pitch: <span className="font-semibold text-foreground">{frequency} Hz</span>
            </Label>
            <Slider
              value={[frequency]}
              min={300}
              max={1000}
              step={50}
              onValueChange={(v) => setFrequency(v[0])}
              className="w-24"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCheatSheet((v) => !v)}
            className="h-8 rounded-xl px-3 text-xs gap-1.5 active-push cursor-pointer border-border/80"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{showCheatSheet ? 'Hide Key' : 'Morse Alphabet'}</span>
          </Button>
        </div>
      </div>

      {/* Preset Quick Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground mr-1">Quick Presets:</span>
        {samplePhrases.map((phrase) => (
          <button
            key={phrase}
            onClick={() => handleTextChange(phrase)}
            className="rounded-full px-3 py-1 text-xs font-mono font-medium border border-border/70 bg-card/70 hover:border-primary/40 hover:bg-secondary transition-all active-push cursor-pointer glass-card"
          >
            {phrase}
          </button>
        ))}
        <button
          onClick={() => {
            setTextInput('')
            setMorseInput('')
          }}
          className="rounded-full px-3 py-1 text-xs font-mono text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/60 transition-all ml-auto active-push cursor-pointer"
        >
          Clear all
        </button>
      </div>

      {/* 2-Way Interactive Translation Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* English / Plain Text Panel */}
        <div className="flex flex-col rounded-2xl border border-border/80 bg-card/80 p-5 glass-card shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary text-xs font-bold font-mono">
                EN
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
                Plain English / Text
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyText}
                className="h-7 px-2 text-xs gap-1 active-push cursor-pointer text-muted-foreground hover:text-foreground"
              >
                {copiedText ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copiedText ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>

          <textarea
            value={textInput}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Type normal text here..."
            className="min-h-[220px] w-full resize-y rounded-xl border border-border/60 bg-background/50 p-4 font-sans text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 leading-relaxed placeholder:text-muted-foreground/60"
          />

          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-1">
            <span>{textInput.length} characters · {textInput.trim() ? textInput.trim().split(/\s+/).length : 0} words</span>
            {lastEdited === 'text' && <span className="text-primary font-semibold">Active Input</span>}
          </div>
        </div>

        {/* Morse Code Panel */}
        <div className="flex flex-col rounded-2xl border border-border/80 bg-card/80 p-5 glass-card shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-amber-500/10 text-amber-500 text-xs font-bold font-mono">
                .-
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
                Morse Code Output / Input
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyMorse}
                className="h-7 px-2 text-xs gap-1 active-push cursor-pointer text-muted-foreground hover:text-foreground"
              >
                {copiedMorse ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copiedMorse ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>

          <textarea
            value={morseInput}
            onChange={(e) => handleMorseChange(e.target.value)}
            placeholder="Type morse dots (.) and dashes (-) here, / for word spaces..."
            className="min-h-[220px] w-full resize-y rounded-xl border border-border/60 bg-background/50 p-4 font-mono text-sm tracking-wider outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 leading-relaxed placeholder:text-muted-foreground/60"
          />

          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-1">
            <span>Letters separated by spaces · Words by &apos;/&apos;</span>
            {lastEdited === 'morse' && <span className="text-amber-500 font-semibold">Active Input</span>}
          </div>
        </div>
      </div>

      {/* Download Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-secondary/30 px-5 py-3.5 glass-card">
        <p className="text-xs text-muted-foreground font-mono">
          Translations process 100% locally in your browser with zero latency.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadTxt}
          className="h-8 rounded-xl px-3.5 text-xs gap-2 active-push cursor-pointer border-border/80"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Save Translation (.txt)</span>
        </Button>
      </div>

      {/* Morse Alphabet Drawer */}
      {showCheatSheet && (
        <div className="rounded-2xl border border-border/80 bg-card/90 p-5 glass-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>International Morse Code Reference Table</span>
            </h3>
            <span className="text-xs text-muted-foreground font-mono">ITU Standard</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
            {Object.entries(MORSE_MAP).map(([char, code]) => (
              <button
                key={char}
                onClick={() => handleTextChange(textInput + char)}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 px-2.5 py-1.5 text-xs font-mono hover:border-primary/50 hover:bg-card active-push transition-all cursor-pointer"
                title={`Append ${char}`}
              >
                <span className="font-bold text-foreground">{char === ' ' ? 'Space' : char}</span>
                <span className="text-muted-foreground text-[11px]">{code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
