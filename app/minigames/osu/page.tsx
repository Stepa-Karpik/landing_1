"use client"

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { useProfileTracker } from "@/components/profile-provider"

type Difficulty = "easy" | "normal" | "hard" | "extreme" | "legend"
type Phase = "loading" | "menu" | "playing" | "paused" | "results" | "error"
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

interface TrackTimingAnalysis {
  bpm: number
  beatPeriodMs: number
  firstBeatMs: number
  beatTimesMs: number[]
  onsetTimesMs: number[]
  restIntervals: Array<{ startMs: number; endMs: number }>
}

interface TrackAsset {
  id: number
  title: string
  artist: string
  src: string
  durationMs: number
  buffer: AudioBuffer
  analysis: TrackTimingAnalysis
}

interface BackgroundAsset {
  id: number
  kind: "video" | "image"
  src: string
}

interface BeatNoteBase {
  tMs: number
  r?: number
  colorIndex?: number
  colorOrder?: number
  colorRunId?: number
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

type RuntimeNote = BeatObject & {
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
  trackId: number
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
  trackId: number
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

interface StartConfirmState {
  trackId: number
  difficulty: Difficulty
  expiresAtMs: number
}

const TRACKS: Array<{ id: number; title: string; src: string }> = [
  { id: 1, title: "OSU Track 1", src: "/osu/osu1_music.mp3" },
  { id: 2, title: "OSU Track 2", src: "/osu/osu2_music.mp3" },
  { id: 3, title: "OSU Track 3", src: "/osu/osu3_music.mp3" },
  { id: 4, title: "OSU Track 4", src: "/osu/osu4_music.mp3" },
  { id: 5, title: "OSU Track 5", src: "/osu/osu5_music.mp3" },
  { id: 6, title: "OSU Track 6", src: "/osu/osu6_music.mp3" },
  { id: 7, title: "OSU Track 7", src: "/osu/osu7_music.mp3" },
  { id: 8, title: "OSU Track 8", src: "/osu/osu8_music.mp3" },
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
const SLIDER_TAIL_BUFFER_MS: Record<Difficulty, number> = {
  easy: 120,
  normal: 95,
  hard: 76,
  extreme: 58,
  legend: 45,
}

const OSU_SURFACE_STYLE: CSSProperties = {
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
}

const OSU_GAME_SURFACE_STYLE: CSSProperties = {
  ...OSU_SURFACE_STYLE,
  touchAction: "none",
}

const CIRCLE_COLORS = ["#ff5f87", "#6fa8ff", "#78d8a6", "#f6b26b", "#c993ff"] as const
const DIFFICULTY_THEME: Record<
  Difficulty,
  { gradient: string; text: string; badge: string }
> = {
  easy: {
    gradient: "linear-gradient(90deg, rgba(117,246,190,0.96) 0%, rgba(86,222,185,0.96) 100%)",
    text: "#08362a",
    badge: "#0f6f57",
  },
  normal: {
    gradient: "linear-gradient(90deg, rgba(117,210,255,0.96) 0%, rgba(89,169,255,0.96) 100%)",
    text: "#072b4d",
    badge: "#1a5696",
  },
  hard: {
    gradient: "linear-gradient(90deg, rgba(255,224,128,0.96) 0%, rgba(255,170,116,0.96) 100%)",
    text: "#432a07",
    badge: "#92541a",
  },
  extreme: {
    gradient: "linear-gradient(90deg, rgba(255,132,158,0.96) 0%, rgba(255,98,148,0.96) 100%)",
    text: "#4f1023",
    badge: "#9a2f4d",
  },
  legend: {
    gradient: "linear-gradient(90deg, rgba(205,130,255,0.96) 0%, rgba(175,111,246,0.96) 100%)",
    text: "#2c114a",
    badge: "#6b35a2",
  },
}

const RANK_SCALE: ResultState["ranking"][] = ["D", "C", "B", "A", "S", "SS"]
const RANK_COLORS: Record<ResultState["ranking"], string> = {
  D: "#ff6868",
  C: "#ff9a57",
  B: "#f4d35e",
  A: "#91e37e",
  S: "#6fe8e5",
  SS: "#a68dff",
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function formatTime(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "0:00"
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, "0")
  return `${minutes}:${seconds}`
}

function polarPoint(cx: number, cy: number, radius: number, angleDeg: number) {
  const radians = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  }
}

function arcPath(cx: number, cy: number, radius: number, startDeg: number, endDeg: number) {
  const start = polarPoint(cx, cy, radius, startDeg)
  const end = polarPoint(cx, cy, radius, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

function cleanMetaText(value: string) {
  return value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim()
}

function readSynchsafeInt(bytes: Uint8Array, offset: number) {
  if (offset + 3 >= bytes.length) return 0
  return (
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)
  )
}

function decodeUtf16Bytes(bytes: Uint8Array, bigEndian: boolean) {
  if (bytes.length < 2) return ""
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let result = ""
  for (let index = 0; index + 1 < bytes.length; index += 2) {
    const code = view.getUint16(index, !bigEndian)
    if (code === 0) break
    result += String.fromCharCode(code)
  }
  return result
}

function decodeId3TextFrame(frameData: Uint8Array) {
  if (frameData.length === 0) return ""
  const encoding = frameData[0]
  const payload = frameData.subarray(1)
  if (payload.length === 0) return ""

  let decoded = ""
  try {
    if (encoding === 0) {
      decoded = new TextDecoder("iso-8859-1").decode(payload)
    } else if (encoding === 1) {
      if (payload.length >= 2 && payload[0] === 0xfe && payload[1] === 0xff) {
        decoded = decodeUtf16Bytes(payload.subarray(2), true)
      } else if (payload.length >= 2 && payload[0] === 0xff && payload[1] === 0xfe) {
        decoded = decodeUtf16Bytes(payload.subarray(2), false)
      } else {
        decoded = decodeUtf16Bytes(payload, false)
      }
    } else if (encoding === 2) {
      decoded = decodeUtf16Bytes(payload, true)
    } else {
      decoded = new TextDecoder("utf-8").decode(payload)
    }
  } catch {
    decoded = new TextDecoder("utf-8").decode(payload)
  }
  return cleanMetaText(decoded)
}

function parseAudioMetadata(fileBuffer: ArrayBuffer, fallbackTitle: string) {
  const bytes = new Uint8Array(fileBuffer)
  let title = ""
  let artist = ""

  if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const version = bytes[3]
    const flags = bytes[5]
    const tagSize = readSynchsafeInt(bytes, 6)
    const tagEnd = Math.min(bytes.length, 10 + tagSize)
    let offset = 10

    if ((flags & 0x40) !== 0 && offset + 4 <= tagEnd) {
      if (version === 4) {
        const extSize = readSynchsafeInt(bytes, offset)
        offset += Math.max(extSize, 4)
      } else {
        const extSize =
          ((bytes[offset] << 24) >>> 0) |
          ((bytes[offset + 1] << 16) >>> 0) |
          ((bytes[offset + 2] << 8) >>> 0) |
          (bytes[offset + 3] >>> 0)
        offset += 4 + Math.max(0, extSize)
      }
    }

    while (offset + 10 <= tagEnd) {
      const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
      if (!/^[A-Z0-9]{4}$/.test(frameId)) break

      const frameSize =
        version === 4
          ? readSynchsafeInt(bytes, offset + 4)
          : (((bytes[offset + 4] << 24) >>> 0) |
              ((bytes[offset + 5] << 16) >>> 0) |
              ((bytes[offset + 6] << 8) >>> 0) |
              (bytes[offset + 7] >>> 0))
      if (frameSize <= 0) break

      const frameStart = offset + 10
      const frameEnd = frameStart + frameSize
      if (frameEnd > tagEnd) break

      const frameData = bytes.subarray(frameStart, frameEnd)
      if (frameId === "TIT2" && !title) {
        title = decodeId3TextFrame(frameData)
      }
      if (frameId === "TPE1" && !artist) {
        artist = decodeId3TextFrame(frameData)
      }

      offset = frameEnd
      if (title && artist) break
    }
  }

  if ((!title || !artist) && bytes.length >= 128) {
    const id3v1Start = bytes.length - 128
    if (bytes[id3v1Start] === 0x54 && bytes[id3v1Start + 1] === 0x41 && bytes[id3v1Start + 2] === 0x47) {
      try {
        const decoder = new TextDecoder("iso-8859-1")
        if (!title) {
          title = cleanMetaText(decoder.decode(bytes.subarray(id3v1Start + 3, id3v1Start + 33)))
        }
        if (!artist) {
          artist = cleanMetaText(decoder.decode(bytes.subarray(id3v1Start + 33, id3v1Start + 63)))
        }
      } catch {
        // ignore metadata decode failures
      }
    }
  }

  return {
    title: title || fallbackTitle,
    artist: artist || "Unknown artist",
  }
}

function accuracyOf(totalHitValue: number, judgedObjects: number) {
  if (judgedObjects <= 0) return 100
  return clamp((totalHitValue / (judgedObjects * 300)) * 100, 0, 100)
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

function pullTailPoint(object: BeatObject) {
  if (object.kind === "circle") return { x: object.x, y: object.y }
  return object.points[object.points.length - 1] ?? object.points[0] ?? { x: 0.5, y: 0.5 }
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = clamp(Math.round((sorted.length - 1) * ratio), 0, sorted.length - 1)
  return sorted[index]
}

function smoothSeries(values: number[], radius: number) {
  if (radius <= 0 || values.length <= 2) return [...values]
  const smoothed = new Array<number>(values.length)
  for (let index = 0; index < values.length; index += 1) {
    let sum = 0
    let count = 0
    for (let offset = -radius; offset <= radius; offset += 1) {
      const target = index + offset
      if (target < 0 || target >= values.length) continue
      sum += values[target]
      count += 1
    }
    smoothed[index] = count > 0 ? sum / count : values[index]
  }
  return smoothed
}

function monoFromBuffer(buffer: AudioBuffer) {
  const { length, numberOfChannels } = buffer
  if (numberOfChannels <= 1) {
    return buffer.getChannelData(0).slice()
  }

  const mono = new Float32Array(length)
  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let index = 0; index < length; index += 1) {
      mono[index] += data[index]
    }
  }
  const gain = 1 / numberOfChannels
  for (let index = 0; index < length; index += 1) {
    mono[index] *= gain
  }
  return mono
}

async function renderBandPassSamples(
  monoSamples: Float32Array,
  sampleRate: number,
  lowHz: number,
  highHz: number,
) {
  try {
    const offlineCtor =
      window.OfflineAudioContext ??
      (window as Window & { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext
    if (!offlineCtor) {
      return monoSamples.slice()
    }

    const offline = new offlineCtor(1, monoSamples.length, sampleRate)
    const sourceBuffer = offline.createBuffer(1, monoSamples.length, sampleRate)
    sourceBuffer.copyToChannel(monoSamples, 0)

    const source = offline.createBufferSource()
    source.buffer = sourceBuffer

    const highPass = offline.createBiquadFilter()
    highPass.type = "highpass"
    highPass.frequency.value = lowHz
    highPass.Q.value = 0.707

    const lowPass = offline.createBiquadFilter()
    lowPass.type = "lowpass"
    lowPass.frequency.value = highHz
    lowPass.Q.value = 0.707

    source.connect(highPass)
    highPass.connect(lowPass)
    lowPass.connect(offline.destination)
    source.start(0)

    const rendered = await offline.startRendering()
    return rendered.getChannelData(0).slice()
  } catch {
    return monoSamples.slice()
  }
}

function frameRmsSeries(samples: Float32Array, frameSize: number) {
  const frames = Math.max(1, Math.floor(samples.length / frameSize))
  const rms = new Array<number>(frames).fill(0)
  for (let frameIndex = 0; frameIndex < frames; frameIndex += 1) {
    const start = frameIndex * frameSize
    const end = Math.min(samples.length, start + frameSize)
    let sumSquares = 0
    for (let index = start; index < end; index += 1) {
      const sample = samples[index]
      sumSquares += sample * sample
    }
    rms[frameIndex] = Math.sqrt(sumSquares / Math.max(1, end - start))
  }
  return rms
}

function detectRestIntervals(
  fullRms: number[],
  vocalRms: number[],
  frameMs: number,
) {
  const nonSilentThreshold = percentile(fullRms, 0.22) * 1.06
  const vocalRatio = fullRms.map((value, index) => vocalRms[index] / Math.max(0.000001, value))
  const smoothRatio = smoothSeries(vocalRatio, 3)
  const voicedPool = smoothRatio.filter((_, index) => fullRms[index] > nonSilentThreshold)
  const ratioPivot = voicedPool.length > 0 ? percentile(voicedPool, 0.62) : percentile(smoothRatio, 0.62)
  const ratioThreshold = ratioPivot * 0.78

  const minRestFrames = Math.max(1, Math.round(1600 / frameMs))
  const mergeGapFrames = Math.max(1, Math.round(520 / frameMs))
  const intervals: Array<{ startMs: number; endMs: number }> = []

  let runStart = -1
  let lastRestFrame = -1
  for (let index = 0; index < smoothRatio.length; index += 1) {
    const isRestFrame = fullRms[index] > nonSilentThreshold && smoothRatio[index] < ratioThreshold

    if (isRestFrame) {
      if (runStart < 0) {
        runStart = index
      }
      lastRestFrame = index
      continue
    }

    if (runStart >= 0) {
      const framesCount = lastRestFrame - runStart + 1
      if (framesCount >= minRestFrames) {
        const startMs = runStart * frameMs
        const endMs = (lastRestFrame + 1) * frameMs
        const previous = intervals[intervals.length - 1]
        if (previous && startMs - previous.endMs <= mergeGapFrames * frameMs) {
          previous.endMs = endMs
        } else {
          intervals.push({ startMs, endMs })
        }
      }
      runStart = -1
      lastRestFrame = -1
    }
  }

  if (runStart >= 0 && lastRestFrame >= runStart) {
    const framesCount = lastRestFrame - runStart + 1
    if (framesCount >= minRestFrames) {
      intervals.push({
        startMs: runStart * frameMs,
        endMs: (lastRestFrame + 1) * frameMs,
      })
    }
  }

  return intervals
}

function detectBeatGrid(
  fullRms: number[],
  frameSec: number,
  durationMs: number,
) {
  const onset = fullRms.map((value, index) => (index === 0 ? 0 : Math.max(0, value - fullRms[index - 1])))
  const onsetSmooth = smoothSeries(onset, 2)

  const minLag = Math.max(2, Math.round((60 / 190) / frameSec))
  const maxLag = Math.max(minLag + 1, Math.round((60 / 72) / frameSec))
  let bestLag = Math.max(2, Math.round((60 / 120) / frameSec))
  let bestScore = -1

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let score = 0
    for (let index = lag; index < onsetSmooth.length; index += 1) {
      score += onsetSmooth[index] * onsetSmooth[index - lag]
    }
    if (score > bestScore) {
      bestScore = score
      bestLag = lag
    }
  }

  const bpm = clamp(60 / (bestLag * frameSec), 72, 190)
  const beatPeriodMs = (60 * 1000) / bpm

  const phaseScores = new Array(bestLag).fill(0)
  for (let index = 0; index < onsetSmooth.length; index += 1) {
    phaseScores[index % bestLag] += onsetSmooth[index]
  }
  let bestPhase = 0
  for (let index = 1; index < phaseScores.length; index += 1) {
    if (phaseScores[index] > phaseScores[bestPhase]) {
      bestPhase = index
    }
  }
  const firstBeatMs = bestPhase * frameSec * 1000

  const beatTimesMs: number[] = []
  for (let tMs = firstBeatMs; tMs <= durationMs; tMs += beatPeriodMs) {
    beatTimesMs.push(tMs)
  }

  const onsetThreshold = percentile(onsetSmooth, 0.84)
  const onsetTimesMs: number[] = []
  for (let index = 1; index < onsetSmooth.length - 1; index += 1) {
    const value = onsetSmooth[index]
    if (value < onsetThreshold) continue
    if (value < onsetSmooth[index - 1] || value < onsetSmooth[index + 1]) continue
    onsetTimesMs.push(index * frameSec * 1000)
  }

  return { bpm, beatPeriodMs, firstBeatMs, beatTimesMs, onsetTimesMs }
}

async function analyzeTrackTiming(buffer: AudioBuffer): Promise<TrackTimingAnalysis> {
  const mono = monoFromBuffer(buffer)
  const frameSize = Math.max(384, Math.round(buffer.sampleRate * 0.02))
  const frameSec = frameSize / buffer.sampleRate
  const frameMs = frameSec * 1000

  const fullRms = frameRmsSeries(mono, frameSize)
  const vocalBand = await renderBandPassSamples(mono, buffer.sampleRate, 220, 3400)
  const vocalRms = frameRmsSeries(vocalBand, frameSize)

  const beatGrid = detectBeatGrid(fullRms, frameSec, buffer.duration * 1000)
  const restIntervals = detectRestIntervals(fullRms, vocalRms, frameMs)

  return {
    bpm: beatGrid.bpm,
    beatPeriodMs: beatGrid.beatPeriodMs,
    firstBeatMs: beatGrid.firstBeatMs,
    beatTimesMs: beatGrid.beatTimesMs,
    onsetTimesMs: beatGrid.onsetTimesMs,
    restIntervals,
  }
}

function isInsideRestInterval(timeMs: number, intervals: Array<{ startMs: number; endMs: number }>) {
  for (const interval of intervals) {
    if (timeMs >= interval.startMs && timeMs <= interval.endMs) return true
  }
  return false
}

function isInsideRestIntervalWithMargin(
  timeMs: number,
  intervals: Array<{ startMs: number; endMs: number }>,
  beforeMs: number,
  afterMs: number,
) {
  for (const interval of intervals) {
    if (timeMs >= interval.startMs - beforeMs && timeMs <= interval.endMs + afterMs) return true
  }
  return false
}

function snapToNearestOnset(
  timeMs: number,
  onsetTimesMs: number[],
  maxOffsetMs: number,
) {
  if (onsetTimesMs.length === 0) return timeMs

  let low = 0
  let high = onsetTimesMs.length - 1
  while (low <= high) {
    const middle = (low + high) >> 1
    const value = onsetTimesMs[middle]
    if (value < timeMs) low = middle + 1
    else high = middle - 1
  }

  const candidates = [onsetTimesMs[clamp(low, 0, onsetTimesMs.length - 1)]]
  if (low - 1 >= 0) candidates.push(onsetTimesMs[low - 1])
  let best = timeMs
  let bestDelta = maxOffsetMs + 1
  for (const candidate of candidates) {
    const delta = Math.abs(candidate - timeMs)
    if (delta < bestDelta) {
      bestDelta = delta
      best = candidate
    }
  }
  return bestDelta <= maxOffsetMs ? best : timeMs
}

function rhythmProfile(difficulty: Difficulty) {
  if (difficulty === "easy") return { subdivision: 1, onBeatChance: 0.95, offBeatChance: 0.0, snapMs: 110, maxNotes: 190 }
  if (difficulty === "normal") return { subdivision: 1, onBeatChance: 0.97, offBeatChance: 0.26, snapMs: 96, maxNotes: 330 }
  if (difficulty === "hard") return { subdivision: 0.5, onBeatChance: 0.98, offBeatChance: 0.58, snapMs: 86, maxNotes: 520 }
  if (difficulty === "extreme") return { subdivision: 0.5, onBeatChance: 0.99, offBeatChance: 0.8, snapMs: 76, maxNotes: 760 }
  return { subdivision: 0.25, onBeatChance: 1, offBeatChance: 0.94, snapMs: 68, maxNotes: 980 }
}

interface MovementProfile {
  minJump: number
  sameColorMaxJump: number
  differentColorMaxJump: number
  longGapBonus: number
  absoluteMaxJump: number
  turnLimit: number
  sliderSegment: [number, number]
}

function movementProfile(difficulty: Difficulty): MovementProfile {
  if (difficulty === "easy") {
    return {
      minJump: 0.07,
      sameColorMaxJump: 0.19,
      differentColorMaxJump: 0.24,
      longGapBonus: 0.08,
      absoluteMaxJump: 0.32,
      turnLimit: Math.PI * 0.62,
      sliderSegment: [0.09, 0.14],
    }
  }
  if (difficulty === "normal") {
    return {
      minJump: 0.08,
      sameColorMaxJump: 0.22,
      differentColorMaxJump: 0.29,
      longGapBonus: 0.1,
      absoluteMaxJump: 0.36,
      turnLimit: Math.PI * 0.72,
      sliderSegment: [0.1, 0.16],
    }
  }
  if (difficulty === "hard") {
    return {
      minJump: 0.09,
      sameColorMaxJump: 0.25,
      differentColorMaxJump: 0.34,
      longGapBonus: 0.12,
      absoluteMaxJump: 0.42,
      turnLimit: Math.PI * 0.82,
      sliderSegment: [0.11, 0.18],
    }
  }
  if (difficulty === "extreme") {
    return {
      minJump: 0.1,
      sameColorMaxJump: 0.29,
      differentColorMaxJump: 0.39,
      longGapBonus: 0.14,
      absoluteMaxJump: 0.47,
      turnLimit: Math.PI * 0.92,
      sliderSegment: [0.12, 0.2],
    }
  }
  return {
    minJump: 0.11,
    sameColorMaxJump: 0.32,
    differentColorMaxJump: 0.43,
    longGapBonus: 0.15,
    absoluteMaxJump: 0.52,
    turnLimit: Math.PI * 1.02,
    sliderSegment: [0.13, 0.22],
  }
}

function randomIntInclusive(rng: () => number, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1))
}

function nextColorIndex(rng: () => number, previousColor: number) {
  if (CIRCLE_COLORS.length <= 1) return 0
  let next = previousColor
  let guard = 0
  while (next === previousColor && guard < 8) {
    next = Math.floor(rng() * CIRCLE_COLORS.length)
    guard += 1
  }
  if (next === previousColor) {
    return (previousColor + 1) % CIRCLE_COLORS.length
  }
  return next
}

function pickSequentialPoint(
  rng: () => number,
  previousX: number,
  previousY: number,
  previousAngle: number,
  minJump: number,
  maxJump: number,
  turnLimit: number,
) {
  const boundsMin = 0.08
  const boundsMax = 0.92
  const attempts = 24
  let best:
    | {
        x: number
        y: number
        angle: number
        distance: number
        score: number
      }
    | null = null

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const angle = previousAngle + (rng() - 0.5) * turnLimit * 2
    const plannedDistance = minJump + rng() * Math.max(0.0001, maxJump - minJump)
    const candidateX = clamp(previousX + Math.cos(angle) * plannedDistance, boundsMin, boundsMax)
    const candidateY = clamp(previousY + Math.sin(angle) * plannedDistance, boundsMin, boundsMax)
    const distance = Math.hypot(candidateX - previousX, candidateY - previousY)
    if (distance < minJump * 0.7) continue

    const edgePadding = Math.min(candidateX - boundsMin, boundsMax - candidateX, candidateY - boundsMin, boundsMax - candidateY)
    const score = Math.abs(distance - plannedDistance) + (edgePadding < 0.045 ? (0.045 - edgePadding) * 1.9 : 0)
    if (!best || score < best.score) {
      best = { x: candidateX, y: candidateY, angle, distance, score }
    }
    if (score < 0.05) break
  }

  if (best) {
    const angle = Math.atan2(best.y - previousY, best.x - previousX)
    return {
      x: best.x,
      y: best.y,
      angle: Number.isFinite(angle) ? angle : previousAngle,
      distance: best.distance,
    }
  }

  const fallbackAngle = rng() * Math.PI * 2
  const fallbackDistance = minJump + (maxJump - minJump) * 0.55
  const fallbackX = clamp(previousX + Math.cos(fallbackAngle) * fallbackDistance, boundsMin, boundsMax)
  const fallbackY = clamp(previousY + Math.sin(fallbackAngle) * fallbackDistance, boundsMin, boundsMax)
  const angle = Math.atan2(fallbackY - previousY, fallbackX - previousX)
  return {
    x: fallbackX,
    y: fallbackY,
    angle: Number.isFinite(angle) ? angle : previousAngle,
    distance: Math.hypot(fallbackX - previousX, fallbackY - previousY),
  }
}

function generateBeatmap(
  trackId: number,
  difficulty: Difficulty,
  durationMs: number,
  analysis: TrackTimingAnalysis,
): BeatObject[] {
  const settings = DIFFICULTY[difficulty]
  const profile = rhythmProfile(difficulty)
  const movement = movementProfile(difficulty)
  const tailBufferMs = SLIDER_TAIL_BUFFER_MS[difficulty]
  const difficultySeed = { easy: 11, normal: 29, hard: 53, extreme: 79, legend: 101 }[difficulty]
  const rng = createRng(trackId * 937 + difficultySeed)
  const notes: BeatObject[] = []

  const finishMs = Math.max(FIRST_NOTE_DELAY_MS + 2000, durationMs - 1300)
  const beatPeriodMs = clamp(analysis.beatPeriodMs, 300, 900)
  const stepMs = beatPeriodMs * profile.subdivision
  const restMarginBeforeMs = settings.approachMs * 0.68
  const restMarginAfterMs = Math.max(settings.hit50 + 90, stepMs * 0.52)
  let tMs = Math.max(FIRST_NOTE_DELAY_MS, analysis.firstBeatMs)
  let nextAllowedMs = tMs
  let prevX = 0.16 + rng() * 0.68
  let prevY = 0.16 + rng() * 0.68
  let prevAngle = rng() * Math.PI * 2
  let prevSpawnMs = tMs - beatPeriodMs

  let activeColorIndex = Math.floor(rng() * CIRCLE_COLORS.length)
  let activeColorRunId = 0
  let activeColorOrder = 1
  let activeColorRunLeft = randomIntInclusive(rng, 3, 9)
  let previousColorIndex = activeColorIndex

  const takeColorState = () => {
    const state = {
      colorIndex: activeColorIndex,
      colorOrder: activeColorOrder,
      colorRunId: activeColorRunId,
    }
    activeColorOrder += 1
    activeColorRunLeft -= 1
    if (activeColorRunLeft <= 0) {
      activeColorIndex = nextColorIndex(rng, activeColorIndex)
      activeColorRunId += 1
      activeColorOrder = 1
      activeColorRunLeft = randomIntInclusive(rng, 3, 9)
    }
    return state
  }

  const pushFallbackCircle = (spawnMs: number, intervalMs: number) => {
    const sameColorAsPrevious = notes.length > 0 && activeColorIndex === previousColorIndex
    const intervalFactor = clamp((intervalMs / Math.max(beatPeriodMs, 1) - 1) / 2.3, 0, 1)
    const jumpMaxBase = sameColorAsPrevious ? movement.sameColorMaxJump : movement.differentColorMaxJump
    const jumpMax = clamp(jumpMaxBase + movement.longGapBonus * intervalFactor, movement.minJump + 0.05, movement.absoluteMaxJump)
    const jumpMin = clamp(movement.minJump * (sameColorAsPrevious ? 0.92 : 1.04), 0.06, jumpMax - 0.04)
    const turnLimit = sameColorAsPrevious ? movement.turnLimit : movement.turnLimit * 1.18
    const placement = pickSequentialPoint(rng, prevX, prevY, prevAngle, jumpMin, jumpMax, turnLimit)
    const colorState = takeColorState()

    notes.push({
      kind: "circle",
      tMs: Math.round(spawnMs),
      x: placement.x,
      y: placement.y,
      ...colorState,
    })

    previousColorIndex = colorState.colorIndex
    prevX = placement.x
    prevY = placement.y
    prevAngle = placement.angle
    prevSpawnMs = spawnMs
  }

  while (tMs < finishMs && notes.length < profile.maxNotes) {
    if (tMs < nextAllowedMs) {
      tMs += stepMs
      continue
    }
    if (isInsideRestIntervalWithMargin(tMs, analysis.restIntervals, restMarginBeforeMs, restMarginAfterMs)) {
      tMs += stepMs
      continue
    }

    const beatPosition = (tMs - analysis.firstBeatMs) / beatPeriodMs
    const beatFraction = Math.abs(beatPosition - Math.round(beatPosition))
    const onBeat = beatFraction <= 0.08
    const spawnChance = onBeat ? profile.onBeatChance : profile.offBeatChance
    if (rng() > spawnChance) {
      tMs += stepMs
      continue
    }

    const snappedTime = snapToNearestOnset(tMs, analysis.onsetTimesMs, profile.snapMs)
    if (snappedTime < nextAllowedMs || snappedTime < FIRST_NOTE_DELAY_MS || snappedTime > finishMs) {
      tMs += stepMs
      continue
    }
    if (isInsideRestIntervalWithMargin(snappedTime, analysis.restIntervals, restMarginBeforeMs, restMarginAfterMs)) {
      tMs += stepMs
      continue
    }
    const sameColorAsPrevious = notes.length > 0 && activeColorIndex === previousColorIndex
    const intervalMs = notes.length > 0 ? Math.max(1, snappedTime - prevSpawnMs) : beatPeriodMs
    const intervalFactor = clamp((intervalMs / Math.max(beatPeriodMs, 1) - 1) / 2.3, 0, 1)
    const jumpMaxBase = sameColorAsPrevious ? movement.sameColorMaxJump : movement.differentColorMaxJump
    const jumpMax = clamp(jumpMaxBase + movement.longGapBonus * intervalFactor, movement.minJump + 0.05, movement.absoluteMaxJump)
    const jumpMin = clamp(movement.minJump * (sameColorAsPrevious ? 0.92 : 1.04), 0.06, jumpMax - 0.04)
    const turnLimit = sameColorAsPrevious ? movement.turnLimit : movement.turnLimit * 1.18
    const placement = pickSequentialPoint(rng, prevX, prevY, prevAngle, jumpMin, jumpMax, turnLimit)
    const nextX = placement.x
    const nextY = placement.y

    let makeSlider = rng() < settings.sliderChance * (onBeat ? 1.06 : 0.74)
    let sliderDuration = 0
    if (makeSlider) {
      const rawSliderDuration =
        settings.sliderDurationMs[0] + rng() * (settings.sliderDurationMs[1] - settings.sliderDurationMs[0])
      const quantized = Math.round(rawSliderDuration / beatPeriodMs) * beatPeriodMs
      sliderDuration = clamp(quantized, settings.sliderDurationMs[0], settings.sliderDurationMs[1])
      if (snappedTime + sliderDuration > finishMs - 120) {
        makeSlider = false
      }
      if (isInsideRestIntervalWithMargin(snappedTime + sliderDuration, analysis.restIntervals, restMarginBeforeMs, restMarginAfterMs)) {
        makeSlider = false
      }
    }

    if (makeSlider) {
      const pointsCount = rng() < 0.62 ? 2 : rng() < 0.86 ? 3 : 4
      const points: Array<{ x: number; y: number }> = [{ x: nextX, y: nextY }]
      const colorState = takeColorState()
      let anchorX = nextX
      let anchorY = nextY
      let anchorAngle = placement.angle
      for (let index = 1; index < pointsCount; index += 1) {
        anchorAngle += (rng() - 0.5) * movement.turnLimit * 0.72
        const segmentMin = movement.sliderSegment[0]
        const segmentMax = movement.sliderSegment[1] + intervalFactor * 0.05
        const length = segmentMin + rng() * Math.max(0.0001, segmentMax - segmentMin)
        anchorX = clamp(anchorX + Math.cos(anchorAngle) * length, 0.08, 0.92)
        anchorY = clamp(anchorY + Math.sin(anchorAngle) * length, 0.08, 0.92)
        points.push({ x: anchorX, y: anchorY })
      }

      notes.push({
        kind: "slider",
        tMs: Math.round(snappedTime),
        points,
        durationMs: Math.round(sliderDuration),
        ...colorState,
      })
      nextAllowedMs = snappedTime + sliderDuration + settings.hit50 + tailBufferMs
      previousColorIndex = colorState.colorIndex
    } else {
      const colorState = takeColorState()
      notes.push({
        kind: "circle",
        tMs: Math.round(snappedTime),
        x: nextX,
        y: nextY,
        ...colorState,
      })
      nextAllowedMs = snappedTime + Math.max(stepMs * 0.82, 92)
      previousColorIndex = colorState.colorIndex
    }

    const lastNote = notes[notes.length - 1]
    const lastPoint = pullTailPoint(lastNote)
    if (lastNote.kind === "slider") {
      const beforeTail = lastNote.points[lastNote.points.length - 2] ?? lastNote.points[0] ?? { x: prevX, y: prevY }
      const angle = Math.atan2(lastPoint.y - beforeTail.y, lastPoint.x - beforeTail.x)
      if (Number.isFinite(angle)) {
        prevAngle = angle
      }
    } else {
      const angle = Math.atan2(lastPoint.y - prevY, lastPoint.x - prevX)
      if (Number.isFinite(angle)) {
        prevAngle = angle
      }
    }
    prevX = lastPoint.x
    prevY = lastPoint.y
    prevSpawnMs = snappedTime
    tMs += stepMs
  }

  const minimumObjects =
    difficulty === "easy" ? 18 : difficulty === "normal" ? 12 : difficulty === "hard" ? 8 : difficulty === "extreme" ? 6 : 4
  if (notes.length < minimumObjects) {
    const fallbackStep = beatPeriodMs * (difficulty === "easy" ? 1 : difficulty === "normal" ? 0.88 : 0.82)
    let fallbackMs =
      notes.length > 0
        ? Math.max(prevSpawnMs + fallbackStep, FIRST_NOTE_DELAY_MS + beatPeriodMs * 0.45)
        : Math.max(FIRST_NOTE_DELAY_MS + beatPeriodMs * 0.45, analysis.firstBeatMs)
    const fallbackFinish = finishMs - settings.hit50
    const relaxedBeforeMs = restMarginBeforeMs * 0.32
    const relaxedAfterMs = restMarginAfterMs * 0.32
    let guard = 0

    while (notes.length < minimumObjects && notes.length < profile.maxNotes && fallbackMs <= fallbackFinish && guard < 900) {
      if (!isInsideRestIntervalWithMargin(fallbackMs, analysis.restIntervals, relaxedBeforeMs, relaxedAfterMs)) {
        const intervalMs = Math.max(1, fallbackMs - prevSpawnMs)
        pushFallbackCircle(fallbackMs, intervalMs)
      }
      fallbackMs += fallbackStep
      guard += 1
    }
  }

  if (notes.length === 0) {
    const hardCap = Math.min(profile.maxNotes, difficulty === "easy" ? 24 : 12)
    let fallbackMs = FIRST_NOTE_DELAY_MS + beatPeriodMs * 0.4
    const fallbackFinish = finishMs - settings.hit50
    let guard = 0
    while (notes.length < hardCap && fallbackMs <= fallbackFinish && guard < 240) {
      const intervalMs = Math.max(1, fallbackMs - prevSpawnMs)
      pushFallbackCircle(fallbackMs, intervalMs)
      fallbackMs += beatPeriodMs
      guard += 1
    }
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

function bestKey(trackId: number, difficulty: Difficulty) {
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

function circleColorByMeta(index: number, colorIndex?: number) {
  const fallbackGroup = Math.floor(index / 5)
  const slot = colorIndex ?? fallbackGroup
  const normalizedSlot = ((slot % CIRCLE_COLORS.length) + CIRCLE_COLORS.length) % CIRCLE_COLORS.length
  return CIRCLE_COLORS[normalizedSlot]
}

function scaleByViewport(width: number, height: number) {
  return clamp(Math.min(width, height) / 900, 0.68, 1.16)
}

function noteRadiusPx(note: BeatObject, settings: DifficultySettings, width: number, height: number) {
  const base = (note.r ?? settings.radiusPx) * scaleByViewport(width, height)
  return base * 1.18
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

async function fetchArrayBufferWithProgress(
  url: string,
  onProgress: (loaded: number, total: number) => void,
) {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error("Assets not found in /osu")
  }

  const totalFromHeader = Number(response.headers.get("content-length") ?? "0")
  const reader = response.body?.getReader()

  if (!reader) {
    const fallbackBuffer = await response.arrayBuffer()
    const fallbackTotal = totalFromHeader > 0 ? totalFromHeader : fallbackBuffer.byteLength
    onProgress(fallbackBuffer.byteLength, fallbackTotal)
    return fallbackBuffer
  }

  const chunks: Uint8Array[] = []
  let loaded = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    chunks.push(value)
    loaded += value.byteLength
    onProgress(loaded, totalFromHeader)
  }

  const merged = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }

  const total = totalFromHeader > 0 ? totalFromHeader : loaded
  onProgress(loaded, total)
  return merged.buffer
}

export default function OsuLikePage() {
  const { recordGameResult } = useProfileTracker()

  const [phase, setPhase] = useState<Phase>("loading")
  const [loadingText, setLoadingText] = useState("Загрузка медиафайлов...")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [errorText, setErrorText] = useState("")

  const [trackAssets, setTrackAssets] = useState<TrackAsset[]>([])
  const [backgroundAssets, setBackgroundAssets] = useState<BackgroundAsset[]>([])

  const [selectedTrackId, setSelectedTrackId] = useState<number>(1)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy")
  const [hoveredTrackId, setHoveredTrackId] = useState<number | null>(null)
  const [startConfirm, setStartConfirm] = useState<StartConfirmState | null>(null)
  const [startConfirmMsLeft, setStartConfirmMsLeft] = useState(0)

  const [volume, setVolume] = useState(70)
  const [backgroundDim, setBackgroundDim] = useState(38)
  const [showHud, setShowHud] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [previewTrackId, setPreviewTrackId] = useState<number | null>(null)

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
  const keyboardHitKeysRef = useRef<Set<string>>(new Set())
  const isKeyboardHitDownRef = useRef(false)
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
  const startConfirmTimeoutRef = useRef<number | null>(null)
  const startConfirmTickRef = useRef<number | null>(null)

  const selectedTrack = useMemo(
    () => trackAssets.find((track) => track.id === selectedTrackId) ?? null,
    [selectedTrackId, trackAssets],
  )
  const selectedBackground = useMemo(
    () => backgroundAssets.find((asset) => asset.id === selectedTrackId) ?? null,
    [backgroundAssets, selectedTrackId],
  )
  const backgroundByTrackId = useMemo(() => {
    const map = new Map<number, BackgroundAsset>()
    for (const background of backgroundAssets) {
      map.set(background.id, background)
    }
    return map
  }, [backgroundAssets])

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

  const clearStartConfirmTimers = useCallback(() => {
    if (startConfirmTimeoutRef.current !== null) {
      window.clearTimeout(startConfirmTimeoutRef.current)
      startConfirmTimeoutRef.current = null
    }
    if (startConfirmTickRef.current !== null) {
      window.clearInterval(startConfirmTickRef.current)
      startConfirmTickRef.current = null
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
    setPreviewTrackId(null)
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
    const mode = phase === "playing" ? "game" : null

    if (mode) {
      document.body.setAttribute("data-osu-cursor-mode", mode)
    } else {
      document.body.removeAttribute("data-osu-cursor-mode")
    }
    return () => {
      document.body.removeAttribute("data-osu-cursor-mode")
    }
  }, [phase])

  useEffect(() => {
    const gameplayCursor = phase === "playing"
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
        setLoadingText("Подготовка аудиодвижка...")
        setLoadingProgress(2)
        const context = await ensureAudioGraph()

        const loadedTracks: TrackAsset[] = []
        const loadedBytesByTrack = new Array<number>(TRACKS.length).fill(0)
        const totalBytesByTrack = new Array<number>(TRACKS.length).fill(0)
        let analyzedTracksCount = 0
        const headSizes = await Promise.all(
          TRACKS.map(async (track) => {
            try {
              const response = await fetch(track.src, { method: "HEAD", cache: "no-store" })
              return Number(response.headers.get("content-length") ?? "0")
            } catch {
              return 0
            }
          }),
        )
        for (let index = 0; index < headSizes.length; index += 1) {
          totalBytesByTrack[index] = headSizes[index]
        }
        const pushProgress = (backgroundRatio = 0) => {
          if (cancelled) return
          const loadedBytes = loadedBytesByTrack.reduce((sum, value) => sum + value, 0)
          const totalBytes = totalBytesByTrack.reduce((sum, value) => sum + value, 0)
          const audioRatio = totalBytes > 0 ? clamp(loadedBytes / totalBytes, 0, 1) : 0
          const analysisRatio = TRACKS.length > 0 ? analyzedTracksCount / TRACKS.length : 0
          const ratio = clamp(audioRatio * 0.68 + analysisRatio * 0.24 + backgroundRatio * 0.08, 0, 1)
          setLoadingProgress(Math.round(ratio * 100))
        }

        for (let index = 0; index < TRACKS.length; index += 1) {
          const track = TRACKS[index]
          setLoadingText("Загрузка медиафайлов...")
          const fileBuffer = await fetchArrayBufferWithProgress(track.src, (loaded, total) => {
            if (total > 0) {
              totalBytesByTrack[index] = total
            }
            loadedBytesByTrack[index] = loaded
            pushProgress()
          })
          loadedBytesByTrack[index] = fileBuffer.byteLength
          if (totalBytesByTrack[index] <= 0) {
            totalBytesByTrack[index] = fileBuffer.byteLength
          }
          pushProgress()

          setLoadingText("Обработка аудио...")
          const decoded = await context.decodeAudioData(fileBuffer.slice(0))
          const metadata = parseAudioMetadata(fileBuffer, track.title)
          setLoadingText("Анализ ритма...")
          const analysis = await analyzeTrackTiming(decoded)
          analyzedTracksCount += 1
          pushProgress()
          loadedTracks.push({
            id: track.id,
            title: metadata.title,
            artist: metadata.artist,
            src: track.src,
            durationMs: decoded.duration * 1000,
            buffer: decoded,
            analysis,
          })
        }

        const loadedBackgrounds: BackgroundAsset[] = []
        for (let index = 0; index < TRACKS.length; index += 1) {
          const id = TRACKS[index]!.id
          setLoadingText("Загрузка фонов...")
          const videoPath = `/osu/osu_video${id}.mp4`
          if (await urlExists(videoPath)) {
            loadedBackgrounds.push({ id, kind: "video", src: videoPath })
            pushProgress((index + 1) / TRACKS.length)
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
          pushProgress((index + 1) / TRACKS.length)
        }

        if (cancelled) return
        setLoadingText("Финализация...")
        setLoadingProgress(100)
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
    if (!session || (phase !== "playing" && phase !== "paused")) return []

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
        const color = circleColorByMeta(note.index, note.colorIndex)
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
          orderLabel: note.colorOrder ?? note.index + 1,
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
    const baseRadius = noteRadiusPx({ kind: "circle", tMs: 0, x: 0.5, y: 0.5 }, session.settings, fieldSize.width, fieldSize.height)
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

  const activeRestInterval = useMemo(() => {
    const session = gameSessionRef.current
    if (!session || (phase !== "playing" && phase !== "paused")) return null

    const track = trackAssets.find((asset) => asset.id === session.trackId)
    if (!track) return null

    const nowMs = phase === "paused" ? session.pausedOffsetMs : renderNowMs
    const interval = track.analysis.restIntervals.find((candidate) => nowMs >= candidate.startMs && nowMs <= candidate.endMs)
    if (!interval) return null

    const durationMs = Math.max(1, interval.endMs - interval.startMs)
    const progress = clamp((nowMs - interval.startMs) / durationMs, 0, 1)
    return {
      startMs: interval.startMs,
      endMs: interval.endMs,
      progress,
      thumbProgress: clamp(progress, 0.02, 0.98),
    }
  }, [phase, renderNowMs, trackAssets])

  const updateHud = useCallback((session: GameSession) => {
    setHud({
      score: session.score,
      combo: session.combo,
      maxCombo: session.maxCombo,
      accuracy: accuracyOf(session.totalHitValue, session.judgedCount),
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

      const accuracy = accuracyOf(session.totalHitValue, session.judgedCount)
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
      const perfectRun = !forcedFail && session.count100 === 0 && session.count50 === 0 && session.countMiss === 0

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
        trackId: session.trackId,
        difficulty: session.difficulty,
        accuracy,
        maxCombo: session.maxCombo,
        cleared: !forcedFail,
        perfect: perfectRun,
        availableTracks: trackAssets.length,
      })

      setResult(resultPayload)
      phaseRef.current = "results"
      setPhase("results")
    },
    [bestScores, cancelRaf, recordGameResult, stopGameAudio, trackAssets.length],
  )

  const judgeNote = useCallback(
    async (note: RuntimeNote, judgement: Judgement, nowMs: number, hitX: number, hitY: number) => {
      const session = gameSessionRef.current
      if (!session || note.judged) return

      note.judged = judgement
      note.judgedAtMs = nowMs
      session.judgedCount += 1
      session.effects.push({ x: hitX, y: hitY, judgement, startedMs: nowMs, color: circleColorByMeta(note.index, note.colorIndex) })

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

  const getHitPointer = useCallback(() => {
    if (pointerRef.current) return pointerRef.current
    const canvas = canvasRef.current
    if (!canvas) return null
    const fallback = {
      x: Math.max(0, canvas.clientWidth * 0.5),
      y: Math.max(0, canvas.clientHeight * 0.5),
    }
    pointerRef.current = fallback
    setCursorPoint({ x: fallback.x, y: fallback.y, visible: true })
    return fallback
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
          color: circleColorByMeta(candidate.note.index, candidate.note.colorIndex),
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
          if ((isPointerDownRef.current || isKeyboardHitDownRef.current) && pointer) {
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
    isKeyboardHitDownRef.current = false
    keyboardHitKeysRef.current.clear()
    gameSessionRef.current = null
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

  const startGameNow = useCallback(async (forcedTrack?: TrackAsset, forcedDifficulty?: Difficulty) => {
    const track = forcedTrack ?? selectedTrack
    const difficulty = forcedDifficulty ?? selectedDifficulty
    if (!track) return
    const context = await ensureAudioGraph()
    if (context.state === "suspended") {
      await context.resume()
    }

    const beatmap = generateBeatmap(track.id, difficulty, track.durationMs, track.analysis)
    const runtimeNotes: RuntimeNote[] = beatmap.map((note, index) => ({
      ...note,
      index,
      judged: null,
      judgedAtMs: null,
    }))

    const source = context.createBufferSource()
    source.buffer = track.buffer
    source.connect(musicGainRef.current!)
    const startContextTime = context.currentTime + 0.02
    source.start(startContextTime, 0)
    gameSourceRef.current = source

    const session: GameSession = {
      trackId: track.id,
      difficulty,
      notes: runtimeNotes,
      settings: DIFFICULTY[difficulty],
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

  const cancelStartConfirm = useCallback(() => {
    clearStartConfirmTimers()
    setStartConfirm(null)
    setStartConfirmMsLeft(0)
  }, [clearStartConfirmTimers])

  const launchGame = useCallback(
    async (trackId: number, difficulty: Difficulty) => {
      const track = trackAssets.find((item) => item.id === trackId)
      if (!track) return

      cancelStartConfirm()
      stopPreview()
      stopGame()
      clearCountdownTimeouts()
      clearArmingTimeout()
      setSelectedTrackId(trackId)
      setSelectedDifficulty(difficulty)
      await enterFullscreen()
      await startGameNow(track, difficulty)
    },
    [cancelStartConfirm, clearArmingTimeout, clearCountdownTimeouts, enterFullscreen, startGameNow, stopGame, stopPreview, trackAssets],
  )

  const confirmStartNow = useCallback(() => {
    if (!startConfirm) return
    const { trackId, difficulty } = startConfirm
    void launchGame(trackId, difficulty)
  }, [launchGame, startConfirm])

  const openStartConfirm = useCallback(
    (trackId: number, difficulty: Difficulty) => {
      stopPreview()
      clearStartConfirmTimers()

      const expiresAtMs = performance.now() + 3000
      setSelectedTrackId(trackId)
      setSelectedDifficulty(difficulty)
      setStartConfirm({ trackId, difficulty, expiresAtMs })
      setStartConfirmMsLeft(3000)

      startConfirmTimeoutRef.current = window.setTimeout(() => {
        void launchGame(trackId, difficulty)
      }, 3000)

      startConfirmTickRef.current = window.setInterval(() => {
        setStartConfirmMsLeft(Math.max(0, Math.ceil(expiresAtMs - performance.now())))
      }, 40)
    },
    [clearStartConfirmTimers, launchGame, stopPreview],
  )

  useEffect(() => {
    if (!startConfirm) return
    const handleConfirmKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        cancelStartConfirm()
        return
      }
      if (event.key === "Enter") {
        event.preventDefault()
        confirmStartNow()
      }
    }
    window.addEventListener("keydown", handleConfirmKeys)
    return () => {
      window.removeEventListener("keydown", handleConfirmKeys)
    }
  }, [cancelStartConfirm, confirmStartNow, startConfirm])

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
    const active = gameSessionRef.current
    const nextTrackId = active?.trackId ?? selectedTrackId
    const nextDifficulty = active?.difficulty ?? selectedDifficulty
    void launchGame(nextTrackId, nextDifficulty)
  }, [launchGame, selectedDifficulty, selectedTrackId])

  const backToMenu = useCallback(() => {
    cancelStartConfirm()
    stopPreview()
    clearCountdownTimeouts()
    stopGame()
    setResult(null)
    phaseRef.current = "menu"
    setPhase("menu")
    void exitFullscreen()
  }, [cancelStartConfirm, clearCountdownTimeouts, exitFullscreen, stopGame, stopPreview])

  const togglePreviewForTrack = useCallback(async (track: TrackAsset) => {
    if (isPreviewPlaying && previewTrackId === track.id) {
      stopPreview()
      return
    }

    const context = await ensureAudioGraph()
    if (context.state === "suspended") {
      await context.resume()
    }

    stopPreview()
    const source = context.createBufferSource()
    source.buffer = track.buffer
    source.connect(musicGainRef.current!)
    const middleSec = clamp(track.buffer.duration * 0.5, 0, Math.max(0, track.buffer.duration - 0.08))
    const loopEndSec = Math.min(track.buffer.duration, middleSec + 24)
    if (loopEndSec - middleSec > 0.36) {
      source.loop = true
      source.loopStart = middleSec
      source.loopEnd = loopEndSec
    }
    source.onended = () => {
      if (previewSourceRef.current !== source) return
      previewSourceRef.current = null
      setIsPreviewPlaying(false)
      setPreviewTrackId(null)
    }
    source.start(0, middleSec)
    previewSourceRef.current = source
    setIsPreviewPlaying(true)
    setPreviewTrackId(track.id)
  }, [ensureAudioGraph, isPreviewPlaying, previewTrackId, stopPreview])

  useEffect(() => {
    const isHitKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      return event.code === "KeyZ" || event.code === "KeyX" || key === "z" || key === "x"
    }

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

      if (isHitKey(event) && phase === "playing") {
        event.preventDefault()
        const hitCode = event.code === "KeyZ" || event.code === "KeyX" ? event.code : event.key.toLowerCase()
        const heldKeys = keyboardHitKeysRef.current
        const alreadyPressed = heldKeys.has(hitCode)
        heldKeys.add(hitCode)
        isKeyboardHitDownRef.current = true
        if (!alreadyPressed) {
          const pointer = getHitPointer()
          if (pointer) {
            void handleHitAt(pointer.x, pointer.y)
          }
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!isHitKey(event)) return
      const hitCode = event.code === "KeyZ" || event.code === "KeyX" ? event.code : event.key.toLowerCase()
      keyboardHitKeysRef.current.delete(hitCode)
      isKeyboardHitDownRef.current = keyboardHitKeysRef.current.size > 0
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [getHitPointer, handleHitAt, pauseGame, phase, restartGame, resumeGame])

  useEffect(() => {
    const releasePointer = () => {
      isPointerDownRef.current = false
    }
    const releaseAllInput = () => {
      isPointerDownRef.current = false
      isKeyboardHitDownRef.current = false
      keyboardHitKeysRef.current.clear()
    }
    window.addEventListener("pointerup", releasePointer)
    window.addEventListener("pointercancel", releasePointer)
    window.addEventListener("blur", releaseAllInput)
    return () => {
      window.removeEventListener("pointerup", releasePointer)
      window.removeEventListener("pointercancel", releasePointer)
      window.removeEventListener("blur", releaseAllInput)
    }
  }, [])

  useEffect(() => {
    const gameplayVisible =
      phase === "playing" || phase === "paused" || phase === "results"
    if (!gameplayVisible) return

    const resizeCanvas = () => {
      const wrap = canvasWrapRef.current
      const canvas = canvasRef.current
      if (!wrap || !canvas) return

      const rect = wrap.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      const width = Math.round(rect.width)
      const height = Math.round(rect.height)
      setFieldSize((previous) => {
        if (previous.width === width && previous.height === height) return previous
        return { width, height }
      })

      const dpr = clamp(window.devicePixelRatio || 1, 1, 2)
      const nextCanvasWidth = Math.round(rect.width * dpr)
      const nextCanvasHeight = Math.round(rect.height * dpr)
      if (canvas.width !== nextCanvasWidth) canvas.width = nextCanvasWidth
      if (canvas.height !== nextCanvasHeight) canvas.height = nextCanvasHeight
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      const context = canvas.getContext("2d")
      if (!context) return
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.imageSmoothingEnabled = true
      context.clearRect(0, 0, rect.width, rect.height)
    }

    let resizeObserver: ResizeObserver | null = null
    if (typeof window !== "undefined" && "ResizeObserver" in window && canvasWrapRef.current) {
      resizeObserver = new ResizeObserver(() => {
        resizeCanvas()
      })
      resizeObserver.observe(canvasWrapRef.current)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    window.addEventListener("orientationchange", resizeCanvas)
    document.addEventListener("fullscreenchange", resizeCanvas)

    const rafId = window.requestAnimationFrame(() => {
      resizeCanvas()
    })

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("orientationchange", resizeCanvas)
      document.removeEventListener("fullscreenchange", resizeCanvas)
      resizeObserver?.disconnect()
    }
  }, [phase])

  useEffect(() => {
    return () => {
      clearArmingTimeout()
      clearCountdownTimeouts()
      clearStartConfirmTimers()
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
  }, [cancelRaf, clearArmingTimeout, clearCountdownTimeouts, clearStartConfirmTimers, stopGameAudio, stopPreview])

  const onCanvasPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    isPointerDownRef.current = true
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    pointerRef.current = { x, y }
    setCursorPoint({ x, y, visible: true })
    cursorTrailRef.current.push({ x, y, t: performance.now() })

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

  const pendingStartTrack = startConfirm ? trackAssets.find((track) => track.id === startConfirm.trackId) ?? null : null
  const pendingStartBackground =
    startConfirm && pendingStartTrack ? backgroundByTrackId.get(startConfirm.trackId) ?? null : null
  const pendingStartBest =
    startConfirm && pendingStartTrack ? bestScores[bestKey(startConfirm.trackId, startConfirm.difficulty)] ?? 0 : 0
  const resultRankIndex = result ? RANK_SCALE.indexOf(result.ranking) : -1
  const selectionStage = phase === "menu" || phase === "loading"
  const menuBackgroundStyle = selectionStage
    ? {
        backgroundColor: "#03060d",
        backgroundImage:
          "radial-gradient(circle at 22% 16%, rgba(139, 31, 68, 0.34), transparent 42%), radial-gradient(circle at 82% 11%, rgba(28, 129, 178, 0.24), transparent 44%), linear-gradient(145deg, #03060d 0%, #040912 56%, #050b16 100%)",
      }
    : undefined

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 pb-8 pt-20 text-[#111111] select-none md:px-8"
      style={{ ...menuBackgroundStyle, ...OSU_SURFACE_STYLE }}
    >
      {selectionStage && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgba(255,255,255,0.08),transparent_40%)]" />
        </>
      )}
      <div className="mx-auto max-w-[1400px]">
        {phase === "loading" && (
          <section className="flex min-h-[72vh] items-center justify-center">
            <div className="w-full max-w-xl rounded-2xl border border-[#ce9fb6]/50 bg-[#fff2f8]/72 p-6 shadow-[0_22px_80px_rgba(97,35,64,0.16)] backdrop-blur">
              <p className="text-[11px] tracking-[0.14em] text-[#6f5361] uppercase">Загрузка</p>
              <p className="mt-2 text-sm text-[#5f4653]">{loadingText}</p>
              <div className="mt-4 h-4 overflow-hidden rounded-full border border-[#d39ebb]/60 bg-white/65">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#8deacc_0%,#74d8e8_32%,#a08ef8_64%,#ff9cc3_100%)] transition-[width] duration-200"
                  style={{ width: `${clamp(loadingProgress, 0, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-[#6e5162]">
                <span>{Math.round(clamp(loadingProgress, 0, 100))}%</span>
                <span>{loadingProgress < 100 ? "Подождите..." : "Готово"}</span>
              </div>
            </div>
          </section>
        )}

        {phase === "error" && (
          <section className="rounded-xl border border-red-900/25 bg-red-50/60 p-6 text-red-900">
            <p className="text-sm font-medium">Assets not found in /osu</p>
            <p className="mt-2 text-sm">
              Check that <code>osu1_music.mp3</code>...<code>osu8_music.mp3</code> and matching backgrounds exist in <code>/osu</code>.
            </p>
            {errorText && <p className="mt-2 text-xs opacity-75">{errorText}</p>}
          </section>
        )}

        {phase === "menu" && (
          <section className="relative space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.06] px-4 py-3 text-white backdrop-blur-sm">
              <div className="inline-flex items-center gap-2">
                <span className="text-[11px] tracking-[0.12em] text-white/75 uppercase">Volume</span>
                <div className="inline-flex items-center overflow-hidden rounded-lg border border-white/28 bg-black/24">
                  <button
                    type="button"
                    onClick={() => setVolume((previous) => clamp(previous - 5, 0, 100))}
                    className="px-3 py-1 text-sm text-white/90 transition-colors hover:bg-white/16"
                    aria-label="Decrease volume"
                  >
                    -
                  </button>
                  <span className="min-w-[56px] border-x border-white/22 px-3 py-1 text-center text-xs font-semibold text-white">{volume}%</span>
                  <button
                    type="button"
                    onClick={() => setVolume((previous) => clamp(previous + 5, 0, 100))}
                    className="px-3 py-1 text-sm text-white/90 transition-colors hover:bg-white/16"
                    aria-label="Increase volume"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[11px] tracking-[0.12em] text-white/75 uppercase">Dim</span>
                <div className="inline-flex items-center overflow-hidden rounded-lg border border-white/28 bg-black/24">
                  <button
                    type="button"
                    onClick={() => setBackgroundDim((previous) => clamp(previous - 5, 0, 100))}
                    className="px-3 py-1 text-sm text-white/90 transition-colors hover:bg-white/16"
                    aria-label="Decrease background dim"
                  >
                    -
                  </button>
                  <span className="min-w-[56px] border-x border-white/22 px-3 py-1 text-center text-xs font-semibold text-white">{backgroundDim}%</span>
                  <button
                    type="button"
                    onClick={() => setBackgroundDim((previous) => clamp(previous + 5, 0, 100))}
                    className="px-3 py-1 text-sm text-white/90 transition-colors hover:bg-white/16"
                    aria-label="Increase background dim"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {trackAssets.map((track) => {
                const expanded = hoveredTrackId === track.id
                const selected = selectedTrackId === track.id
                const trackBackground = backgroundByTrackId.get(track.id) ?? null
                const trackBest = DIFFICULTY_ORDER.reduce((currentBest, difficulty) => {
                  const value = bestScores[bestKey(track.id, difficulty)] ?? 0
                  return Math.max(currentBest, value)
                }, 0)
                const previewActive = isPreviewPlaying && previewTrackId === track.id

                return (
                  <article
                    key={track.id}
                    onMouseEnter={() => setHoveredTrackId(track.id)}
                    onMouseLeave={() => setHoveredTrackId(null)}
                    className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                      selected
                        ? "border-[#ff9fc5]/72 bg-[#2a2941]/86 text-white shadow-[0_14px_35px_rgba(36,11,31,0.4)]"
                        : "border-white/22 bg-[#212c42]/74 text-white/95"
                    }`}
                  >
                    <div className="flex items-stretch gap-3 px-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          cancelStartConfirm()
                          setSelectedTrackId(track.id)
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${selected ? "bg-[#ff8bbb]" : "bg-[#8be5c7]"}`} />
                          <p className="truncate text-[clamp(20px,2.6vw,34px)] font-semibold leading-none tracking-[-0.02em]">
                            {track.title}
                          </p>
                        </div>
                        <p className="mt-1 truncate text-xs text-white/74">{track.artist}</p>
                        <p className="mt-1 text-[11px] tracking-[0.12em] text-white/76 uppercase">
                          {formatTime(track.durationMs)} - best {trackBest}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          cancelStartConfirm()
                          setSelectedTrackId(track.id)
                          void togglePreviewForTrack(track)
                        }}
                        className={`group flex h-24 w-16 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                          previewActive
                            ? "border-[#ff9cc6]/85 bg-[#ff9cc6]/24 text-[#ffd8ea]"
                            : "border-white/32 bg-black/24 text-white/78 hover:bg-white/10"
                        }`}
                        aria-label={`Preview ${track.title}`}
                      >
                        <svg viewBox="0 0 48 48" className="h-8 w-8" fill="currentColor" aria-hidden="true">
                          <path d="M16 9v20.9a6.4 6.4 0 1 1-2.7-5.2V11.6l19-4.5v18.2a6.4 6.4 0 1 1-2.7-5.2V10.4L16 13.7Z" />
                        </svg>
                      </button>

                      <div className="relative hidden h-24 w-44 shrink-0 overflow-hidden rounded-xl border border-white/35 bg-black/25 sm:block">
                        {trackBackground?.kind === "video" && (
                          <video src={trackBackground.src} className="h-full w-full object-cover" muted loop autoPlay playsInline />
                        )}
                        {trackBackground?.kind === "image" && (
                          <img src={trackBackground.src} alt={`${track.title} cover`} className="h-full w-full object-cover" />
                        )}
                        {!trackBackground && <div className="h-full w-full bg-[#283f43]" />}
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(9,7,14,0.08)_0%,rgba(9,7,14,0.5)_100%)]" />
                      </div>
                    </div>

                    <div
                      className={`overflow-hidden transition-[max-height,opacity,margin] duration-300 ${
                        expanded ? "max-h-[360px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="space-y-2 px-3 pb-3">
                        {DIFFICULTY_ORDER.map((difficulty) => {
                          const active = selectedTrackId === track.id && selectedDifficulty === difficulty
                          const theme = DIFFICULTY_THEME[difficulty]
                          const stars = "*".repeat(DIFFICULTY[difficulty].star)
                          const bestForDifficulty = bestScores[bestKey(track.id, difficulty)] ?? 0
                          return (
                            <button
                              key={`${track.id}-${difficulty}`}
                              type="button"
                              onClick={() => {
                                cancelStartConfirm()
                                setSelectedTrackId(track.id)
                                setSelectedDifficulty(difficulty)
                              }}
                              onDoubleClick={() => {
                                openStartConfirm(track.id, difficulty)
                              }}
                              className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-transform hover:scale-[1.01]"
                              style={{
                                background: theme.gradient,
                                color: theme.text,
                                borderColor: active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.38)",
                                boxShadow: active ? "0 0 0 1px rgba(255,255,255,0.86), 0 8px 20px rgba(0,0,0,0.2)" : "none",
                              }}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.badge }} />
                                <span className="text-sm font-semibold tracking-[0.02em] uppercase">{difficulty}</span>
                              </span>
                              <span className="text-[11px] font-medium">{stars} - Best {bestForDifficulty}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {startConfirm && pendingStartTrack && (
              <div
                className="fixed inset-0 z-[120] flex items-center justify-center bg-black/74 p-4 backdrop-blur-[4px]"
                onClick={confirmStartNow}
                onContextMenu={(event) => {
                  event.preventDefault()
                  confirmStartNow()
                }}
              >
                <div className="w-full max-w-2xl rounded-2xl border border-white/28 bg-[#101827]/82 p-4 text-white shadow-[0_28px_90px_rgba(0,0,0,0.65)] backdrop-blur-md">
                  <p className="text-[11px] tracking-[0.15em] text-white/68 uppercase">Press Enter / Click / Right click</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <div className="relative h-28 w-full overflow-hidden rounded-xl border border-white/26 bg-black/30 sm:w-60">
                      {pendingStartBackground?.kind === "video" && (
                        <video src={pendingStartBackground.src} className="h-full w-full object-cover" muted loop autoPlay playsInline />
                      )}
                      {pendingStartBackground?.kind === "image" && (
                        <img src={pendingStartBackground.src} alt={`${pendingStartTrack.title} cover`} className="h-full w-full object-cover" />
                      )}
                      {!pendingStartBackground && <div className="h-full w-full bg-[#21263a]" />}
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(4,7,12,0.08)_0%,rgba(4,7,12,0.52)_100%)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-2xl font-semibold tracking-[-0.02em]">{pendingStartTrack.title}</p>
                      <p className="mt-1 truncate text-sm text-white/74">{pendingStartTrack.artist}</p>
                      <p className="mt-2 text-xs text-white/80">
                        {formatTime(pendingStartTrack.durationMs)} - {startConfirm.difficulty.toUpperCase()} - Best {pendingStartBest}
                      </p>
                      <p className="mt-2 text-xs tracking-[0.12em] text-white/70 uppercase">
                        Auto start in {Math.max(0, Math.ceil(startConfirmMsLeft / 1000))}s
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        cancelStartConfirm()
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        cancelStartConfirm()
                      }}
                      className="rounded-lg border border-white/36 bg-white/10 px-3 py-1.5 text-xs tracking-[0.12em] text-white/88 uppercase hover:bg-white/16"
                    >
                      Cancel (Esc)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {(phase === "playing" || phase === "paused" || phase === "results") && (
          <section
            ref={gameplayRootRef}
            className="fixed inset-0 z-[80] h-[100dvh] overflow-hidden bg-[#140914] select-none"
            style={OSU_GAME_SURFACE_STYLE}
            onContextMenu={(event) => event.preventDefault()}
          >
            <div ref={canvasWrapRef} className="relative h-full w-full overflow-hidden bg-black">
              {selectedBackground?.kind === "video" && (
                <video src={selectedBackground.src} className="absolute inset-0 h-full w-full object-cover" muted loop autoPlay playsInline />
              )}
              {selectedBackground?.kind === "image" && (
                <img src={selectedBackground.src} alt="Game background" className="absolute inset-0 h-full w-full object-cover" />
              )}

              <div className="absolute inset-0 bg-black transition-opacity duration-200" style={{ opacity: clamp(backgroundDim / 100, 0, 1) }} />

              <canvas
                ref={canvasRef}
                className={`absolute inset-0 z-10 h-full w-full touch-none select-none ${phase === "playing" ? "cursor-none" : ""}`}
                style={OSU_GAME_SURFACE_STYLE}
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
                    <circle cx={note.x} cy={note.y} r={Math.max(2, note.radius * 0.14)} fill="rgba(255,255,255,0.92)" />
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
                    <text
                      x={note.x}
                      y={note.y}
                      fill="rgba(255,255,255,0.99)"
                      fontSize={Math.max(13, note.radius * 0.8)}
                      fontWeight="900"
                      letterSpacing="-0.01em"
                      textAnchor="middle"
                      dominantBaseline="central"
                      stroke="rgba(12,3,10,0.72)"
                      strokeWidth={Math.max(1.2, note.radius * 0.1)}
                      paintOrder="stroke"
                    >
                      {note.orderLabel}
                    </text>
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

              {phase === "playing" && (
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

              {(phase === "playing" || phase === "paused") && (
                <div className="pointer-events-none absolute bottom-4 left-4 z-30 text-white">
                  <p className="text-[clamp(30px,4vw,52px)] font-black leading-none tracking-[-0.02em] drop-shadow-[0_5px_14px_rgba(0,0,0,0.45)]">
                    X{hud.combo}
                  </p>
                </div>
              )}

              <div className="pointer-events-none absolute right-3 top-3 z-30 rounded-md border border-white/35 bg-[#f9d8e7]/34 px-3 py-2 text-white backdrop-blur-sm">
                <p className="text-xs tracking-[0.12em] uppercase">Accuracy</p>
                <p className="mt-1 text-lg font-semibold leading-none">{hud.accuracy.toFixed(2)}%</p>
              </div>

              {activeRestInterval && (
                <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center px-4">
                  <div className="relative w-[min(78vw,960px)]">
                    <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-[54px] leading-none text-white/70 drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]">
                      {"<"}
                    </div>
                    <div className="absolute -right-16 top-1/2 -translate-y-1/2 text-[54px] leading-none text-white/70 drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]">
                      {">"}
                    </div>

                    <div className="h-3 overflow-hidden rounded-full border border-white/55 bg-white/18 shadow-[0_0_30px_rgba(255,255,255,0.2)] backdrop-blur-[1px]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#cef4ff] via-[#ffffff] to-[#ffd4ea]"
                        style={{
                          width: `${activeRestInterval.progress * 100}%`,
                          boxShadow: "0 0 20px rgba(255,255,255,0.55)",
                        }}
                      />
                    </div>

                    <div
                      className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-white/90 bg-[#fff7fc] shadow-[0_0_16px_rgba(255,255,255,0.95)]"
                      style={{
                        left: `calc(${activeRestInterval.thumbProgress * 100}% - 12px)`,
                      }}
                    >
                      <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff7db5]" />
                    </div>
                  </div>
                </div>
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
                  {result.failed ? (
                    <div
                      className={`w-full max-w-md rounded-2xl border border-[#ff95a4]/45 bg-[#2b1022]/75 p-5 text-[#ffeef4] shadow-[0_20px_64px_rgba(0,0,0,0.45)] backdrop-blur transition-all duration-500 ${
                        resultVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-95 opacity-0"
                      }`}
                    >
                      <p className="text-[11px] tracking-[0.15em] text-[#ffbacb] uppercase">Поражение</p>
                      <h2 className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-[#ffd4de]">Серия промахов</h2>
                      <p className="mt-2 text-sm text-[#ffd8e2]/90">Допущено 5 промахов подряд. Попробуйте еще раз.</p>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <p>Очки: {result.score}</p>
                        <p>Рекорд: {result.bestScore}</p>
                        <p>Точность: {result.accuracy.toFixed(2)}%</p>
                        <p>Макс. комбо: {result.maxCombo}</p>
                        <p>300: {result.count300}</p>
                        <p>100: {result.count100}</p>
                        <p>50: {result.count50}</p>
                        <p>Miss: {result.countMiss}</p>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={restartGame}
                          className="rounded-xl border border-[#ffb1c3]/70 bg-[#ff7ca5]/28 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ff7ca5]/38"
                        >
                          Рестарт
                        </button>
                        <button
                          type="button"
                          onClick={backToMenu}
                          className="rounded-xl border border-[#ffd6ea]/55 bg-[#ffd6ea]/18 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ffd6ea]/28"
                        >
                          Меню
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`w-full max-w-lg rounded-2xl border border-[#b8d4ff]/30 bg-[#0d1424]/82 p-5 text-[#e9f1ff] shadow-[0_20px_64px_rgba(0,0,0,0.55)] backdrop-blur transition-all duration-500 ${
                        resultVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-95 opacity-0"
                      }`}
                    >
                      <p className="text-[11px] tracking-[0.15em] text-[#9ec5ff] uppercase">Результат</p>
                      <div className="mt-3 flex justify-center">
                        <div className="relative h-[290px] w-[290px]">
                          <svg viewBox="0 0 100 100" className="h-full w-full">
                            <circle cx="50" cy="50" r="37" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                            {RANK_SCALE.map((rank, index) => {
                              const segment = 360 / RANK_SCALE.length
                              const gap = 5
                              const start = index * segment + gap * 0.5
                              const end = (index + 1) * segment - gap * 0.5
                              const active = index === resultRankIndex
                              return (
                                <path
                                  key={rank}
                                  d={arcPath(50, 50, 37, start, end)}
                                  fill="none"
                                  stroke={RANK_COLORS[rank]}
                                  strokeWidth={active ? 10.5 : 9}
                                  strokeLinecap="round"
                                  opacity={active ? 1 : 0.46}
                                  style={active ? { filter: `drop-shadow(0 0 7px ${RANK_COLORS[rank]})` } : undefined}
                                />
                              )
                            })}
                            {RANK_SCALE.map((rank, index) => {
                              const angle = (index + 0.5) * (360 / RANK_SCALE.length)
                              const point = polarPoint(50, 50, 46, angle)
                              return (
                                <text
                                  key={`${rank}-label`}
                                  x={point.x}
                                  y={point.y}
                                  fill={RANK_COLORS[rank]}
                                  fontSize="4.4"
                                  fontWeight={index === resultRankIndex ? "800" : "700"}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  opacity={index === resultRankIndex ? 1 : 0.75}
                                >
                                  {rank}
                                </text>
                              )
                            })}
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className="flex h-[148px] w-[148px] items-center justify-center rounded-full border text-[64px] font-semibold tracking-[-0.02em]"
                              style={{
                                borderColor: `${RANK_COLORS[result.ranking]}bb`,
                                color: RANK_COLORS[result.ranking],
                                background: "radial-gradient(circle at 50% 40%, rgba(16,22,38,0.95) 0%, rgba(10,15,27,0.98) 100%)",
                                boxShadow: `0 0 30px ${RANK_COLORS[result.ranking]}33, inset 0 0 24px rgba(255,255,255,0.06)`,
                              }}
                            >
                              {result.ranking}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="mt-1 text-center text-[52px] font-light leading-none tracking-[-0.02em]">{result.score}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <p>Точность: {result.accuracy.toFixed(2)}%</p>
                        <p>Макс. комбо: {result.maxCombo}</p>
                        <p>300: {result.count300}</p>
                        <p>100: {result.count100}</p>
                        <p>50: {result.count50}</p>
                        <p>Miss: {result.countMiss}</p>
                        <p>Сложность: {result.difficulty.toUpperCase()}</p>
                        <p>Рекорд: {result.bestScore}</p>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={restartGame}
                          className="rounded-xl border border-[#8ec5ff]/65 bg-[#57a8ff]/26 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#57a8ff]/36"
                        >
                          Рестарт
                        </button>
                        <button
                          type="button"
                          onClick={backToMenu}
                          className="rounded-xl border border-[#9fcbff]/55 bg-[#9fcbff]/16 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#9fcbff]/28"
                        >
                          Меню
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

