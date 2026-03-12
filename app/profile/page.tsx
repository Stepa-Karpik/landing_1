"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useProfileTracker } from "@/components/profile-provider"

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const ratio = (value: number, target: number) => (target <= 0 ? 0 : clamp(value / target, 0, 1))
const ACHIEVEMENTS_PER_PAGE = 12

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
  impossible: "Невозможное",
}

const raritySortOrder: Record<string, number> = {
  impossible: 0,
  legendary: 1,
  epic: 2,
  rare: 3,
  common: 4,
}

const miniGames: Array<{
  href: string
  label: string
  tone: string
  start: string
  end: string
}> = [
  { href: "/minigames/tetris", label: "Тетрис", tone: "Чистая геометрия и ритм", start: "#8ed9ff", end: "#8aa4ff" },
  { href: "/minigames/dino", label: "Динозаврик", tone: "Бег на рефлексе", start: "#97f3b4", end: "#44c58f" },
  { href: "/minigames/minesweeper", label: "Сапёр", tone: "Логика и риск", start: "#ffd78a", end: "#ffb067" },
  { href: "/minigames/match3", label: "Три в ряд", tone: "Комбо и каскады", start: "#ff8fb7", end: "#ff6a87" },
  { href: "/minigames/snake", label: "Змейка", tone: "Контроль темпа", start: "#8be7b8", end: "#35bd81" },
  { href: "/minigames/2048", label: "2048", tone: "Слияния и план", start: "#f9d66f", end: "#f0a948" },
  { href: "/minigames/breakout", label: "Арканоид", tone: "Растущий хаос", start: "#9ad6ff", end: "#6f8fff" },
  { href: "/minigames/simon", label: "Саймон", tone: "Память и скорость", start: "#ff9ec2", end: "#ff6c92" },
  { href: "/minigames/osu", label: "OSU-like", tone: "Музыкальный нажим", start: "#d8b3ff", end: "#a684ff" },
]

const achievementTypeLabels: Record<string, string> = {
  site: "Сайт",
  minigames: "Мини-игры",
  tetris: "Тетрис",
  dino: "Динозаврик",
  minesweeper: "Сапёр",
  match3: "Три в ряд",
  snake: "Змейка",
  game2048: "2048",
  breakout: "Арканоид",
  simon: "Саймон",
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

  const [activeGameIndex, setActiveGameIndex] = useState(0)
  const [selectedType, setSelectedType] = useState<string>("all")
  const [achievementPage, setAchievementPage] = useState(0)

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

  const typeTabs = useMemo(() => {
    const values: string[] = ["all"]
    const seen = new Set<string>()
    for (const achievement of orderedAchievements) {
      const type = getAchievementType(achievement.id)
      if (seen.has(type)) continue
      seen.add(type)
      values.push(type)
    }
    return values
  }, [orderedAchievements])

  useEffect(() => {
    setAchievementPage(0)
  }, [selectedType])

  const filteredAchievements = useMemo(() => {
    if (selectedType === "all") return orderedAchievements
    return orderedAchievements.filter((achievement) => getAchievementType(achievement.id) === selectedType)
  }, [orderedAchievements, selectedType])

  const pageCount = Math.max(1, Math.ceil(filteredAchievements.length / ACHIEVEMENTS_PER_PAGE))

  useEffect(() => {
    setAchievementPage((previous) => clamp(previous, 0, pageCount - 1))
  }, [pageCount])

  const visibleAchievements = useMemo(() => {
    const start = achievementPage * ACHIEVEMENTS_PER_PAGE
    return filteredAchievements.slice(start, start + ACHIEVEMENTS_PER_PAGE)
  }, [achievementPage, filteredAchievements])

  const activeGame = miniGames[activeGameIndex]

  return (
    <main className="relative h-screen overflow-hidden bg-[linear-gradient(145deg,#d9f6ec_0%,#f7dcec_68%,#fbe5ef_100%)] px-2 pb-2 pt-20 text-[#111111] md:px-5">
      <div className="pointer-events-none absolute -left-24 top-6 h-[440px] w-[440px] rounded-full bg-[#8ed9ff]/35 blur-[96px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-[480px] w-[480px] rounded-full bg-[#ff8db6]/28 blur-[100px]" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1720px] flex-col gap-3">
        <section className="rounded-2xl border border-black/10 bg-[#fff6fb]/74 p-4 shadow-[0_18px_52px_rgba(58,17,37,0.14)] backdrop-blur-sm md:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-[clamp(28px,4.2vw,52px)] font-semibold leading-[0.9] tracking-[-0.03em]">Профиль</h1>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/?tutorial=1"
                className="rounded-lg border border-black/16 bg-[linear-gradient(180deg,#ffffff_0%,#fff5fb_100%)] px-3.5 py-2 text-[11px] tracking-[0.12em] uppercase transition-all hover:border-black/28 hover:bg-white"
              >
                Перепройти обучение
              </Link>
              <Link
                href="/403"
                className="rounded-lg border border-[#8f1d1f]/40 bg-[linear-gradient(180deg,#fff8f8_0%,#ffeef0_100%)] px-3.5 py-2 text-[11px] tracking-[0.12em] text-[#7a1517] uppercase transition-all hover:border-[#8f1d1f]/60 hover:bg-[#ffe9ed]"
              >
                Админ панель
              </Link>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-12">
            <article className="rounded-xl border border-black/10 bg-white/74 p-3 xl:col-span-2">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Прогресс сайта</p>
              <p className="mt-1 text-2xl font-semibold">{siteProgressPercent}%</p>
              <div className="mt-2">
                <ProgressBar percent={siteProgressPercent} />
              </div>
            </article>

            <article className="rounded-xl border border-black/10 bg-white/74 p-3 xl:col-span-2">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Достижения</p>
              <p className="mt-1 text-2xl font-semibold">
                {unlockedCount}/{orderedAchievements.length}
              </p>
              <div className="mt-2">
                <ProgressBar percent={achievementsProgressPercent} />
              </div>
            </article>

            <article className="rounded-xl border border-black/10 bg-white/74 p-3 xl:col-span-2">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Активное время</p>
              <p className="mt-1 text-2xl font-semibold">{formatDuration(data.totalSeconds)}</p>
              <p className="mt-1 text-[11px] text-black/60">Сессий: {data.sessions}</p>
            </article>

            <article className="rounded-xl border border-black/10 bg-[#fff8fd]/78 p-3 shadow-[0_10px_26px_rgba(21,8,40,0.12)] backdrop-blur-sm xl:col-span-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.16em] text-black/56 uppercase">Игровая станция</p>
                <span className="text-[10px] tracking-[0.16em] text-black/52 uppercase">
                  {activeGameIndex + 1}/{miniGames.length} • {gamesPlayed} открыто
                </span>
              </div>

              <div className="mt-2 grid grid-cols-[34px_minmax(0,1fr)_34px] items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveGameIndex((previous) => (previous - 1 + miniGames.length) % miniGames.length)}
                  className="h-9 rounded-lg border border-black/14 bg-white/78 text-xl leading-none transition-colors hover:bg-white"
                  aria-label="Предыдущая игра"
                >
                  ‹
                </button>

                <div
                  className="relative overflow-hidden rounded-2xl border border-black/14 p-2.5 text-white shadow-[0_12px_24px_rgba(0,0,0,0.16)]"
                  style={{ background: `linear-gradient(145deg, ${activeGame.start}, ${activeGame.end})` }}
                >
                  <div className="pointer-events-none absolute -left-6 -top-10 h-24 w-24 rounded-full bg-white/26 blur-xl" />
                  <div className="pointer-events-none absolute -bottom-10 -right-6 h-24 w-24 rounded-full bg-black/12 blur-xl" />

                  <p className="relative text-[10px] tracking-[0.16em] text-white/86 uppercase">Выбор игры</p>
                  <p className="relative mt-1 text-2xl font-semibold leading-[0.9] tracking-[-0.02em]">{activeGame.label}</p>
                  <p className="relative mt-1.5 text-[11px] text-white/90">{activeGame.tone}</p>

                  <Link
                    href={activeGame.href}
                    className="relative mt-2 inline-flex rounded-lg border border-white/42 bg-white/18 px-2.5 py-1.5 text-[10px] tracking-[0.12em] uppercase transition-colors hover:bg-white/26"
                  >
                    Запустить
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGameIndex((previous) => (previous + 1) % miniGames.length)}
                  className="h-9 rounded-lg border border-black/14 bg-white/78 text-xl leading-none transition-colors hover:bg-white"
                  aria-label="Следующая игра"
                >
                  ›
                </button>
              </div>

              <div className="mt-2 grid grid-cols-9 gap-1.5">
                {miniGames.map((game, index) => {
                  const active = index === activeGameIndex
                  return (
                    <button
                      key={game.href}
                      type="button"
                      onClick={() => setActiveGameIndex(index)}
                      className={`h-2.5 rounded-full transition-all ${active ? "bg-black" : "bg-black/18 hover:bg-black/30"}`}
                      aria-label={game.label}
                    />
                  )
                })}
              </div>
            </article>
          </div>
        </section>

        <section className="min-h-0 flex-1">
          <article className="flex h-full min-h-0 flex-col rounded-2xl border border-black/10 bg-[#fff8fd]/78 p-3.5 shadow-[0_14px_40px_rgba(21,8,40,0.12)] backdrop-blur-sm md:p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[11px] tracking-[0.16em] text-black/56 uppercase">Достижения</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAchievementPage((previous) => clamp(previous - 1, 0, pageCount - 1))}
                  className="h-7 w-7 rounded-lg border border-black/14 bg-white/78 text-sm leading-none transition-colors hover:bg-white"
                  aria-label="Предыдущая страница"
                >
                  ‹
                </button>
                <span className="text-[10px] tracking-[0.14em] text-black/56 uppercase">
                  {achievementPage + 1}/{pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setAchievementPage((previous) => clamp(previous + 1, 0, pageCount - 1))}
                  className="h-7 w-7 rounded-lg border border-black/14 bg-white/78 text-sm leading-none transition-colors hover:bg-white"
                  aria-label="Следующая страница"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {typeTabs.map((type) => {
                const active = selectedType === type
                const label = type === "all" ? "Все" : achievementTypeLabels[type] ?? "Сайт"
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] tracking-[0.11em] uppercase transition-colors ${
                      active
                        ? "border-black bg-black text-white"
                        : "border-black/14 bg-white/74 text-black/72 hover:bg-white"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <div className="mt-2 grid flex-1 auto-rows-fr grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleAchievements.map((achievement) => {
                const percent = Math.round(ratio(achievement.progress.value, achievement.progress.target) * 100)
                const rarityClass = rarityClassByKey[achievement.rarity] ?? rarityClassByKey.common
                const rarityText = rarityTextByKey[achievement.rarity] ?? achievement.rarity
                const unlockedAt = formatDate(achievement.unlockedAt)
                const type = getAchievementType(achievement.id)

                return (
                  <article
                    key={achievement.id}
                    className={`rounded-lg border p-2.5 transition-colors ${
                      achievement.unlocked
                        ? "border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.92)_0%,rgba(255,245,251,0.82)_100%)]"
                        : "border-black/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.66)_0%,rgba(255,248,253,0.52)_100%)]"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-1.5">
                      <span className="text-[9px] tracking-[0.12em] text-black/56 uppercase">
                        {achievementTypeLabels[type] ?? "Сайт"}
                      </span>
                      <span className={`rounded-full border px-1.5 py-0.5 text-[9px] tracking-[0.1em] uppercase ${rarityClass}`}>
                        {rarityText}
                      </span>
                    </div>

                    <p className="text-[13px] font-semibold leading-[1.15]">{achievement.title}</p>
                    <p className="mt-0.5 text-[10px] leading-[1.25] text-black/66">{achievement.description}</p>

                    <div className="mt-1.5">
                      <div className="mb-0.5 flex items-center justify-between text-[9px] tracking-[0.09em] text-black/56 uppercase">
                        <span>
                          {Math.min(achievement.progress.value, achievement.progress.target)}/{achievement.progress.target}
                        </span>
                        <span>{percent}%</span>
                      </div>
                      <ProgressBar percent={percent} />
                    </div>

                    {achievement.unlocked && unlockedAt && (
                      <p className="mt-1 text-[9px] tracking-[0.08em] text-black/52 uppercase">Открыто: {unlockedAt}</p>
                    )}
                  </article>
                )
              })}

              {Array.from({ length: Math.max(0, ACHIEVEMENTS_PER_PAGE - visibleAchievements.length) }).map((_, index) => (
                <div key={`placeholder-${index}`} className="rounded-lg border border-black/8 bg-white/35" />
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}
