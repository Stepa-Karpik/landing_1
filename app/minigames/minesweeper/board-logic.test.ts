import test from "node:test"
import assert from "node:assert/strict"

import {
  BOARD_LEVEL_COUNT,
  DRAG_THRESHOLD_PX,
  getBaseCellSize,
  getCellFontSize,
  normalizeUnlockedLevel,
  shouldStartBoardDrag,
  updateUnlockedLevel,
} from "./board-logic"

test("normalizeUnlockedLevel falls back to the first level", () => {
  assert.equal(normalizeUnlockedLevel(undefined), 1)
  assert.equal(normalizeUnlockedLevel(-4), 1)
  assert.equal(normalizeUnlockedLevel("oops"), 1)
})

test("normalizeUnlockedLevel clamps saved progress to available levels", () => {
  assert.equal(normalizeUnlockedLevel(3), 3)
  assert.equal(normalizeUnlockedLevel(BOARD_LEVEL_COUNT + 4), BOARD_LEVEL_COUNT)
})

test("updateUnlockedLevel only moves progress forward", () => {
  assert.equal(updateUnlockedLevel(1, 1), 1)
  assert.equal(updateUnlockedLevel(1, 2), 2)
  assert.equal(updateUnlockedLevel(3, 2), 3)
  assert.equal(updateUnlockedLevel(BOARD_LEVEL_COUNT - 1, BOARD_LEVEL_COUNT + 2), BOARD_LEVEL_COUNT)
})

test("shouldStartBoardDrag only activates after the drag threshold", () => {
  assert.equal(shouldStartBoardDrag(3, 4), false)
  assert.equal(shouldStartBoardDrag(DRAG_THRESHOLD_PX, 0), true)
  assert.equal(shouldStartBoardDrag(0, DRAG_THRESHOLD_PX), true)
})

test("getBaseCellSize keeps large boards readable instead of shrinking to blurry pixels", () => {
  assert.equal(getBaseCellSize(100, 800), 12)
  assert.equal(getBaseCellSize(50, 800), 16)
  assert.equal(getBaseCellSize(8, 800), 72)
})

test("getCellFontSize scales numbers with the actual cell size", () => {
  assert.equal(getCellFontSize(12), 10)
  assert.equal(getCellFontSize(20), 13)
  assert.equal(getCellFontSize(48), 24)
})
