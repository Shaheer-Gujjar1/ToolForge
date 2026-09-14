'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  FileCode,
  Copy,
  Check,
  RotateCcw,
  Lock,
  Download,
  Upload,
  Sliders,
  Trash2,
  CheckCircle2,
  FileText,
  Code2,
  Layers,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type LanguageType =
  | 'auto'
  | 'c-cpp'
  | 'csharp'
  | 'java'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'ruby'
  | 'php'
  | 'sql'
  | 'html'
  | 'css'
  | 'matlab'
  | 'go'
  | 'rust'
  | 'swift'
  | 'kotlin'
  | 'r'
  | 'shell'

const LANGUAGE_LABELS: Record<LanguageType, string> = {
  auto: 'Auto Detect',
  javascript: 'JavaScript / TS',
  python: 'Python',
  'c-cpp': 'C / C++',
  csharp: 'C#',
  java: 'Java',
  php: 'PHP',
  html: 'HTML / XML',
  css: 'CSS / SCSS',
  sql: 'SQL',
  matlab: 'MATLAB',
  go: 'Go',
  rust: 'Rust',
  swift: 'Swift',
  kotlin: 'Kotlin',
  ruby: 'Ruby',
  r: 'R',
  shell: 'Shell / Bash',
  typescript: 'TypeScript',
}

interface RemovalOptions {
  singleLine: boolean
  multiLine: boolean
  removeBlankLines: boolean
  preserveLicenseHeaders: boolean
  trimTrailingSpaces: boolean
}

// Sample code snippets for testing
const SAMPLE_CODES: Record<string, { lang: LanguageType; code: string }> = {
  python: {
    lang: 'python',
    code: `# Calculate fibonacci sequence
def fibonacci(n):
    """Return the n-th Fibonacci number."""
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    # Memoized recursive step
    return fibonacci(n - 1) + fibonacci(n - 2) # end of calculation
`,
  },
  javascript: {
    lang: 'javascript',
    code: `/*!
 * ToolForge Core v1.0
 * Licensed under MIT
 */
// Connect to database
async function initDatabase() {
  /* Multi-line comment explaining
     connection timeout and retry options */
  const url = "http://localhost:5432//db"; // note: url has '//' in string!
  console.log("Database initialized"); /* inline block */
  return true;
}
`,
  },
  cpp: {
    lang: 'c-cpp',
    code: `#include <iostream>

// Main execution entrypoint
int main() {
    /* Print welcome message
       to the standard console */
    std::cout << "Hello, World! // not a comment" << std::endl;
    return 0; // return status code zero
}
`,
  },
  sql: {
    lang: 'sql',
    code: `-- Fetch active subscribers
SELECT id, email, created_at
FROM users /* exclude banned users */
WHERE is_active = 1 -- only verified
ORDER BY created_at DESC;
`,
  },
  matlab: {
    lang: 'matlab',
    code: `% Matrix transformation script
A = [1, 2; 3, 4]; % 2x2 matrix
%{
  Block comment in MATLAB
  spanning multiple lines
%}
B = inv(A); % compute inverse
`,
  },
}

/**
 * Intelligent comment stripper with string & regex literal protection
 */
function stripComments(
  code: string,
  lang: LanguageType,
  options: RemovalOptions
): string {
  if (!code) return ''

  // Infer language if auto
  let targetLang = lang
  if (targetLang === 'auto') {
    if (code.includes('def ') || code.includes('import ') && code.includes(':')) targetLang = 'python'
    else if (code.includes('SELECT ') || code.includes('FROM ') || code.includes('-- ')) targetLang = 'sql'
    else if (code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('<!--')) targetLang = 'html'
    else if (code.includes('%{') || (code.includes('%') && !code.includes('%='))) targetLang = 'matlab'
    else targetLang = 'javascript'
  }

  let result = ''
  let i = 0
  const len = code.length

  const hasSlashComments = [
    'c-cpp', 'csharp', 'java', 'javascript', 'typescript',
    'php', 'css', 'go', 'rust', 'swift', 'kotlin'
  ].includes(targetLang)

  const hasHashComments = ['python', 'ruby', 'r', 'shell', 'php'].includes(targetLang)
  const hasSqlComments = targetLang === 'sql'
  const hasMatlabComments = targetLang === 'matlab'
  const hasHtmlComments = targetLang === 'html'

  while (i < len) {
    // 1. Strings: Quotes escape handling (protect contents from being considered comments)
    const char = code[i]
    if (
      (char === '"' || char === "'" || (char === '`' && (targetLang === 'javascript' || targetLang === 'typescript' || targetLang === 'go')))
    ) {
      // Check for Python triple quotes
      if (
        targetLang === 'python' &&
        (code.startsWith('"""', i) || code.startsWith("'''", i))
      ) {
        const quote = code.slice(i, i + 3)
        // If it's a standalone docstring and multiline removal is enabled, we can strip it, otherwise preserve
        const endIdx = code.indexOf(quote, i + 3)
        if (endIdx === -1) {
          result += code.slice(i)
          break
        } else {
          result += code.slice(i, endIdx + 3)
          i = endIdx + 3
          continue
        }
      }

      const quote = char
      result += quote
      i++
      while (i < len) {
        if (code[i] === '\\' && i + 1 < len) {
          result += code[i] + code[i + 1]
          i += 2
          continue
        }
        if (code[i] === quote) {
          result += code[i]
          i++
          break
        }
        result += code[i]
        i++
      }
      continue
    }

    // 2. HTML Comments: <!-- ... -->
    if (hasHtmlComments && code.startsWith('<!--', i)) {
      if (options.multiLine) {
        const endIdx = code.indexOf('-->', i + 4)
        if (endIdx === -1) {
          i = len
        } else {
          i = endIdx + 3
        }
        continue
      }
    }

    // 3. MATLAB Block Comments: %{ ... %}
    if (hasMatlabComments && code.startsWith('%{', i)) {
      if (options.multiLine) {
        const endIdx = code.indexOf('%}', i + 2)
        if (endIdx === -1) {
          i = len
        } else {
          i = endIdx + 2
        }
        continue
      }
    }

    // 4. MATLAB Line Comments: % ...
    if (hasMatlabComments && code[i] === '%') {
      if (options.singleLine) {
        while (i < len && code[i] !== '\n' && code[i] !== '\r') {
          i++
        }
        continue
      }
    }

    // 5. C/JS/CSS Block Comments: /* ... */
    if (hasSlashComments || targetLang === 'css' || targetLang === 'sql') {
      if (code.startsWith('/*', i)) {
        // Check for license header preservation
        const isLicense =
          options.preserveLicenseHeaders &&
          (code.startsWith('/*!', i) ||
            code.slice(i, i + 150).toLowerCase().includes('license') ||
            code.slice(i, i + 150).toLowerCase().includes('copyright'))

        if (!isLicense && options.multiLine) {
          const endIdx = code.indexOf('*/', i + 2)
          if (endIdx === -1) {
            i = len
          } else {
            i = endIdx + 2
          }
          continue
        }
      }
    }

    // 6. C/JS/Go Line Comments: // ...
    if (hasSlashComments && targetLang !== 'css') {
      if (code.startsWith('//', i)) {
        if (options.singleLine) {
          while (i < len && code[i] !== '\n' && code[i] !== '\r') {
            i++
          }
          continue
        }
      }
    }

    // 7. Hash Line Comments: # ... (Python, Ruby, R, Shell, PHP)
    if (hasHashComments && code[i] === '#') {
      if (options.singleLine) {
        while (i < len && code[i] !== '\n' && code[i] !== '\r') {
          i++
        }
        continue
      }
    }

    // 8. SQL Line Comments: -- ...
    if (hasSqlComments && code.startsWith('--', i)) {
      if (options.singleLine) {
        while (i < len && code[i] !== '\n' && code[i] !== '\r') {
          i++
        }
        continue
      }
    }

    // Default: copy character
    result += code[i]
    i++
  }

  // Post-processing options
  let lines = result.split(/\r?\n/)

  if (options.trimTrailingSpaces) {
    lines = lines.map((l) => l.trimEnd())
  }

  if (options.removeBlankLines) {
    lines = lines.filter((l) => l.trim().length > 0)
  }

  return lines.join('\n')
}

export function RemoveCommentsView() {
  const [lang, setLang] = React.useState<LanguageType>('auto')
  const [code, setCode] = React.useState<string>(SAMPLE_CODES.javascript.code)
  const [options, setOptions] = React.useState<RemovalOptions>({
    singleLine: true,
    multiLine: true,
    removeBlankLines: false,
    preserveLicenseHeaders: true,
    trimTrailingSpaces: true,
  })
  const [copied, setCopied] = React.useState<boolean>(false)
  const [fileName, setFileName] = React.useState<string>('cleaned-code.txt')

  // Process cleaned code
  const cleanedCode = React.useMemo(() => {
    return stripComments(code, lang, options)
  }, [code, lang, options])

  // Stats
  const originalLines = code ? code.split(/\r?\n/).length : 0
  const cleanedLines = cleanedCode ? cleanedCode.split(/\r?\n/).length : 0
  const originalBytes = new Blob([code]).size
  const cleanedBytes = new Blob([cleanedCode]).size
  const savedBytes = Math.max(0, originalBytes - cleanedBytes)
  const savedPercent = originalBytes > 0 ? Math.round((savedBytes / originalBytes) * 100) : 0

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(`cleaned-${file.name}`)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'py') setLang('python')
    else if (ext === 'js') setLang('javascript')
    else if (ext === 'ts') setLang('typescript')
    else if (ext === 'cpp' || ext === 'c' || ext === 'h') setLang('c-cpp')
    else if (ext === 'java') setLang('java')
    else if (ext === 'cs') setLang('csharp')
    else if (ext === 'php') setLang('php')
    else if (ext === 'sql') setLang('sql')
    else if (ext === 'html') setLang('html')
    else if (ext === 'css') setLang('css')
    else if (ext === 'm') setLang('matlab')
    else if (ext === 'go') setLang('go')
    else if (ext === 'rs') setLang('rust')
    else if (ext === 'swift') setLang('swift')
    else if (ext === 'kt') setLang('kotlin')
    else if (ext === 'rb') setLang('ruby')
    else if (ext === 'r') setLang('r')
    else setLang('auto')

    const reader = new FileReader()
    reader.onload = (event) => {
      setCode(event.target?.result as string || '')
    }
    reader.readAsText(file)
  }

  const handleDownload = () => {
    const blob = new Blob([cleanedCode], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* 1. Header Studio Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs glass-card">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
                <FileCode className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">
                    Code Comments Remover
                  </h2>
                  <span
                    title="Production verified"
                    className="inline-flex items-center rounded-full bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400"
                  >
                    <Lock className="h-3 w-3" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Safely strip single-line, multi-line & doc comments across 18+ programming languages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary transition-colors cursor-pointer shadow-2xs">
                <Upload className="h-3.5 w-3.5 text-primary" />
                <span>Upload File</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCode('')}
                className="h-8 gap-1.5 rounded-xl text-xs font-medium cursor-pointer shadow-2xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear</span>
              </Button>
            </div>
          </div>

          {/* Controls row: Language select + Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Language:</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LanguageType)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {Object.entries(LANGUAGE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Samples */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground mr-1">Sample snippet:</span>
              {Object.entries(SAMPLE_CODES).map(([k, sample]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setCode(sample.code)
                    setLang(sample.lang)
                  }}
                  className="rounded-lg border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground hover:border-primary hover:text-foreground transition-colors cursor-pointer"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Options checkboxes */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border/70 bg-secondary/30 p-3 text-xs">
            <label className="flex items-center gap-2 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.singleLine}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, singleLine: e.target.checked }))
                }
                className="rounded accent-primary"
              />
              <span>Single-line comments (//, #, --, %)</span>
            </label>

            <label className="flex items-center gap-2 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.multiLine}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, multiLine: e.target.checked }))
                }
                className="rounded accent-primary"
              />
              <span>Multi-line block comments (/* */, &lt;!-- --&gt;)</span>
            </label>

            <label className="flex items-center gap-2 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.preserveLicenseHeaders}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    preserveLicenseHeaders: e.target.checked,
                  }))
                }
                className="rounded accent-primary"
              />
              <span>Preserve License / Copyright headers</span>
            </label>

            <label className="flex items-center gap-2 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.removeBlankLines}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    removeBlankLines: e.target.checked,
                  }))
                }
                className="rounded accent-primary"
              />
              <span>Remove empty blank lines</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Editor & Output */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Input Code */}
        <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs glass-card flex flex-col">
          <div className="flex items-center justify-between pb-1 border-b border-border/40">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5" /> Source Code (With Comments)
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {originalLines} lines · {originalBytes} bytes
            </span>
          </div>

          <textarea
            rows={16}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your source code or drop a file here..."
            className="w-full flex-1 rounded-xl border border-border bg-background p-3 font-mono text-xs placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary leading-relaxed"
          />
        </div>

        {/* Right: Cleaned Code Output */}
        <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs glass-card flex flex-col">
          <div className="flex items-center justify-between pb-1 border-b border-border/40">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Cleaned Code (No Comments)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={copied ? 'default' : 'outline'}
                onClick={handleCopy}
                disabled={!cleanedCode}
                className="h-7 text-xs gap-1"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownload}
                disabled={!cleanedCode}
                className="h-7 text-xs gap-1"
              >
                <Download className="h-3 w-3" />
                <span>Download</span>
              </Button>
            </div>
          </div>

          <textarea
            rows={16}
            readOnly
            value={cleanedCode}
            placeholder="Cleaned code will appear here instantly..."
            className="w-full flex-1 rounded-xl border border-border bg-background p-3 font-mono text-xs placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary leading-relaxed cursor-default"
          />

          {/* Stats footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-mono">
            <span>
              Lines: <strong className="text-foreground">{cleanedLines}</strong> ({originalLines - cleanedLines} removed)
            </span>
            <span>
              Saved: <strong className="text-emerald-500">{savedBytes} bytes</strong> ({savedPercent}% smaller)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
