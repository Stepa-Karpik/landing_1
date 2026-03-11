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
  common: "\u041e\u0431\u044b\u0447\u043d\u043e\u0435",
  rare: "\u0420\u0435\u0434\u043a\u043e\u0435",
  epic: "\u042d\u043f\u0438\u0447\u0435\u0441\u043a\u043e\u0435",
  legendary: "\u041b\u0435\u0433\u0435\u043d\u0434\u0430\u0440\u043d\u043e\u0435",
  impossible: "\u041d\u0435\u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e",
}

const raritySortOrder: Record<string, number> = {
  impossible: 0,
  legendary: 1,
  epic: 2,
  rare: 3,
  common: 4,
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

const achievementTypeLabels: Record<string, string> = {
  site: "\u0421\u0430\u0439\u0442",
  minigames: "\u041c\u0438\u043d\u0438-\u0438\u0433\u0440\u044b",
  tetris: "\u0422\u0435\u0442\u0440\u0438\u0441",
  dino: "\u0414\u0438\u043d\u043e\u0437\u0430\u0432\u0440\u0438\u043a",
  minesweeper: "\u0421\u0430\u043f\u0435\u0440",
  match3: "\u0422\u0440\u0438 \u0412 \u0420\u044f\u0434",
  snake: "\u0417\u043c\u0435\u0439\u043a\u0430",
  game2048: "2048",
  breakout: "Breakout",
  simon: "Simon",
  osu: "OSU-like",
}

const achievementTypeOrder: Record<string, number> = {
  site: 0,
  minigames: 1,
  tetris: 2,
  dino: 3,
  minesweeper: 4,
  match3: 5,
  snake: 6,
  game2048: 7,
  breakout: 8,
  simon: 9,
  osu: 10,
}

function getAchievementType(id: string) {
  if (id === "games-routes" || id === "games-play-all" || id === "games-master") return "minigames"
  if (id.startsWith("tetris-")) return "tetris"
  if (id.startsWith("dino-")) return "dino"
  if (id.startsWith("minesweeper-")) return "minesweeper"
  if (id.startsWith("match3-")) return "match3"
  if (id.startsWith("snake-")) return "snake"
  if (id.startsWith("game2048-")) return "game2048"
  if (id.startsWith("breakout-")) return "breakout"
  if (id.startsWith("simon-")) return "simon"
  if (id.startsWith("osu-")) return "osu"
  return "site"
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  if (hours > 0) return `${hours}\u0447 ${minutes}\u043c`
  return `${minutes}\u043c ${String(seconds).padStart(2, "0")}\u0441`
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

  const orderedAchievements = useMemo(() => {
    return [...sortedAchievementViews].sort((first, second) => {
      const firstType = getAchievementType(first.id)
      const secondType = getAchievementType(second.id)
      const typeDiff = (achievementTypeOrder[firstType] ?? 999) - (achievementTypeOrder[secondType] ?? 999)
      if (typeDiff !== 0) return typeDiff

      const rarityDiff = (raritySortOrder[first.rarity] ?? 999) - (raritySortOrder[second.rarity] ?? 999)
      if (rarityDiff !== 0) return rarityDiff

      return first.title.localeCompare(second.title)
    })
  }, [sortedAchievementViews])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#d9f6ec_0%,#f7dcec_68%,#fbe5ef_100%)] px-4 pb-10 pt-20 text-[#111111] md:px-8">
      <div className="pointer-events-none absolute -left-24 top-8 h-[420px] w-[420px] rounded-full bg-[#8ed9ff]/35 blur-[90px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-[460px] w-[460px] rounded-full bg-[#ff8db6]/28 blur-[92px]" />

      <div className="relative z-10 mx-auto max-w-[1220px]">
        <section className="rounded-2xl border border-black/10 bg-[#fff6fb]/72 p-5 shadow-[0_18px_50px_rgba(58,17,37,0.14)] backdrop-blur-sm md:p-7">
          <h1 className="text-[clamp(28px,4.2vw,54px)] font-semibold leading-[0.92] tracking-[-0.03em]">
            {"\u041f\u0440\u043e\u0444\u0438\u043b\u044c"}
          </h1>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-black/10 bg-white/72 p-3.5">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">{"\u041f\u0440\u043e\u0433\u0440\u0435\u0441\u0441 \u0441\u0430\u0439\u0442\u0430"}</p>
              <p className="mt-1 text-2xl font-semibold">{siteProgressPercent}%</p>
              <div className="mt-2">
                <ProgressBar percent={siteProgressPercent} />
              </div>
            </article>
            <article className="rounded-xl border border-black/10 bg-white/72 p-3.5">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">{"\u0414\u043e\u0441\u0442\u0438\u0436\u0435\u043d\u0438\u044f"}</p>
              <p className="mt-1 text-2xl font-semibold">
                {unlockedCount}/{orderedAchievements.length}
              </p>
              <div className="mt-2">
                <ProgressBar percent={achievementsProgressPercent} />
              </div>
            </article>
            <article className="rounded-xl border border-black/10 bg-white/72 p-3.5">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">{"\u0410\u043a\u0442\u0438\u0432\u043d\u043e\u0435 \u0432\u0440\u0435\u043c\u044f"}</p>
              <p className="mt-1 text-2xl font-semibold">{formatDuration(data.totalSeconds)}</p>
              <p className="mt-2 text-xs text-black/60">
                {"\u0421\u0435\u0441\u0441\u0438\u0439"}: {data.sessions} | {"\u0418\u0433\u0440 \u043e\u0442\u043a\u0440\u044b\u0442\u043e"}: {gamesPlayed}
              </p>
            </article>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setShowMiniGames((previous) => !previous)}
              className="rounded-lg border border-black/16 bg-[linear-gradient(180deg,#ffffff_0%,#fff5fb_100%)] px-3.5 py-2 text-[11px] tracking-[0.12em] uppercase transition-all hover:border-black/28 hover:bg-white"
            >
              {showMiniGames ? "\u0421\u043a\u0440\u044b\u0442\u044c \u0438\u0433\u0440\u044b" : "\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0438\u0433\u0440\u0443"}
            </button>
            <Link
              href="/?tutorial=1"
              className="rounded-lg border border-black/16 bg-[linear-gradient(180deg,#ffffff_0%,#fff5fb_100%)] px-3.5 py-2 text-[11px] tracking-[0.12em] uppercase transition-all hover:border-black/28 hover:bg-white"
            >
              {"\u041f\u0435\u0440\u0435\u043f\u0440\u043e\u0439\u0442\u0438 \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435"}
            </Link>
            <Link
              href="/403"
              className="rounded-lg border border-[#8f1d1f]/40 bg-[linear-gradient(180deg,#fff8f8_0%,#ffeef0_100%)] px-3.5 py-2 text-[11px] tracking-[0.12em] text-[#7a1517] uppercase transition-all hover:border-[#8f1d1f]/60 hover:bg-[#ffe9ed]"
            >
              {"\u0410\u0434\u043c\u0438\u043d \u043f\u0430\u043d\u0435\u043b\u044c"}
            </Link>
          </div>

          {showMiniGames && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {miniGames.map((game) => (
                <Link
                  key={game.href}
                  href={game.href}
                  className="rounded-xl border border-black/12 bg-white/70 px-3 py-2.5 text-sm font-medium transition-all hover:border-black/24 hover:bg-white"
                >
                  {game.label}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4">
          <article className="rounded-2xl border border-black/10 bg-[#fff8fd]/76 p-4 shadow-[0_14px_40px_rgba(21,8,40,0.12)] backdrop-blur-sm md:p-5">
            <h2 className="text-[11px] tracking-[0.16em] text-black/56 uppercase">{"\u0414\u043e\u0441\u0442\u0438\u0436\u0435\u043d\u0438\u044f"}</h2>
            <div className="mt-3 max-h-[62vh] space-y-2.5 overflow-y-auto pr-1">
              {orderedAchievements.map((achievement, index) => {
                const percent = Math.round(ratio(achievement.progress.value, achievement.progress.target) * 100)
                const rarityClass = rarityClassByKey[achievement.rarity] ?? rarityClassByKey.common
                const rarityText = rarityTextByKey[achievement.rarity] ?? achievement.rarity
                const unlockedAt = formatDate(achievement.unlockedAt)

                const achievementType = getAchievementType(achievement.id)
                const previousType = index > 0 ? getAchievementType(orderedAchievements[index - 1].id) : null
                const showTypeHeader = index === 0 || achievementType !== previousType

                return (
                  <div key={achievement.id} className="space-y-2.5">
                    {showTypeHeader && (
                      <div className="flex items-center gap-2.5 pb-0.5 pt-1">
                        <span className="shrink-0 text-[10px] tracking-[0.16em] text-black/58 uppercase">
                          {achievementTypeLabels[achievementType] ?? achievementTypeLabels.site}
                        </span>
                        <span className="h-px w-full bg-[linear-gradient(90deg,rgba(17,17,17,0.28)_0%,rgba(17,17,17,0.08)_100%)]" />
                      </div>
                    )}

                    <article
                      className={`rounded-xl border p-3.5 transition-colors ${
                        achievement.unlocked
                          ? "border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.92)_0%,rgba(255,245,251,0.82)_100%)]"
                          : "border-black/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.66)_0%,rgba(255,248,253,0.52)_100%)]"
                      }`}
                    >
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                        <div>
                          <p className="text-[15px] font-semibold leading-[1.2] tracking-[-0.01em]">{achievement.title}</p>
                          <p className="mt-1 text-xs leading-[1.45] text-black/66">{achievement.description}</p>
                          {achievement.unlocked && unlockedAt && (
                            <p className="mt-1.5 text-[10px] tracking-[0.08em] text-black/52 uppercase">
                              {"\u041e\u0442\u043a\u0440\u044b\u0442\u043e"}: {unlockedAt}
                            </p>
                          )}
                        </div>

                        <div className="flex items-start justify-start md:justify-end">
                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] tracking-[0.11em] uppercase ${rarityClass}`}
                          >
                            {rarityText}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="mb-1.5 flex items-center justify-between text-[10px] tracking-[0.11em] text-black/56 uppercase">
                          <span>
                            {Math.min(achievement.progress.value, achievement.progress.target)}/{achievement.progress.target}
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <ProgressBar percent={percent} />
                      </div>
                    </article>
                  </div>
                )
              })}
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}
