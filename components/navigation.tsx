"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { navItems, teamName } from "@/lib/data"

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleNav = (href: string) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b border-white/10 bg-black/55 backdrop-blur-2xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-6">
        <button
          onClick={() => handleNav("#hero")}
          className="font-display text-sm font-semibold tracking-[0.25em] text-white/95 uppercase cursor-pointer"
        >
          {teamName}
        </button>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className="text-[11px] tracking-[0.18em] text-white/62 uppercase transition-colors duration-300 hover:text-white"
            >
              {item.label}
            </button>
          ))}
          <a
            href="https://nerior.ru"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-2 text-[11px] tracking-[0.12em] text-white transition-all duration-300 hover:border-cyan-200/60 hover:bg-white/[0.12]"
          >
            Сайта
          </a>
        </nav>

        <button
          aria-label="Открыть навигацию"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] md:hidden"
        >
          <div className="relative h-3.5 w-4.5">
            <span
              className={`absolute left-0 top-0 block h-px w-full bg-white transition-all duration-300 ${
                mobileOpen ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[6px] block h-px w-full bg-white transition-all duration-300 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-3 block h-px w-full bg-white transition-all duration-300 ${
                mobileOpen ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-white/10 bg-black/78 px-6 pb-6 pt-4 backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNav(item.href)}
                  className="rounded-lg px-3 py-2 text-left text-sm tracking-wide text-white/72 transition-colors duration-300 hover:text-white"
                >
                  {item.label}
                </button>
              ))}
              <a
                href="https://nerior.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 rounded-full border border-white/20 bg-white/[0.08] px-5 py-2.5 text-xs font-medium tracking-[0.12em] text-white"
              >
                Сайта
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
