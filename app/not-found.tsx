"use client"

import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push("/")
  }

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-between overflow-hidden bg-[#f6f4ef] px-4 pb-12 pt-8 text-[#111111] sm:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="route-ambient left-[8%] top-[12%] h-[clamp(320px,38vw,620px)] w-[clamp(320px,38vw,620px)] bg-[#9bdcff]/24" />
        <div className="route-ambient right-[6%] bottom-[8%] h-[clamp(320px,40vw,660px)] w-[clamp(320px,40vw,660px)] bg-[#ffd7ad]/28" />
      </div>

      <div className="relative z-10 mt-0 flex w-full max-w-[1800px] items-start justify-center pt-[clamp(4px,3vh,36px)]">
        <div className="relative h-[clamp(300px,72vh,980px)] w-[clamp(300px,72vh,980px)] overflow-visible rounded-full">
          <video
            className="h-full w-full object-cover"
            src="/handlers/404.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <span className="pointer-events-none absolute top-1/2 left-0 z-20 -translate-x-[34%] -translate-y-1/2 font-brand text-[clamp(150px,30vw,520px)] leading-[0.72] tracking-[-0.07em] text-[#e2bc8f]">
            4
          </span>
          <span className="pointer-events-none absolute top-1/2 right-0 z-20 translate-x-[34%] -translate-y-1/2 font-brand text-[clamp(150px,30vw,520px)] leading-[0.72] tracking-[-0.07em] text-[#e2bc8f]">
            4
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleBack}
        className="relative z-10 mt-8 rounded-full border border-black/28 bg-white/66 px-8 py-3 text-sm tracking-[0.2em] text-black/90 uppercase backdrop-blur-md transition-colors hover:bg-white/82"
      >
        Вернуться
      </button>
    </main>
  )
}
