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

      <div className="relative z-10 mt-0 flex w-full max-w-[1800px] items-start justify-center gap-[clamp(4px,1vw,20px)] pt-[clamp(4px,3vh,36px)]">
        <span className="font-brand text-[clamp(140px,28vw,480px)] leading-[0.72] tracking-[-0.07em] text-[#e2bc8f]">
          4
        </span>

        <div className="relative h-[clamp(300px,72vh,980px)] w-[clamp(300px,72vh,980px)] overflow-hidden rounded-full">
          <video
            className="h-full w-full object-cover"
            src="/handlers/403.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        </div>

        <span className="font-brand text-[clamp(140px,28vw,480px)] leading-[0.72] tracking-[-0.07em] text-[#e2bc8f]">
          3
        </span>
      </div>

      <p className="relative z-10 mt-6 mr-auto max-w-[34ch] font-playfair text-[clamp(22px,3vw,44px)] leading-[1.06] text-black">
        Что же я хочу сказать? Тебе сюда нельзя!
      </p>

      <button
        type="button"
        onClick={handleBack}
        className="liquid-button relative z-10 mt-8 rounded-full px-8 py-3 text-sm tracking-[0.2em] text-white/90 uppercase"
      >
        Вернуться
      </button>
    </main>
  )
}
