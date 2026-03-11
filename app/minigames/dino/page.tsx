"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useProfileTracker } from "@/components/profile-provider"

const CANVAS_WIDTH = 1320
const CANVAS_HEIGHT = 360
const GROUND_Y = 296
const PLAYER_X = 146

const BASE_SPEED = 360
const MAX_SPEED = 1350
const SPEED_PER_SCORE = 0.12
const SCORE_BASE_RATE = 38
const SCORE_SPEED_RATE = 0.05

const JUMP_VELOCITY = -930
const GRAVITY = 2850
const FAST_FALL_GRAVITY = 5500

const PLAYER_TARGET_HEIGHT = 84
const OBSTACLE_TARGET_HEIGHT = 78

const SKIN_STORAGE_KEY = "landing.dino.selected-skin.v1"
const LOCAL_BEST_STORAGE_KEY = "landing.dino.best.v1"

type SkinId = "cactus" | "mario" | "sonik" | "finn" | "dedpul" | "godjo" | "toxis"
type ObstacleId = "dino" | "2_dino" | "3_dino"

interface SkinDefinition {
  id: SkinId
  unlockScore: number
  src: string
  width: number
  height: number
}

interface ObstacleDefinition {
  id: ObstacleId
  src: string
  chance: number
  width: number
  height: number
}

interface Obstacle {
  id: string
  type: ObstacleId
  src: string
  x: number
  width: number
  height: number
}

interface DinoGameState {
  running: boolean
  over: boolean
  score: number
  speed: number
  playerY: number
  playerVelocity: number
  obstacles: Obstacle[]
  distanceSinceSpawn: number
  nextSpawnDistance: number
  parallaxNearOffset: number
  parallaxFarOffset: number
  isFastFall: boolean
  lastFrameMs: number
}

const SKINS: readonly SkinDefinition[] = [
  { id: "cactus", unlockScore: 0, src: "/games/dino/cactus.png", width: 180, height: 352 },
  { id: "mario", unlockScore: 250, src: "/games/dino/mario.png", width: 273, height: 359 },
  { id: "sonik", unlockScore: 500, src: "/games/dino/sonik.png", width: 246, height: 359 },
  { id: "finn", unlockScore: 1000, src: "/games/dino/finn.png", width: 202, height: 351 },
  { id: "dedpul", unlockScore: 1500, src: "/games/dino/dedpul.png", width: 198, height: 352 },
  { id: "godjo", unlockScore: 2000, src: "/games/dino/godjo.png", width: 263, height: 342 },
  { id: "toxis", unlockScore: 5000, src: "/games/dino/toxis.png", width: 197, height: 346 },
]

const OBSTACLE_DEFS: readonly ObstacleDefinition[] = [
  { id: "dino", src: "/games/dino/dino.png", chance: 0.5, width: 334, height: 359 },
  { id: "2_dino", src: "/games/dino/2_dino.png", chance: 0.3, width: 373, height: 359 },
  { id: "3_dino", src: "/games/dino/3_dino.png", chance: 0.2, width: 546, height: 359 },
]

const skinById: Record<SkinId, SkinDefinition> = {
  cactus: SKINS[0],
  mario: SKINS[1],
  sonik: SKINS[2],
  finn: SKINS[3],
  dedpul: SKINS[4],
  godjo: SKINS[5],
  toxis: SKINS[6],
}

function getScaledSize(width: number, height: number, targetHeight: number) {
  const scaledHeight = targetHeight
  const scaledWidth = (width / height) * scaledHeight
  return {
    width: scaledWidth,
    height: scaledHeight,
  }
}

function getPlayerSize(skinId: SkinId) {
  const skin = skinById[skinId]
  return getScaledSize(skin.width, skin.height, PLAYER_TARGET_HEIGHT)
}

function createInitialState(playerHeight: number): DinoGameState {
  return {
    running: true,
    over: false,
    score: 0,
    speed: BASE_SPEED,
    playerY: GROUND_Y - playerHeight,
    playerVelocity: 0,
    obstacles: [],
    distanceSinceSpawn: 0,
    nextSpawnDistance: 760,
    parallaxNearOffset: 0,
    parallaxFarOffset: 0,
    isFastFall: false,
    lastFrameMs: 0,
  }
}

function intersects(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function isSkinId(value: string): value is SkinId {
  return value in skinById
}

function pickObstacle() {
  const roll = Math.random()
  let cumulative = 0
  for (const obstacle of OBSTACLE_DEFS) {
    cumulative += obstacle.chance
    if (roll <= cumulative) return obstacle
  }
  return OBSTACLE_DEFS[0]
}

function loadSprite(src: string) {
  return new Promise<[string, HTMLImageElement]>((resolve, reject) => {
    const image = new Image()
    image.decoding = "async"
    image.onload = () => resolve([src, image])
    image.onerror = () => reject(new Error(`Could not load sprite: ${src}`))
    image.src = src
  })
}

export default function DinoPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const spritesRef = useRef<Record<string, HTMLImageElement>>({})
  const currentSkinRef = useRef<SkinId>("cactus")
  const playerSizeRef = useRef(getPlayerSize("cactus"))
  const reportedGameOverRef = useRef(false)
  const scoreViewRef = useRef(0)
  const speedViewRef = useRef(BASE_SPEED)
  const stateRef = useRef<DinoGameState>(createInitialState(playerSizeRef.current.height))

  const { data, recordGameResult } = useProfileTracker()

  const [scoreView, setScoreView] = useState(0)
  const [speedView, setSpeedView] = useState(BASE_SPEED)
  const [isOver, setIsOver] = useState(false)
  const [selectedSkinId, setSelectedSkinId] = useState<SkinId>("cactus")
  const [localBest, setLocalBest] = useState(0)

  const bestScore = Math.max(data.gameStats.dino.bestScore, localBest)

  const unlockedSkins = useMemo(() => {
    return new Set<SkinId>(SKINS.filter((skin) => bestScore >= skin.unlockScore).map((skin) => skin.id))
  }, [bestScore])

  const syncPlayerSkin = (skinId: SkinId) => {
    const state = stateRef.current
    const currentSize = playerSizeRef.current
    const nextSize = getPlayerSize(skinId)

    const currentFeetY = state.playerY + currentSize.height
    const groundedY = GROUND_Y - nextSize.height

    state.playerY = Math.min(groundedY, currentFeetY - nextSize.height)
    if (state.playerY >= groundedY) {
      state.playerY = groundedY
      if (state.playerVelocity > 0) {
        state.playerVelocity = 0
      }
    }

    currentSkinRef.current = skinId
    playerSizeRef.current = nextSize
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    const rawBest = Number(window.localStorage.getItem(LOCAL_BEST_STORAGE_KEY))
    if (Number.isFinite(rawBest) && rawBest > 0) {
      setLocalBest(Math.round(rawBest))
    }

    const savedSkin = window.localStorage.getItem(SKIN_STORAGE_KEY)
    if (savedSkin && isSkinId(savedSkin)) {
      setSelectedSkinId(savedSkin)
    }
  }, [])

  useEffect(() => {
    const mergedBest = Math.max(localBest, data.gameStats.dino.bestScore)
    if (mergedBest <= localBest) return
    setLocalBest(mergedBest)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_BEST_STORAGE_KEY, String(mergedBest))
    }
  }, [data.gameStats.dino.bestScore, localBest])

  useEffect(() => {
    if (!unlockedSkins.has(selectedSkinId)) {
      setSelectedSkinId("cactus")
      return
    }
    syncPlayerSkin(selectedSkinId)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SKIN_STORAGE_KEY, selectedSkinId)
    }
  }, [selectedSkinId, unlockedSkins])

  const draw = (ctx: CanvasRenderingContext2D, state: DinoGameState) => {
    const playerSize = playerSizeRef.current
    const playerSkin = skinById[currentSkinRef.current]
    const playerSprite = spritesRef.current[playerSkin.src]

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    skyGradient.addColorStop(0, "#fcfbf6")
    skyGradient.addColorStop(1, "#f0eee6")
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.fillStyle = "rgba(17,17,17,0.08)"
    for (let x = -state.parallaxFarOffset; x < CANVAS_WIDTH + 180; x += 180) {
      ctx.fillRect(x, GROUND_Y - 78, 96, 4)
    }

    ctx.strokeStyle = "rgba(17,17,17,0.24)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, GROUND_Y)
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y)
    ctx.stroke()

    ctx.fillStyle = "rgba(17,17,17,0.16)"
    for (let x = -state.parallaxNearOffset; x < CANVAS_WIDTH + 54; x += 54) {
      ctx.fillRect(x, GROUND_Y + 8, 26, 3)
    }

    if (playerSprite) {
      ctx.drawImage(playerSprite, PLAYER_X, state.playerY, playerSize.width, playerSize.height)
    } else {
      ctx.fillStyle = "#111111"
      ctx.fillRect(PLAYER_X, state.playerY, playerSize.width, playerSize.height)
    }

    for (const obstacle of state.obstacles) {
      const obstacleSprite = spritesRef.current[obstacle.src]
      const obstacleY = GROUND_Y - obstacle.height
      if (obstacleSprite) {
        ctx.drawImage(obstacleSprite, obstacle.x, obstacleY, obstacle.width, obstacle.height)
      } else {
        ctx.fillStyle = "#111111"
        ctx.fillRect(obstacle.x, obstacleY, obstacle.width, obstacle.height)
      }
    }

    ctx.fillStyle = "rgba(17,17,17,0.66)"
    ctx.font = "700 20px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 20, 32)

    if (state.over) {
      ctx.fillStyle = "rgba(17,17,17,0.34)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = "#f6f4ef"
      ctx.textAlign = "center"
      ctx.font = "700 44px ui-monospace, monospace"
      ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10)
      ctx.font = "600 20px ui-monospace, monospace"
      ctx.fillText("Space or Enter to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 28)
      ctx.textAlign = "left"
    }
  }

  const restart = () => {
    reportedGameOverRef.current = false
    stateRef.current = createInitialState(playerSizeRef.current.height)
    stateRef.current.nextSpawnDistance = 760 + Math.random() * 120
    scoreViewRef.current = 0
    speedViewRef.current = BASE_SPEED
    setScoreView(0)
    setSpeedView(BASE_SPEED)
    setIsOver(false)
  }

  const jump = () => {
    const state = stateRef.current
    if (state.over) {
      restart()
      return
    }
    const groundedY = GROUND_Y - playerSizeRef.current.height
    if (state.playerY >= groundedY - 0.5) {
      state.playerVelocity = JUMP_VELOCITY
    }
  }

  const setFastFall = (active: boolean) => {
    stateRef.current.isFastFall = active
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return

    let cancelled = false

    const spriteSources = Array.from(new Set([...SKINS.map((skin) => skin.src), ...OBSTACLE_DEFS.map((obstacle) => obstacle.src)]))

    void Promise.allSettled(spriteSources.map((src) => loadSprite(src))).then((results) => {
      if (cancelled) return
      const loaded: Record<string, HTMLImageElement> = {}
      for (const result of results) {
        if (result.status !== "fulfilled") continue
        const [src, image] = result.value
        loaded[src] = image
      }
      spritesRef.current = loaded
    })

    const loop = (timestamp: number) => {
      const state = stateRef.current
      if (!state.running) return

      if (state.lastFrameMs === 0) {
        state.lastFrameMs = timestamp
      }

      const delta = Math.min((timestamp - state.lastFrameMs) / 1000, 0.05)
      state.lastFrameMs = timestamp
      const groundedY = GROUND_Y - playerSizeRef.current.height
      if (state.playerY > groundedY) {
        state.playerY = groundedY
      }

      if (!state.over) {
        state.speed = Math.min(MAX_SPEED, BASE_SPEED + state.score * SPEED_PER_SCORE)
        state.score += delta * (SCORE_BASE_RATE + state.speed * SCORE_SPEED_RATE)

        const activeGravity = state.isFastFall && state.playerY < groundedY - 0.5 ? GRAVITY + FAST_FALL_GRAVITY : GRAVITY
        state.playerVelocity += activeGravity * delta
        state.playerY = Math.min(groundedY, state.playerY + state.playerVelocity * delta)
        if (state.playerY >= groundedY) {
          state.playerY = groundedY
          state.playerVelocity = 0
        }

        state.distanceSinceSpawn += state.speed * delta
        if (state.distanceSinceSpawn >= state.nextSpawnDistance) {
          state.distanceSinceSpawn = 0
          const obstacleDef = pickObstacle()
          const obstacleSize = getScaledSize(obstacleDef.width, obstacleDef.height, OBSTACLE_TARGET_HEIGHT)
          const minGap = 520 + Math.min(220, state.speed * 0.08)
          const maxGap = minGap + 460
          state.nextSpawnDistance = minGap + Math.random() * (maxGap - minGap)

          state.obstacles.push({
            id: `${obstacleDef.id}-${timestamp}-${Math.random()}`,
            type: obstacleDef.id,
            src: obstacleDef.src,
            x: CANVAS_WIDTH + 24,
            width: obstacleSize.width,
            height: obstacleSize.height,
          })
        }

        state.obstacles = state.obstacles
          .map((obstacle) => ({
            ...obstacle,
            x: obstacle.x - state.speed * delta,
          }))
          .filter((obstacle) => obstacle.x + obstacle.width > -20)

        state.parallaxNearOffset = (state.parallaxNearOffset + state.speed * delta) % 54
        state.parallaxFarOffset = (state.parallaxFarOffset + state.speed * 0.35 * delta) % 180

        const playerRect = {
          x: PLAYER_X,
          y: state.playerY,
          w: playerSizeRef.current.width,
          h: playerSizeRef.current.height,
        }

        for (const obstacle of state.obstacles) {
          const obstacleRect = {
            x: obstacle.x,
            y: GROUND_Y - obstacle.height,
            w: obstacle.width,
            h: obstacle.height,
          }
          if (intersects(playerRect, obstacleRect)) {
            state.over = true
            state.isFastFall = false
            setIsOver(true)
            break
          }
        }
      }

      draw(context, state)

      const nextScore = Math.floor(state.score)
      if (nextScore !== scoreViewRef.current) {
        scoreViewRef.current = nextScore
        setScoreView(nextScore)
      }
      const nextSpeed = Math.round(state.speed)
      if (nextSpeed !== speedViewRef.current) {
        speedViewRef.current = nextSpeed
        setSpeedView(nextSpeed)
      }

      animationFrameRef.current = window.requestAnimationFrame(loop)
    }

    animationFrameRef.current = window.requestAnimationFrame(loop)

    return () => {
      cancelled = true
      stateRef.current.running = false
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "ArrowUp") {
        event.preventDefault()
        jump()
      } else if (event.key === "ArrowDown") {
        event.preventDefault()
        setFastFall(true)
      } else if (event.key === "Enter" && stateRef.current.over) {
        event.preventDefault()
        restart()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        setFastFall(false)
      }
    }

    const handleBlur = () => {
      setFastFall(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", handleBlur)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", handleBlur)
    }
  }, [])

  useEffect(() => {
    if (!isOver || reportedGameOverRef.current) return
    reportedGameOverRef.current = true

    const finalScore = scoreViewRef.current
    recordGameResult("dino", {
      score: finalScore,
      win: finalScore >= 600,
    })

    setLocalBest((previous) => {
      const nextBest = Math.max(previous, finalScore)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCAL_BEST_STORAGE_KEY, String(nextBest))
      }
      return nextBest
    })
  }, [isOver, recordGameResult])

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-2 pb-8 pt-10 text-[#111111] sm:px-4">
      <section className="mx-auto max-w-[1380px] space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] tracking-[0.12em] uppercase">
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Счет</p>
            <p className="mt-0.5 text-xl font-semibold">{scoreView}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Рекорд</p>
            <p className="mt-0.5 text-xl font-semibold">{bestScore}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Скорость</p>
            <p className="mt-0.5 text-xl font-semibold">{speedView}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => jump()}
          className="w-full rounded-lg border border-black/14 bg-[#f9f7f2] p-2"
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block h-auto w-full rounded-sm border border-black/12 bg-[#f9f7f2]"
          />
        </button>

        <div className="grid grid-cols-2 gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => jump()}
            className="rounded-md border border-black/20 bg-white/75 px-3 py-2 text-xs tracking-[0.1em] uppercase"
          >
            Jump
          </button>
          <button
            type="button"
            onPointerDown={() => setFastFall(true)}
            onPointerUp={() => setFastFall(false)}
            onPointerCancel={() => setFastFall(false)}
            onPointerLeave={() => setFastFall(false)}
            className="rounded-md border border-black/20 bg-black px-3 py-2 text-xs tracking-[0.1em] text-white uppercase"
          >
            Down
          </button>
        </div>

        <section className="rounded-lg border border-black/12 bg-white/55 p-3">
          <p className="mb-2 text-[11px] tracking-[0.16em] text-black/64 uppercase">Скины</p>
          <div className="flex flex-wrap gap-2">
            {SKINS.map((skin) => {
              const unlocked = bestScore >= skin.unlockScore
              const isSelected = selectedSkinId === skin.id
              return (
                <button
                  key={skin.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    if (!unlocked) return
                    setSelectedSkinId(skin.id)
                  }}
                  className={`relative h-12 w-12 rounded-md border bg-[#f9f7f2] transition-all sm:h-14 sm:w-14 ${
                    isSelected
                      ? "border-black shadow-[0_0_0_2px_rgba(17,17,17,0.15)]"
                      : "border-black/18 hover:border-black/36"
                  } ${unlocked ? "" : "cursor-not-allowed"}`}
                >
                  <img
                    src={skin.src}
                    alt=""
                    draggable={false}
                    className={`h-full w-full object-contain p-1.5 ${unlocked ? "" : "blur-[6px] opacity-35"}`}
                  />
                  {!unlocked && (
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-black">
                      {skin.unlockScore}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {isOver && (
          <button
            type="button"
            onClick={() => restart()}
            className="w-full rounded-md border border-black/20 bg-black px-3 py-2 text-xs tracking-[0.12em] text-white uppercase"
          >
            Restart
          </button>
        )}
      </section>
    </main>
  )
}
