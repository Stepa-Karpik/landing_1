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
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-x-clip gap-6 bg-[#f6f4ef] px-4 pb-8 pt-5 text-[#111111] sm:px-8 sm:pb-12 sm:pt-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="route-ambient left-[8%] top-[8%] h-[clamp(280px,34vw,540px)] w-[clamp(280px,34vw,540px)] bg-[#ffd2a4]/26" />
        <div className="route-ambient right-[3%] bottom-[8%] h-[clamp(300px,36vw,620px)] w-[clamp(300px,36vw,620px)] bg-[#9cdcff]/22" />
      </div>

      <div className="relative z-10 grid w-full max-w-[1800px] items-center justify-items-center gap-5 lg:gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:justify-items-stretch">
        <div className="flex min-h-0 flex-col justify-center text-center xl:text-left">
          <h1 className="font-brand text-[clamp(140px,30vw,590px)] leading-[0.7] tracking-[-0.07em] text-[#e2bc8f] xl:-translate-y-[clamp(90px,14vh,220px)]">
            403
          </h1>
          <p className="mx-auto mt-4 max-w-[26ch] font-playfair text-[clamp(22px,3vw,44px)] leading-[1.06] text-black xl:mx-0 xl:mt-6 xl:max-w-[34ch]">
            Что же я хочу сказать? Тебе сюда нельзя!
          </p>
        </div>

        <div className="relative mx-auto h-[clamp(220px,44vh,980px)] w-[min(90vw,clamp(250px,60vh,980px))] overflow-visible rounded-full sm:h-[clamp(250px,48vh,980px)] sm:w-[min(88vw,clamp(280px,66vh,980px))] xl:mx-0 xl:h-[clamp(280px,62vh,980px)] xl:w-[clamp(300px,72vh,980px)]">
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
            className="absolute left-1/2 top-[78%] z-20 -translate-x-1/2 rounded-full border border-black/28 bg-white/66 px-8 py-3 text-sm tracking-[0.2em] text-black/90 uppercase backdrop-blur-md transition-colors hover:bg-white/82"
          >
            Вернуться
          </button>
        </div>
      </div>
    </main>
  )
}
