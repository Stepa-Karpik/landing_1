import Link from "next/link"
import type { ReactNode } from "react"

export function MinigameShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#f6f4ef] px-4 pb-10 pt-20 text-[#111111] md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-black/55 uppercase">Мини-игра</p>
            <h1 className="mt-1 text-[clamp(32px,5vw,60px)] leading-[0.9] tracking-[-0.03em]">{title}</h1>
            <p className="mt-2 max-w-[56ch] text-sm text-black/68">{subtitle}</p>
          </div>
          <Link
            href="/"
            className="rounded-md border border-black/20 bg-white/65 px-3 py-1.5 text-xs tracking-[0.12em] uppercase transition-colors hover:bg-white"
          >
            На главную
          </Link>
        </div>
        <div className="rounded-xl border border-black/14 bg-white/45 p-3 shadow-[0_8px_26px_rgba(0,0,0,0.06)] md:p-5">
          {children}
        </div>
      </div>
    </main>
  )
}
