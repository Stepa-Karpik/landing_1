"use client"

import { useRouter } from "next/navigation"

export default function ForbiddenPage() {
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
        <div className="route-ambient left-[8%] top-[8%] h-[clamp(280px,34vw,540px)] w-[clamp(280px,34vw,540px)] bg-[#ffd2a4]/26" />
        <div className="route-ambient right-[3%] bottom-[8%] h-[clamp(300px,36vw,620px)] w-[clamp(300px,36vw,620px)] bg-[#9cdcff]/22" />
      </div>

      <div className="relative z-10 mt-0 grid w-full max-w-[1800px] items-center gap-8 pt-[clamp(4px,3vh,36px)] lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-h-[clamp(260px,60vh,760px)] flex-col justify-end">
          <h1 className="-translate-y-[clamp(90px,14vh,220px)] font-brand text-[clamp(170px,33vw,590px)] leading-[0.7] tracking-[-0.07em] text-[#e2bc8f]">
            403
          </h1>
          <p className="mt-6 max-w-[34ch] font-playfair text-[clamp(22px,3vw,44px)] leading-[1.06] text-black">
            Что же я хочу сказать? Тебе сюда нельзя!
          </p>
        </div>

        <div className="relative mx-auto h-[clamp(300px,72vh,980px)] w-[clamp(300px,72vh,980px)] overflow-visible rounded-full lg:mx-0">
          <video
            className="h-full w-full rounded-full object-cover object-[30%_50%]"
            src="/handlers/403.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <button
            type="button"
            onClick={handleBack}
            className="absolute top-[75%] left-1/2 z-20 -translate-x-1/2 rounded-full border border-black/28 bg-white/66 px-8 py-3 text-sm tracking-[0.2em] text-black/90 uppercase backdrop-blur-md transition-colors hover:bg-white/82"
          >
            Вернуться
          </button>
        </div>
      </div>
    </main>
  )
}
