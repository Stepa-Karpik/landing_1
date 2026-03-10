"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useProfileTracker } from "@/components/profile-provider"

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const ratio = (value: number, target: number) => (target <= 0 ? 0 : clamp(value / target, 0, 1))

const rarityClassByKey: Record<string, string> = {
  common: "border-black/12 bg-black/[0.04] text-black/68",
  rare: "border-blue-200 bg-blue-50 text-blue-700",
  epic: "border-orange-200 bg-orange-50 text-orange-700",
  legendary: "border-black bg-black text-white",
  impossible: "border-[#8f1d1f] bg-[#24090a] text-[#ffd8d9]",
}

const rarityTextByKey: Record<string, string> = {
  common: "Обычное",
  rare: "Редкое",
  epic: "Эпическое",
  legendary: "Легендарное",
  impossible: "Невозможно",
}

const miniGames: Array<{ href: string; label: string }> = [
  { href: "/minigames/tetris", label: "\u0422\u0435\u0442\u0440\u0438\u0441" },
  { href: "/minigames/dino", label: "\u0414\u0438\u043d\u043e\u0437\u0430\u0432\u0440\u0438\u043a" },
  { href: "/minigames/minesweeper", label: "\u0421\u0430\u043f\u0435\u0440" },
  { href: "/minigames/match3", label: "\u0422\u0440\u0438 \u0432 \u0440\u044f\u0434" },
  { href: "/minigames/snake", label: "\u0417\u043c\u0435\u0439\u043a\u0430" },
  { href: "/minigames/2048", label: "2048" },
  { href: "/minigames/breakout", label: "Breakout" },
  { href: "/minigames/simon", label: "Simon" },
  { href: "/minigames/osu", label: "OSU-like" },
]

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  if (hours > 0) return `${hours}ч ${minutes}м`
  return `${minutes}м ${String(seconds).padStart(2, "0")}с`
}

function formatDate(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#77dfd4_0%,#9b9cf4_52%,#ff8fb7_100%)] transition-[width] duration-300"
        style={{ width: `${clamp(percent, 0, 100)}%` }}
      />
    </div>
  )
}

export default function ProfilePage() {
  const { data, siteProgressPercent, achievementsProgressPercent, unlockedCount, sortedAchievementViews } = useProfileTracker()
  const [showMiniGames, setShowMiniGames] = useState(false)

  const gamesPlayed = useMemo(
    () => Object.values(data.gameStats).reduce((acc, game) => (game.plays > 0 ? acc + 1 : acc), 0),
    [data.gameStats],
  )

  const totalMapsTarget = Math.max(1, data.osuProgress.knownTracks)
  const clearedMapsPercent = Math.round(ratio(data.osuProgress.clearedTracks.length, totalMapsTarget) * 100)
  const perfectMapsPercent = Math.round(ratio(data.osuProgress.perfectTracks.length, totalMapsTarget) * 100)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#d9f6ec_0%,#f7dcec_68%,#fbe5ef_100%)] px-4 pb-10 pt-20 text-[#111111] md:px-8">
      <div className="pointer-events-none absolute -left-24 top-8 h-[420px] w-[420px] rounded-full bg-[#8ed9ff]/35 blur-[90px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-[460px] w-[460px] rounded-full bg-[#ff8db6]/28 blur-[92px]" />

      <div className="relative z-10 mx-auto max-w-[1220px]">
        <section className="rounded-2xl border border-black/10 bg-[#fff6fb]/72 p-5 shadow-[0_18px_50px_rgba(58,17,37,0.14)] backdrop-blur-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.18em] text-black/58 uppercase">Профиль игрока</p>
              <h1 className="mt-2 text-[clamp(28px,4.2vw,54px)] font-semibold leading-[0.92] tracking-[-0.03em]">Статистика и достижения</h1>
              <p className="mt-3 max-w-[760px] text-sm text-black/66">Общий прогресс по сайту, мини-играм и полная история достижений.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowMiniGames((previous) => !previous)}
                className="rounded-full border border-black/16 bg-white/70 px-3 py-1.5 text-[11px] tracking-[0.12em] uppercase transition-colors hover:bg-white"
              >
                {showMiniGames ? "\u0421\u043a\u0440\u044b\u0442\u044c \u0438\u0433\u0440\u044b" : "\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0438\u0433\u0440\u0443"}
              </button>
              <Link
                href="/?tutorial=1"
                className="rounded-full border border-black/16 bg-white/70 px-3 py-1.5 text-[11px] tracking-[0.12em] uppercase transition-colors hover:bg-white"
              >
                {"\u041f\u0435\u0440\u0435\u043f\u0440\u043e\u0439\u0442\u0438 \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435"}
              </Link>
              <Link
                href="/"
                className="rounded-full border border-black/16 bg-white/70 px-3 py-1.5 text-[11px] tracking-[0.12em] uppercase transition-colors hover:bg-white"
              >
                {"\u041d\u0430 \u0433\u043b\u0430\u0432\u043d\u0443\u044e"}
              </Link>
              <Link
                href="/403"
                className="rounded-full border border-[#8f1d1f]/40 bg-[#fff0f0]/85 px-3 py-1.5 text-[11px] tracking-[0.12em] text-[#7a1517] uppercase transition-colors hover:bg-[#ffe5e6]"
              >
                {"\u0410\u0434\u043c\u0438\u043d-\u043f\u0430\u043d\u0435\u043b\u044c"}
              </Link>
            </div>
          </div>

          {showMiniGames && (
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {miniGames.map((game) => (
                <Link
                  key={game.href}
                  href={game.href}
                  className="rounded-xl border border-black/12 bg-white/70 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white"
                >
                  {game.label}
                </Link>
              ))}
            </div>
          )}
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-black/10 bg-white/72 p-3.5">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Прогресс сайта</p>
              <p className="mt-1 text-2xl font-semibold">{siteProgressPercent}%</p>
              <div className="mt-2">
                <ProgressBar percent={siteProgressPercent} />
              </div>
            </article>
            <article className="rounded-xl border border-black/10 bg-white/72 p-3.5">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Достижения</p>
              <p className="mt-1 text-2xl font-semibold">
                {unlockedCount}/{sortedAchievementViews.length}
              </p>
              <div className="mt-2">
                <ProgressBar percent={achievementsProgressPercent} />
              </div>
            </article>
            <article className="rounded-xl border border-black/10 bg-white/72 p-3.5">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Активное время</p>
              <p className="mt-1 text-2xl font-semibold">{formatDuration(data.totalSeconds)}</p>
              <p className="mt-2 text-xs text-black/60">
                Сессий: {data.sessions} • Игр открыто: {gamesPlayed}
              </p>
            </article>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1.5fr]">
          <article className="rounded-2xl border border-black/10 bg-[#fff8fd]/76 p-4 shadow-[0_14px_40px_rgba(21,8,40,0.12)] backdrop-blur-sm">
            <h2 className="text-[11px] tracking-[0.16em] text-black/56 uppercase">OSU-like</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5 text-sm">
              <div className="rounded-lg border border-black/10 bg-white/74 p-2.5">
                <p className="text-[10px] tracking-[0.12em] text-black/56 uppercase">Лучший счёт</p>
                <p className="mt-1 text-lg font-semibold">{data.gameStats.osu.bestScore}</p>
              </div>
              <div className="rounded-lg border border-black/10 bg-white/74 p-2.5">
                <p className="text-[10px] tracking-[0.12em] text-black/56 uppercase">Лучшая точность</p>
                <p className="mt-1 text-lg font-semibold">{data.osuProgress.bestAccuracy.toFixed(2)}%</p>
              </div>
              <div className="rounded-lg border border-black/10 bg-white/74 p-2.5">
                <p className="text-[10px] tracking-[0.12em] text-black/56 uppercase">Лучший комбо</p>
                <p className="mt-1 text-lg font-semibold">X{data.osuProgress.bestCombo}</p>
              </div>
              <div className="rounded-lg border border-black/10 bg-white/74 p-2.5">
                <p className="text-[10px] tracking-[0.12em] text-black/56 uppercase">Проходов на Legend</p>
                <p className="mt-1 text-lg font-semibold">{data.osuProgress.legendClears}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] tracking-[0.12em] text-black/56 uppercase">
                  <span>Карты пройдены</span>
                  <span>
                    {Math.min(data.osuProgress.clearedTracks.length, totalMapsTarget)}/{totalMapsTarget}
                  </span>
                </div>
                <ProgressBar percent={clearedMapsPercent} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] tracking-[0.12em] text-black/56 uppercase">
                  <span>Карты идеально</span>
                  <span>
                    {Math.min(data.osuProgress.perfectTracks.length, totalMapsTarget)}/{totalMapsTarget}
                  </span>
                </div>
                <ProgressBar percent={perfectMapsPercent} />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-black/10 bg-[#fff8fd]/76 p-4 shadow-[0_14px_40px_rgba(21,8,40,0.12)] backdrop-blur-sm">
            <h2 className="text-[11px] tracking-[0.16em] text-black/56 uppercase">Достижения</h2>
            <div className="mt-3 max-h-[56vh] space-y-2.5 overflow-y-auto pr-1">
              {sortedAchievementViews.map((achievement) => {
                const percent = Math.round(ratio(achievement.progress.value, achievement.progress.target) * 100)
                const rarityClass = rarityClassByKey[achievement.rarity] ?? rarityClassByKey.common
                const rarityText = rarityTextByKey[achievement.rarity] ?? achievement.rarity
                const unlockedAt = formatDate(achievement.unlockedAt)
                return (
                  <article
                    key={achievement.id}
                    className={`rounded-xl border p-3 ${
                      achievement.unlocked ? "border-black/20 bg-white/76" : "border-black/10 bg-white/44"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{achievement.title}</p>
                        <p className="mt-0.5 text-xs leading-[1.4] text-black/66">{achievement.description}</p>
                        {achievement.unlocked && unlockedAt && (
                          <p className="mt-1 text-[10px] tracking-[0.08em] text-black/50 uppercase">Открыто: {unlockedAt}</p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] tracking-[0.11em] uppercase ${rarityClass}`}>
                        {rarityText}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <div className="mb-1 flex items-center justify-between text-[10px] tracking-[0.11em] text-black/56 uppercase">
                        <span>
                          {Math.min(achievement.progress.value, achievement.progress.target)}/{achievement.progress.target}
                        </span>
                        <span>{percent}%</span>
                      </div>
                      <ProgressBar percent={percent} />
                    </div>
                  </article>
                )
              })}
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}
