const test = require("node:test")
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")

const source = readFileSync(join(__dirname, "page.tsx"), "utf8")

test("people page includes the requested GitHub links", () => {
  assert.match(source, /id: "vladislav-bogdan"[\s\S]*?githubUrl: "https:\/\/github\.com\/Vladick-Pick"/)
  assert.match(source, /id: "tatyana-popova"[\s\S]*?githubUrl: "https:\/\/github\.com\/TanyaP09"/)
  assert.match(source, /id: "roman-mikhailov"[\s\S]*?githubUrl: "https:\/\/github\.com\/MihaylovvvR1"/)
  assert.match(source, /id: "egor-linevich"[\s\S]*?githubUrl: "https:\/\/github\.com\/wxstmoon"/)
})

test("people page keeps Anastasia on a Figma label instead of GitHub", () => {
  assert.match(source, /id: "Melihova-Anastasiya"[\s\S]*?githubLabel: "Figma"/)
})

test("people page uses a black hover color for clickable profile links", () => {
  assert.match(source, /githubUrl[\s\S]*?hover:text-black/)
  assert.match(source, /telegramUrl[\s\S]*?hover:text-black/)
  assert.match(source, /type="button"[\s\S]*?hover:text-black[\s\S]*?copiedEmailId === person\.id/)
})

test("people page anchors the contact row in the bottom-right corner on desktop", () => {
  assert.match(
    source,
    /className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-8 text-\[11px\] tracking-\[0\.12em\] text-\[#111\]\/62 uppercase md:self-end md:flex-nowrap md:justify-end"/,
  )
})
