"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { useProfileTracker } from "@/components/profile-provider"

type Difficulty = "easy" | "normal" | "hard" | "extreme" | "legend"
type Phase = "loading" | "menu" | "arming" | "countdown" | "playing" | "paused" | "results" | "error"
type Judgement = "300" | "100" | "50" | "miss"

interface DifficultySettings {
  approachMs: number
  hit300: number
  hit100: number
  hit50: number
  radiusPx: number
  star: number
  spacing: [number, number]
  sliderChance: number
  sliderDurationMs: [number, number]
}

interface TrackAsset {
  id: 1 | 2 | 3
  title: string
  src: string
  durationMs: number
  buffer: AudioBuffer
}

interface BackgroundAsset {
  id: 1 | 2 | 3
  kind: "video" | "image"
  src: string
}

interface BeatNoteBase {
  tMs: number
  r?: number
}

interface BeatCircle extends BeatNoteBase {
  kind: "circle"
  x: number
  y: number
}

interface BeatSlider extends BeatNoteBase {
  kind: "slider"
  points: Array<{ x: number; y: number }>
  durationMs: number
}

type BeatObject = BeatCircle | BeatSlider

interface RuntimeNote extends BeatObject {
  index: number
  judged: Judgement | null
  judgedAtMs: number | null
  isHolding?: boolean
}

interface HitEffect {
  x: number
  y: number
  startedMs: number
  judgement: Judgement
  color: string
}

interface HudState {
  score: number
  combo: number
  maxCombo: number
  accuracy: number
  count300: number
  count100: number
  count50: number
  countMiss: number
}

interface ResultState extends HudState {
  ranking: "SS" | "S" | "A" | "B" | "C" | "D"
  trackId: 1 | 2 | 3
  difficulty: Difficulty
  bestScore: number
  failed: boolean
}

interface ActiveSliderState {
  noteIndex: number
  startDeltaMs: number
  startMs: number
  endMs: number
  coveredMs: number
  lastSampleMs: number
}

interface GameSession {
  trackId: 1 | 2 | 3
  difficulty: Difficulty
  notes: RuntimeNote[]
  settings: DifficultySettings
  source: AudioBufferSourceNode | null
  startContextTime: number
  pausedOffsetMs: number
  totalObjects: number
  score: number
  combo: number
  maxCombo: number
  count300: number
  count100: number
  count50: number
  countMiss: number
  missStreak: number
  totalHitValue: number
  judgedCount: number
  effects: HitEffect[]
  hudLastPushMs: number
  finished: boolean
  activeSlider: ActiveSliderState | null
}

type BestScoresMap = Record<string, number>

const TRACKS: Array<{ id: 1 | 2 | 3; title: string; src: string }> = [
  { id: 1, title: "OSU Track 1", src: "/osu/osu1_music.mp3" },
  { id: 2, title: "OSU Track 2", src: "/osu/osu2_music.mp3" },
  { id: 3, title: "OSU Track 3", src: "/osu/osu3_music.mp3" },
]

const DIFFICULTY: Record<Difficulty, DifficultySettings> = {
  easy: {
    approachMs: 1250,
    hit300: 82,
    hit100: 152,
    hit50: 224,
    radiusPx: 54,
    star: 2,
    spacing: [900, 1280],
    sliderChance: 0.14,
    sliderDurationMs: [780, 1240],
  },
  normal: {
    approachMs: 980,
    hit300: 74,
    hit100: 138,
    hit50: 204,
    radiusPx: 46,
    star: 3,
    spacing: [620, 940],
    sliderChance: 0.18,
    sliderDurationMs: [700, 1160],
  },
  hard: {
    approachMs: 760,
    hit300: 64,
    hit100: 122,
    hit50: 182,
    radiusPx: 40,
    star: 4,
    spacing: [430, 700],
    sliderChance: 0.22,
    sliderDurationMs: [620, 1080],
  },
  extreme: {
    approachMs: 620,
    hit300: 56,
    hit100: 108,
    hit50: 164,
    radiusPx: 36,
    star: 5,
    spacing: [320, 540],
    sliderChance: 0.28,
    sliderDurationMs: [560, 980],
  },
  legend: {
    approachMs: 520,
    hit300: 50,
    hit100: 98,
    hit50: 152,
    radiusPx: 32,
    star: 6,
    spacing: [250, 440],
    sliderChance: 0.34,
    sliderDurationMs: [500, 900],
  },
}

const BEST_STORAGE_KEY = "landing.osu.best.v1"
const FIRST_NOTE_DELAY_MS = 2000
const MISS_STREAK_LIMIT = 5
const DIFFICULTY_ORDER: Difficulty[] = ["easy", "normal", "hard", "extreme", "legend"]

const CIRCLE_COLORS = ["#ff5f87", "#6fa8ff", "#78d8a6", "#f6b26b", "#c993ff"] as const

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function formatTime(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "0:00"
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, "0")
  return `${minutes}:${seconds}`
}

function accuracyOf(totalHitValue: number, totalObjects: number) {
  if (totalObjects <= 0) return 100
  return clamp((totalHitValue / (totalObjects * 300)) * 100, 0, 100)
}

function rankingFromStats(
  accuracy: number,
  count300: number,
  count100: number,
  count50: number,
  countMiss: number,
): ResultState["ranking"] {
  const totalJudged = count300 + count100 + count50 + countMiss
  if (totalJudged <= 0) return "D"

  const ratio300 = count300 / totalJudged
  if (countMiss === 0 && count100 === 0 && count50 === 0 && accuracy >= 99.99) return "SS"
  if (countMiss === 0 && accuracy >= 95 && ratio300 >= 0.78) return "S"
  if (accuracy >= 90 && countMiss <= Math.max(1, Math.floor(totalJudged * 0.02))) return "A"
  if (accuracy >= 82) return "B"
  if (accuracy >= 72) return "C"
  return "D"
}

function createRng(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function pullPoint(object: BeatObject) {
  if (object.kind === "circle") return { x: object.x, y: object.y }
  return object.points[0] ?? { x: 0.5, y: 0.5 }
}

function generateBeatmap(trackId: 1 | 2 | 3, difficulty: Difficulty, durationMs: number): BeatObject[] {
  const settings = DIFFICULTY[difficulty]
  const [minGap, maxGap] = settings.spacing
  const difficultySeed = { easy: 11, normal: 29, hard: 53, extreme: 79, legend: 101 }[difficulty]
  const rng = createRng(trackId * 937 + difficultySeed)
  const notes: BeatObject[] = []

  let tMs = FIRST_NOTE_DELAY_MS
  const finishMs = Math.max(FIRST_NOTE_DELAY_MS + 2000, durationMs - 1300)
  let prevX = 0.5
  let prevY = 0.5

  while (tMs < finishMs) {
    let nextX = 0.12 + rng() * 0.76
    let nextY = 0.12 + rng() * 0.76
    let guard = 0
    while (guard < 10) {
      const dx = nextX - prevX
      const dy = nextY - prevY
      if (Math.sqrt(dx * dx + dy * dy) >= 0.16) break
      nextX = 0.12 + rng() * 0.76
      nextY = 0.12 + rng() * 0.76
      guard += 1
    }

    const makeSlider = rng() < settings.sliderChance
    if (makeSlider) {
      const pointsCount = rng() < 0.62 ? 2 : rng() < 0.86 ? 3 : 4
      const points: Array<{ x: number; y: number }> = [{ x: nextX, y: nextY }]
      let anchorX = nextX
      let anchorY = nextY
      for (let index = 1; index < pointsCount; index += 1) {
        const dir = rng() * Math.PI * 2
        const len = 0.12 + rng() * 0.18
        anchorX = clamp(anchorX + Math.cos(dir) * len, 0.09, 0.91)
        anchorY = clamp(anchorY + Math.sin(dir) * len, 0.09, 0.91)
        points.push({ x: anchorX, y: anchorY })
      }

      const sliderDuration =
        settings.sliderDurationMs[0] + rng() * (settings.sliderDurationMs[1] - settings.sliderDurationMs[0])
      notes.push({
        kind: "slider",
        tMs: Math.round(tMs),
        points,
        durationMs: Math.round(sliderDuration),
      })
    } else {
      notes.push({
        kind: "circle",
        tMs: Math.round(tMs),
        x: nextX,
        y: nextY,
      })
    }

    const lastPoint = pullPoint(notes[notes.length - 1])
    prevX = lastPoint.x
    prevY = lastPoint.y
    const gap = minGap + rng() * (maxGap - minGap)
    tMs += gap
  }

  return notes
}

function notePosition(note: BeatObject, width: number, height: number, radiusPx = 0) {
  const point = pullPoint(note)
  const pad = Math.max(18, radiusPx + 12, Math.min(width, height) * 0.08)
  const x = pad + clamp(point.x, 0, 1) * Math.max(1, width - pad * 2)
  const y = pad + clamp(point.y, 0, 1) * Math.max(1, height - pad * 2)
  return { x, y }
}

function bestKey(trackId: 1 | 2 | 3, difficulty: Difficulty) {
  return `${trackId}_${difficulty}`
}

function judgementBase(judgement: Judgement) {
  if (judgement === "300") return 300
  if (judgement === "100") return 100
  if (judgement === "50") return 50
  return 0
}

function judgementColor(judgement: Judgement) {
  if (judgement === "300") return "#16a34a"
  if (judgement === "100") return "#2563eb"
  if (judgement === "50") return "#ca8a04"
  return "#dc2626"
}

function circleColorByIndex(index: number) {
  const group = Math.floor(index / 5)
  return CIRCLE_COLORS[group % CIRCLE_COLORS.length]
}

function scaleByViewport(width: number, height: number) {
  return clamp(Math.min(width, height) / 900, 0.68, 1.16)
}

function noteRadiusPx(note: BeatObject, settings: DifficultySettings, width: number, height: number) {
  return (note.r ?? settings.radiusPx) * scaleByViewport(width, height)
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const abx = bx - ax
  const aby = by - ay
  const apx = px - ax
  const apy = py - ay
  const abLenSq = abx * abx + aby * aby
  if (abLenSq <= 0.0001) {
    const dx = px - ax
    const dy = py - ay
    return { distance: Math.sqrt(dx * dx + dy * dy), x: ax, y: ay }
  }
  const t = clamp((apx * abx + apy * aby) / abLenSq, 0, 1)
  const x = ax + abx * t
  const y = ay + aby * t
  const dx = px - x
  const dy = py - y
  return { distance: Math.sqrt(dx * dx + dy * dy), x, y }
}

function distanceToSlider(
  pointerX: number,
  pointerY: number,
  points: Array<{ x: number; y: number }>,
) {
  if (points.length === 0) return { distance: Number.POSITIVE_INFINITY, x: pointerX, y: pointerY }
  if (points.length === 1) {
    const dx = pointerX - points[0].x
    const dy = pointerY - points[0].y
    return { distance: Math.sqrt(dx * dx + dy * dy), x: points[0].x, y: points[0].y }
  }

  let bestDistance = Number.POSITIVE_INFINITY
  let bestX = points[0].x
  let bestY = points[0].y

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const candidate = distanceToSegment(pointerX, pointerY, current.x, current.y, next.x, next.y)
    if (candidate.distance < bestDistance) {
      bestDistance = candidate.distance
      bestX = candidate.x
      bestY = candidate.y
    }
  }

  return { distance: bestDistance, x: bestX, y: bestY }
}

function pointAtPolylineProgress(points: Array<{ x: number; y: number }>, progress: number) {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length === 1) return points[0]

  const segmentLengths: number[] = []
  let totalLength = 0
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const dx = next.x - current.x
    const dy = next.y - current.y
    const length = Math.sqrt(dx * dx + dy * dy)
    segmentLengths.push(length)
    totalLength += length
  }
  if (totalLength <= 0.0001) return points[0]

  const target = clamp(progress, 0, 1) * totalLength
  let passed = 0
  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index]
    if (passed + segmentLength >= target) {
      const current = points[index]
      const next = points[index + 1]
      const local = (target - passed) / Math.max(segmentLength, 0.0001)
      return {
        x: current.x + (next.x - current.x) * local,
        y: current.y + (next.y - current.y) * local,
      }
    }
    passed += segmentLength
  }

  return points[points.length - 1]
}

async function urlExists(url: string) {
  try {
    const head = await fetch(url, { method: "HEAD", cache: "no-store" })
    return head.ok
  } catch {
    return false
  }
}

export default function OsuLikePage() {
  const { recordGameResult } = useProfileTracker()

  const [phase, setPhase] = useState<Phase>("loading")
  const [loadingText, setLoadingText] = useState("Loading assets...")
  const [errorText, setErrorText] = useState("")

  const [trackAssets, setTrackAssets] = useState<TrackAsset[]>([])
  const [backgroundAssets, setBackgroundAssets] = useState<BackgroundAsset[]>([])

  const [selectedTrackId, setSelectedTrackId] = useState<1 | 2 | 3>(1)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy")
  const [hoveredTrackId, setHoveredTrackId] = useState<1 | 2 | 3 | null>(null)

  const [volume, setVolume] = useState(70)
  const [backgroundDim, setBackgroundDim] = useState(38)
  const [showHud, setShowHud] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [isSetupPanelHovered, setIsSetupPanelHovered] = useState(false)

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [countdownLabel, setCountdownLabel] = useState<string | null>(null)

  const [hud, setHud] = useState<HudState>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    accuracy: 100,
    count300: 0,
    count100: 0,
    count50: 0,
    countMiss: 0,
  })

  const [result, setResult] = useState<ResultState | null>(null)
  const [resultVisible, setResultVisible] = useState(false)
  const [bestScores, setBestScores] = useState<BestScoresMap>({})
  const [renderNowMs, setRenderNowMs] = useState(0)
  const [fieldSize, setFieldSize] = useState({ width: 1280, height: 720 })
  const [cursorPoint, setCursorPoint] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false })
  const [cursorTrail, setCursorTrail] = useState<Array<{ x: number; y: number; t: number }>>([])
  const phaseRef = useRef<Phase>("loading")

  const gameplayRootRef = useRef<HTMLDivElement | null>(null)
  const canvasWrapRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const cursorTrailRef = useRef<Array<{ x: number; y: number; t: number }>>([])
  const isSetupPanelHoveredRef = useRef(false)
  const armingStartedAtRef = useRef(0)
  const isPointerDownRef = useRef(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const musicGainRef = useRef<GainNode | null>(null)
  const hitGainRef = useRef<GainNode | null>(null)
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gameSourceRef = useRef<AudioBufferSourceNode | null>(null)

  const gameSessionRef = useRef<GameSession | null>(null)
  const rafRef = useRef<number | null>(null)
  const countdownTimeoutsRef = useRef<number[]>([])
  const armingTimeoutRef = useRef<number | null>(null)

  const selectedTrack = useMemo(
    () => trackAssets.find((track) => track.id === selectedTrackId) ?? null,
    [selectedTrackId, trackAssets],
  )
  const selectedBackground = useMemo(
    () => backgroundAssets.find((asset) => asset.id === selectedTrackId) ?? null,
    [backgroundAssets, selectedTrackId],
  )
  const difficultyConfig = DIFFICULTY[selectedDifficulty]

  const ensureAudioGraph = useCallback(async () => {
    if (audioCtxRef.current && musicGainRef.current && hitGainRef.current) {
      return audioCtxRef.current
    }

    const audioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!audioCtor) {
      throw new Error("WebAudio is not supported in this browser.")
    }

    const context = new audioCtor()
    const musicGain = context.createGain()
    const hitGain = context.createGain()

    musicGain.gain.value = 0.7
    hitGain.gain.value = 0.32
    hitGain.connect(musicGain)
    musicGain.connect(context.destination)

    audioCtxRef.current = context
    musicGainRef.current = musicGain
    hitGainRef.current = hitGain
    return context
  }, [])

  const clearCountdownTimeouts = useCallback(() => {
    for (const timeoutId of countdownTimeoutsRef.current) {
      window.clearTimeout(timeoutId)
    }
    countdownTimeoutsRef.current = []
  }, [])

  const clearArmingTimeout = useCallback(() => {
    if (armingTimeoutRef.current !== null) {
      window.clearTimeout(armingTimeoutRef.current)
      armingTimeoutRef.current = null
    }
  }, [])

  const cancelRaf = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const stopBufferSource = useCallback((source: AudioBufferSourceNode | null) => {
    if (!source) return
    try {
      source.onended = null
      source.stop()
    } catch {
      // ignore stop race conditions
    }
    try {
      source.disconnect()
    } catch {
      // ignore disconnect race conditions
    }
  }, [])

  const stopPreview = useCallback(() => {
    stopBufferSource(previewSourceRef.current)
    previewSourceRef.current = null
    setIsPreviewPlaying(false)
  }, [stopBufferSource])

  const stopGameAudio = useCallback(() => {
    stopBufferSource(gameSourceRef.current)
    gameSourceRef.current = null
    if (gameSessionRef.current) {
      gameSessionRef.current.source = null
    }
  }, [stopBufferSource])

  const syncVolume = useCallback(() => {
    const context = audioCtxRef.current
    const musicGain = musicGainRef.current
    if (!context || !musicGain) return
    musicGain.gain.setTargetAtTime(clamp(volume / 100, 0, 1), context.currentTime, 0.02)
  }, [volume])

  useEffect(() => {
    syncVolume()
  }, [syncVolume])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    const mode =
      phase === "playing" || phase === "countdown"
        ? "game"
        : phase === "arming"
          ? isSetupPanelHovered
            ? "panel"
            : "game"
          : null

    if (mode) {
      document.body.setAttribute("data-osu-cursor-mode", mode)
    } else {
      document.body.removeAttribute("data-osu-cursor-mode")
    }
    return () => {
      document.body.removeAttribute("data-osu-cursor-mode")
    }
  }, [isSetupPanelHovered, phase])

  useEffect(() => {
    const gameplayCursor = phase === "playing" || phase === "countdown" || phase === "arming"
    if (!gameplayCursor) {
      cursorTrailRef.current = []
      setCursorTrail([])
      setCursorPoint((previous) => ({ ...previous, visible: false }))
      return
    }

    let rafId = 0
    const tick = () => {
      const now = performance.now()
      cursorTrailRef.current = cursorTrailRef.current.filter((point) => now - point.t <= 500)
      setCursorTrail([...cursorTrailRef.current])
      rafId = window.requestAnimationFrame(tick)
    }
    rafId = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(rafId)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== "results") {
      setResultVisible(false)
      return
    }
    const timeoutId = window.setTimeout(() => {
      setResultVisible(true)
    }, 24)
    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [phase, result])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BEST_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as BestScoresMap
      if (!parsed || typeof parsed !== "object") return
      setBestScores(parsed)
    } catch {
      // ignore invalid local storage payload
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setLoadingText("Preparing audio engine...")
        const context = await ensureAudioGraph()

        const loadedTracks: TrackAsset[] = []
        let loadedCount = 0

        for (const track of TRACKS) {
          setLoadingText(`Loading ${track.title}...`)
          const response = await fetch(track.src, { cache: "no-store" })
          if (!response.ok) {
            throw new Error("Assets not found in /osu")
          }
          const fileBuffer = await response.arrayBuffer()
          const decoded = await context.decodeAudioData(fileBuffer.slice(0))
          loadedTracks.push({
            id: track.id,
            title: track.title,
            src: track.src,
            durationMs: decoded.duration * 1000,
            buffer: decoded,
          })
          loadedCount += 1
          setLoadingText(`Loading audio ${loadedCount}/3...`)
        }

        const loadedBackgrounds: BackgroundAsset[] = []
        for (const id of [1, 2, 3] as const) {
          const videoPath = `/osu/osu_video${id}.mp4`
          if (await urlExists(videoPath)) {
            loadedBackgrounds.push({ id, kind: "video", src: videoPath })
            continue
          }

          let photoPath: string | null = null
          for (const ext of ["jpg", "jpeg", "png"]) {
            const candidate = `/osu/osu_photo${id}.${ext}`
            if (await urlExists(candidate)) {
              photoPath = candidate
              break
            }
          }
          if (!photoPath) {
            throw new Error("Assets not found in /osu")
          }
          loadedBackgrounds.push({ id, kind: "image", src: photoPath })
        }

        if (cancelled) return
        setTrackAssets(loadedTracks)
        setBackgroundAssets(loadedBackgrounds)
        setPhase("menu")
      } catch (error) {
        if (cancelled) return
        setErrorText(error instanceof Error ? error.message : "Assets not found in /osu")
        setPhase("error")
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [ensureAudioGraph])

  const visualNotes = useMemo(() => {
    const session = gameSessionRef.current
    if (!session || (phase !== "playing" && phase !== "countdown" && phase !== "paused")) return []

    const width = Math.max(fieldSize.width, 1)
    const height = Math.max(fieldSize.height, 1)
    const timelineMs = phase === "paused" ? session.pausedOffsetMs : renderNowMs

    return session.notes
      .filter((note) => {
        if (note.judged) return false
        const delta = note.tMs - timelineMs
        if (note.kind === "slider") {
          const sliderEndMs = note.tMs + note.durationMs
          return delta <= session.settings.approachMs && timelineMs <= sliderEndMs + session.settings.hit50
        }
        return delta <= session.settings.approachMs && delta >= -session.settings.hit50
      })
      .map((note) => {
        const radius = noteRadiusPx(note, session.settings, width, height)
        const position = notePosition(note, width, height, radius)
        const delta = note.tMs - timelineMs
        const approachProgress = note.kind === "slider" && timelineMs > note.tMs ? 0 : clamp(delta / session.settings.approachMs, 0, 1)
        const approachRadius = radius * (1 + approachProgress * 1.8)
        const color = circleColorByIndex(note.index)
        const sliderPoints =
          note.kind === "slider"
            ? note.points.map((point) => notePosition({ kind: "circle", tMs: note.tMs, x: point.x, y: point.y }, width, height, radius))
            : null
        const sliderProgress =
          note.kind === "slider" ? clamp((timelineMs - note.tMs) / Math.max(note.durationMs, 1), 0, 1) : null
        const sliderBall =
          note.kind === "slider" && sliderPoints && sliderPoints.length > 1 && sliderProgress !== null
            ? pointAtPolylineProgress(sliderPoints, sliderProgress)
            : null
        return {
          id: note.index,
          kind: note.kind,
          x: position.x,
          y: position.y,
          radius,
          approachRadius,
          color,
          sliderPoints,
          sliderProgress,
          sliderBall,
        }
      })
  }, [fieldSize.height, fieldSize.width, phase, renderNowMs])

  const visualEffects = useMemo(() => {
    const session = gameSessionRef.current
    if (!session) return []
    const timelineMs = phase === "paused" ? session.pausedOffsetMs : renderNowMs
    const baseRadius = noteRadiusPx({ tMs: 0, x: 0.5, y: 0.5 }, session.settings, fieldSize.width, fieldSize.height)
    return session.effects
      .map((effect, index) => {
        const age = timelineMs - effect.startedMs
        if (age < 0 || age > 500) return null
        const alpha = clamp(1 - age / 500, 0, 1)
        const ringRadius = baseRadius * 0.9 + age * (reduceMotion ? 0.05 : 0.14)
        return {
          id: `${effect.startedMs}-${index}`,
          x: effect.x,
          y: effect.y,
          alpha,
          ringRadius,
          judgement: effect.judgement,
          color: effect.color,
        }
      })
      .filter((value): value is NonNullable<typeof value> => value !== null)
  }, [fieldSize.height, fieldSize.width, phase, reduceMotion, renderNowMs])

  const updateHud = useCallback((session: GameSession) => {
    setHud({
      score: session.score,
      combo: session.combo,
      maxCombo: session.maxCombo,
      accuracy: accuracyOf(session.totalHitValue, session.totalObjects),
      count300: session.count300,
      count100: session.count100,
      count50: session.count50,
      countMiss: session.countMiss,
    })
  }, [])

  const playHitSound = useCallback(async (judgement: Judgement) => {
    if (judgement === "miss") return
    const context = audioCtxRef.current ?? (await ensureAudioGraph())
    const target = hitGainRef.current
    if (!target) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = judgement === "300" ? "triangle" : judgement === "100" ? "sine" : "square"
    oscillator.frequency.value = judgement === "300" ? 950 : judgement === "100" ? 780 : 620

    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.13, context.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.09)

    oscillator.connect(gain)
    gain.connect(target)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.1)
  }, [ensureAudioGraph])

  const pushResult = useCallback(
    (session: GameSession, forcedFail = false) => {
      if (session.finished) return
      session.finished = true
      stopGameAudio()
      cancelRaf()

      const accuracy = accuracyOf(session.totalHitValue, session.totalObjects)
      const ranking = rankingFromStats(
        accuracy,
        session.count300,
        session.count100,
        session.count50,
        session.countMiss,
      )
      const storageKey = bestKey(session.trackId, session.difficulty)
      const previousBest = bestScores[storageKey] ?? 0
      const nextBest = Math.max(previousBest, session.score)

      const resultPayload: ResultState = {
        score: session.score,
        combo: session.combo,
        maxCombo: session.maxCombo,
        accuracy,
        count300: session.count300,
        count100: session.count100,
        count50: session.count50,
        countMiss: session.countMiss,
        ranking,
        trackId: session.trackId,
        difficulty: session.difficulty,
        bestScore: nextBest,
        failed: forcedFail,
      }

      setBestScores((previous) => {
        const updated = { ...previous, [storageKey]: nextBest }
        try {
          window.localStorage.setItem(BEST_STORAGE_KEY, JSON.stringify(updated))
        } catch {
          // ignore storage errors
        }
        return updated
      })

      recordGameResult("osu", {
        score: session.score,
        win: !forcedFail && accuracy >= 90,
      })

      setResult(resultPayload)
      phaseRef.current = "results"
      setPhase("results")
    },
    [bestScores, cancelRaf, recordGameResult, stopGameAudio],
  )

  const judgeNote = useCallback(
    async (note: RuntimeNote, judgement: Judgement, nowMs: number, hitX: number, hitY: number) => {
      const session = gameSessionRef.current
      if (!session || note.judged) return

      note.judged = judgement
      note.judgedAtMs = nowMs
      session.judgedCount += 1
      session.effects.push({ x: hitX, y: hitY, judgement, startedMs: nowMs, color: circleColorByIndex(note.index) })

      if (judgement === "miss") {
        session.combo = 0
        session.countMiss += 1
        session.missStreak += 1
      } else {
        const base = judgementBase(judgement)
        session.missStreak = 0
        session.combo += 1
        session.maxCombo = Math.max(session.maxCombo, session.combo)
        const gain = 1 + session.combo / 25
        session.score += Math.round(base * gain)
        session.totalHitValue += base
        if (judgement === "300") session.count300 += 1
        if (judgement === "100") session.count100 += 1
        if (judgement === "50") session.count50 += 1
      }

      updateHud(session)
      await playHitSound(judgement)

      if (session.missStreak >= MISS_STREAK_LIMIT) {
        pushResult(session, true)
        return
      }

      if (session.judgedCount >= session.totalObjects) {
        pushResult(session)
      }
    },
    [playHitSound, pushResult, updateHud],
  )

  const getCurrentGameTimeMs = useCallback(() => {
    const context = audioCtxRef.current
    const session = gameSessionRef.current
    if (!session || !context) return 0
    return Math.max(0, (context.currentTime - session.startContextTime) * 1000)
  }, [])

  const handleHitAt = useCallback(
    async (x: number, y: number) => {
      if (phaseRef.current !== "playing") return
      const canvas = canvasRef.current
      const session = gameSessionRef.current
      if (!canvas || !session) return
      if (session.activeSlider) return

      const nowMs = getCurrentGameTimeMs()
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const radiusBase = session.settings.radiusPx * scaleByViewport(width, height)
      const tolerance = Math.max(8, radiusBase * 0.18)

      let candidate:
        | {
            note: RuntimeNote
            delta: number
            distance: number
            hitX: number
            hitY: number
          }
        | null = null
      for (const note of session.notes) {
        if (note.judged) continue
        const delta = Math.abs(nowMs - note.tMs)
        if (delta > session.settings.hit50) continue

        const radius = noteRadiusPx(note, session.settings, width, height)
        let distance = Number.POSITIVE_INFINITY
        let hitX = 0
        let hitY = 0

        if (note.kind === "slider") {
          const sliderPoints = note.points.map((point) =>
            notePosition({ kind: "circle", tMs: note.tMs, x: point.x, y: point.y }, width, height, radius),
          )
          const nearest = distanceToSlider(x, y, sliderPoints)
          distance = nearest.distance
          hitX = nearest.x
          hitY = nearest.y
        } else {
          const position = notePosition(note, width, height, radius)
          const dx = x - position.x
          const dy = y - position.y
          distance = Math.sqrt(dx * dx + dy * dy)
          hitX = position.x
          hitY = position.y
        }
        if (distance > radius + tolerance) continue

        if (!candidate || delta < candidate.delta || (delta === candidate.delta && distance < candidate.distance)) {
          candidate = { note, delta, distance, hitX, hitY }
        }
      }

      if (!candidate) return

      const delta = candidate.delta

      if (candidate.note.kind === "slider") {
        if (candidate.note.isHolding || session.activeSlider) return
        candidate.note.isHolding = true
        session.activeSlider = {
          noteIndex: candidate.note.index,
          startDeltaMs: delta,
          startMs: nowMs,
          endMs: candidate.note.tMs + candidate.note.durationMs,
          coveredMs: 0,
          lastSampleMs: nowMs,
        }
        session.effects.push({
          x: candidate.hitX,
          y: candidate.hitY,
          judgement: "100",
          startedMs: nowMs,
          color: circleColorByIndex(candidate.note.index),
        })
        void playHitSound("100")
        return
      }

      let judgement: Judgement = "miss"
      if (delta <= session.settings.hit300) judgement = "300"
      else if (delta <= session.settings.hit100) judgement = "100"
      else if (delta <= session.settings.hit50) judgement = "50"

      await judgeNote(candidate.note, judgement, nowMs, candidate.hitX, candidate.hitY)
    },
    [getCurrentGameTimeMs, judgeNote, playHitSound],
  )

  const rafTick = useCallback(() => {
    const session = gameSessionRef.current
    if (!session || phaseRef.current !== "playing") return

    const nowMs = getCurrentGameTimeMs()
    const canvas = canvasRef.current
    const width = canvas?.clientWidth ?? 1280
    const height = canvas?.clientHeight ?? 720

    const activeSlider = session.activeSlider
    if (activeSlider) {
      const sliderNote = session.notes.find((note) => note.index === activeSlider.noteIndex)
      if (!sliderNote || sliderNote.kind !== "slider" || sliderNote.judged) {
        session.activeSlider = null
      } else {
        const elapsedSample = Math.max(0, nowMs - activeSlider.lastSampleMs)
        if (elapsedSample > 0) {
          const pointer = pointerRef.current
          const radius = noteRadiusPx(sliderNote, session.settings, width, height)
          const path = sliderNote.points.map((point) =>
            notePosition({ kind: "circle", tMs: sliderNote.tMs, x: point.x, y: point.y }, width, height, radius),
          )
          if (isPointerDownRef.current && pointer) {
            const nearest = distanceToSlider(pointer.x, pointer.y, path)
            const followTolerance = radius * 0.82
            if (nearest.distance <= radius + followTolerance) {
              activeSlider.coveredMs += elapsedSample
            }
          }
          activeSlider.lastSampleMs = nowMs
        }

        if (nowMs >= activeSlider.endMs) {
          const holdRatio = clamp(activeSlider.coveredMs / Math.max(sliderNote.durationMs, 1), 0, 1)
          let judgement: Judgement = "miss"
          if (activeSlider.startDeltaMs <= session.settings.hit300 && holdRatio >= 0.9) judgement = "300"
          else if (activeSlider.startDeltaMs <= session.settings.hit100 && holdRatio >= 0.72) judgement = "100"
          else if (holdRatio >= 0.45) judgement = "50"

          session.activeSlider = null
          sliderNote.isHolding = false
          const tail = sliderNote.points[sliderNote.points.length - 1] ?? sliderNote.points[0] ?? { x: 0.5, y: 0.5 }
          const tailPosition = notePosition(
            { kind: "circle", tMs: sliderNote.tMs, x: tail.x, y: tail.y },
            width,
            height,
            noteRadiusPx(sliderNote, session.settings, width, height),
          )
          void judgeNote(sliderNote, judgement, nowMs, tailPosition.x, tailPosition.y)
        } else {
          sliderNote.isHolding = true
        }
      }
    }

    for (const note of session.notes) {
      if (note.judged) continue
      if (note.isHolding) continue
      if (nowMs > note.tMs + session.settings.hit50) {
        const radius = noteRadiusPx(note, session.settings, width, height)
        const position = notePosition(note, width, height, radius)
        void judgeNote(note, "miss", nowMs, position.x, position.y)
      }
    }
    session.effects = session.effects.filter((effect) => nowMs - effect.startedMs <= 500)
    setRenderNowMs(nowMs)
    if (nowMs - session.hudLastPushMs >= 90) {
      session.hudLastPushMs = nowMs
      updateHud(session)
    }

    if (session.judgedCount >= session.totalObjects && !session.finished) {
      pushResult(session)
      return
    }

    rafRef.current = window.requestAnimationFrame(() => {
      rafTick()
    })
  }, [getCurrentGameTimeMs, judgeNote, pushResult, updateHud])

  const stopGame = useCallback(() => {
    clearArmingTimeout()
    cancelRaf()
    stopGameAudio()
    isPointerDownRef.current = false
    gameSessionRef.current = null
    setCountdownLabel(null)
  }, [cancelRaf, clearArmingTimeout, stopGameAudio])

  const enterFullscreen = useCallback(async () => {
    const target = gameplayRootRef.current ?? document.documentElement
    if (document.fullscreenElement) return
    try {
      await target.requestFullscreen()
    } catch {
      // ignore fullscreen rejection
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) return
    try {
      await document.exitFullscreen()
    } catch {
      // ignore fullscreen rejection
    }
  }, [])

  const startGameNow = useCallback(async () => {
    if (!selectedTrack) return
    const context = await ensureAudioGraph()
    if (context.state === "suspended") {
      await context.resume()
    }

    const beatmap = generateBeatmap(selectedTrack.id, selectedDifficulty, selectedTrack.durationMs)
    const runtimeNotes: RuntimeNote[] = beatmap.map((note, index) => ({
      ...note,
      index,
      judged: null,
      judgedAtMs: null,
    }))

    const source = context.createBufferSource()
    source.buffer = selectedTrack.buffer
    source.connect(musicGainRef.current!)
    const startContextTime = context.currentTime + 0.02
    source.start(startContextTime, 0)
    gameSourceRef.current = source

    const session: GameSession = {
      trackId: selectedTrack.id,
      difficulty: selectedDifficulty,
      notes: runtimeNotes,
      settings: DIFFICULTY[selectedDifficulty],
      source,
      startContextTime,
      pausedOffsetMs: 0,
      totalObjects: runtimeNotes.length,
      score: 0,
      combo: 0,
      maxCombo: 0,
      count300: 0,
      count100: 0,
      count50: 0,
      countMiss: 0,
      missStreak: 0,
      totalHitValue: 0,
      judgedCount: 0,
      effects: [],
      hudLastPushMs: 0,
      finished: false,
      activeSlider: null,
    }

    source.onended = () => {
      const active = gameSessionRef.current
      if (!active || active !== session) return
      if (!active.finished) {
        pushResult(active)
      }
    }

    setHud({
      score: 0,
      combo: 0,
      maxCombo: 0,
      accuracy: 100,
      count300: 0,
      count100: 0,
      count50: 0,
      countMiss: 0,
    })
    setRenderNowMs(0)
    setResult(null)
    gameSessionRef.current = session
    phaseRef.current = "playing"
    setPhase("playing")
    rafRef.current = window.requestAnimationFrame(() => {
      rafTick()
    })
  }, [ensureAudioGraph, pushResult, rafTick, selectedDifficulty, selectedTrack])

  const kickoffCountdown = useCallback(() => {
    clearArmingTimeout()
    clearCountdownTimeouts()
    setCountdownLabel("3")
    phaseRef.current = "countdown"
    setPhase("countdown")

    const steps: Array<{ at: number; label: string; start?: boolean }> = [
      { at: 1000, label: "2" },
      { at: 2000, label: "1" },
      { at: 3000, label: "GO", start: true },
      { at: 3700, label: "" },
    ]

    for (const step of steps) {
      const timeoutId = window.setTimeout(() => {
        setCountdownLabel(step.label || null)
        if (step.start) {
          startGameNow()
        }
      }, step.at)
      countdownTimeoutsRef.current.push(timeoutId)
    }
  }, [clearArmingTimeout, clearCountdownTimeouts, startGameNow])

  const scheduleArmingAutoStart = useCallback(() => {
    clearArmingTimeout()
    if (phaseRef.current !== "arming") return
    if (isSetupPanelHoveredRef.current) return

    const elapsed = performance.now() - armingStartedAtRef.current
    const delayMs = Math.max(0, 2000 - elapsed)
    armingTimeoutRef.current = window.setTimeout(() => {
      if (phaseRef.current !== "arming") return
      if (isSetupPanelHoveredRef.current) return
      kickoffCountdown()
    }, delayMs)
  }, [clearArmingTimeout, kickoffCountdown])

  const beginArming = useCallback(async () => {
    if (!selectedTrack) return
    await enterFullscreen()
    stopPreview()
    stopGame()
    clearCountdownTimeouts()
    clearArmingTimeout()
    setCountdownLabel(null)
    setIsSetupPanelHovered(false)
    isSetupPanelHoveredRef.current = false
    armingStartedAtRef.current = performance.now()
    phaseRef.current = "arming"
    setPhase("arming")
  }, [clearArmingTimeout, clearCountdownTimeouts, enterFullscreen, selectedTrack, stopGame, stopPreview])

  useEffect(() => {
    if (phase !== "arming") {
      clearArmingTimeout()
      return
    }
    scheduleArmingAutoStart()
  }, [clearArmingTimeout, isSetupPanelHovered, phase, scheduleArmingAutoStart])

  const pauseGame = useCallback(() => {
    if (phase !== "playing") return
    const session = gameSessionRef.current
    if (!session) return

    const nowMs = getCurrentGameTimeMs()
    session.pausedOffsetMs = nowMs
    setRenderNowMs(nowMs)
    stopGameAudio()
    cancelRaf()
    phaseRef.current = "paused"
    setPhase("paused")
  }, [cancelRaf, getCurrentGameTimeMs, phase, stopGameAudio])

  const resumeGame = useCallback(async () => {
    if (phase !== "paused") return
    const session = gameSessionRef.current
    if (!session) return
    const context = await ensureAudioGraph()
    if (context.state === "suspended") {
      await context.resume()
    }

    const track = trackAssets.find((item) => item.id === session.trackId)
    if (!track) return

    const source = context.createBufferSource()
    source.buffer = track.buffer
    source.connect(musicGainRef.current!)
    source.onended = () => {
      const active = gameSessionRef.current
      if (!active || active !== session) return
      if (!active.finished) pushResult(active)
    }

    const offsetSec = clamp(session.pausedOffsetMs / 1000, 0, track.buffer.duration - 0.02)
    const startContextTime = context.currentTime - offsetSec
    session.startContextTime = startContextTime
    session.source = source
    gameSourceRef.current = source
    source.start(context.currentTime + 0.01, offsetSec)

    phaseRef.current = "playing"
    setPhase("playing")
    rafRef.current = window.requestAnimationFrame(() => {
      rafTick()
    })
  }, [ensureAudioGraph, phase, pushResult, rafTick, trackAssets])

  const restartGame = useCallback(() => {
    beginArming()
  }, [beginArming])

  const backToMenu = useCallback(() => {
    clearCountdownTimeouts()
    stopGame()
    setResult(null)
    phaseRef.current = "menu"
    setPhase("menu")
    void exitFullscreen()
  }, [clearCountdownTimeouts, exitFullscreen, stopGame])

  const togglePreview = useCallback(async () => {
    if (!selectedTrack) return
    if (isPreviewPlaying) {
      stopPreview()
      return
    }

    const context = await ensureAudioGraph()
    if (context.state === "suspended") {
      await context.resume()
    }

    stopPreview()
    const source = context.createBufferSource()
    source.buffer = selectedTrack.buffer
    source.connect(musicGainRef.current!)
    source.loop = true
    source.loopStart = 0
    source.loopEnd = Math.min(selectedTrack.buffer.duration, 24)
    source.start()
    previewSourceRef.current = source
    setIsPreviewPlaying(true)
  }, [ensureAudioGraph, isPreviewPlaying, selectedTrack, stopPreview])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        if (phase === "playing") pauseGame()
        else if (phase === "paused") resumeGame()
      }

      if (event.key.toLowerCase() === "r") {
        if (phase === "playing" || phase === "paused" || phase === "results") {
          event.preventDefault()
          restartGame()
        }
      }

      const key = event.key.toLowerCase()
      if ((key === "z" || key === "x") && phase === "playing") {
        event.preventDefault()
        const pointer = pointerRef.current
        if (pointer) {
          handleHitAt(pointer.x, pointer.y)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleHitAt, pauseGame, phase, restartGame, resumeGame])

  useEffect(() => {
    const releasePointer = () => {
      isPointerDownRef.current = false
    }
    window.addEventListener("pointerup", releasePointer)
    window.addEventListener("pointercancel", releasePointer)
    window.addEventListener("blur", releasePointer)
    return () => {
      window.removeEventListener("pointerup", releasePointer)
      window.removeEventListener("pointercancel", releasePointer)
      window.removeEventListener("blur", releasePointer)
    }
  }, [])

  useEffect(() => {
    const resizeCanvas = () => {
      const wrap = canvasWrapRef.current
      const canvas = canvasRef.current
      if (!wrap || !canvas) return

      const rect = wrap.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      setFieldSize({ width: rect.width, height: rect.height })

      const dpr = clamp(window.devicePixelRatio || 1, 1, 2)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      const context = canvas.getContext("2d")
      if (!context) return
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.imageSmoothingEnabled = true
      context.clearRect(0, 0, rect.width, rect.height)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  useEffect(() => {
    return () => {
      clearArmingTimeout()
      clearCountdownTimeouts()
      cancelRaf()
      stopPreview()
      stopGameAudio()
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {
          // ignore close errors
        })
      }
      const context = audioCtxRef.current
      if (context) {
        context.close().catch(() => {
          // ignore close errors
        })
      }
    }
  }, [cancelRaf, clearArmingTimeout, clearCountdownTimeouts, stopGameAudio, stopPreview])

  const onCanvasPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    isPointerDownRef.current = true
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    pointerRef.current = { x, y }
    setCursorPoint({ x, y, visible: true })
    cursorTrailRef.current.push({ x, y, t: performance.now() })

    if (phase === "arming") {
      const centerHit = x > rect.width * 0.22 && x < rect.width * 0.78 && y > rect.height * 0.2 && y < rect.height * 0.8
      if (!isSetupPanelHoveredRef.current && centerHit) {
        kickoffCountdown()
      }
      return
    }

    if (phase === "playing") {
      handleHitAt(x, y)
    }
  }

  const onCanvasPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    pointerRef.current = { x, y }
    setCursorPoint({ x, y, visible: true })
    cursorTrailRef.current.push({ x, y, t: performance.now() })
  }

  const onCanvasPointerLeave = () => {
    setCursorPoint((previous) => ({ ...previous, visible: false }))
  }

  const onCanvasPointerUp = () => {
    isPointerDownRef.current = false
  }

  const difficultyLabel = difficultyConfig ? selectedDifficulty.toUpperCase() : "EASY"
  const bestForCurrent = bestScores[bestKey(selectedTrackId, selectedDifficulty)] ?? 0

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-4 pb-8 pt-20 text-[#111111] md:px-8">
      <div className="mx-auto max-w-[1400px]">
        {phase === "loading" && (
          <section className="rounded-xl border border-black/14 bg-white/45 p-6">
            <p className="text-sm tracking-[0.08em] text-black/70 uppercase">{loadingText}</p>
          </section>
        )}

        {phase === "error" && (
          <section className="rounded-xl border border-red-900/25 bg-red-50/60 p-6 text-red-900">
            <p className="text-sm font-medium">Assets not found in /osu</p>
            <p className="mt-2 text-sm">
              Check that <code>osu1_music.mp3</code>...<code>osu3_music.mp3</code> and matching backgrounds exist in <code>/osu</code>.
            </p>
            {errorText && <p className="mt-2 text-xs opacity-75">{errorText}</p>}
          </section>
        )}

        {phase === "menu" && (
          <section className="relative overflow-hidden rounded-2xl border border-black/14 bg-white/40 p-4 md:p-5">
            {selectedBackground?.kind === "video" && (
              <video src={selectedBackground.src} className="absolute inset-0 h-full w-full object-cover" muted loop autoPlay playsInline />
            )}
            {selectedBackground?.kind === "image" && (
              <img src={selectedBackground.src} alt={`Track ${selectedTrackId}`} className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-[#190a18]/45 backdrop-blur-[1px]" />

            <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-2">
                <p className="text-[11px] tracking-[0.16em] text-white/70 uppercase">Song wheel</p>
                {trackAssets.map((track) => {
                  const expanded = hoveredTrackId === track.id || selectedTrackId === track.id
                  const selected = selectedTrackId === track.id
                  return (
                    <div
                      key={track.id}
                      onMouseEnter={() => setHoveredTrackId(track.id)}
                      onMouseLeave={() => setHoveredTrackId(null)}
                      className={`overflow-hidden rounded-xl border transition-all duration-300 ${
                        expanded
                          ? "border-white/45 bg-[#ffe7f2]/28 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                          : "border-white/20 bg-black/25"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (track.id !== selectedTrackId && isPreviewPlaying) {
                            stopPreview()
                          }
                          setSelectedTrackId(track.id)
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <div>
                          <p className="text-base font-medium text-white">{track.title}</p>
                          <p className="text-[11px] text-white/70">{formatTime(track.durationMs)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] tracking-[0.14em] text-white/70 uppercase">{selected ? "Selected" : "Track"}</p>
                          <p className="text-sm text-[#ffd4e8]">{"*".repeat(DIFFICULTY[selectedDifficulty].star)}</p>
                        </div>
                      </button>

                      <div
                        className={`grid overflow-hidden px-3 transition-[max-height,opacity,margin] duration-300 ${
                          expanded ? "mt-1 max-h-52 opacity-100 pb-3" : "mt-0 max-h-0 opacity-0 pb-0"
                        }`}
                      >
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {DIFFICULTY_ORDER.map((difficulty) => (
                            <button
                              key={`${track.id}-${difficulty}`}
                              type="button"
                              onClick={() => {
                                if (track.id !== selectedTrackId && isPreviewPlaying) {
                                  stopPreview()
                                }
                                setSelectedTrackId(track.id)
                                setSelectedDifficulty(difficulty)
                              }}
                              className={`rounded-md border px-2 py-1.5 text-[11px] tracking-[0.1em] uppercase transition-colors ${
                                selectedTrackId === track.id && selectedDifficulty === difficulty
                                  ? "border-white/55 bg-white/18 text-white"
                                  : "border-white/25 bg-black/20 text-white/85 hover:bg-black/35"
                              }`}
                            >
                              {difficulty}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <aside className="space-y-4 rounded-xl border border-white/30 bg-[#ffe7f2]/28 p-4 text-white backdrop-blur-md">
                <div className="rounded-md border border-white/30 bg-black/18 p-3 text-xs">
                  <p className="text-[10px] tracking-[0.12em] text-white/70 uppercase">Selected</p>
                  <p className="mt-1 text-sm font-medium">{selectedTrack?.title ?? "Track"}</p>
                  <p className="mt-1 text-white/80">Difficulty: {difficultyLabel}</p>
                  <p className="mt-1 text-white/80">Best score: {bestForCurrent}</p>
                  <p className="mt-1 text-white/80">First note: +{Math.round(FIRST_NOTE_DELAY_MS / 1000)}s after GO</p>
                </div>

                <div>
                  <label className="flex items-center justify-between text-[11px] tracking-[0.12em] text-white/80 uppercase">
                    <span>Volume</span>
                    <span>{volume}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    className="mt-2 w-full accent-[#ff6ea5]"
                  />
                </div>

                <button
                  type="button"
                  onClick={togglePreview}
                  className="w-full rounded-md border border-white/35 bg-white/18 px-3 py-2 text-xs tracking-[0.12em] uppercase transition-colors hover:bg-white/25"
                >
                  {isPreviewPlaying ? "Stop preview" : "Preview"}
                </button>

                <button
                  type="button"
                  onClick={beginArming}
                  className="w-full rounded-md border border-white/35 bg-[#ff6fa3] px-3 py-2 text-xs tracking-[0.12em] text-white uppercase transition-opacity hover:opacity-90"
                >
                  Start
                </button>
              </aside>
            </div>
          </section>
        )}

        {(phase === "arming" || phase === "countdown" || phase === "playing" || phase === "paused" || phase === "results") && (
          <section ref={gameplayRootRef} className="fixed inset-0 z-[80] h-[100dvh] overflow-hidden bg-[#140914]">
            <div ref={canvasWrapRef} className="relative h-full w-full overflow-hidden bg-black">
              {selectedBackground?.kind === "video" && (
                <video src={selectedBackground.src} className="absolute inset-0 h-full w-full object-cover" muted loop autoPlay playsInline />
              )}
              {selectedBackground?.kind === "image" && (
                <img src={selectedBackground.src} alt="Game background" className="absolute inset-0 h-full w-full object-cover" />
              )}

              <div className="absolute inset-0 bg-black transition-opacity duration-200" style={{ opacity: clamp(backgroundDim / 100, 0, 0.8) }} />

              <canvas
                ref={canvasRef}
                className={`absolute inset-0 z-10 h-full w-full touch-none ${
                  phase === "playing" || phase === "countdown" || (phase === "arming" && !isSetupPanelHovered)
                    ? "cursor-none"
                    : ""
                }`}
                onPointerDown={onCanvasPointerDown}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={onCanvasPointerUp}
                onPointerCancel={onCanvasPointerUp}
                onPointerLeave={onCanvasPointerLeave}
              />

              <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" viewBox={`0 0 ${fieldSize.width} ${fieldSize.height}`} preserveAspectRatio="none">
                {visualNotes.map((note) => (
                  <g key={note.id}>
                    {note.kind === "slider" && note.sliderPoints && note.sliderPoints.length > 1 && (
                      <polyline
                        points={note.sliderPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                        fill="none"
                        stroke={`${note.color}cc`}
                        strokeWidth={Math.max(3, note.radius * 0.48)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    <circle
                      cx={note.x}
                      cy={note.y}
                      r={note.approachRadius}
                      fill="none"
                      stroke="rgba(255,255,255,0.92)"
                      strokeWidth={Math.max(1.6, note.radius * 0.08)}
                    />
                    <circle
                      cx={note.x}
                      cy={note.y}
                      r={note.radius}
                      fill={`${note.color}77`}
                      stroke="white"
                      strokeWidth={Math.max(2, note.radius * 0.12)}
                    />
                    <circle cx={note.x} cy={note.y} r={Math.max(2, note.radius * 0.2)} fill="rgba(255,255,255,0.95)" />
                    {note.kind === "slider" && note.sliderPoints && note.sliderPoints.length > 1 && (
                      <circle
                        cx={note.sliderPoints[note.sliderPoints.length - 1]!.x}
                        cy={note.sliderPoints[note.sliderPoints.length - 1]!.y}
                        r={Math.max(2, note.radius * 0.78)}
                        fill={`${note.color}4f`}
                        stroke="rgba(255,255,255,0.92)"
                        strokeWidth={Math.max(2, note.radius * 0.1)}
                      />
                    )}
                    {note.kind === "slider" && note.sliderBall && (
                      <circle
                        cx={note.sliderBall.x}
                        cy={note.sliderBall.y}
                        r={Math.max(3, note.radius * 0.52)}
                        fill="rgba(255,255,255,0.94)"
                        stroke={`${note.color}f0`}
                        strokeWidth={Math.max(1.8, note.radius * 0.08)}
                      />
                    )}
                  </g>
                ))}

                {visualEffects.map((effect) => (
                  <g key={effect.id} opacity={effect.alpha}>
                    <circle
                      cx={effect.x}
                      cy={effect.y}
                      r={effect.ringRadius}
                      fill="none"
                      stroke={effect.judgement === "miss" ? judgementColor("miss") : effect.color}
                      strokeWidth={reduceMotion ? 2 : 2.8}
                    />
                    <text
                      x={effect.x}
                      y={effect.y - effect.ringRadius - 6}
                      fill="#ffffff"
                      fontSize="15"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {effect.judgement.toUpperCase()}
                    </text>
                  </g>
                ))}
              </svg>

              {(phase === "playing" || phase === "countdown" || (phase === "arming" && !isSetupPanelHovered)) && (
                <div className="pointer-events-none absolute inset-0 z-40">
                  {cursorTrail.map((point, index) => {
                    const age = performance.now() - point.t
                    const alpha = clamp(1 - age / 500, 0, 1)
                    return (
                      <div
                        key={`${point.t}-${index}`}
                        className="absolute h-1 w-1 rounded-full bg-white"
                        style={{
                          left: point.x - 2,
                          top: point.y - 2,
                          opacity: alpha * 0.85,
                          boxShadow: "0 0 6px rgba(255,255,255,0.7)",
                        }}
                      />
                    )
                  })}

                  {cursorPoint.visible && (
                    <div
                      className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/85"
                      style={{
                        left: cursorPoint.x,
                        top: cursorPoint.y,
                        boxShadow: "0 0 18px rgba(255,255,255,0.9), 0 0 26px rgba(255,255,255,0.45)",
                      }}
                    >
                      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)]" />
                    </div>
                  )}
                </div>
              )}

              {showHud && (
                <div className="pointer-events-none absolute left-3 top-3 z-30 rounded-md border border-white/35 bg-[#f9d8e7]/34 px-3 py-2 text-white backdrop-blur-sm">
                  <p className="text-[11px] tracking-[0.1em] uppercase">Score {hud.score}</p>
                  <p className="mt-1 text-[11px] tracking-[0.1em] uppercase">Combo {hud.combo}</p>
                  <p className="mt-1 text-[11px] tracking-[0.1em] uppercase">Max {hud.maxCombo}</p>
                  <p className="mt-1 text-[11px] tracking-[0.1em] uppercase">
                    Miss streak {Math.max(0, MISS_STREAK_LIMIT - (gameSessionRef.current?.missStreak ?? 0))} left
                  </p>
                </div>
              )}

              <div className="pointer-events-none absolute right-3 top-3 z-30 rounded-md border border-white/35 bg-[#f9d8e7]/34 px-3 py-2 text-white backdrop-blur-sm">
                <p className="text-xs tracking-[0.12em] uppercase">Accuracy</p>
                <p className="mt-1 text-lg font-semibold leading-none">{hud.accuracy.toFixed(2)}%</p>
              </div>

              {countdownLabel && (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
                  <p className="text-[clamp(44px,11vw,120px)] font-semibold tracking-[-0.03em] text-white drop-shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
                    {countdownLabel}
                  </p>
                </div>
              )}

              {phase === "arming" && (
                <>
                  <div className="pointer-events-none absolute inset-0 z-[35] bg-black/15" />

                  <div className="pointer-events-none absolute inset-0 z-[36] flex items-center justify-center px-6">
                    <div className="rounded-2xl border border-white/30 bg-[#ffddea]/16 px-6 py-4 text-center text-white backdrop-blur-sm">
                      <p className="text-xs tracking-[0.14em] uppercase text-white/80">Ready</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.02em]">Click center to begin</p>
                    </div>
                  </div>

                  <aside
                    onPointerEnter={() => {
                      isSetupPanelHoveredRef.current = true
                      setIsSetupPanelHovered(true)
                    }}
                    onPointerLeave={() => {
                      isSetupPanelHoveredRef.current = false
                      setIsSetupPanelHovered(false)
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="absolute inset-y-4 right-4 z-50 flex w-[min(320px,92vw)] flex-col gap-3 rounded-2xl border border-white/35 bg-[#ffe7f2]/18 p-4 text-white backdrop-blur-md"
                  >
                    <div className="rounded-lg border border-white/30 bg-black/18 p-3">
                      <p className="text-[10px] tracking-[0.14em] uppercase text-white/70">Start setup</p>
                      <p className="mt-1 text-sm">
                        {selectedTrack?.title ?? "Track"} / {selectedDifficulty}
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center justify-between text-[10px] tracking-[0.12em] uppercase text-white/80">
                        <span>Volume</span>
                        <span>{volume}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={volume}
                        onChange={(event) => setVolume(Number(event.target.value))}
                        className="mt-1.5 w-full accent-[#ff79af]"
                      />
                    </div>

                    <div>
                      <label className="flex items-center justify-between text-[10px] tracking-[0.12em] uppercase text-white/80">
                        <span>Background dim</span>
                        <span>{backgroundDim}%</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={80}
                        value={backgroundDim}
                        onChange={(event) => setBackgroundDim(Number(event.target.value))}
                        className="mt-1.5 w-full accent-[#ff79af]"
                      />
                    </div>

                    <label className="flex items-center justify-between rounded-md border border-white/30 bg-black/16 px-3 py-2">
                      <span className="text-[10px] tracking-[0.12em] uppercase">Show HUD</span>
                      <input type="checkbox" checked={showHud} onChange={(event) => setShowHud(event.target.checked)} className="h-4 w-4 accent-[#ff79af]" />
                    </label>

                    <label className="flex items-center justify-between rounded-md border border-white/30 bg-black/16 px-3 py-2">
                      <span className="text-[10px] tracking-[0.12em] uppercase">Reduce motion</span>
                      <input
                        type="checkbox"
                        checked={reduceMotion}
                        onChange={(event) => setReduceMotion(event.target.checked)}
                        className="h-4 w-4 accent-[#ff79af]"
                      />
                    </label>

                  </aside>
                </>
              )}

              {phase === "paused" && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#2b0f1e]/55 p-4">
                  <div className="w-full max-w-sm rounded-lg border border-[#f8bfd8]/45 bg-[#f9d8e7]/28 p-4 text-[#fff6fb] backdrop-blur">
                    <p className="text-sm tracking-[0.14em] uppercase">Pause</p>
                    <p className="mt-2 text-sm text-[#ffe8f3]">ESC - resume, R - restart, Click/Z/X - hit.</p>
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      <button type="button" onClick={resumeGame} className="rounded-md border border-[#ffd6ea]/55 bg-[#ffd6ea]/28 px-3 py-2 text-xs uppercase">
                        Resume
                      </button>
                      <button type="button" onClick={restartGame} className="rounded-md border border-[#ffd6ea]/55 bg-[#ffd6ea]/20 px-3 py-2 text-xs uppercase">
                        Restart
                      </button>
                      <button type="button" onClick={backToMenu} className="rounded-md border border-[#ffd6ea]/55 bg-[#ffd6ea]/20 px-3 py-2 text-xs uppercase">
                        Back to menu
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {phase === "results" && result && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#180914]/58 p-4 backdrop-blur-[2px]">
                  <div
                    className={`w-full max-w-md rounded-lg border border-[#f8bfd8]/45 bg-[#f9d8e7]/28 p-4 text-[#fff6fb] backdrop-blur transition-all duration-500 ${
                      resultVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-95 opacity-0"
                    }`}
                  >
                    <p className="text-[11px] tracking-[0.15em] text-[#ffe8f3] uppercase">Result</p>
                    <h2 className="mt-1 text-3xl font-semibold tracking-[-0.02em]">Rank {result.ranking}</h2>
                    {result.failed && <p className="mt-1 text-sm text-[#ffd6ea]">Failed: 5 misses in a row.</p>}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <p>Score: {result.score}</p>
                      <p>Best: {result.bestScore}</p>
                      <p>Accuracy: {result.accuracy.toFixed(2)}%</p>
                      <p>Max Combo: {result.maxCombo}</p>
                      <p>300: {result.count300}</p>
                      <p>100: {result.count100}</p>
                      <p>50: {result.count50}</p>
                      <p>Miss: {result.countMiss}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button type="button" onClick={restartGame} className="rounded-md border border-[#ffd6ea]/55 bg-[#ffd6ea]/28 px-3 py-2 text-xs uppercase">
                        Retry
                      </button>
                      <button type="button" onClick={backToMenu} className="rounded-md border border-[#ffd6ea]/55 bg-[#ffd6ea]/20 px-3 py-2 text-xs uppercase">
                        Back to menu
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
