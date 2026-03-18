const test = require("node:test")
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")

const source = readFileSync(join(__dirname, "page.tsx"), "utf8")

test("stack page uses an interleaved working-set order", () => {
  assert.match(
    source,
    /const competencyTags = \[\s*"React",\s*"Python",\s*"Figma",\s*"Kotlin",\s*"Next\.js",\s*"Node\.js",\s*"Photoshop",\s*"Jetpack Compose",\s*"TypeScript",\s*"FastAPI",\s*"Illustrator",\s*"Coroutines",\s*"Tailwind CSS",\s*"REST API",\s*"Motion",\s*"Retrofit",\s*"Framer Motion",\s*"PostgreSQL",\s*"Prototype",\s*"API Integration",\s*"OpenAI",\s*"Docker",\s*"Design Systems",\s*"Security",\s*"Delivery",\s*\]/,
  )
})

test("stack page removes the section helper labels", () => {
  assert.doesNotMatch(source, /Направления/)
  assert.doesNotMatch(source, /Рабочий набор/)
})

test("stack direction showcases render only the title above the lanes", () => {
  assert.doesNotMatch(source, /direction\.index/)
  assert.doesNotMatch(source, /direction\.summary/)
})

test("stack direction showcases sit directly on the page background", () => {
  assert.match(source, /function StackDirectionShowcase[\s\S]*?className="px-\[clamp\(4px,0\.7vw,8px\)\] py-\[clamp\(8px,1vw,12px\)\]"/)
  assert.doesNotMatch(source, /function StackDirectionShowcase[\s\S]*?soft-gradient-section mt-6 py-1/)
  assert.doesNotMatch(source, /function TechLane[\s\S]*?soft-gradient-divider relative overflow-hidden/)
})

test("stack ribbons use a gradient border and liquid-glass fill", () => {
  assert.match(source, /rounded-full bg-\[linear-gradient\(135deg,rgba\(74,143,228,0\.34\),rgba\(122,79,216,0\.28\),rgba\(255,255,255,0\.42\)\)\] p-px/)
  assert.match(source, /backdrop-blur-\[16px\]/)
  assert.doesNotMatch(source, /shadow-\[0_14px_30px_rgba\(17,17,17,0\.05\)\]/)
  assert.doesNotMatch(source, /shadow-\[inset_0_1px_0_rgba\(255,255,255,0\.45\),0_10px_22px_rgba\(17,17,17,0\.04\)\]/)
})
