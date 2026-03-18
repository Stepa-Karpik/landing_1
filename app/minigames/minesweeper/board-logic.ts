export const BOARD_LEVEL_COUNT = 5
export const MIN_CELL_SIZE_PX = 12
export const MAX_CELL_SIZE_PX = 72
export const MIN_CELL_FONT_PX = 10
export const MAX_CELL_FONT_PX = 24
export const DRAG_THRESHOLD_PX = 6

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function normalizeUnlockedLevel(value: unknown, levelCount = BOARD_LEVEL_COUNT) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 1
  }

  return clamp(Math.round(numericValue), 1, levelCount)
}

export function updateUnlockedLevel(currentUnlockedLevel: unknown, reachedLevel: unknown, levelCount = BOARD_LEVEL_COUNT) {
  return Math.max(normalizeUnlockedLevel(currentUnlockedLevel, levelCount), normalizeUnlockedLevel(reachedLevel, levelCount))
}

export function shouldStartBoardDrag(deltaX: number, deltaY: number, threshold = DRAG_THRESHOLD_PX) {
  return Math.hypot(deltaX, deltaY) >= threshold
}

export function getBaseCellSize(boardSize: number, shortestViewportPx: number) {
  if (boardSize <= 0) {
    return MIN_CELL_SIZE_PX
  }

  return clamp(Math.floor(shortestViewportPx / boardSize), MIN_CELL_SIZE_PX, MAX_CELL_SIZE_PX)
}

export function getScaledCellSize(boardSize: number, shortestViewportPx: number, zoom: number) {
  const baseSize = getBaseCellSize(boardSize, shortestViewportPx)
  return Math.max(MIN_CELL_SIZE_PX, Math.round(baseSize * zoom))
}

export function getCellFontSize(cellSize: number) {
  return clamp(Math.round(cellSize * 0.65), MIN_CELL_FONT_PX, MAX_CELL_FONT_PX)
}

export function getCellIconSize(cellSize: number) {
  return clamp(Math.round(cellSize * 0.72), 10, 40)
}

export function clampBoardPanToViewport(
  nextX: number,
  nextY: number,
  boardWidth: number,
  boardHeight: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const overflowX = Math.max((boardWidth - viewportWidth) / 2, 0)
  const overflowY = Math.max((boardHeight - viewportHeight) / 2, 0)

  return {
    x: clamp(nextX, -overflowX, overflowX),
    y: clamp(nextY, -overflowY, overflowY),
  }
}

export function getVisibleCellBounds(
  boardSize: number,
  cellSize: number,
  viewportWidth: number,
  viewportHeight: number,
  panX: number,
  panY: number,
  overscan = 2,
) {
  const boardWidth = boardSize * cellSize
  const boardHeight = boardSize * cellSize
  const boardLeft = viewportWidth / 2 - boardWidth / 2 + panX
  const boardTop = viewportHeight / 2 - boardHeight / 2 + panY

  const startCol = clamp(Math.floor((0 - boardLeft) / cellSize) - overscan, 0, boardSize - 1)
  const endCol = clamp(Math.ceil((viewportWidth - boardLeft) / cellSize) + overscan, 0, boardSize - 1)
  const startRow = clamp(Math.floor((0 - boardTop) / cellSize) - overscan, 0, boardSize - 1)
  const endRow = clamp(Math.ceil((viewportHeight - boardTop) / cellSize) + overscan, 0, boardSize - 1)

  return {
    startRow,
    endRow,
    startCol,
    endCol,
  }
}
