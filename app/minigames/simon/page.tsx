"use client"

import { useEffect, useRef, useState } from "react"
import { MinigameShell } from "@/components/minigame-shell"
import { useProfileTracker } from "@/components/profile-provider"

type Status = "idle" | "showing" | "input" | "lost"

const COLORS = [
  { id: 0, base: "bg-red-500/70", active: "bg-red-500", label: "A" },
  { id: 1, base: "bg-blue-500/70", active: "bg-blue-500", label: "B" },
  { id: 2, base: "bg-emerald-500/70", active: "bg-emerald-500", label: "C" },
  { id: 3, base: "bg-amber-500/70", active: "bg-amber-500", label: "D" },
]

function randomStep() {
  return Math.floor(Math.random() * 4)
}

export default function SimonPage() {
  const { data, recordGameResult } = useProfileTracker()
  const [sequence, setSequence] = useState<number[]>([])
  const [status, setStatus] = useState<Status>("idle")
  const [inputIndex, setInputIndex] = useState(0)
  const [activePad, setActivePad] = useState<number | null>(null)
  const [round, setRound] = useState(0)
  const timersRef = useRef<number[]>([])
  const reportedRef = useRef(false)

  const bestStreak = data.gameStats.simon.bestScore

  const clearTimers = () => {
    for (const timer of timersRef.current) window.clearTimeout(timer)
    timersRef.current = []
  }

  const commitResult = (finalScore: number) => {
    if (reportedRef.current) return
    reportedRef.current = true
    recordGameResult("simon", {
      score: finalScore,
      win: finalScore >= 10,
    })
  }

  const reset = () => {
    if (!reportedRef.current && round > 0) {
      commitResult(round)
    }
    clearTimers()
    reportedRef.current = false
    setSequence([])
    setStatus("idle")
    setInputIndex(0)
    setActivePad(null)
    setRound(0)
  }

  const start = () => {
    clearTimers()
    reportedRef.current = false
    setSequence([randomStep()])
    setStatus("showing")
    setInputIndex(0)
    setActivePad(null)
    setRound(1)
  }

  useEffect(() => {
    if (status !== "showing" || sequence.length === 0) return
    clearTimers()

    sequence.forEach((step, index) => {
      const showTimer = window.setTimeout(() => {
        setActivePad(step)
      }, index * 650 + 260)
      const hideTimer = window.setTimeout(() => {
        setActivePad((previous) => (previous === step ? null : previous))
      }, index * 650 + 580)
      timersRef.current.push(showTimer, hideTimer)
    })

    const finishTimer = window.setTimeout(() => {
      setActivePad(null)
      setInputIndex(0)
      setStatus("input")
    }, sequence.length * 650 + 640)
    timersRef.current.push(finishTimer)

    return () => clearTimers()
  }, [sequence, status])

  useEffect(() => {
    return () => clearTimers()
  }, [])

  const onPadClick = (pad: number) => {
    if (status !== "input") return

    setActivePad(pad)
    const flashTimer = window.setTimeout(() => setActivePad((previous) => (previous === pad ? null : previous)), 170)
    timersRef.current.push(flashTimer)

    const expected = sequence[inputIndex]
    if (pad !== expected) {
      setStatus("lost")
      commitResult(round)
      return
    }

    const nextIndex = inputIndex + 1
    if (nextIndex >= sequence.length) {
      setStatus("showing")
      setInputIndex(0)
      setRound((previous) => previous + 1)
      setSequence((previous) => [...previous, randomStep()])
      return
    }

    setInputIndex(nextIndex)
  }

  return (
    <MinigameShell
      title="Simon"
      subtitle="Запоминай последовательность светящихся кнопок и повторяй. Цель достижения: 10 шагов."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] tracking-[0.12em] uppercase">
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Шаг</p>
            <p className="mt-0.5 text-lg font-semibold">{round}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Рекорд</p>
            <p className="mt-0.5 text-lg font-semibold">{bestStreak}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Статус</p>
            <p className="mt-0.5 text-sm font-semibold uppercase">{status}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 max-w-[360px]">
          {COLORS.map((item) => {
            const active = activePad === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPadClick(item.id)}
                className={`h-24 rounded-md border border-black/20 text-xl font-semibold text-white transition-all ${
                  active ? `${item.active} scale-[0.98]` : item.base
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => start()}
            className="rounded-md border border-black/20 bg-white/75 px-4 py-2 text-xs tracking-[0.12em] uppercase"
          >
            Начать
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md border border-black/20 bg-black px-4 py-2 text-xs tracking-[0.12em] text-white uppercase"
          >
            Сброс
          </button>
        </div>

        {status === "lost" && <p className="text-sm text-red-700">Ошибка в последовательности.</p>}
      </div>
    </MinigameShell>
  )
}
