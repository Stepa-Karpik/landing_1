const test = require("node:test")
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")

function readSource(relativePath) {
  return readFileSync(join(__dirname, relativePath), "utf8")
}

test("landing page provides a stacked mobile layout and keeps the desktop rail separate", () => {
  const source = readSource("page.tsx")

  assert.match(source, /className="[^"]*md:hidden[^"]*"/)
  assert.match(source, /className="hidden md:block h-screen overflow-hidden"/)
})

test("landing page removes the projects card from the home rail and derives the trailing frame indexes", () => {
  const source = readSource("page.tsx")

  assert.doesNotMatch(source, /href:\s*"\/projects"/)
  assert.match(source, /const WORD_FRAME_INDEXES = routeFrames\.map\(\(_, index\) => index \+ FIRST_ROUTE_FRAME_INDEX\)/)
  assert.match(source, /const MANIFESTO_FRAME_INDEX = LAST_ROUTE_FRAME_INDEX \+ 1/)
  assert.match(source, /const CONTACTS_FRAME_INDEX = MANIFESTO_FRAME_INDEX \+ 1/)
})

test("people page falls back to a stacked layout below the desktop rail breakpoint", () => {
  const source = readSource("lyudi/page.tsx")

  assert.match(source, /className="[^"]*xl:hidden[^"]*"/)
  assert.match(source, /className="hidden xl:flex h-screen w-full touch-pan-x items-center/ )
})

test("people page uses a compact stacked layout on medium widths and only floats quotes on extra-wide rails", () => {
  const source = readSource("lyudi/page.tsx")

  assert.match(source, /className="grid gap-5 sm:grid-cols-\[minmax\(220px,0\.42fr\)_minmax\(0,0\.58fr\)\] sm:items-start sm:gap-6"/)
  assert.match(source, /className="mt-8 min-h-\[168px\] w-full max-w-\[620px\] self-center 2xl:absolute/)
})

test("profile and the remaining minigame screens stop hard-locking the viewport on small devices", () => {
  const responsiveFiles = [
    "profile/page.tsx",
    "minigames/2048/page.tsx",
    "minigames/breakout/page.tsx",
    "minigames/match3/page.tsx",
    "minigames/minesweeper/page.tsx",
    "minigames/simon/page.tsx",
  ]

  for (const relativePath of responsiveFiles) {
    const source = readSource(relativePath)
    assert.match(
      source,
      /<main className="[^"]*min-h-screen overflow-x-hidden [^"]*md:h-screen md:overflow-hidden/,
      relativePath,
    )
  }
})

test("dynamic route detail page keeps the hero heading inside the mobile content column", () => {
  const source = readSource("[slug]/page.tsx")

  assert.match(source, /className="mt-3 w-full md:w-\[108%\] text-\[clamp\(44px,9vw,132px\)\]/)
})

test("tetris keeps the board dominant until extra-wide layouts", () => {
  const source = readSource("minigames/tetris/page.tsx")

  assert.match(source, /<main className="[^"]*min-h-screen overflow-x-hidden [^"]*xl:h-screen xl:overflow-hidden/)
  assert.match(source, /<section className="[^"]*flex-col gap-3 [^"]*xl:h-full xl:min-h-0 xl:flex-row/)
  assert.match(source, /<aside className="[^"]*xl:w-\[360px\] xl:grid-cols-1 xl:gap-3/)
})

test("snake exposes dedicated mobile touch controls and stays scrollable below xl", () => {
  const source = readSource("minigames/snake/page.tsx")

  assert.match(source, /const requestDirection = useCallback\(\(desired: Direction\) =>/)
  assert.match(source, /<main className="[^"]*min-h-screen overflow-x-hidden [^"]*xl:h-screen xl:overflow-hidden/)
  assert.match(source, /className="mx-auto grid w-full max-w-\[220px\] grid-cols-3 gap-2 md:hidden"/)
})

test("404 page centers the video between the two fours on mobile", () => {
  const source = readSource("not-found.tsx")

  assert.match(source, /left-\[8%\] top-1\/2/)
  assert.match(source, /right-\[8%\] top-1\/2/)
})

test("403 page keeps the video block above the fold on mobile", () => {
  const source = readSource("forbidden.tsx")

  assert.match(source, /justify-center overflow-x-clip/)
  assert.match(source, /min-h-0 flex-col justify-center/)
  assert.match(source, /h-\[clamp\(220px,44vh,980px\)\]/)
})
