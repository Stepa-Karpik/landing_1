"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useProfileTracker } from "@/components/profile-provider"

type SimonMode = "classic" | "reverse" | "mirror"
type SimonDifficulty = "easy" | "normal" | "hard"
type SimonStatus = "showing" | "input" | "lost"

interface PadConfig {
  id: number
  hotkeys: string[]
  label: string
  base: string
  glow: string
  text: string
}

const PADS: PadConfig[] = [
  {
    id: 0,
    hotkeys: ["1", "q", "й"],
    label: "I",
    base: "from-[#ff8ba7] to-[#ff4f74]",
    glow: "shadow-[0_0_42px_rgba(255,79,116,0.52)]",
    text: "text-[#2f0a13]",
  },
  {
    id: 1,
    hotkeys: ["2", "w", "ц"],
    label: "II",
    base: "from-[#80c7ff] to-[#3495ff]",
    glow: "shadow-[0_0_42px_rgba(52,149,255,0.52)]",
    text: "text-[#082039]",
  },
  {
    id: 2,
    hotkeys: ["3", "a", "ф"],
    label: "III",
    base: "from-[#8be7b8] to-[#30c37d]",
    glow: "shadow-[0_0_42px_rgba(48,195,125,0.5)]",
    text: "text-[#0d2a1d]",
  },
  {
    id: 3,
    hotkeys: ["4", "s", "ы"],
    label: "IV",
    base: "from-[#ffd27a] to-[#ff9d39]",
    glow: "shadow-[0_0_42px_rgba(255,157,57,0.52)]",
    text: "text-[#3d2108]",
  },
]

const MODE_LABELS: Record<SimonMode, string> = {
  classic: "Классика",
  reverse: "Реверс",
  mirror: "Зеркало",
}

const DIFFICULTY_LABELS: Record<SimonDifficulty, string> = {
  easy: "Легко",
  normal: "Нормально",
  hard: "Сложно",
}

const DIFFICULTY_CONFIG: Record<SimonDifficulty, { flashMs: number; gapMs: number }> = {
  easy: { flashMs: 420, gapMs: 240 },
  normal: { flashMs: 300, gapMs: 170 },
  hard: { flashMs: 220, gapMs: 110 },
}

const randomPad = () => Math.floor(Math.random() * PADS.length)

const mirrorPad = (pad: number) => {
  if (pad === 0) return 1
  if (pad === 1) return 0
  if (pad === 2) return 3
  return 2
}

const expectedSequence = (sequence: number[], mode: SimonMode) => {
  if (mode === "classic") return sequence
  if (mode === "reverse") return [...sequence].reverse()
  return sequence.map((pad) => mirrorPad(pad))
}

const roundStepIncrease = (mode: SimonMode, difficulty: SimonDifficulty, nextRound: number) => {
  let value = 1
  if (difficulty === "hard" && nextRound % 4 === 0) value += 1
  if (mode === "mirror" && nextRound % 6 === 0) value += 1
  return value
}

export default function SimonPage() {
  const { data, recordGameResult } = useProfileTracker()

  const [mode, setMode] = useState<SimonMode>("classic")
  const [difficulty, setDifficulty] = useState<SimonDifficulty>("normal")

  const [status, setStatus] = useState<SimonStatus>("showing")
  const [sequence, setSequence] = useState<number[]>([])
  const [expected, setExpected] = useState<number[]>([])
  const [inputIndex, setInputIndex] = useState(0)
  const [activePad, setActivePad] = useState<number | null>(null)
  const [round, setRound] = useState(1)

  const timersRef = useRef<number[]>([])
  const reportedRef = useRef(false)

  const bestScore = data.gameStats.simon.bestScore

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) {
      window.clearTimeout(timer)
    }
    timersRef.current = []
  }, [])

  const commitResult = useCallback(
    (value: number) => {
      if (reportedRef.current) return
      reportedRef.current = true
      recordGameResult("simon", {
        score: value,
        win: value >= 18,
        mode,
        difficulty,
      })
    },
    [difficulty, mode, recordGameResult],
  )

  const startRun = useCallback(
    (nextMode: SimonMode = mode, nextDifficulty: SimonDifficulty = difficulty) => {
      clearTimers()
      reportedRef.current = false
      const first = [randomPad()]
      setMode(nextMode)
      setDifficulty(nextDifficulty)
      setSequence(first)
      setExpected(expectedSequence(first, nextMode))
      setInputIndex(0)
      setActivePad(null)
      setRound(1)
      setStatus("showing")
    },
    [clearTimers, difficulty, mode],
  )

  useEffect(() => {
    clearTimers()
    reportedRef.current = false
    const first = [randomPad()]
    setSequence(first)
    setExpected(expectedSequence(first, "classic"))
    setInputIndex(0)
    setActivePad(null)
    setRound(1)
    setStatus("showing")
    return () => clearTimers()
  }, [clearTimers])

  useEffect(() => {
    if (status !== "showing" || sequence.length === 0) return
    clearTimers()

    const config = DIFFICULTY_CONFIG[difficulty]
    sequence.forEach((pad, index) => {
      const showTimer = window.setTimeout(() => {
        setActivePad(pad)
      }, index * (config.flashMs + config.gapMs) + 220)
      const hideTimer = window.setTimeout(() => {
        setActivePad((previous) => (previous === pad ? null : previous))
      }, index * (config.flashMs + config.gapMs) + 220 + config.flashMs)
      timersRef.current.push(showTimer, hideTimer)
    })

    const finishTimer = window.setTimeout(() => {
      setActivePad(null)
      setInputIndex(0)
      setStatus("input")
    }, sequence.length * (config.flashMs + config.gapMs) + 300)
    timersRef.current.push(finishTimer)

    return () => clearTimers()
  }, [clearTimers, difficulty, sequence, status])

  const onPadPress = (pad: number) => {
    if (status !== "input") return

    setActivePad(pad)
    const flashTimer = window.setTimeout(() => {
      setActivePad((previous) => (previous === pad ? null : previous))
    }, 130)
    timersRef.current.push(flashTimer)

    const expectedPad = expected[inputIndex]
    if (pad !== expectedPad) {
      setStatus("lost")
      commitResult(round)
      return
    }

    const nextInput = inputIndex + 1
    if (nextInput >= expected.length) {
      const nextRound = round + 1
      const addCount = roundStepIncrease(mode, difficulty, nextRound)
      const extension = Array.from({ length: addCount }, () => randomPad())
      const nextSequence = [...sequence, ...extension]

      setRound(nextRound)
      setSequence(nextSequence)
      setExpected(expectedSequence(nextSequence, mode))
      setInputIndex(0)
      setStatus("showing")
      return
    }

    setInputIndex(nextInput)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const pad = PADS.find((item) => item.hotkeys.includes(key))
      if (pad) {
        event.preventDefault()
        onPadPress(pad.id)
        return
      }

      if (event.key === "Enter") {
        event.preventDefault()
        if (status === "lost") {
          startRun(mode, difficulty)
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [difficulty, mode, startRun, status])

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ef] px-2 pb-3 pt-3 text-[#111111] md:h-screen md:overflow-hidden sm:px-3">
      <section className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-[1680px] flex-col gap-3 md:h-full md:min-h-0">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Round</p>
            <p className="mt-1 text-xl font-semibold">{round}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Best</p>
            <p className="mt-1 text-xl font-semibold">{bestScore}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Mode</p>
            <p className="mt-1 text-sm font-semibold uppercase">{MODE_LABELS[mode]}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Diff</p>
            <p className="mt-1 text-sm font-semibold uppercase">{DIFFICULTY_LABELS[difficulty]}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(MODE_LABELS) as SimonMode[]).map((modeKey) => (
            <button
              key={modeKey}
              type="button"
              onClick={() => startRun(modeKey, difficulty)}
              className={`rounded-xl border px-3 py-2 text-xs tracking-[0.12em] uppercase transition-all ${
                mode === modeKey
                  ? "border-black bg-black text-white"
                  : "border-black/14 bg-white/76 text-black hover:border-black/28"
              }`}
            >
              {MODE_LABELS[modeKey]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(DIFFICULTY_LABELS) as SimonDifficulty[]).map((difficultyKey) => (
            <button
              key={difficultyKey}
              type="button"
              onClick={() => startRun(mode, difficultyKey)}
              className={`rounded-xl border px-3 py-2 text-xs tracking-[0.12em] uppercase transition-all ${
                difficulty === difficultyKey
                  ? "border-black bg-black text-white"
                  : "border-black/14 bg-white/76 text-black hover:border-black/28"
              }`}
            >
              {DIFFICULTY_LABELS[difficultyKey]}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-black/14 bg-[linear-gradient(180deg,#fffdfa_0%,#f5eee3_100%)] p-2 shadow-[0_10px_36px_rgba(0,0,0,0.07)]">
          <div className="relative grid h-full max-h-[78vh] w-full max-w-[920px] grid-cols-2 grid-rows-2 gap-3 rounded-2xl border border-black/15 bg-[#1d1d22] p-3 sm:gap-4 sm:p-4">
            {PADS.map((pad) => {
              const active = activePad === pad.id
              const baseClass = active ? `bg-gradient-to-br ${pad.base} ${pad.glow} scale-[0.98]` : "bg-gradient-to-br from-[#2f313b] to-[#1f2129]"
              return (
                <button
                  key={pad.id}
                  type="button"
                  onClick={() => onPadPress(pad.id)}
                  className={`group relative rounded-xl border border-white/16 transition-all duration-150 ${baseClass}`}
                >
                  <span className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.2),rgba(255,255,255,0)_62%)]" />
                  <span className={`relative z-10 text-[clamp(28px,5vw,58px)] font-semibold tracking-[0.08em] ${active ? pad.text : "text-white/68"}`}>
                    {pad.label}
                  </span>
                </button>
              )
            })}

            {status === "lost" && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/42">
                <div className="rounded-xl border border-white/22 bg-black/58 px-5 py-4 text-center text-white">
                  <p className="text-2xl font-semibold">Ошибка</p>
                  <p className="mt-1 text-xs tracking-[0.11em] uppercase text-white/84">Enter — новая попытка</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
