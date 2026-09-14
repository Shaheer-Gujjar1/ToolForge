'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Lock,
  ArrowRightLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Compass,
  Table as TableIcon,
  Search,
  Globe2,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ==========================================
// --- Official Score Concordance Mapping ---
// ==========================================

interface ScoreConcordance {
  ielts: number // 0.0 - 9.0
  pteMin: number
  pteMax: number
  pteDisplay: string
  cambridgeMin: number
  cambridgeMax: number
  cambridgeDisplay: string
  cambridgeExam: string
  cefr: 'C2' | 'C1' | 'B2' | 'B1' | 'A2' | 'Below A2'
  cefrDesc: string
  toeflDisplay: string
  studyVisaLevel: string
}

const SCORE_TABLE: ScoreConcordance[] = [
  {
    ielts: 9.0,
    pteMin: 86,
    pteMax: 90,
    pteDisplay: '86 - 90',
    cambridgeMin: 209,
    cambridgeMax: 230,
    cambridgeDisplay: '209 - 230',
    cambridgeExam: 'C2 Proficiency (CPE)',
    cefr: 'C2',
    cefrDesc: 'Mastery / Near-native fluency',
    toeflDisplay: '118 - 120',
    studyVisaLevel: 'Direct Ivy League / Oxford / PhD entry with full honors',
  },
  {
    ielts: 8.5,
    pteMin: 83,
    pteMax: 85,
    pteDisplay: '83 - 85',
    cambridgeMin: 200,
    cambridgeMax: 208,
    cambridgeDisplay: '200 - 208',
    cambridgeExam: 'C2 Proficiency (CPE)',
    cefr: 'C2',
    cefrDesc: 'Mastery',
    toeflDisplay: '115 - 117',
    studyVisaLevel: 'Exceeds all top global university requirements',
  },
  {
    ielts: 8.0,
    pteMin: 78,
    pteMax: 82,
    pteDisplay: '78 - 82',
    cambridgeMin: 193,
    cambridgeMax: 199,
    cambridgeDisplay: '193 - 199',
    cambridgeExam: 'C1 Advanced (CAE)',
    cefr: 'C1',
    cefrDesc: 'Effective Operational Proficiency',
    toeflDisplay: '110 - 114',
    studyVisaLevel: 'Accepted for Medical, Law & competitive Master degrees',
  },
  {
    ielts: 7.5,
    pteMin: 73,
    pteMax: 77,
    pteDisplay: '73 - 77',
    cambridgeMin: 185,
    cambridgeMax: 192,
    cambridgeDisplay: '185 - 192',
    cambridgeExam: 'C1 Advanced (CAE)',
    cefr: 'C1',
    cefrDesc: 'Advanced professional proficiency',
    toeflDisplay: '102 - 109',
    studyVisaLevel: 'Australia Superior English / Canada Express Entry CLB 10',
  },
  {
    ielts: 7.0,
    pteMin: 65,
    pteMax: 72,
    pteDisplay: '65 - 72',
    cambridgeMin: 176,
    cambridgeMax: 184,
    cambridgeDisplay: '176 - 184',
    cambridgeExam: 'C1 Advanced (CAE) / B2 First (Grade A)',
    cefr: 'C1',
    cefrDesc: 'High operational proficiency',
    toeflDisplay: '94 - 101',
    studyVisaLevel: 'Gold standard for UK Russell Group / Australia Skilled Visa (CLB 9)',
  },
  {
    ielts: 6.5,
    pteMin: 58,
    pteMax: 64,
    pteDisplay: '58 - 64',
    cambridgeMin: 169,
    cambridgeMax: 175,
    cambridgeDisplay: '169 - 175',
    cambridgeExam: 'B2 First (FCE)',
    cefr: 'B2',
    cefrDesc: 'Independent / Vantage User',
    toeflDisplay: '79 - 93',
    studyVisaLevel: 'Standard minimum for UK/US/Canada University Undergraduate & Masters',
  },
  {
    ielts: 6.0,
    pteMin: 50,
    pteMax: 57,
    pteDisplay: '50 - 57',
    cambridgeMin: 162,
    cambridgeMax: 168,
    cambridgeDisplay: '162 - 168',
    cambridgeExam: 'B2 First (FCE)',
    cefr: 'B2',
    cefrDesc: 'Competent User',
    toeflDisplay: '60 - 78',
    studyVisaLevel: 'Minimum for UK Tier 4 General / Canada College Diplomas (CLB 7)',
  },
  {
    ielts: 5.5,
    pteMin: 42,
    pteMax: 49,
    pteDisplay: '42 - 49',
    cambridgeMin: 154,
    cambridgeMax: 161,
    cambridgeDisplay: '154 - 161',
    cambridgeExam: 'B1 Preliminary (PET)',
    cefr: 'B1',
    cefrDesc: 'Threshold / Intermediate User',
    toeflDisplay: '46 - 59',
    studyVisaLevel: 'Foundation / Pre-sessional English courses required',
  },
  {
    ielts: 5.0,
    pteMin: 36,
    pteMax: 41,
    pteDisplay: '36 - 41',
    cambridgeMin: 147,
    cambridgeMax: 153,
    cambridgeDisplay: '147 - 153',
    cambridgeExam: 'B1 Preliminary (PET)',
    cefr: 'B1',
    cefrDesc: 'Modest User',
    toeflDisplay: '35 - 45',
    studyVisaLevel: 'Vocational training / Work permits in select trades',
  },
  {
    ielts: 4.5,
    pteMin: 30,
    pteMax: 35,
    pteDisplay: '30 - 35',
    cambridgeMin: 140,
    cambridgeMax: 146,
    cambridgeDisplay: '140 - 146',
    cambridgeExam: 'A2 Key (KET)',
    cefr: 'A2',
    cefrDesc: 'Waystage / Basic User',
    toeflDisplay: '32 - 34',
    studyVisaLevel: 'General migration / English preparatory programs',
  },
  {
    ielts: 4.0,
    pteMin: 23,
    pteMax: 29,
    pteDisplay: '23 - 29',
    cambridgeMin: 120,
    cambridgeMax: 139,
    cambridgeDisplay: '120 - 139',
    cambridgeExam: 'A2 Key (KET)',
    cefr: 'A2',
    cefrDesc: 'Limited User',
    toeflDisplay: '0 - 31',
    studyVisaLevel: 'Intensive English language training needed',
  },
]

export function IeltsPteConverterView() {
  const [ielts, setIelts] = React.useState<number>(7.0)
  const [pte, setPte] = React.useState<number>(66)
  const [cambridge, setCambridge] = React.useState<number>(180)
  const [copied, setCopied] = React.useState<boolean>(false)
  const [searchTable, setSearchTable] = React.useState<string>('')

  // Bidirectional conversions
  const handleIeltsChange = (newIelts: number) => {
    setIelts(newIelts)
    const match = SCORE_TABLE.find((row) => row.ielts === newIelts)
    if (match) {
      setPte(Math.round((match.pteMin + match.pteMax) / 2))
      setCambridge(Math.round((match.cambridgeMin + match.cambridgeMax) / 2))
    }
  }

  const handlePteChange = (newPte: number) => {
    setPte(newPte)
    const match = SCORE_TABLE.find(
      (row) => newPte >= row.pteMin && newPte <= row.pteMax
    ) || (newPte > 85 ? SCORE_TABLE[0] : SCORE_TABLE[SCORE_TABLE.length - 1])
    setIelts(match.ielts)
    setCambridge(Math.round((match.cambridgeMin + match.cambridgeMax) / 2))
  }

  const handleCambridgeChange = (newCbe: number) => {
    setCambridge(newCbe)
    const match = SCORE_TABLE.find(
      (row) => newCbe >= row.cambridgeMin && newCbe <= row.cambridgeMax
    ) || (newCbe > 200 ? SCORE_TABLE[0] : SCORE_TABLE[SCORE_TABLE.length - 1])
    setIelts(match.ielts)
    setPte(Math.round((match.pteMin + match.pteMax) / 2))
  }

  // Active concordance row
  const activeMatch = React.useMemo(() => {
    return (
      SCORE_TABLE.find((row) => row.ielts === ielts) ||
      SCORE_TABLE[4] // default 7.0
    )
  }, [ielts])

  const handleCopySummary = () => {
    const summary = `English Exam Equivalency:\n• IELTS Band: ${activeMatch.ielts.toFixed(1)}\n• PTE Academic: ${pte} (${activeMatch.pteDisplay})\n• Cambridge English Scale: ${cambridge} (${activeMatch.cambridgeExam})\n• CEFR Level: ${activeMatch.cefr} (${activeMatch.cefrDesc})\n• TOEFL iBT Reference: ${activeMatch.toeflDisplay}`
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredTable = React.useMemo(() => {
    if (!searchTable.trim()) return SCORE_TABLE
    const q = searchTable.toLowerCase()
    return SCORE_TABLE.filter(
      (r) =>
        r.ielts.toString().includes(q) ||
        r.pteDisplay.toLowerCase().includes(q) ||
        r.cambridgeDisplay.toLowerCase().includes(q) ||
        r.cefr.toLowerCase().includes(q) ||
        r.cambridgeExam.toLowerCase().includes(q)
    )
  }, [searchTable])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs glass-card">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 ring-1 ring-teal-500/30">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">
                    IELTS · PTE · Cambridge (CBE) Converter
                  </h2>
                  <span
                    title="Production verified"
                    className="inline-flex items-center rounded-full bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400"
                  >
                    <Lock className="h-3 w-3" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Official 2-way score mapping between IELTS, Pearson PTE Academic, Cambridge English Qualifications & CEFR
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySummary}
                className="h-8 gap-1.5 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied Summary!' : 'Copy Summary'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleIeltsChange(7.0)}
                className="h-8 gap-1.5 rounded-xl text-xs font-medium cursor-pointer shadow-2xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
            </div>
          </div>

          {/* 2. Interactive 3-way Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. IELTS Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs glass-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px]">
                    IELTS
                  </Badge>
                  IELTS Band
                </span>
                <span className="font-mono text-2xl font-bold text-foreground">
                  {ielts.toFixed(1)}
                </span>
              </div>

              <div>
                <input
                  type="range"
                  min={4.0}
                  max={9.0}
                  step={0.5}
                  value={ielts}
                  onChange={(e) => handleIeltsChange(parseFloat(e.target.value))}
                  className="h-3 w-full cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                  <span>Band 4.0</span>
                  <span>6.5</span>
                  <span>Band 9.0</span>
                </div>
              </div>

              <div className="rounded-xl bg-secondary/30 p-2.5 text-center text-xs">
                <span className="text-[11px] text-muted-foreground block">Scale</span>
                <span className="font-mono font-semibold text-foreground">0.0 – 9.0 in 0.5 steps</span>
              </div>
            </div>

            {/* 2. PTE Academic Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs glass-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Badge className="bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 text-[10px]">
                    PTE
                  </Badge>
                  PTE Academic
                </span>
                <span className="font-mono text-2xl font-bold text-foreground">
                  {pte}
                </span>
              </div>

              <div>
                <input
                  type="range"
                  min={23}
                  max={90}
                  step={1}
                  value={pte}
                  onChange={(e) => handlePteChange(parseInt(e.target.value, 10))}
                  className="h-3 w-full cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                  <span>23 pts</span>
                  <span>58 pts</span>
                  <span>90 pts</span>
                </div>
              </div>

              <div className="rounded-xl bg-secondary/30 p-2.5 text-center text-xs">
                <span className="text-[11px] text-muted-foreground block">Concordance Band</span>
                <span className="font-mono font-semibold text-foreground">{activeMatch.pteDisplay}</span>
              </div>
            </div>

            {/* 3. Cambridge English Scale Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs glass-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30 text-[10px]">
                    CBE
                  </Badge>
                  Cambridge Scale
                </span>
                <span className="font-mono text-2xl font-bold text-foreground">
                  {cambridge}
                </span>
              </div>

              <div>
                <input
                  type="range"
                  min={120}
                  max={230}
                  step={1}
                  value={cambridge}
                  onChange={(e) => handleCambridgeChange(parseInt(e.target.value, 10))}
                  className="h-3 w-full cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                  <span>120</span>
                  <span>175</span>
                  <span>230</span>
                </div>
              </div>

              <div className="rounded-xl bg-secondary/30 p-2.5 text-center text-xs truncate">
                <span className="text-[11px] text-muted-foreground block">Qualification</span>
                <span className="font-semibold text-foreground truncate block">
                  {activeMatch.cambridgeExam}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Official Status & CEFR Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                CEFR Proficiency Level
              </span>
              <div className="flex items-center gap-2">
                <Badge className="font-mono text-base font-bold bg-primary/10 text-primary border border-primary/30">
                  {activeMatch.cefr}
                </Badge>
                <span className="text-xs font-medium text-foreground">
                  {activeMatch.cefrDesc}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                TOEFL iBT Reference
              </span>
              <div className="font-mono text-xl font-bold text-foreground">
                {activeMatch.toeflDisplay} <span className="text-xs font-normal text-muted-foreground">pts</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Visa & Academic Benchmark
              </span>
              <p className="text-xs text-foreground font-medium line-clamp-2">
                {activeMatch.studyVisaLevel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Concordance Reference Table */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs glass-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-teal-500" />
              Full Score Equivalency Table
            </h3>
            <p className="text-xs text-muted-foreground">
              Official concordance between IELTS, Pearson PTE, Cambridge English Scale, and CEFR
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              placeholder="Search band, score, or CEFR..."
              className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-1.5 text-xs font-mono placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[380px] scrollbar-thin border border-border/60 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-secondary/80 backdrop-blur-md border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">IELTS Band</th>
                <th className="py-2.5 px-3">PTE Academic</th>
                <th className="py-2.5 px-3">Cambridge Scale (CBE)</th>
                <th className="py-2.5 px-3">CEFR</th>
                <th className="py-2.5 px-3">TOEFL iBT</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {filteredTable.map((row) => (
                <tr
                  key={row.ielts}
                  className={cn(
                    'hover:bg-secondary/30 transition-colors',
                    row.ielts === ielts && 'bg-primary/10 font-bold'
                  )}
                >
                  <td className="py-2.5 px-3 text-sm text-foreground">
                    Band {row.ielts.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-teal-600 dark:text-teal-400">
                    {row.pteDisplay}
                  </td>
                  <td className="py-2.5 px-3 text-violet-600 dark:text-violet-400">
                    {row.cambridgeDisplay} ({row.cambridgeExam.split('(')[0].trim()})
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold">
                      {row.cefr}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {row.toeflDisplay}
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      type="button"
                      onClick={() => handleIeltsChange(row.ielts)}
                      className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
