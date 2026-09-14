'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dices,
  Lock,
  HelpCircle,
  Flame,
  Shuffle,
  RotateCcw,
  Copy,
  Check,
  Plus,
  Users,
  Sparkles,
  PartyPopper,
  MessageCircle,
  Eye,
  Heart,
  Laugh,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type PromptCategory = 'juicy' | 'party' | 'embarrassing' | 'deep' | 'casual'
export type PromptType = 'truth' | 'dare'

export interface PromptItem {
  id: string
  type: PromptType
  category: PromptCategory
  text: string
}

// ==========================================
// --- Authentic, Realistic Human Library ---
// ==========================================
const DEFAULT_PROMPTS: PromptItem[] = [
  // --- TRUTHS: Juicy, Crushes & Dating ---
  { id: 't-j-1', type: 'truth', category: 'juicy', text: 'Who was your most recent crush, and did they ever suspect or find out?' },
  { id: 't-j-2', type: 'truth', category: 'juicy', text: "Have you ever stalked someone's profile from a burner account or your friend's phone?" },
  { id: 't-j-3', type: 'truth', category: 'juicy', text: 'What is the biggest red flag you completely ignored in someone just because you found them attractive?' },
  { id: 't-j-4', type: 'truth', category: 'juicy', text: 'Have you ever sent a risky text and immediately turned off your phone or threw it across the bed in panic?' },
  { id: 't-j-5', type: 'truth', category: 'juicy', text: 'What was the most awkward date or romantic encounter you have ever been on?' },
  { id: 't-j-6', type: 'truth', category: 'juicy', text: 'Have you ever ghosted someone you were talking to? What was the real, blunt reason?' },
  { id: 't-j-7', type: 'truth', category: 'juicy', text: 'If you were forced to kiss or go on a date with someone in this room, who would you choose?' },
  { id: 't-j-8', type: 'truth', category: 'juicy', text: 'What is the pettiest reason you lost interest in someone or stopped replying to their messages?' },
  { id: 't-j-9', type: 'truth', category: 'juicy', text: "Have you ever secretly read someone else's private messages when their phone was left unlocked?" },
  { id: 't-j-10', type: 'truth', category: 'juicy', text: "Have you ever had feelings for a close friend's ex, sibling, or mutual acquaintance?" },
  { id: 't-j-11', type: 'truth', category: 'juicy', text: 'What is the most desperate thing you have ever done just to get your crush to notice you?' },
  { id: 't-j-12', type: 'truth', category: 'juicy', text: 'If you could erase one person from your past dating or situationship history, who would it be?' },
  { id: 't-j-13', type: 'truth', category: 'juicy', text: 'Who was your absolute worst kiss, and what exactly went wrong?' },
  { id: 't-j-14', type: 'truth', category: 'juicy', text: 'Have you ever flirted with someone purely to get a favor, free food, or an easier way out?' },
  { id: 't-j-15', type: 'truth', category: 'juicy', text: 'Have you ever lied to get out of hanging out with someone, only to be seen doing something else?' },
  { id: 't-j-16', type: 'truth', category: 'juicy', text: 'What is a secret about your romantic life that your parents would be horrified to find out?' },

  // --- TRUTHS: Embarrassing, Fails & Secrets ---
  { id: 't-e-1', type: 'truth', category: 'embarrassing', text: 'What is the most humiliating thing your parents or roommates have ever walked in on you doing?' },
  { id: 't-e-2', type: 'truth', category: 'embarrassing', text: 'What was the cringiest phase you ever went through that you pray nobody has photographic proof of?' },
  { id: 't-e-3', type: 'truth', category: 'embarrassing', text: 'What is the biggest lie you ever told your parents or boss that they still believe to this day?' },
  { id: 't-e-4', type: 'truth', category: 'embarrassing', text: 'Have you ever clogged someone else’s toilet at a party or house visit? What did you do to handle it?' },
  { id: 't-e-5', type: 'truth', category: 'embarrassing', text: 'What is an embarrassing guilty-pleasure song or artist you secretly blast when nobody else is around?' },
  { id: 't-e-6', type: 'truth', category: 'embarrassing', text: 'What is the dumbest way you have ever physically injured yourself?' },
  { id: 't-e-7', type: 'truth', category: 'embarrassing', text: 'Have you ever blamed a bodily noise or weird smell on a pet or someone else in the room?' },
  { id: 't-e-8', type: 'truth', category: 'embarrassing', text: 'What is the most mortifying text or photo you accidentally sent to the wrong person or group chat?' },
  { id: 't-e-9', type: 'truth', category: 'embarrassing', text: 'What is the longest stretch of time you have ever gone without taking a shower or brushing your teeth?' },
  { id: 't-e-10', type: 'truth', category: 'embarrassing', text: 'Have you ever enthusiastically waved back at someone who was actually waving to the person behind you?' },
  { id: 't-e-11', type: 'truth', category: 'embarrassing', text: 'What is something you pretended to understand for years just so you wouldn’t look clueless?' },
  { id: 't-e-12', type: 'truth', category: 'embarrassing', text: 'Have you ever practiced kissing on your hand, a pillow, or the mirror?' },
  { id: 't-e-13', type: 'truth', category: 'embarrassing', text: 'What is the weirdest thing you do when you are home completely alone with the blinds shut?' },
  { id: 't-e-14', type: 'truth', category: 'embarrassing', text: 'What is the most ridiculous purchase you made that you refuse to admit was a total waste of money?' },

  // --- TRUTHS: Deep, Raw & Real Friendship ---
  { id: 't-d-1', type: 'truth', category: 'deep', text: 'Who in this room would you trust the most to hide a secret that could ruin your reputation?' },
  { id: 't-d-2', type: 'truth', category: 'deep', text: 'If you were stranded in an unfamiliar city at 3:00 AM with zero cash, who in this room would you call first?' },
  { id: 't-d-3', type: 'truth', category: 'deep', text: 'What is an assumption people consistently make about your personality that is completely inaccurate?' },
  { id: 't-d-4', type: 'truth', category: 'deep', text: 'What is something you are genuinely insecure about, but you try very hard to mask with humor or confidence?' },
  { id: 't-d-5', type: 'truth', category: 'deep', text: 'Have you ever felt quietly jealous or bitter about a close friend’s success or relationship?' },
  { id: 't-d-6', type: 'truth', category: 'deep', text: 'What is something someone in this room did that bothered or hurt you, but you never spoke up about?' },
  { id: 't-d-7', type: 'truth', category: 'deep', text: 'If everyone in this room had to vote on who is the most dramatic, who would take first place?' },
  { id: 't-d-8', type: 'truth', category: 'deep', text: 'What is the hardest truth about your own character or habits that you’ve had to come to terms with?' },
  { id: 't-d-9', type: 'truth', category: 'deep', text: 'What was the lowest point of your past year, and who actually reached out and showed up for you?' },
  { id: 't-d-10', type: 'truth', category: 'deep', text: 'What is a former friendship you let fade away that you secretly wish you could restore?' },
  { id: 't-d-11', type: 'truth', category: 'deep', text: 'Have you ever talked behind someone’s back in this room? Be completely honest.' },
  { id: 't-d-12', type: 'truth', category: 'deep', text: 'What is a core opinion or value you held 3 years ago that you have completely changed your mind on?' },

  // --- TRUTHS: Casual, Hot Takes & Fun ---
  { id: 't-c-1', type: 'truth', category: 'casual', text: 'If you were forced to delete all social media apps except one forever, which one are you keeping?' },
  { id: 't-c-2', type: 'truth', category: 'casual', text: 'What is an insanely popular movie, TV series, or artist that you secretly think is pure garbage?' },
  { id: 't-c-3', type: 'truth', category: 'casual', text: 'What is the weirdest food combination that you genuinely love and will defend to the grave?' },
  { id: 't-c-4', type: 'truth', category: 'casual', text: 'If someone handed you $25,000 in cash right now to never speak to your best friend again, would you take it?' },
  { id: 't-c-5', type: 'truth', category: 'casual', text: 'If you could swap lives with anyone in this room for 48 hours, who would it be and why?' },
  { id: 't-c-6', type: 'truth', category: 'casual', text: 'What is a childish habit or comfort routine you still do on a daily basis?' },
  { id: 't-c-7', type: 'truth', category: 'casual', text: 'What is an irrational fear you have that makes zero logical sense?' },
  { id: 't-c-8', type: 'truth', category: 'casual', text: 'If you were arrested tomorrow with zero context, what would your friends immediately assume you did?' },
  { id: 't-c-9', type: 'truth', category: 'casual', text: 'What is the worst advice a family member or friend has ever given you that you actually followed?' },

  // --- DARES: Party, Phone & Social Action ---
  { id: 'd-p-1', type: 'dare', category: 'party', text: 'Let the person to your left send a 3-word text of their choice to any contact in your recent chats.' },
  { id: 'd-p-2', type: 'dare', category: 'party', text: 'Open your Instagram or TikTok search history right now and display it to the entire room.' },
  { id: 'd-p-3', type: 'dare', category: 'party', text: 'Let the person sitting across from you scroll through your phone camera roll for 20 seconds without you touching the screen.' },
  { id: 'd-p-4', type: 'dare', category: 'party', text: 'Call a contact chosen by the group, say "I know what you did" with stone-cold seriousness, and hang up immediately.' },
  { id: 'd-p-5', type: 'dare', category: 'party', text: 'Trade phones with the person to your right — each of you gets to inspect one non-banking app of your choice for 30 seconds.' },
  { id: 'd-p-6', type: 'dare', category: 'party', text: 'Post a close-up photo of your forehead or shoe to your Instagram/Snapchat story with the caption "Can\'t believe this happened" for 10 minutes.' },
  { id: 'd-p-7', type: 'dare', category: 'party', text: 'Let the group pick a random emoji and comment it on the most recent post of the 3rd person appearing on your feed.' },
  { id: 'd-p-8', type: 'dare', category: 'party', text: 'Put your phone on speaker and call a local fast-food spot or grocery store to ask if they sell hot tap water or single ice cubes.' },
  { id: 'd-p-9', type: 'dare', category: 'party', text: 'Send a voice note to your 2nd most recent chat singing the first line of "Happy Birthday" with complete sincerity.' },
  { id: 'd-p-10', type: 'dare', category: 'party', text: 'Show the entire group the last 3 things you searched on Google or YouTube without deleting anything.' },
  { id: 'd-p-11', type: 'dare', category: 'party', text: 'Send a message to your best friend saying "We need to talk seriously tomorrow morning" and do not reply for 5 minutes.' },
  { id: 'd-p-12', type: 'dare', category: 'party', text: 'Show the group the oldest selfie currently saved on your phone camera roll.' },
  { id: 'd-p-13', type: 'dare', category: 'party', text: 'Let the person to your right read out loud the last three text messages you sent to anyone.' },

  // --- DARES: Wild, Physical, Acting & Fun ---
  { id: 'd-w-1', type: 'dare', category: 'party', text: 'Put an ice cube in your mouth and let it melt completely without chewing, biting, or spitting it out.' },
  { id: 'd-w-2', type: 'dare', category: 'party', text: 'Speak with a thick British, Australian, or dramatic mobster accent for the next 3 rounds without breaking character.' },
  { id: 'd-w-3', type: 'dare', category: 'party', text: 'Do your absolute best impression of someone in this room until the group guesses who you are imitating.' },
  { id: 'd-w-4', type: 'dare', category: 'party', text: 'Let someone in the group draw a tiny mustache or funny doodle on your hand or arm with a pen.' },
  { id: 'd-w-5', type: 'dare', category: 'party', text: 'Eat a spoonful of whatever condiment the group picks (hot sauce, mustard, ketchup, lemon slice, or soy sauce).' },
  { id: 'd-w-6', type: 'dare', category: 'party', text: 'Do 15 push-ups right now, or let the person to your left sit or lean on your back for 10 seconds.' },
  { id: 'd-w-7', type: 'dare', category: 'party', text: 'Swap your jacket, shirt, or hat with the player to your right for the next two rounds.' },
  { id: 'd-w-8', type: 'dare', category: 'party', text: 'Let the person to your left style your hair however they want and keep it like that for the next 15 minutes.' },
  { id: 'd-w-9', type: 'dare', category: 'party', text: 'Hold a wall-sit or plank for 45 seconds while answering rapid-fire questions from the group.' },
  { id: 'd-w-10', type: 'dare', category: 'party', text: 'Do a dramatic runway walk across the room and strike a ridiculous high-fashion pose at the end.' },
  { id: 'd-w-11', type: 'dare', category: 'party', text: 'Keep a completely straight poker face while everyone in the room has 30 seconds to make you laugh or smile.' },
  { id: 'd-w-12', type: 'dare', category: 'party', text: 'Speak only in questions for your next two turns. If you utter a regular statement, do 5 jumping jacks.' },
  { id: 'd-w-13', type: 'dare', category: 'party', text: 'Let the person across from you pose you like a mannequin in a shop window, and hold that pose for 45 seconds.' },
  { id: 'd-w-14', type: 'dare', category: 'party', text: 'Act like a mime trapped inside an invisible box for 30 seconds without making any vocal sound.' },
  { id: 'd-w-15', type: 'dare', category: 'party', text: 'Trade shoes with the person sitting across from you for the next 10 minutes.' },
  { id: 'd-w-16', type: 'dare', category: 'party', text: 'Give a dramatic 1-minute speech thanking your socks or phone charger as if you just won an Academy Award.' },
  { id: 'd-w-17', type: 'dare', category: 'party', text: 'Act like a hyperactive golden retriever greeting its owner at the front door for 30 seconds.' },
]

export function TruthOrDareView() {
  const [prompts, setPrompts] = React.useState<PromptItem[]>(DEFAULT_PROMPTS)
  const [selectedType, setSelectedType] = React.useState<PromptType | 'random'>('random')
  const [selectedCategory, setSelectedCategory] = React.useState<PromptCategory | 'all'>('all')

  // Up to 5 prompts at a time
  const [batchCount, setBatchCount] = React.useState<number>(1)
  const [currentPrompts, setCurrentPrompts] = React.useState<PromptItem[]>([DEFAULT_PROMPTS[0]])
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [copiedAll, setCopiedAll] = React.useState<boolean>(false)
  const [isFlipping, setIsFlipping] = React.useState<boolean>(false)

  // Players Management
  const [players, setPlayers] = React.useState<string[]>(['Player 1', 'Player 2'])
  const [newPlayerName, setNewPlayerName] = React.useState<string>('')
  const [currentPlayerIndex, setCurrentPlayerIndex] = React.useState<number>(0)

  // Custom prompt input
  const [customText, setCustomText] = React.useState<string>('')
  const [customType, setCustomType] = React.useState<PromptType>('truth')
  const [customCategory, setCustomCategory] = React.useState<PromptCategory>('party')

  // Load custom prompts from local storage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('toolforge_custom_tod')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPrompts((prev) => [...prev, ...parsed])
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Filter pool based on type and category
  const filteredPool = React.useMemo(() => {
    return prompts.filter((p) => {
      const matchType = selectedType === 'random' ? true : p.type === selectedType
      const matchCat = selectedCategory === 'all' ? true : p.category === selectedCategory
      return matchType && matchCat
    })
  }, [prompts, selectedType, selectedCategory])

  // Draw multiple cards (up to 5)
  const drawBatch = (countToDraw: number = batchCount) => {
    if (filteredPool.length === 0) return
    setIsFlipping(true)

    setTimeout(() => {
      const needed = Math.min(countToDraw, Math.max(1, filteredPool.length))
      const currentIds = new Set(currentPrompts.map((p) => p.id))
      let candidatePool = filteredPool.filter((p) => !currentIds.has(p.id))

      // If candidates run low, refill with the full pool
      if (candidatePool.length < needed) {
        candidatePool = [...filteredPool]
      }

      // Shuffle candidates
      const shuffled = [...candidatePool].sort(() => Math.random() - 0.5)
      const picked = shuffled.slice(0, needed)

      setCurrentPrompts(picked)
      setIsFlipping(false)

      // Advance players
      if (players.length > 0) {
        setCurrentPlayerIndex((prev) => (prev + needed) % players.length)
      }
    }, 200)
  }

  // Handle individual copy
  const handleCopyOne = (item: PromptItem) => {
    const formatted = `[${item.type.toUpperCase()}] ${item.text}`
    navigator.clipboard.writeText(formatted)
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Copy all drawn cards in batch
  const handleCopyAll = () => {
    if (currentPrompts.length === 0) return
    const formatted = currentPrompts
      .map((p, idx) => {
        const playerLabel = players.length > 0
          ? ` (${players[(currentPlayerIndex - currentPrompts.length + idx + players.length) % players.length]})`
          : ''
        return `${idx + 1}. [${p.type.toUpperCase()}${playerLabel}] ${p.text}`
      })
      .join('\n\n')

    navigator.clipboard.writeText(formatted)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const addPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return
    setPlayers((prev) => [...prev, newPlayerName.trim()])
    setNewPlayerName('')
  }

  const removePlayer = (idx: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== idx))
    if (currentPlayerIndex >= players.length - 1) {
      setCurrentPlayerIndex(0)
    }
  }

  const handleAddCustomPrompt = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customText.trim()) return
    const newPrompt: PromptItem = {
      id: `custom-${Date.now()}`,
      type: customType,
      category: customCategory,
      text: customText.trim(),
    }
    setPrompts((prev) => {
      const next = [newPrompt, ...prev]
      try {
        const customOnly = next.filter((p) => p.id.startsWith('custom-'))
        localStorage.setItem('toolforge_custom_tod', JSON.stringify(customOnly))
      } catch {
        // ignore
      }
      return next
    })
    setCurrentPrompts([newPrompt])
    setCustomText('')
  }

  const categories: { id: PromptCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Vibes' },
    { id: 'juicy', label: '🌶️ Juicy & Dating' },
    { id: 'party', label: '🎉 Party & Dares' },
    { id: 'embarrassing', label: '🙈 Cringe & Fails' },
    { id: 'deep', label: '🧠 Deep & Friends' },
    { id: 'casual', label: '🍿 Casual & Chill' },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs glass-card">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30">
                <Dices className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">
                    Truth or Dare Generator
                  </h2>
                  <span
                    title="Production verified"
                    className="inline-flex items-center rounded-full bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400"
                  >
                    <Lock className="h-3 w-3" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Authentic, hilarious & spicy party truths and dares that real humans actually play
                </p>
              </div>
            </div>

            {players.length > 0 && (
              <div className="flex items-center gap-2 rounded-2xl bg-secondary/40 border border-border/70 px-3.5 py-1.5 shadow-2xs">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Current Turn:</span>
                <span className="font-bold text-foreground text-sm">
                  {players[currentPlayerIndex % players.length]}
                </span>
              </div>
            )}
          </div>

          {/* Mode & Category Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Type selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/40 p-1">
              <button
                type="button"
                onClick={() => setSelectedType('random')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                  selectedType === 'random'
                    ? 'bg-card text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Shuffle className="h-3.5 w-3.5" />
                <span>All / Mix</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('truth')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                  selectedType === 'truth'
                    ? 'bg-blue-500 text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Truths Only</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('dare')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                  selectedType === 'dare'
                    ? 'bg-rose-500 text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Dares Only</span>
              </button>
            </div>

            {/* Prompts Count Selector (1 to 5 at a time) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Draw:
              </span>
              <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-secondary/40 p-1">
                {[1, 2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      setBatchCount(cnt)
                      drawBatch(cnt)
                    }}
                    className={cn(
                      'min-w-[28px] h-7 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      batchCount === cnt
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                {batchCount === 1 ? 'card' : 'cards at once'}
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs transition-colors cursor-pointer',
                  selectedCategory === cat.id
                    ? 'bg-primary/15 text-primary border border-primary/40 font-bold shadow-2xs'
                    : 'border border-border/60 bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 2. Central Prompt Cards Display */}
          {batchCount === 1 ? (
            /* Single Hero Card Display */
            <div className="relative min-h-[220px] rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card to-secondary/30 p-7 sm:p-10 shadow-sm glass-card flex flex-col justify-between items-center text-center">
              {currentPrompts[0] && (
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                  {players.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                      <UserCheck className="h-3 w-3" />
                      For: {players[(currentPlayerIndex - 1 + players.length) % players.length]}
                    </span>
                  )}
                  <Badge
                    className={cn(
                      'font-mono text-xs font-bold uppercase tracking-wider px-3 py-1',
                      currentPrompts[0].type === 'truth'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    )}
                  >
                    {currentPrompts[0].type === 'truth' ? '🔍 TRUTH' : '🔥 DARE'}
                  </Badge>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                    {currentPrompts[0].category}
                  </span>
                </div>
              )}

              {/* Main Prompt Text */}
              <div className="my-auto py-2">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentPrompts[0]?.id || 'empty'}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.22 }}
                    className="text-lg sm:text-2xl font-bold tracking-tight text-foreground max-w-2xl leading-snug"
                  >
                    {currentPrompts[0]?.text || 'No cards match your filter. Select All Vibes or reset filters.'}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6 pt-4 border-t border-border/60 w-full">
                <Button
                  size="lg"
                  onClick={() => drawBatch(1)}
                  disabled={isFlipping || filteredPool.length === 0}
                  className="h-11 px-7 rounded-xl font-bold gap-2 text-sm shadow-md shadow-primary/20 cursor-pointer active-push"
                >
                  <Shuffle className={cn('h-4 w-4', isFlipping && 'animate-spin')} />
                  <span>Next Prompt</span>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => currentPrompts[0] && handleCopyOne(currentPrompts[0])}
                  disabled={!currentPrompts[0]}
                  className="h-11 rounded-xl text-sm gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedId === currentPrompts[0]?.id ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{copiedId === currentPrompts[0]?.id ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Multi-Card Grid Display (2 to 5 Cards) */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Showing {currentPrompts.length} prompts simultaneously:
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAll}
                    className="h-8 text-xs gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedAll ? 'Copied All!' : `Copy All (${currentPrompts.length})`}</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => drawBatch(batchCount)}
                    disabled={isFlipping || filteredPool.length === 0}
                    className="h-8 text-xs font-bold gap-1.5 cursor-pointer active-push"
                  >
                    <Shuffle className={cn('h-3.5 w-3.5', isFlipping && 'animate-spin')} />
                    <span>Next {batchCount} Cards</span>
                  </Button>
                </div>
              </div>

              <div
                className={cn(
                  'grid gap-4',
                  batchCount === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : batchCount === 3
                    ? 'grid-cols-1 md:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                )}
              >
                {currentPrompts.map((item, idx) => {
                  const playerTurn = players.length > 0
                    ? players[(currentPlayerIndex - currentPrompts.length + idx + players.length) % players.length]
                    : null

                  return (
                    <motion.div
                      key={`${item.id}-${idx}`}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className="rounded-2xl border border-border/80 bg-gradient-to-b from-card to-secondary/20 p-5 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-colors"
                    >
                      <div>
                        {/* Top info */}
                        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-border/50">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-black text-muted-foreground">
                              #{idx + 1}
                            </span>
                            <Badge
                              className={cn(
                                'font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
                                item.type === 'truth'
                                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              )}
                            >
                              {item.type === 'truth' ? 'TRUTH' : 'DARE'}
                            </Badge>
                          </div>

                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                            {item.category}
                          </span>
                        </div>

                        {playerTurn && (
                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                              <UserCheck className="h-3 w-3" /> Turn: {playerTurn}
                            </span>
                          </div>
                        )}

                        <p className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                          {item.text}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyOne(item)}
                          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500 mr-1" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              <span>Copy</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Player Tracker & Custom Prompts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Player Roster */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs glass-card space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Party Players Tracker
              </h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {players.length} players
            </span>
          </div>

          <form onSubmit={addPlayer} className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Add friend's name..."
              className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" size="sm" className="h-8 text-xs font-semibold cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </form>

          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-0.5">
            {players.map((p, idx) => (
              <div
                key={`${p}-${idx}`}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold transition-all',
                  idx === currentPlayerIndex % Math.max(1, players.length)
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                    : 'border-border/80 bg-secondary/40 text-foreground'
                )}
              >
                <span>{p}</span>
                {players.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlayer(idx)}
                    className="ml-1 text-muted-foreground hover:text-destructive cursor-pointer font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Custom Prompt */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs glass-card space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <PartyPopper className="h-4 w-4 text-rose-500" />
              <h3 className="text-sm font-bold text-foreground">
                Add Custom Party Card
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">Saves to this device</span>
          </div>

          <form onSubmit={handleAddCustomPrompt} className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCustomType('truth')}
                className={cn(
                  'flex-1 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer',
                  customType === 'truth'
                    ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    : 'border-border text-muted-foreground'
                )}
              >
                Truth
              </button>
              <button
                type="button"
                onClick={() => setCustomType('dare')}
                className={cn(
                  'flex-1 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer',
                  customType === 'dare'
                    ? 'border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    : 'border-border text-muted-foreground'
                )}
              >
                Dare
              </button>

              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as PromptCategory)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-hidden"
              >
                <option value="juicy">Juicy</option>
                <option value="party">Party</option>
                <option value="embarrassing">Embarrassing</option>
                <option value="deep">Deep</option>
                <option value="casual">Casual</option>
              </select>
            </div>

            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter your custom question or challenge..."
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
            />

            <Button
              type="submit"
              size="sm"
              disabled={!customText.trim()}
              className="w-full h-8 text-xs font-semibold cursor-pointer"
            >
              Add Card to Game
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
