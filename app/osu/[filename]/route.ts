import { promises as fs } from "node:fs"
import path from "node:path"

export const runtime = "nodejs"

const ROOT_OSU_DIR = path.join(process.cwd(), "osu")

const ALLOWED_FILES = new Set(
  [1, 2, 3].flatMap((index) => [
    `osu${index}_music.mp3`,
    `osu_photo${index}.jpg`,
    `osu_photo${index}.jpeg`,
    `osu_photo${index}.png`,
    `osu_video${index}.mp4`,
  ]),
)

const MIME_BY_EXT: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
}

function getMimeType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase()
  return MIME_BY_EXT[ext] ?? "application/octet-stream"
}

function getInvalidResponse() {
  return new Response("Not found", { status: 404 })
}

async function getFileMeta(fileName: string) {
  if (!ALLOWED_FILES.has(fileName)) return null
  const absolutePath = path.join(ROOT_OSU_DIR, fileName)
  const normalized = path.normalize(absolutePath)
  if (!normalized.startsWith(path.normalize(ROOT_OSU_DIR + path.sep))) return null

  try {
    const stat = await fs.stat(normalized)
    if (!stat.isFile()) return null
    return { absolutePath: normalized, stat }
  } catch {
    return null
  }
}

async function readParams(context: { params: { filename: string } | Promise<{ filename: string }> }) {
  const params = await Promise.resolve(context.params)
  return params
}

export async function HEAD(_: Request, context: { params: { filename: string } | Promise<{ filename: string }> }) {
  const { filename } = await readParams(context)
  const meta = await getFileMeta(filename)
  if (!meta) return getInvalidResponse()

  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": getMimeType(filename),
      "Content-Length": String(meta.stat.size),
      "Cache-Control": "public, max-age=60",
    },
  })
}

export async function GET(_: Request, context: { params: { filename: string } | Promise<{ filename: string }> }) {
  const { filename } = await readParams(context)
  const meta = await getFileMeta(filename)
  if (!meta) return getInvalidResponse()

  const fileBuffer = await fs.readFile(meta.absolutePath)
  return new Response(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": getMimeType(filename),
      "Content-Length": String(meta.stat.size),
      "Cache-Control": "public, max-age=60",
    },
  })
}
