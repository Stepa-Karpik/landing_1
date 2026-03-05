"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

type Rarity = "common" | "rare" | "epic" | "legendary"
type GameId = "tetris" | "dino" | "minesweeper" | "match3"

interface GameStatsEntry {
  plays: number
  wins: number
  bestScore: number
  lastScore: number
  bestTimeMs: number | null
}

interface ProfileData {
  version: 1
  sessions: number
  profileOpenCount: number
  totalSeconds: number
  visitedRoutes: string[]
  routeVisits: Record<string, number>
  discoveredLinks: string[]
  clickedLinks: string[]
  hoveredButtons: string[]
  clickedButtons: string[]
  stackTargets: string[]
  stackHovered: string[]
  stackClicked: string[]
  unlockedAchievements: string[]
  unlockedAt: Record<string, string>
  gameStats: Record<GameId, GameStatsEntry>
}

interface ProgressInfo {
  value: number
  target: number
}

interface AchievementDefinition {
  id: string
  title: string
  description: string
  rarity: Rarity
  getProgress: (data: ProfileData, siteProgressPercent: number) => ProgressInfo
  isUnlocked?: (data: ProfileData, progress: ProgressInfo, siteProgressPercent: number) => boolean
}

interface AchievementView extends AchievementDefinition {
  progress: ProgressInfo
  unlocked: boolean
  unlockedAt?: string
}

interface ToastItem {
  id: string
  title: string
  rarity: Rarity
}

interface GameResultPayload {
  score?: number
  win?: boolean
  timeMs?: number
}

interface ProfileContextValue {
  data: ProfileData
  recordGameResult: (gameId: GameId, payload: GameResultPayload) => void
}

const STORAGE_KEY = "landing.profile.v1"
const SESSION_KEY = "landing.profile.session.v1"
const STACK_TARGET_MIN = 36
const REQUIRED_DISCOVERED_LINKS = 20

const MAIN_ROUTES = ["/", "/sostav", "/lyudi", "/stek", "/craft", "/projects", "/works"] as const
const GAME_ROUTES = ["/minigames/tetris", "/minigames/dino", "/minigames/minesweeper", "/minigames/match3"] as const
const SITE_ROUTES = [...MAIN_ROUTES, ...GAME_ROUTES] as const

const miniGames: ReadonlyArray<{ id: GameId; label: string; href: (typeof GAME_ROUTES)[number]; goal: string }> = [
  { id: "tetris", label: "Тетрис", href: "/minigames/tetris", goal: "700 очков" },
  { id: "dino", label: "Динозаврик", href: "/minigames/dino", goal: "600 очков" },
  { id: "minesweeper", label: "Сапер", href: "/minigames/minesweeper", goal: "1 победа" },
  { id: "match3", label: "Три в ряд", href: "/minigames/match3", goal: "450 очков" },
]

const rarityStyles: Record<Rarity, { badge: string; accent: string }> = {
  common: { badge: "bg-black/5 text-black/60 border-black/10", accent: "#6b7280" },
  rare: { badge: "bg-blue-50 text-blue-700 border-blue-200", accent: "#2563eb" },
  epic: { badge: "bg-orange-50 text-orange-700 border-orange-200", accent: "#c2410c" },
  legendary: { badge: "bg-black text-white border-black", accent: "#111111" },
}

const rarityOrder: Record<Rarity, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
}

const defaultGameEntry: GameStatsEntry = {
  plays: 0,
  wins: 0,
  bestScore: 0,
  lastScore: 0,
  bestTimeMs: null,
}

const DEFAULT_PROFILE: ProfileData = {
  version: 1,
  sessions: 0,
  profileOpenCount: 0,
  totalSeconds: 0,
  visitedRoutes: [],
  routeVisits: {},
  discoveredLinks: [],
  clickedLinks: [],
  hoveredButtons: [],
  clickedButtons: [],
  stackTargets: [],
  stackHovered: [],
  stackClicked: [],
  unlockedAchievements: [],
  unlockedAt: {},
  gameStats: {
    tetris: { ...defaultGameEntry },
    dino: { ...defaultGameEntry },
    minesweeper: { ...defaultGameEntry },
    match3: { ...defaultGameEntry },
  },
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const ratio = (value: number, target: number) => (target <= 0 ? 0 : clamp(value / target, 0, 1))
const nowIso = () => new Date().toISOString()

function uniquePush(list: string[], item: string) {
  if (list.includes(item)) return list
  return [...list, item]
}

function uniqueMerge(list: string[], items: string[]) {
  const next = [...list]
  let changed = false
  for (const item of items) {
    if (!item || next.includes(item)) continue
    next.push(item)
    changed = true
  }
  return changed ? next : list
}

function normalizePath(path: string) {
  if (!path || path === "/") return "/"
  const noHash = path.split("#")[0]
  const noQuery = noHash.split("?")[0]
  const trimmed = noQuery.replace(/\/+$/, "")
  return trimmed.length > 0 ? trimmed : "/"
}

function parseLinkKey(anchor: HTMLAnchorElement) {
  const explicit = anchor.dataset.achievementLinkId
  if (explicit) return explicit

  const hrefAttr = anchor.getAttribute("href")
  if (!hrefAttr) return ""
  if (hrefAttr.startsWith("javascript:")) return ""

  try {
    const resolved = new URL(hrefAttr, window.location.origin)
    if (resolved.origin === window.location.origin) {
      return normalizePath(resolved.pathname)
    }
    return `${resolved.hostname}${resolved.pathname}`
  } catch {
    return hrefAttr
  }
}

function parseButtonKey(button: HTMLButtonElement, pathname: string) {
  const explicit = button.dataset.achievementButtonId
  if (explicit) return `${pathname}::${explicit}`
  const text = button.textContent?.replace(/\s+/g, " ").trim().slice(0, 48) ?? ""
  if (!text) return `${pathname}::button`
  return `${pathname}::${text}`
}

function sanitizeProfileData(raw: unknown): ProfileData {
  if (!raw || typeof raw !== "object") return DEFAULT_PROFILE
  const candidate = raw as Partial<ProfileData>
  const gameStatsRaw = (candidate.gameStats ?? {}) as Partial<Record<GameId, Partial<GameStatsEntry>>>

  const normalizeEntry = (entry: Partial<GameStatsEntry> | undefined): GameStatsEntry => ({
    plays: Math.max(0, Number(entry?.plays ?? 0) || 0),
    wins: Math.max(0, Number(entry?.wins ?? 0) || 0),
    bestScore: Math.max(0, Number(entry?.bestScore ?? 0) || 0),
    lastScore: Math.max(0, Number(entry?.lastScore ?? 0) || 0),
    bestTimeMs:
      entry?.bestTimeMs === null || entry?.bestTimeMs === undefined
        ? null
        : Math.max(0, Number(entry.bestTimeMs) || 0),
  })

  return {
    version: 1,
    sessions: Math.max(0, Number(candidate.sessions ?? 0) || 0),
    profileOpenCount: Math.max(0, Number(candidate.profileOpenCount ?? 0) || 0),
    totalSeconds: Math.max(0, Number(candidate.totalSeconds ?? 0) || 0),
    visitedRoutes: Array.isArray(candidate.visitedRoutes) ? candidate.visitedRoutes.filter((value): value is string => typeof value === "string") : [],
    routeVisits: candidate.routeVisits && typeof candidate.routeVisits === "object" ? (candidate.routeVisits as Record<string, number>) : {},
    discoveredLinks: Array.isArray(candidate.discoveredLinks)
      ? candidate.discoveredLinks.filter((value): value is string => typeof value === "string")
      : [],
    clickedLinks: Array.isArray(candidate.clickedLinks)
      ? candidate.clickedLinks.filter((value): value is string => typeof value === "string")
      : [],
    hoveredButtons: Array.isArray(candidate.hoveredButtons)
      ? candidate.hoveredButtons.filter((value): value is string => typeof value === "string")
      : [],
    clickedButtons: Array.isArray(candidate.clickedButtons)
      ? candidate.clickedButtons.filter((value): value is string => typeof value === "string")
      : [],
    stackTargets: Array.isArray(candidate.stackTargets)
      ? candidate.stackTargets.filter((value): value is string => typeof value === "string")
      : [],
    stackHovered: Array.isArray(candidate.stackHovered)
      ? candidate.stackHovered.filter((value): value is string => typeof value === "string")
      : [],
    stackClicked: Array.isArray(candidate.stackClicked)
      ? candidate.stackClicked.filter((value): value is string => typeof value === "string")
      : [],
    unlockedAchievements: Array.isArray(candidate.unlockedAchievements)
      ? candidate.unlockedAchievements.filter((value): value is string => typeof value === "string")
      : [],
    unlockedAt: candidate.unlockedAt && typeof candidate.unlockedAt === "object" ? (candidate.unlockedAt as Record<string, string>) : {},
    gameStats: {
      tetris: normalizeEntry(gameStatsRaw.tetris),
      dino: normalizeEntry(gameStatsRaw.dino),
      minesweeper: normalizeEntry(gameStatsRaw.minesweeper),
      match3: normalizeEntry(gameStatsRaw.match3),
    },
  }
}

function countVisited(data: ProfileData, routes: readonly string[]) {
  return routes.reduce((acc, route) => (data.visitedRoutes.includes(route) ? acc + 1 : acc), 0)
}

function countMatched(values: string[], targets: string[]) {
  if (targets.length === 0) return 0
  const targetSet = new Set(targets)
  return values.reduce((acc, value) => (targetSet.has(value) ? acc + 1 : acc), 0)
}

function getSiteProgress(data: ProfileData) {
  const mainRoutesProgress = ratio(countVisited(data, MAIN_ROUTES), MAIN_ROUTES.length)
  const gameRoutesProgress = ratio(countVisited(data, GAME_ROUTES), GAME_ROUTES.length)

  const discoveredTarget = Math.max(data.discoveredLinks.length, REQUIRED_DISCOVERED_LINKS)
  const linkProgress = ratio(data.clickedLinks.length, discoveredTarget)

  const stackTarget = Math.max(data.stackTargets.length, STACK_TARGET_MIN)
  const stackHoverProgress = ratio(countMatched(data.stackHovered, data.stackTargets), stackTarget)
  const stackClickProgress = ratio(countMatched(data.stackClicked, data.stackTargets), stackTarget)

  const total = (mainRoutesProgress + gameRoutesProgress + linkProgress + stackHoverProgress + stackClickProgress) / 5
  return Math.round(total * 100)
}

const achievementDefinitions: AchievementDefinition[] = [
  {
    id: "main-routes",
    title: "Навигатор",
    description: "Посетить все основные разделы сайта.",
    rarity: "common",
    getProgress: (data) => ({ value: countVisited(data, MAIN_ROUTES), target: MAIN_ROUTES.length }),
  },
  {
    id: "full-routes",
    title: "Карта мира",
    description: "Открыть все маршруты сайта, включая мини-игры.",
    rarity: "rare",
    getProgress: (data) => ({ value: countVisited(data, SITE_ROUTES), target: SITE_ROUTES.length }),
  },
  {
    id: "links-15",
    title: "Следопыт ссылок I",
    description: "Нажать 10 уникальных ссылок.",
    rarity: "common",
    getProgress: (data) => ({ value: data.clickedLinks.length, target: 10 }),
  },
  {
    id: "links-30",
    title: "Следопыт ссылок II",
    description: "Нажать 20 уникальных ссылок.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.clickedLinks.length, target: 20 }),
  },
  {
    id: "links-perfect",
    title: "Без пропусков",
    description: "Нажать все обнаруженные ссылки на сайте.",
    rarity: "epic",
    getProgress: (data) => ({
      value: data.clickedLinks.length,
      target: Math.max(data.discoveredLinks.length, REQUIRED_DISCOVERED_LINKS),
    }),
    isUnlocked: (data) =>
      data.discoveredLinks.length >= REQUIRED_DISCOVERED_LINKS && data.clickedLinks.length >= data.discoveredLinks.length,
  },
  {
    id: "buttons-hover-25",
    title: "Тестировщик UI I",
    description: "Навестись на 25 разных кнопок.",
    rarity: "common",
    getProgress: (data) => ({ value: data.hoveredButtons.length, target: 25 }),
  },
  {
    id: "buttons-hover-60",
    title: "Тестировщик UI II",
    description: "Навестись на 60 разных кнопок.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.hoveredButtons.length, target: 60 }),
  },
  {
    id: "buttons-click-25",
    title: "Клик-мастер I",
    description: "Нажать 25 разных кнопок.",
    rarity: "common",
    getProgress: (data) => ({ value: data.clickedButtons.length, target: 25 }),
  },
  {
    id: "buttons-click-50",
    title: "Клик-мастер II",
    description: "Нажать 50 разных кнопок.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.clickedButtons.length, target: 50 }),
  },
  {
    id: "stack-hover-all",
    title: "Сканер стэка",
    description: "Навестись на все кнопки в блоке «Стэк».",
    rarity: "epic",
    getProgress: (data) => {
      const target = Math.max(data.stackTargets.length, STACK_TARGET_MIN)
      return { value: countMatched(data.stackHovered, data.stackTargets), target }
    },
    isUnlocked: (data) =>
      data.stackTargets.length >= STACK_TARGET_MIN && countMatched(data.stackHovered, data.stackTargets) >= data.stackTargets.length,
  },
  {
    id: "stack-click-all",
    title: "Инженер стэка",
    description: "Нажать все кнопки в блоке «Стэк».",
    rarity: "legendary",
    getProgress: (data) => {
      const target = Math.max(data.stackTargets.length, STACK_TARGET_MIN)
      return { value: countMatched(data.stackClicked, data.stackTargets), target }
    },
    isUnlocked: (data) =>
      data.stackTargets.length >= STACK_TARGET_MIN && countMatched(data.stackClicked, data.stackTargets) >= data.stackTargets.length,
  },
  {
    id: "profile-open-5",
    title: "Пульс профиля I",
    description: "Открыть профиль 5 раз.",
    rarity: "common",
    getProgress: (data) => ({ value: data.profileOpenCount, target: 5 }),
  },
  {
    id: "profile-open-15",
    title: "Пульс профиля II",
    description: "Открыть профиль 15 раз.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.profileOpenCount, target: 15 }),
  },
  {
    id: "sessions-3",
    title: "Возвращение I",
    description: "Зайти на сайт в 3 разных сессиях.",
    rarity: "common",
    getProgress: (data) => ({ value: data.sessions, target: 3 }),
  },
  {
    id: "sessions-7",
    title: "Возвращение II",
    description: "Зайти на сайт в 7 разных сессиях.",
    rarity: "epic",
    getProgress: (data) => ({ value: data.sessions, target: 7 }),
  },
  {
    id: "time-10m",
    title: "Глубокий просмотр I",
    description: "Провести на сайте 10 минут активного времени.",
    rarity: "common",
    getProgress: (data) => ({ value: data.totalSeconds, target: 600 }),
  },
  {
    id: "time-30m",
    title: "Глубокий просмотр II",
    description: "Провести на сайте 30 минут активного времени.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.totalSeconds, target: 1800 }),
  },
  {
    id: "site-100",
    title: "Просмотрено полностью",
    description: "Достичь 100% прогресса изучения сайта.",
    rarity: "legendary",
    getProgress: (_, siteProgressPercent) => ({ value: siteProgressPercent, target: 100 }),
  },
  {
    id: "games-routes",
    title: "Ретро-тур",
    description: "Открыть все маршруты мини-игр.",
    rarity: "rare",
    getProgress: (data) => ({ value: countVisited(data, GAME_ROUTES), target: GAME_ROUTES.length }),
  },
  {
    id: "games-play-all",
    title: "Аркадник",
    description: "Сыграть во все мини-игры хотя бы один раз.",
    rarity: "rare",
    getProgress: (data) => {
      const value = miniGames.reduce((acc, game) => (data.gameStats[game.id].plays > 0 ? acc + 1 : acc), 0)
      return { value, target: miniGames.length }
    },
  },
  {
    id: "tetris-700",
    title: "Тетрис: стабильный темп",
    description: "Набрать 700 очков в тетрисе.",
    rarity: "epic",
    getProgress: (data) => ({ value: data.gameStats.tetris.bestScore, target: 700 }),
  },
  {
    id: "dino-600",
    title: "Дино: длинный забег",
    description: "Набрать 600 очков в динозаврике.",
    rarity: "epic",
    getProgress: (data) => ({ value: data.gameStats.dino.bestScore, target: 600 }),
  },
  {
    id: "minesweeper-win",
    title: "Сапер: чистое поле",
    description: "Выиграть в сапере минимум один раз.",
    rarity: "epic",
    getProgress: (data) => ({ value: data.gameStats.minesweeper.wins, target: 1 }),
  },
  {
    id: "match3-450",
    title: "Три в ряд: комбо",
    description: "Набрать 450 очков в игре «Три в ряд».",
    rarity: "epic",
    getProgress: (data) => ({ value: data.gameStats.match3.bestScore, target: 450 }),
  },
  {
    id: "games-master",
    title: "Покоритель мини-игр",
    description: "Выполнить цели всех мини-игр.",
    rarity: "legendary",
    getProgress: (data) => {
      const tetrisDone = data.gameStats.tetris.bestScore >= 700 ? 1 : 0
      const dinoDone = data.gameStats.dino.bestScore >= 600 ? 1 : 0
      const minesweeperDone = data.gameStats.minesweeper.wins >= 1 ? 1 : 0
      const match3Done = data.gameStats.match3.bestScore >= 450 ? 1 : 0
      return { value: tetrisDone + dinoDone + minesweeperDone + match3Done, target: 4 }
    },
  },
  {
    id: "achievements-20",
    title: "Коллекционер достижений",
    description: "Открыть 20 достижений.",
    rarity: "legendary",
    getProgress: (data) => ({ value: data.unlockedAchievements.length, target: 20 }),
  },
]

function getAchievementViews(data: ProfileData, siteProgressPercent: number): AchievementView[] {
  return achievementDefinitions.map((definition) => {
    const progress = definition.getProgress(data, siteProgressPercent)
    const unlockedByRule = definition.isUnlocked
      ? definition.isUnlocked(data, progress, siteProgressPercent)
      : progress.value >= progress.target
    const alreadyUnlocked = data.unlockedAchievements.includes(definition.id)
    return {
      ...definition,
      progress,
      unlocked: alreadyUnlocked || unlockedByRule,
      unlockedAt: data.unlockedAt[definition.id],
    }
  })
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/8">
      <div
        className="h-full rounded-full bg-black transition-[width] duration-300"
        style={{ width: `${clamp(value, 0, 100)}%` }}
      />
    </div>
  )
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const pathnameRaw = usePathname()
  const pathname = normalizePath(pathnameRaw ?? "/")
  const [data, setData] = useState<ProfileData>(DEFAULT_PROFILE)
  const [hydrated, setHydrated] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [showMiniGames, setShowMiniGames] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const skipToastForInitialSyncRef = useRef(true)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setHydrated(true)
        return
      }
      const parsed = JSON.parse(raw) as unknown
      setData(sanitizeProfileData(parsed))
    } catch {
      setData(DEFAULT_PROFILE)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Ignore storage write issues.
    }
  }, [data, hydrated])

  useEffect(() => {
    if (!hydrated) return
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === "1") return
      window.sessionStorage.setItem(SESSION_KEY, "1")
      setData((previous) => ({ ...previous, sessions: previous.sessions + 1 }))
    } catch {
      setData((previous) => ({ ...previous, sessions: previous.sessions + 1 }))
    }
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      setData((previous) => ({ ...previous, totalSeconds: previous.totalSeconds + 1 }))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return
    setData((previous) => {
      const nextVisited = uniquePush(previous.visitedRoutes, pathname)
      const nextCount = (previous.routeVisits[pathname] ?? 0) + 1
      return {
        ...previous,
        visitedRoutes: nextVisited,
        routeVisits: {
          ...previous.routeVisits,
          [pathname]: nextCount,
        },
      }
    })
  }, [pathname, hydrated])

  useEffect(() => {
    if (!hydrated) return
    const timer = window.setTimeout(() => {
      const stackElements = Array.from(document.querySelectorAll<HTMLElement>("[data-stack-id]"))
      const stackIds = stackElements.map((element) => element.dataset.stackId ?? "").filter(Boolean)
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).filter(
        (anchor) => !anchor.closest("[data-profile-ui='1']"),
      )
      const linkKeys = anchors.map(parseLinkKey).filter(Boolean)

      setData((previous) => {
        const nextTargets = uniqueMerge(previous.stackTargets, stackIds)
        const nextLinks = uniqueMerge(previous.discoveredLinks, linkKeys)
        if (nextTargets === previous.stackTargets && nextLinks === previous.discoveredLinks) {
          return previous
        }
        return {
          ...previous,
          stackTargets: nextTargets,
          discoveredLinks: nextLinks,
        }
      })
    }, 80)

    return () => window.clearTimeout(timer)
  }, [pathname, hydrated])

  useEffect(() => {
    if (!hydrated) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target || target.closest("[data-profile-ui='1']")) return

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null
      if (anchor) {
        const key = parseLinkKey(anchor)
        if (key) {
          setData((previous) => {
            const nextClicked = uniquePush(previous.clickedLinks, key)
            if (nextClicked === previous.clickedLinks) return previous
            return { ...previous, clickedLinks: nextClicked }
          })
        }
      }

      const button = target.closest("button") as HTMLButtonElement | null
      if (button) {
        const buttonKey = parseButtonKey(button, pathname)
        setData((previous) => {
          const nextClicked = uniquePush(previous.clickedButtons, buttonKey)
          if (nextClicked === previous.clickedButtons) return previous
          return { ...previous, clickedButtons: nextClicked }
        })
      }

      const stackElement = target.closest("[data-stack-id]") as HTMLElement | null
      const stackId = stackElement?.dataset.stackId
      if (stackId) {
        setData((previous) => {
          const nextStackClicks = uniquePush(previous.stackClicked, stackId)
          if (nextStackClicks === previous.stackClicked) return previous
          return { ...previous, stackClicked: nextStackClicks }
        })
      }
    }

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target || target.closest("[data-profile-ui='1']")) return

      const button = target.closest("button") as HTMLButtonElement | null
      if (button) {
        const buttonKey = parseButtonKey(button, pathname)
        setData((previous) => {
          const nextHovered = uniquePush(previous.hoveredButtons, buttonKey)
          if (nextHovered === previous.hoveredButtons) return previous
          return { ...previous, hoveredButtons: nextHovered }
        })
      }

      const stackElement = target.closest("[data-stack-id]") as HTMLElement | null
      const stackId = stackElement?.dataset.stackId
      if (stackId) {
        setData((previous) => {
          const nextStackHover = uniquePush(previous.stackHovered, stackId)
          if (nextStackHover === previous.stackHovered) return previous
          return { ...previous, stackHovered: nextStackHover }
        })
      }
    }

    document.addEventListener("click", handleClick, true)
    document.addEventListener("mouseover", handleMouseOver, true)

    return () => {
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("mouseover", handleMouseOver, true)
    }
  }, [pathname, hydrated])

  useEffect(() => {
    if (pathname !== "/") {
      setProfileOpen(false)
      setShowMiniGames(false)
    }
  }, [pathname])

  const siteProgressPercent = useMemo(() => getSiteProgress(data), [data])
  const achievementViews = useMemo(() => getAchievementViews(data, siteProgressPercent), [data, siteProgressPercent])
  const sortedAchievementViews = useMemo(
    () =>
      [...achievementViews].sort((first, second) => {
        const rarityDiff = rarityOrder[first.rarity] - rarityOrder[second.rarity]
        if (rarityDiff !== 0) return rarityDiff
        return first.title.localeCompare(second.title)
      }),
    [achievementViews],
  )
  const unlockedCount = achievementViews.filter((achievement) => achievement.unlocked).length
  const achievementsProgressPercent = Math.round(ratio(unlockedCount, achievementViews.length) * 100)

  const pushToast = useCallback((item: Omit<ToastItem, "id">) => {
    const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((previous) => [...previous, { id: toastId, ...item }].slice(-4))
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== toastId))
    }, 1600)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const newlyUnlocked = achievementViews.filter(
      (achievement) => achievement.unlocked && !data.unlockedAchievements.includes(achievement.id),
    )
    if (skipToastForInitialSyncRef.current) {
      skipToastForInitialSyncRef.current = false
      if (newlyUnlocked.length === 0) return
      setData((previous) => {
        const nextUnlocked = [...previous.unlockedAchievements]
        const nextUnlockedAt = { ...previous.unlockedAt }
        let changed = false

        for (const achievement of newlyUnlocked) {
          if (nextUnlocked.includes(achievement.id)) continue
          nextUnlocked.push(achievement.id)
          nextUnlockedAt[achievement.id] = nowIso()
          changed = true
        }

        if (!changed) return previous
        return {
          ...previous,
          unlockedAchievements: nextUnlocked,
          unlockedAt: nextUnlockedAt,
        }
      })
      return
    }

    if (newlyUnlocked.length === 0) return

    setData((previous) => {
      const nextUnlocked = [...previous.unlockedAchievements]
      const nextUnlockedAt = { ...previous.unlockedAt }
      let changed = false

      for (const achievement of newlyUnlocked) {
        if (nextUnlocked.includes(achievement.id)) continue
        nextUnlocked.push(achievement.id)
        nextUnlockedAt[achievement.id] = nowIso()
        changed = true
      }

      if (!changed) return previous
      return {
        ...previous,
        unlockedAchievements: nextUnlocked,
        unlockedAt: nextUnlockedAt,
      }
    })

    for (const achievement of newlyUnlocked) {
      pushToast({ title: achievement.title, rarity: achievement.rarity })
    }
  }, [achievementViews, data.unlockedAchievements, hydrated, pushToast])

  const openProfile = () => {
    setProfileOpen(true)
    setData((previous) => ({ ...previous, profileOpenCount: previous.profileOpenCount + 1 }))
  }

  const recordGameResult = useCallback((gameId: GameId, payload: GameResultPayload) => {
    setData((previous) => {
      const current = previous.gameStats[gameId]
      const rawScore = Number(payload.score ?? 0)
      const score = Number.isFinite(rawScore) ? Math.max(0, Math.round(rawScore)) : 0
      const won = Boolean(payload.win)
      const rawTime = payload.timeMs
      const cleanedTime = rawTime === undefined || rawTime === null ? null : Math.max(0, Math.round(rawTime))

      const updatedEntry: GameStatsEntry = {
        plays: current.plays + 1,
        wins: current.wins + (won ? 1 : 0),
        lastScore: score,
        bestScore: Math.max(current.bestScore, score),
        bestTimeMs:
          won && cleanedTime !== null
            ? current.bestTimeMs === null
              ? cleanedTime
              : Math.min(current.bestTimeMs, cleanedTime)
            : current.bestTimeMs,
      }

      return {
        ...previous,
        gameStats: {
          ...previous.gameStats,
          [gameId]: updatedEntry,
        },
      }
    })
  }, [])

  const contextValue = useMemo<ProfileContextValue>(
    () => ({
      data,
      recordGameResult,
    }),
    [data, recordGameResult],
  )

  const isHome = pathname === "/"

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[220] flex w-[min(92vw,340px)] flex-col gap-2">
        {toasts.map((toast) => {
          const styles = rarityStyles[toast.rarity]
          return (
            <div
              key={toast.id}
              className="pointer-events-none rounded-md border border-black/15 bg-[#f6f4ef]/96 px-3 py-2 text-sm text-black shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur-sm"
            >
              <p className="text-[10px] tracking-[0.16em] uppercase" style={{ color: styles.accent }}>
                Достижение получено
              </p>
              <p className="mt-0.5 font-medium">{toast.title}</p>
            </div>
          )
        })}
      </div>

      {isHome && (
        <>
          <button
            type="button"
            onClick={openProfile}
            className="fixed right-4 top-4 z-[210] text-sm tracking-[0.08em] text-black uppercase transition-opacity hover:opacity-70"
          >
            Профиль
          </button>

          {profileOpen && (
            <section
              data-profile-ui="1"
              className="fixed right-4 top-16 z-[210] flex max-h-[80vh] w-[min(94vw,430px)] flex-col overflow-hidden rounded-xl border border-black/15 bg-[#f6f4ef]/98 p-4 text-black shadow-[0_18px_48px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-[0.08em] uppercase">Профиль</h2>
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="text-xs tracking-[0.12em] uppercase text-black/74 transition-opacity hover:opacity-65"
                >
                  Закрыть
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] tracking-[0.12em] text-black/70 uppercase">
                    <span>Просмотр сайта</span>
                    <span>{siteProgressPercent}%</span>
                  </div>
                  <ProgressBar value={siteProgressPercent} />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] tracking-[0.12em] text-black/70 uppercase">
                    <span>Достижения</span>
                    <span>
                      {unlockedCount}/{achievementViews.length}
                    </span>
                  </div>
                  <ProgressBar value={achievementsProgressPercent} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] tracking-[0.1em] uppercase">
                  <div className="rounded-md border border-black/10 bg-white/45 px-2 py-2">
                    <p className="text-black/55">Сессии</p>
                    <p className="mt-0.5 text-sm font-semibold">{data.sessions}</p>
                  </div>
                  <div className="rounded-md border border-black/10 bg-white/45 px-2 py-2">
                    <p className="text-black/55">Время</p>
                    <p className="mt-0.5 text-sm font-semibold">{Math.floor(data.totalSeconds / 60)}м</p>
                  </div>
                  <div className="rounded-md border border-black/10 bg-white/45 px-2 py-2">
                    <p className="text-black/55">Ссылки</p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {data.clickedLinks.length}/{Math.max(data.discoveredLinks.length, REQUIRED_DISCOVERED_LINKS)}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-black/12 bg-white/40 p-2.5">
                  <button
                    type="button"
                    onClick={() => setShowMiniGames((previous) => !previous)}
                    className="flex w-full items-center justify-between text-left text-xs tracking-[0.12em] uppercase"
                  >
                    <span>Мини игры</span>
                    <span>{showMiniGames ? "Свернуть" : "Открыть"}</span>
                  </button>
                  {showMiniGames && (
                    <div className="mt-2 space-y-1.5">
                      {miniGames.map((game) => (
                        <Link
                          key={game.id}
                          href={game.href}
                          className="flex items-center justify-between rounded-md border border-black/12 bg-[#f8f6f1] px-3 py-2 text-xs tracking-[0.06em] transition-colors hover:bg-white"
                        >
                          <span>{game.label}</span>
                          <span className="text-black/56">{game.goal}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 overflow-y-auto pr-1">
                <div className="space-y-2">
                  {sortedAchievementViews.map((achievement) => {
                    const styles = rarityStyles[achievement.rarity]
                    const percent = Math.round(ratio(achievement.progress.value, achievement.progress.target) * 100)
                    return (
                      <article
                        key={achievement.id}
                        className={`rounded-md border p-2.5 ${
                          achievement.unlocked ? "border-black/22 bg-white/60" : "border-black/10 bg-white/35"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{achievement.title}</p>
                            <p className="mt-0.5 text-[12px] leading-[1.35] text-black/68">{achievement.description}</p>
                          </div>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] tracking-[0.12em] uppercase ${styles.badge}`}
                          >
                            {achievement.rarity}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="mb-1 flex items-center justify-between text-[10px] tracking-[0.11em] text-black/58 uppercase">
                            <span>
                              {Math.min(achievement.progress.value, achievement.progress.target)}/{achievement.progress.target}
                            </span>
                            <span>{percent}%</span>
                          </div>
                          <ProgressBar value={percent} />
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </ProfileContext.Provider>
  )
}

export function useProfileTracker() {
  const context = useContext(ProfileContext)
  if (!context) {
    return {
      data: DEFAULT_PROFILE,
      recordGameResult: () => {
        // noop outside provider.
      },
    }
  }
  return context
}
