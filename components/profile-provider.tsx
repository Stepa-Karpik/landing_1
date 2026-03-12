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

type Rarity = "common" | "rare" | "epic" | "legendary" | "impossible"
type AchievementType = "site" | "minigames" | "tetris" | "dino" | "minesweeper" | "match3" | "snake" | "game2048" | "breakout" | "simon" | "osu"
type GameId = "tetris" | "dino" | "minesweeper" | "match3" | "snake" | "game2048" | "breakout" | "simon" | "osu"
type OsuDifficulty = "easy" | "normal" | "hard" | "extreme" | "legend"
type SnakeMode = "classic" | "tunnel" | "rush"

interface GameStatsEntry {
  plays: number
  wins: number
  bestScore: number
  lastScore: number
  bestTimeMs: number | null
}

interface OsuProgress {
  clears: number
  perfectClears: number
  legendClears: number
  knownTracks: number
  seenTracks: number[]
  clearedTracks: number[]
  perfectTracks: number[]
  clearedDifficulties: OsuDifficulty[]
  bestAccuracy: number
  bestCombo: number
}

interface ProfileData {
  version: 1
  sessions: number
  profileOpenCount: number
  tutorialViews: number
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
  osuProgress: OsuProgress
  minesweeperFirstMoveDeaths: number
  snakeModeBestScores: Record<SnakeMode, number>
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
  mode?: string
  firstMoveMine?: boolean
  trackId?: number
  difficulty?: string
  accuracy?: number
  maxCombo?: number
  cleared?: boolean
  perfect?: boolean
  availableTracks?: number
}

interface ProfileContextValue {
  data: ProfileData
  siteProgressPercent: number
  achievementsProgressPercent: number
  unlockedCount: number
  achievementViews: AchievementView[]
  sortedAchievementViews: AchievementView[]
  recordGameResult: (gameId: GameId, payload: GameResultPayload) => void
}

const STORAGE_KEY = "landing.profile.v1"
const SESSION_KEY = "landing.profile.session.v1"
const STACK_TARGET_MIN = 36
const REQUIRED_DISCOVERED_LINKS = 20

const MAIN_ROUTES = ["/", "/sostav", "/lyudi", "/stek", "/craft", "/projects", "/works"] as const
const GAME_ROUTES = [
  "/minigames/tetris",
  "/minigames/dino",
  "/minigames/minesweeper",
  "/minigames/match3",
  "/minigames/snake",
  "/minigames/2048",
  "/minigames/breakout",
  "/minigames/simon",
  "/minigames/osu",
] as const
const SITE_ROUTES = [...MAIN_ROUTES, ...GAME_ROUTES] as const
const OSU_DIFFICULTIES: readonly OsuDifficulty[] = ["easy", "normal", "hard", "extreme", "legend"]
const SNAKE_MODES: readonly SnakeMode[] = ["classic", "tunnel", "rush"]

const miniGames: ReadonlyArray<{ id: GameId; label: string; href: (typeof GAME_ROUTES)[number]; goal: string }> = [
  { id: "tetris", label: "Тетрис", href: "/minigames/tetris", goal: "700 очков" },
  { id: "dino", label: "\u0414\u0438\u043d\u043e\u0437\u0430\u0432\u0440\u0438\u043a", href: "/minigames/dino", goal: "\u0432\u0441\u0435 \u0441\u043a\u0438\u043d\u044b" },
  { id: "minesweeper", label: "Сапер", href: "/minigames/minesweeper", goal: "1 победа" },
  { id: "match3", label: "Три в ряд", href: "/minigames/match3", goal: "450 очков" },
  { id: "snake", label: "Змейка", href: "/minigames/snake", goal: "40 очков" },
  { id: "game2048", label: "2048 4x4", href: "/minigames/2048", goal: "плитка 2048" },
  { id: "breakout", label: "Арканоид", href: "/minigames/breakout", goal: "2500 очков" },
  { id: "simon", label: "Саймон", href: "/minigames/simon", goal: "10 шагов" },
  { id: "osu", label: "OSU-like", href: "/minigames/osu", goal: "120000 points" },
]

const rarityStyles: Record<Rarity, { badge: string; accent: string }> = {
  common: { badge: "bg-black/5 text-black/60 border-black/10", accent: "#6b7280" },
  rare: { badge: "bg-blue-50 text-blue-700 border-blue-200", accent: "#2563eb" },
  epic: { badge: "bg-orange-50 text-orange-700 border-orange-200", accent: "#c2410c" },
  legendary: { badge: "bg-black text-white border-black", accent: "#111111" },
  impossible: { badge: "bg-[#24090a] text-[#ffd8d9] border-[#8f1d1f]", accent: "#b91c1c" },
}

const rarityLabels: Record<Rarity, string> = {
  common: "\u041e\u0431\u044b\u0447\u043d\u043e\u0435",
  rare: "\u0420\u0435\u0434\u043a\u043e\u0435",
  epic: "\u042d\u043f\u0438\u0447\u0435\u0441\u043a\u043e\u0435",
  legendary: "\u041b\u0435\u0433\u0435\u043d\u0434\u0430\u0440\u043d\u043e\u0435",
  impossible: "невозможно",
}

const rarityOrder: Record<Rarity, number> = {
  impossible: 0,
  legendary: 1,
  epic: 2,
  rare: 3,
  common: 4,
}

const achievementTypeOrder: Record<AchievementType, number> = {
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

const achievementTypeLabels: Record<AchievementType, string> = {
  site: "\u0421\u0430\u0439\u0442",
  minigames: "\u041c\u0438\u043d\u0438-\u0438\u0433\u0440\u044b",
  tetris: "\u0422\u0435\u0442\u0440\u0438\u0441",
  dino: "\u0414\u0438\u043d\u043e\u0437\u0430\u0432\u0440\u0438\u043a",
  minesweeper: "\u0421\u0430\u043f\u0435\u0440",
  match3: "\u0422\u0440\u0438 \u0412 \u0420\u044f\u0434",
  snake: "\u0417\u043c\u0435\u0439\u043a\u0430",
  game2048: "2048",
  breakout: "Арканоид",
  simon: "Саймон",
  osu: "OSU-like",
}

const defaultGameEntry: GameStatsEntry = {
  plays: 0,
  wins: 0,
  bestScore: 0,
  lastScore: 0,
  bestTimeMs: null,
}

const defaultOsuProgress: OsuProgress = {
  clears: 0,
  perfectClears: 0,
  legendClears: 0,
  knownTracks: 0,
  seenTracks: [],
  clearedTracks: [],
  perfectTracks: [],
  clearedDifficulties: [],
  bestAccuracy: 0,
  bestCombo: 0,
}

const defaultSnakeModeBestScores: Record<SnakeMode, number> = {
  classic: 0,
  tunnel: 0,
  rush: 0,
}

const DEFAULT_PROFILE: ProfileData = {
  version: 1,
  sessions: 0,
  profileOpenCount: 0,
  tutorialViews: 0,
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
    snake: { ...defaultGameEntry },
    game2048: { ...defaultGameEntry },
    breakout: { ...defaultGameEntry },
    simon: { ...defaultGameEntry },
    osu: { ...defaultGameEntry },
  },
  osuProgress: { ...defaultOsuProgress },
  minesweeperFirstMoveDeaths: 0,
  snakeModeBestScores: { ...defaultSnakeModeBestScores },
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const ratio = (value: number, target: number) => (target <= 0 ? 0 : clamp(value / target, 0, 1))
const nowIso = () => new Date().toISOString()

function getAchievementType(id: string): AchievementType {
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

function compareAchievements(first: { id: string; rarity: Rarity; title: string }, second: { id: string; rarity: Rarity; title: string }) {
  const typeDiff = achievementTypeOrder[getAchievementType(first.id)] - achievementTypeOrder[getAchievementType(second.id)]
  if (typeDiff !== 0) return typeDiff

  const rarityDiff = rarityOrder[first.rarity] - rarityOrder[second.rarity]
  if (rarityDiff !== 0) return rarityDiff

  return first.title.localeCompare(second.title)
}

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
  const osuProgressRaw = (candidate.osuProgress ?? {}) as Partial<OsuProgress>

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

  const normalizeTrackIds = (values: unknown): number[] =>
    Array.isArray(values)
      ? values
          .map((value) => Number(value))
          .filter((value): value is number => Number.isInteger(value) && value > 0)
      : []
  const normalizedTracks = normalizeTrackIds(osuProgressRaw.clearedTracks)
  const normalizedSeenTracks = normalizeTrackIds((osuProgressRaw as { seenTracks?: unknown }).seenTracks)
  const normalizedPerfectTracks = normalizeTrackIds((osuProgressRaw as { perfectTracks?: unknown }).perfectTracks)
  const normalizedDifficulties = Array.isArray(osuProgressRaw.clearedDifficulties)
    ? osuProgressRaw.clearedDifficulties.filter(
        (value): value is OsuDifficulty =>
          typeof value === "string" && (OSU_DIFFICULTIES as readonly string[]).includes(value),
      )
    : []
  const rawKnownTracks = Number((osuProgressRaw as { knownTracks?: unknown }).knownTracks ?? 0)
  const hasLegacyOsuProgress =
    normalizedTracks.length > 0 ||
    Number(osuProgressRaw.clears ?? 0) > 0 ||
    Number((gameStatsRaw.osu?.plays ?? 0) || 0) > 0
  const knownTracksFloor = hasLegacyOsuProgress ? 3 : 0
  const knownTracks = Math.max(
    knownTracksFloor,
    Number.isFinite(rawKnownTracks) ? Math.max(0, Math.round(rawKnownTracks)) : 0,
    normalizedSeenTracks.length,
    normalizedTracks.length,
    normalizedPerfectTracks.length,
  )
  const snakeModeRaw = candidate.snakeModeBestScores && typeof candidate.snakeModeBestScores === "object"
    ? (candidate.snakeModeBestScores as Partial<Record<SnakeMode, unknown>>)
    : {}
  const snakeModeBestScores = SNAKE_MODES.reduce<Record<SnakeMode, number>>((acc, mode) => {
    acc[mode] = Math.max(0, Number(snakeModeRaw[mode] ?? 0) || 0)
    return acc
  }, { ...defaultSnakeModeBestScores })

  return {
    version: 1,
    sessions: Math.max(0, Number(candidate.sessions ?? 0) || 0),
    profileOpenCount: Math.max(0, Number(candidate.profileOpenCount ?? 0) || 0),
    tutorialViews: Math.max(0, Number(candidate.tutorialViews ?? 0) || 0),
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
      snake: normalizeEntry(gameStatsRaw.snake),
      game2048: normalizeEntry(gameStatsRaw.game2048),
      breakout: normalizeEntry(gameStatsRaw.breakout),
      simon: normalizeEntry(gameStatsRaw.simon),
      osu: normalizeEntry(gameStatsRaw.osu),
    },
    osuProgress: {
      clears: Math.max(0, Number(osuProgressRaw.clears ?? 0) || 0),
      perfectClears: Math.max(0, Number((osuProgressRaw as { perfectClears?: unknown }).perfectClears ?? 0) || 0),
      legendClears: Math.max(0, Number(osuProgressRaw.legendClears ?? 0) || 0),
      knownTracks,
      seenTracks: Array.from(new Set(normalizedSeenTracks)),
      clearedTracks: Array.from(new Set(normalizedTracks)),
      perfectTracks: Array.from(new Set(normalizedPerfectTracks)),
      clearedDifficulties: Array.from(new Set(normalizedDifficulties)),
      bestAccuracy: clamp(Number(osuProgressRaw.bestAccuracy ?? 0) || 0, 0, 100),
      bestCombo: Math.max(0, Number(osuProgressRaw.bestCombo ?? 0) || 0),
    },
    minesweeperFirstMoveDeaths: Math.max(0, Number(candidate.minesweeperFirstMoveDeaths ?? 0) || 0),
    snakeModeBestScores,
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
    id: "tutorial-replay",
    title: "Второй круг",
    description: "Пройти обучение повторно.",
    rarity: "rare",
    getProgress: (data) => ({ value: Math.max(data.tutorialViews - 1, 0), target: 1 }),
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
    id: "dino-enter",
    title: "\u0447\u0442\u043e \u0442\u0443\u0442 \u043f\u0440\u043e\u0438\u0441\u0445\u043e\u0434\u0438\u0442",
    description: "\u0417\u0430\u0439\u0442\u0438 \u0432 \u043c\u0438\u043d\u0438-\u0438\u0433\u0440\u0443 \u00ab\u0414\u0438\u043d\u043e\u0437\u0430\u0432\u0440\u0438\u043a\u00bb.",
    rarity: "common",
    getProgress: (data) => ({ value: data.visitedRoutes.includes("/minigames/dino") ? 1 : 0, target: 1 }),
  },
  {
    id: "tetris-first-game",
    title: "Тетрис: первый блок",
    description: "Сыграть в тетрис хотя бы один раз.",
    rarity: "common",
    getProgress: (data) => ({ value: data.gameStats.tetris.plays, target: 1 }),
  },
  {
    id: "tetris-300",
    title: "Тетрис: разгон",
    description: "Набрать 300 очков в тетрисе.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.gameStats.tetris.bestScore, target: 300 }),
  },
  {
    id: "tetris-700",
    title: "Тетрис: стабильный темп",
    description: "Набрать 700 очков в тетрисе.",
    rarity: "epic",
    getProgress: (data) => ({ value: data.gameStats.tetris.bestScore, target: 700 }),
  },
  {
    id: "tetris-2000",
    title: "Тетрис: прессинг",
    description: "Набрать 2000 очков в тетрисе.",
    rarity: "legendary",
    getProgress: (data) => ({ value: data.gameStats.tetris.bestScore, target: 2000 }),
  },
  {
    id: "tetris-5000",
    title: "Тетрис: абсолют",
    description: "Набрать 5000 очков в тетрисе.",
    rarity: "impossible",
    getProgress: (data) => ({ value: data.gameStats.tetris.bestScore, target: 5000 }),
  },
  {
    id: "dino-all-skins",
    title: "\u041a\u0440\u0430\u0441\u0430\u0432\u0438\u0447\u043a",
    description: "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0432\u0441\u0435 \u0441\u043a\u0438\u043d\u044b \u0432 \u0434\u0438\u043d\u043e\u0437\u0430\u0432\u0440\u0438\u043a\u0435.",
    rarity: "epic",
    getProgress: (data) => ({ value: data.gameStats.dino.bestScore, target: 5000 }),
  },
  {
    id: "minesweeper-first-game",
    title: "Сапёр: первый раскоп",
    description: "Сыграть в сапёр хотя бы один раз.",
    rarity: "common",
    getProgress: (data) => ({ value: data.gameStats.minesweeper.plays, target: 1 }),
  },
  {
    id: "minesweeper-no-luck",
    title: "Не судьба",
    description: "На 1 уровне подорваться на самой первой открытой клетке.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.minesweeperFirstMoveDeaths, target: 1 }),
  },
  {
    id: "minesweeper-win",
    title: "Сапер: чистое поле",
    description: "Выиграть в сапере минимум один раз.",
    rarity: "epic",
    getProgress: (data) => ({ value: data.gameStats.minesweeper.bestScore, target: 3 }),
  },
  {
    id: "minesweeper-full-run",
    title: "Сапёр: чистая серия",
    description: "Пройти все 5 уровней сапёра без поражения.",
    rarity: "legendary",
    getProgress: (data) => ({ value: data.gameStats.minesweeper.wins, target: 1 }),
  },
  {
    id: "minesweeper-speedrun",
    title: "Сапёр: молниеносно",
    description: "Пройти всю серию сапёра быстрее чем за 12 минут.",
    rarity: "impossible",
    getProgress: (data) => ({ value: data.gameStats.minesweeper.bestTimeMs === null ? 0 : 1, target: 1 }),
    isUnlocked: (data) => data.gameStats.minesweeper.bestTimeMs !== null && data.gameStats.minesweeper.bestTimeMs <= 12 * 60 * 1000,
  },
  {
    id: "match3-first-game",
    title: "Три в ряд: старт",
    description: "Сыграть в «Три в ряд» хотя бы один раз.",
    rarity: "common",
    getProgress: (data) => ({ value: data.gameStats.match3.plays, target: 1 }),
  },
  {
    id: "match3-300",
    title: "Три в ряд: разминка",
    description: "Набрать 300 очков в «Три в ряд».",
    rarity: "rare",
    getProgress: (data) => ({ value: data.gameStats.match3.bestScore, target: 300 }),
  },
  {
    id: "match3-450",
    title: "Три в ряд: комбо",
    description: "Набрать 450 очков в игре «Три в ряд».",
    rarity: "epic",
    getProgress: (data) => ({ value: data.gameStats.match3.bestScore, target: 1200 }),
  },
  {
    id: "match3-2400",
    title: "Три в ряд: каскад",
    description: "Набрать 2400 очков в «Три в ряд».",
    rarity: "legendary",
    getProgress: (data) => ({ value: data.gameStats.match3.bestScore, target: 2400 }),
  },
  {
    id: "match3-4000",
    title: "Три в ряд: без тормозов",
    description: "Набрать 4000 очков в «Три в ряд».",
    rarity: "impossible",
    getProgress: (data) => ({ value: data.gameStats.match3.bestScore, target: 4000 }),
  },
  {
    id: "snake-first-game",
    title: "Змейка: пробный заход",
    description: "Сыграть в змейку хотя бы один раз.",
    rarity: "common",
    getProgress: (data) => ({ value: data.gameStats.snake.plays, target: 1 }),
  },
  {
    id: "snake-20",
    title: "Змейка: уже длинная",
    description: "Набрать 20 очков в змейке.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.gameStats.snake.bestScore, target: 20 }),
  },
  {
    id: "snake-40",
    title: "Змейка: выживание",
    description: "Набрать 40 очков в змейке.",
    rarity: "epic",
    getProgress: (data) => ({ value: data.gameStats.snake.bestScore, target: 45 }),
  },
  {
    id: "snake-75",
    title: "Змейка: хищник",
    description: "Набрать 75 очков в змейке.",
    rarity: "legendary",
    getProgress: (data) => ({ value: data.gameStats.snake.bestScore, target: 75 }),
  },
  {
    id: "snake-rush-60",
    title: "Змейка: турбо-режим",
    description: "Набрать 60 очков в режиме Rush.",
    rarity: "impossible",
    getProgress: (data) => ({ value: data.snakeModeBestScores.rush, target: 60 }),
  },
  {
    id: "game2048-first-game",
    title: "2048: первая плитка",
    description: "Сыграть в 2048 хотя бы один раз.",
    rarity: "common",
    getProgress: (data) => ({ value: data.gameStats.game2048.plays, target: 1 }),
  },
  {
    id: "game2048-256",
    title: "2048: разогрев",
    description: "Собрать плитку 256.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.gameStats.game2048.bestScore, target: 256 }),
  },
  {
    id: "game2048-1024",
    title: "2048: плотный матч",
    description: "Собрать плитку 1024.",
    rarity: "epic",
    getProgress: (data) => ({ value: data.gameStats.game2048.bestScore, target: 1024 }),
  },
  {
    id: "game2048-tile",
    title: "2048: собрано",
    description: "Собрать плитку 2048 на поле 4x4.",
    rarity: "legendary",
    getProgress: (data) => ({ value: data.gameStats.game2048.bestScore, target: 2048 }),
  },
  {
    id: "game2048-4096",
    title: "2048: за гранью",
    description: "Собрать плитку 4096.",
    rarity: "impossible",
    getProgress: (data) => ({ value: data.gameStats.game2048.bestScore, target: 4096 }),
  },
  {
    id: "breakout-first-game",
    title: "Арканоид: первый удар",
    description: "Сыграть в арканоид хотя бы один раз.",
    rarity: "common",
    getProgress: (data) => ({ value: data.gameStats.breakout.plays, target: 1 }),
  },
  {
    id: "breakout-800",
    title: "Арканоид: разогрев",
    description: "Набрать 800 очков в арканоиде.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.gameStats.breakout.bestScore, target: 800 }),
  },
  {
    id: "breakout-win",
    title: "Арканоид: победный темп",
    description: "Достичь 2500 очков в арканоиде.",
    rarity: "epic",
    getProgress: (data) => ({ value: data.gameStats.breakout.bestScore, target: 2500 }),
  },
  {
    id: "breakout-5000",
    title: "Арканоид: шторм",
    description: "Набрать 5000 очков в арканоиде.",
    rarity: "legendary",
    getProgress: (data) => ({ value: data.gameStats.breakout.bestScore, target: 5000 }),
  },
  {
    id: "breakout-9000",
    title: "Арканоид: бесконечный",
    description: "Набрать 9000 очков в арканоиде.",
    rarity: "impossible",
    getProgress: (data) => ({ value: data.gameStats.breakout.bestScore, target: 9000 }),
  },
  {
    id: "simon-first-game",
    title: "Саймон: первая серия",
    description: "Сыграть в саймон хотя бы один раз.",
    rarity: "common",
    getProgress: (data) => ({ value: data.gameStats.simon.plays, target: 1 }),
  },
  {
    id: "simon-6",
    title: "Саймон: ритм",
    description: "Повторить 6 шагов в саймоне.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.gameStats.simon.bestScore, target: 6 }),
  },
  {
    id: "simon-10",
    title: "Саймон: память",
    description: "Повторить 10 шагов в саймоне.",
    rarity: "epic",
    getProgress: (data) => ({ value: data.gameStats.simon.bestScore, target: 10 }),
  },
  {
    id: "simon-20",
    title: "Саймон: концентрация",
    description: "Повторить 20 шагов в саймоне.",
    rarity: "legendary",
    getProgress: (data) => ({ value: data.gameStats.simon.bestScore, target: 20 }),
  },
  {
    id: "simon-32",
    title: "Саймон: без ошибки",
    description: "Повторить 32 шага в саймоне.",
    rarity: "impossible",
    getProgress: (data) => ({ value: data.gameStats.simon.bestScore, target: 32 }),
  },
  {
    id: "osu-120000",
    title: "\u041e\u0421\u0423-like: \u0442\u043e\u0447\u043d\u044b\u0439 \u0440\u0438\u0442\u043c",
    description: "\u041d\u0430\u0431\u0440\u0430\u0442\u044c 120000 \u043e\u0447\u043a\u043e\u0432 \u0432 \u0440\u0435\u0436\u0438\u043c\u0435 OSU-like.",
    rarity: "legendary",
    getProgress: (data) => ({ value: data.gameStats.osu.bestScore, target: 120000 }),
  },
  {
    id: "osu-first-clear",
    title: "\u041f\u0440\u043e\u0439\u0442\u0438 \u043b\u044e\u0431\u0443\u044e \u043a\u0430\u0440\u0442\u0443",
    description: "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044c \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u043d\u0443 \u043a\u0430\u0440\u0442\u0443 \u0432 OSU-like.",
    rarity: "common",
    getProgress: (data) => ({ value: data.osuProgress.clearedTracks.length, target: 1 }),
  },
  {
    id: "osu-all-tracks-clear",
    title: "\u041f\u0440\u043e\u0439\u0442\u0438 \u0432\u0441\u0435 \u043a\u0430\u0440\u0442\u044b",
    description: "\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u0432\u0441\u0435 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0435 \u043d\u0430 \u0442\u0435\u043a\u0443\u0449\u0438\u0439 \u043c\u043e\u043c\u0435\u043d\u0442 \u043a\u0430\u0440\u0442\u044b \u0432 OSU-like.",
    rarity: "epic",
    getProgress: (data) => ({
      value: data.osuProgress.clearedTracks.length,
      target: Math.max(1, data.osuProgress.knownTracks),
    }),
    isUnlocked: (data) => data.osuProgress.knownTracks > 0 && data.osuProgress.clearedTracks.length >= data.osuProgress.knownTracks,
  },
  {
    id: "osu-one-perfect-clear",
    title: "\u041f\u0440\u043e\u0439\u0442\u0438 \u043e\u0434\u043d\u0443 \u043a\u0430\u0440\u0442\u0443 \u0438\u0434\u0435\u0430\u043b\u044c\u043d\u043e",
    description: "\u041f\u0440\u043e\u0439\u0442\u0438 \u043b\u044e\u0431\u0443\u044e \u043a\u0430\u0440\u0442\u0443 \u0431\u0435\u0437 100/50/miss.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.osuProgress.perfectTracks.length, target: 1 }),
  },
  {
    id: "osu-all-perfect-clear",
    title: "\u041f\u0440\u043e\u0439\u0442\u0438 \u0432\u0441\u0435 \u043a\u0430\u0440\u0442\u044b \u0438\u0434\u0435\u0430\u043b\u044c\u043d\u043e",
    description: "\u041f\u0440\u043e\u0439\u0442\u0438 \u0438\u0434\u0435\u0430\u043b\u044c\u043d\u043e \u0432\u0441\u0435 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0435 \u043a\u0430\u0440\u0442\u044b \u0432 OSU-like.",
    rarity: "legendary",
    getProgress: (data) => ({
      value: data.osuProgress.perfectTracks.length,
      target: Math.max(1, data.osuProgress.knownTracks),
    }),
    isUnlocked: (data) => data.osuProgress.knownTracks > 0 && data.osuProgress.perfectTracks.length >= data.osuProgress.knownTracks,
  },
  {
    id: "osu-hard-clear",
    title: "\u041f\u0440\u043e\u0439\u0442\u0438 \u043d\u0430 Hard",
    description: "\u041f\u0440\u043e\u0439\u0442\u0438 \u043b\u044e\u0431\u0443\u044e \u043a\u0430\u0440\u0442\u0443 \u043d\u0430 \u0441\u043b\u043e\u0436\u043d\u043e\u0441\u0442\u0438 Hard.",
    rarity: "rare",
    getProgress: (data) => ({ value: data.osuProgress.clearedDifficulties.includes("hard") ? 1 : 0, target: 1 }),
  },
  {
    id: "osu-extreme-clear",
    title: "\u041f\u0440\u043e\u0439\u0442\u0438 \u043d\u0430 Extreme",
    description: "\u041f\u0440\u043e\u0439\u0442\u0438 \u043b\u044e\u0431\u0443\u044e \u043a\u0430\u0440\u0442\u0443 \u043d\u0430 \u0441\u043b\u043e\u0436\u043d\u043e\u0441\u0442\u0438 Extreme.",
    rarity: "epic",
    getProgress: (data) => ({ value: data.osuProgress.clearedDifficulties.includes("extreme") ? 1 : 0, target: 1 }),
  },
  {
    id: "osu-legend-clear",
    title: "\u041f\u0440\u043e\u0439\u0442\u0438 \u043d\u0430 Legend",
    description: "\u041f\u0440\u043e\u0439\u0442\u0438 \u043b\u044e\u0431\u0443\u044e \u043a\u0430\u0440\u0442\u0443 \u043d\u0430 \u0441\u043b\u043e\u0436\u043d\u043e\u0441\u0442\u0438 Legend.",
    rarity: "impossible",
    getProgress: (data) => ({ value: data.osuProgress.clearedDifficulties.includes("legend") ? 1 : 0, target: 1 }),
  },
  {
    id: "osu-all-difficulties",
    title: "\u0412\u0441\u0435 \u0441\u043b\u043e\u0436\u043d\u043e\u0441\u0442\u0438 OSU-like",
    description: "\u041f\u0440\u043e\u0439\u0442\u0438 \u0445\u043e\u0442\u044f \u0431\u044b \u043f\u043e \u043e\u0434\u043d\u043e\u0439 \u043a\u0430\u0440\u0442\u0435 \u043d\u0430 \u043a\u0430\u0436\u0434\u043e\u0439 \u0441\u043b\u043e\u0436\u043d\u043e\u0441\u0442\u0438.",
    rarity: "legendary",
    getProgress: (data) => ({ value: data.osuProgress.clearedDifficulties.length, target: OSU_DIFFICULTIES.length }),
  },
  {
    id: "games-master",
    title: "Покоритель мини-игр",
    description: "Выполнить цели всех мини-игр.",
    rarity: "legendary",
    getProgress: (data) => {
      const tetrisDone = data.gameStats.tetris.bestScore >= 700 ? 1 : 0
      const dinoDone = data.gameStats.dino.bestScore >= 5000 ? 1 : 0
      const minesweeperDone = data.gameStats.minesweeper.wins >= 1 ? 1 : 0
      const match3Done = data.gameStats.match3.bestScore >= 1200 ? 1 : 0
      const snakeDone = data.gameStats.snake.bestScore >= 45 ? 1 : 0
      const game2048Done = data.gameStats.game2048.bestScore >= 2048 ? 1 : 0
      const breakoutDone = data.gameStats.breakout.wins >= 1 ? 1 : 0
      const simonDone = data.gameStats.simon.bestScore >= 10 ? 1 : 0
      const osuDone = data.gameStats.osu.bestScore >= 120000 ? 1 : 0
      return {
        value:
          tetrisDone +
          dinoDone +
          minesweeperDone +
          match3Done +
          snakeDone +
          game2048Done +
          breakoutDone +
          simonDone +
          osuDone,
        target: 9,
      }
    },
  },
  {
    id: "achievements-20",
    title: "Коллекционер достижений",
    description: "Открыть 20 достижений.",
    rarity: "legendary",
    getProgress: (data) => ({
      value: data.unlockedAchievements.filter((id) => achievementDefinitions.some((definition) => definition.id === id)).length,
      target: 20,
    }),
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
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [tutorialExiting, setTutorialExiting] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [stepOneArrowStyle, setStepOneArrowStyle] = useState({ left: 0, top: 0, angle: 180 })
  const [stepTwoArrowStyle, setStepTwoArrowStyle] = useState({ left: 0, top: 0, angle: -35 })
  const [showMiniGames, setShowMiniGames] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const skipToastForInitialSyncRef = useRef(true)
  const storageLoadedRef = useRef(false)
  const tutorialStepOneTextRef = useRef<HTMLDivElement | null>(null)
  const tutorialStepTwoTextRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (storageLoadedRef.current) return
    storageLoadedRef.current = true
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const nextData = raw ? sanitizeProfileData(JSON.parse(raw) as unknown) : DEFAULT_PROFILE
      setData(nextData)
      if (pathname === "/" && nextData.tutorialViews === 0) {
        setTutorialStep(0)
        setTutorialOpen(true)
      }
    } catch {
      setData(DEFAULT_PROFILE)
      if (pathname === "/") {
        setTutorialStep(0)
        setTutorialOpen(true)
      }
    } finally {
      setHydrated(true)
    }
  }, [pathname])

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
    if (!hydrated || pathname !== "/profile") return
    setData((previous) => ({ ...previous, profileOpenCount: previous.profileOpenCount + 1 }))
  }, [hydrated, pathname])

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
      setTutorialOpen(false)
      setTutorialExiting(false)
      setTutorialStep(0)
    }
  }, [pathname])

  useEffect(() => {
    if (!hydrated || pathname !== "/") return
    const replayRequested = new URLSearchParams(window.location.search).get("tutorial") === "1"
    if (!replayRequested) return
    setTutorialExiting(false)
    setTutorialStep(0)
    setTutorialOpen(true)
  }, [hydrated, pathname])

  useEffect(() => {
    if (!tutorialOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [tutorialOpen])

  useEffect(() => {
    if (!tutorialOpen || tutorialExiting) return

    const updateArrowPositions = () => {
      if (tutorialStep === 1 && tutorialStepOneTextRef.current) {
        const rect = tutorialStepOneTextRef.current.getBoundingClientRect()
        const textPoint = { x: rect.left, y: rect.top + rect.height * 0.55 }
        const targetPoint = { x: 28, y: window.innerHeight * 0.5 }
        const middleX = (textPoint.x + targetPoint.x) / 2
        const middleY = (textPoint.y + targetPoint.y) / 2
        const angle = (Math.atan2(targetPoint.y - textPoint.y, targetPoint.x - textPoint.x) * 180) / Math.PI
        setStepOneArrowStyle((previous) => {
          if (
            Math.abs(previous.left - middleX) < 0.5 &&
            Math.abs(previous.top - middleY) < 0.5 &&
            Math.abs(previous.angle - angle) < 0.2
          ) {
            return previous
          }
          return { left: middleX, top: middleY, angle }
        })
      }

      if (tutorialStep === 2 && tutorialStepTwoTextRef.current) {
        const rect = tutorialStepTwoTextRef.current.getBoundingClientRect()
        const textPoint = { x: rect.right, y: rect.top + rect.height * 0.44 }
        const targetPoint = { x: window.innerWidth - 42, y: 24 }
        const middleX = (textPoint.x + targetPoint.x) / 2
        const middleY = (textPoint.y + targetPoint.y) / 2
        const angle = (Math.atan2(targetPoint.y - textPoint.y, targetPoint.x - textPoint.x) * 180) / Math.PI
        setStepTwoArrowStyle((previous) => {
          if (
            Math.abs(previous.left - middleX) < 0.5 &&
            Math.abs(previous.top - middleY) < 0.5 &&
            Math.abs(previous.angle - angle) < 0.2
          ) {
            return previous
          }
          return { left: middleX, top: middleY, angle }
        })
      }
    }

    const rafId = window.requestAnimationFrame(updateArrowPositions)
    window.addEventListener("resize", updateArrowPositions)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener("resize", updateArrowPositions)
    }
  }, [tutorialExiting, tutorialOpen, tutorialStep])

  const siteProgressPercent = useMemo(() => getSiteProgress(data), [data])
  const achievementViews = useMemo(() => getAchievementViews(data, siteProgressPercent), [data, siteProgressPercent])
  const sortedAchievementViews = useMemo(() => [...achievementViews].sort(compareAchievements), [achievementViews])
  const unlockedCount = achievementViews.filter((achievement) => achievement.unlocked).length
  const achievementsProgressPercent = Math.round(ratio(unlockedCount, achievementViews.length) * 100)

  const pushToast = useCallback((item: Omit<ToastItem, "id">) => {
    const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((previous) => [...previous, { id: toastId, ...item }].slice(-4))
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== toastId))
    }, 1600)
  }, [])

  const openTutorial = useCallback(() => {
    setTutorialStep(0)
    setTutorialExiting(false)
    setTutorialOpen(true)
  }, [])

  const completeTutorial = useCallback(() => {
    setTutorialExiting(true)
    window.setTimeout(() => {
      setTutorialOpen(false)
      setTutorialExiting(false)
      setTutorialStep(0)
    }, 460)
    setData((previous) => ({ ...previous, tutorialViews: previous.tutorialViews + 1 }))
  }, [])

  useEffect(() => {
    if (!tutorialOpen || tutorialExiting) return
    if (tutorialStep === 0) return

    const timer = window.setTimeout(() => {
      if (tutorialStep >= 3) {
        completeTutorial()
        return
      }
      setTutorialStep((previous) => previous + 1)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [completeTutorial, tutorialExiting, tutorialOpen, tutorialStep])

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

      let nextMinesweeperFirstMoveDeaths = previous.minesweeperFirstMoveDeaths
      if (gameId === "minesweeper" && payload.firstMoveMine) {
        nextMinesweeperFirstMoveDeaths += 1
      }

      let nextSnakeModeBestScores = previous.snakeModeBestScores
      if (gameId === "snake" && typeof payload.mode === "string") {
        const mode = SNAKE_MODES.find((value) => value === payload.mode)
        if (mode) {
          nextSnakeModeBestScores = {
            ...previous.snakeModeBestScores,
            [mode]: Math.max(previous.snakeModeBestScores[mode], score),
          }
        }
      }

      let nextOsuProgress = previous.osuProgress
      if (gameId === "osu") {
        const rawTrackId = Number(payload.trackId ?? NaN)
        const trackId = Number.isInteger(rawTrackId) && rawTrackId > 0 ? rawTrackId : null
        const difficulty =
          typeof payload.difficulty === "string" && (OSU_DIFFICULTIES as readonly string[]).includes(payload.difficulty)
            ? (payload.difficulty as OsuDifficulty)
            : null
        const accuracyRaw = Number(payload.accuracy ?? NaN)
        const accuracy = Number.isFinite(accuracyRaw) ? clamp(accuracyRaw, 0, 100) : null
        const comboRaw = Number(payload.maxCombo ?? NaN)
        const maxCombo = Number.isFinite(comboRaw) ? Math.max(0, Math.round(comboRaw)) : null
        const cleared = payload.cleared === undefined ? won : Boolean(payload.cleared)
        const perfect = Boolean(payload.perfect) && cleared
        const rawAvailableTracks = Number(payload.availableTracks ?? NaN)
        const availableTracks =
          Number.isFinite(rawAvailableTracks) && rawAvailableTracks > 0 ? Math.round(rawAvailableTracks) : null

        const seenTracks = [...previous.osuProgress.seenTracks]
        const clearedTracks = [...previous.osuProgress.clearedTracks]
        const perfectTracks = [...previous.osuProgress.perfectTracks]
        const clearedDifficulties = [...previous.osuProgress.clearedDifficulties]
        let knownTracks = previous.osuProgress.knownTracks
        let clears = previous.osuProgress.clears
        let perfectClears = previous.osuProgress.perfectClears
        let legendClears = previous.osuProgress.legendClears

        if (trackId !== null && !seenTracks.includes(trackId)) {
          seenTracks.push(trackId)
        }
        if (availableTracks !== null) {
          knownTracks = Math.max(knownTracks, availableTracks)
        }

        if (cleared) {
          clears += 1
          if (trackId !== null && !clearedTracks.includes(trackId)) {
            clearedTracks.push(trackId)
          }
          if (difficulty && !clearedDifficulties.includes(difficulty)) {
            clearedDifficulties.push(difficulty)
          }
          if (difficulty === "legend") {
            legendClears += 1
          }
        }
        if (perfect) {
          perfectClears += 1
          if (trackId !== null && !perfectTracks.includes(trackId)) {
            perfectTracks.push(trackId)
          }
        }

        knownTracks = Math.max(knownTracks, seenTracks.length, clearedTracks.length, perfectTracks.length)

        nextOsuProgress = {
          ...previous.osuProgress,
          clears,
          perfectClears,
          legendClears,
          knownTracks,
          seenTracks,
          clearedTracks,
          perfectTracks,
          clearedDifficulties,
          bestAccuracy: accuracy === null ? previous.osuProgress.bestAccuracy : Math.max(previous.osuProgress.bestAccuracy, accuracy),
          bestCombo: maxCombo === null ? previous.osuProgress.bestCombo : Math.max(previous.osuProgress.bestCombo, maxCombo),
        }
      }

      return {
        ...previous,
        gameStats: {
          ...previous.gameStats,
          [gameId]: updatedEntry,
        },
        osuProgress: nextOsuProgress,
        minesweeperFirstMoveDeaths: nextMinesweeperFirstMoveDeaths,
        snakeModeBestScores: nextSnakeModeBestScores,
      }
    })
  }, [])

  const contextValue = useMemo<ProfileContextValue>(
    () => ({
      data,
      siteProgressPercent,
      achievementsProgressPercent,
      unlockedCount,
      achievementViews,
      sortedAchievementViews,
      recordGameResult,
    }),
    [achievementViews, achievementsProgressPercent, data, recordGameResult, siteProgressPercent, sortedAchievementViews, unlockedCount],
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

      {isHome && !hydrated && <section data-profile-ui="1" className="fixed inset-0 z-[279] bg-[#f6f4ef]" />}

      {isHome && tutorialOpen && (
        <section
          data-profile-ui="1"
          className={`fixed inset-0 z-[280] bg-[#f6f4ef] text-[#111111] transition-[opacity,filter] duration-500 ${
            tutorialExiting ? "opacity-0 blur-sm" : "opacity-100 blur-0"
          }`}
        >
          {tutorialStep === 1 && (
            <div className="pointer-events-none fixed left-3 top-1/2 -translate-y-1/2 text-[12px] tracking-[0.12em] text-black/70 uppercase">
              ← Назад
            </div>
          )}

          {tutorialStep === 2 && (
            <div className="pointer-events-none fixed right-4 top-4 text-[12px] tracking-[0.12em] text-black/76 uppercase">
              Профиль
            </div>
          )}

          <div className="flex h-full items-center justify-center px-6">
            {tutorialStep === 0 && (
              <div className="max-w-[70ch] text-center">
                <p className="text-[clamp(34px,5.8vw,78px)] leading-[0.9] tracking-[-0.04em]">Возьмешь телефон, детка</p>
                <button
                  type="button"
                  onClick={() => setTutorialStep(1)}
                  className="mt-8 text-sm tracking-[0.14em] uppercase transition-opacity hover:opacity-65"
                >
                  Начнем
                </button>
              </div>
            )}

            {tutorialStep === 1 && (
              <div ref={tutorialStepOneTextRef} className="max-w-[70ch] text-center">
                <p className="text-[clamp(28px,4.7vw,56px)] leading-[0.94] tracking-[-0.03em]">Кнопка назад находится слева</p>
                <p className="mt-3 text-sm text-black/62">
                  Каждый заход в блок мы будем ее подсвечивать, чтобы вы не забыли
                </p>
                <div
                  className="pointer-events-none fixed text-[clamp(96px,15vw,230px)] leading-none text-black/74 animate-pulse"
                  style={{
                    left: `${stepOneArrowStyle.left}px`,
                    top: `${stepOneArrowStyle.top}px`,
                    transform: `translate(-50%, -50%) rotate(${stepOneArrowStyle.angle}deg)`,
                  }}
                >
                  ➜
                </div>
              </div>
            )}

            {tutorialStep === 2 && (
              <div ref={tutorialStepTwoTextRef} className="max-w-[70ch] text-center">
                <p className="text-[clamp(28px,4.7vw,56px)] leading-[0.94] tracking-[-0.03em]">Профиль находится здесь</p>
                <p className="mt-3 text-sm text-black/62">Там ваш прогресс и достижения</p>
                <div
                  className="pointer-events-none fixed text-[clamp(96px,15vw,230px)] leading-none text-black/74 animate-pulse"
                  style={{
                    left: `${stepTwoArrowStyle.left}px`,
                    top: `${stepTwoArrowStyle.top}px`,
                    transform: `translate(-50%, -50%) rotate(${stepTwoArrowStyle.angle}deg)`,
                  }}
                >
                  ➜
                </div>
              </div>
            )}

            {tutorialStep === 3 && (
              <div className="max-w-[70ch] text-center">
                <p className="text-[clamp(34px,5.8vw,78px)] leading-[0.9] tracking-[-0.04em]">Удачи</p>
              </div>
            )}
          </div>
        </section>
      )}

      {isHome && (
        <>
          <Link
            href="/profile"
            className="fixed right-4 top-4 z-[210] text-sm tracking-[0.08em] text-black uppercase transition-opacity hover:opacity-70"
          >
            Профиль
          </Link>

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

                <button
                  type="button"
                  onClick={() => openTutorial()}
                  className="w-full text-left text-xs tracking-[0.12em] uppercase text-black/78 transition-opacity hover:opacity-65"
                >
                  Пройти обучение
                </button>
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="block w-full text-left text-xs tracking-[0.12em] uppercase text-black/82 transition-opacity hover:opacity-65"
                >
                  {"\u041f\u043e\u043b\u043d\u044b\u0439 \u043f\u0440\u043e\u0444\u0438\u043b\u044c"}
                </Link>
              </div>

              <div className="mt-4 overflow-y-auto pr-1">
                <div className="space-y-2">
                  {sortedAchievementViews.map((achievement, index) => {
                    const styles = rarityStyles[achievement.rarity]
                    const percent = Math.round(ratio(achievement.progress.value, achievement.progress.target) * 100)
                    const achievementType = getAchievementType(achievement.id)
                    const previousType = index > 0 ? getAchievementType(sortedAchievementViews[index - 1].id) : null
                    const showTypeHeader = index === 0 || achievementType !== previousType
                    return (
                      <div key={achievement.id} className="space-y-2">
                        {showTypeHeader && (
                          <p className="text-[10px] tracking-[0.16em] text-black/54 uppercase">
                            {achievementTypeLabels[achievementType]}
                          </p>
                        )}
                        <article
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
                              {rarityLabels[achievement.rarity]}
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
                      </div>
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
    const siteProgressPercent = getSiteProgress(DEFAULT_PROFILE)
    const achievementViews = getAchievementViews(DEFAULT_PROFILE, siteProgressPercent)
    const sortedAchievementViews = [...achievementViews].sort(compareAchievements)
    const unlockedCount = achievementViews.filter((achievement) => achievement.unlocked).length
    const achievementsProgressPercent = Math.round(ratio(unlockedCount, achievementViews.length) * 100)
    return {
      data: DEFAULT_PROFILE,
      siteProgressPercent,
      achievementsProgressPercent,
      unlockedCount,
      achievementViews,
      sortedAchievementViews,
      recordGameResult: () => {
        // noop outside provider.
      },
    }
  }
  return context
}

