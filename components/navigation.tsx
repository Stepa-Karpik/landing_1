"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { navItems } from "@/lib/data"

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleNav = (href: string) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        <button
          onClick={() => handleNav("#hero")}
          className="text-foreground font-semibold text-lg tracking-tight cursor-pointer"
        >
          Изи бриджи
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm tracking-wide cursor-pointer"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => handleNav("#contacts")}
            className="relative px-5 py-2 text-sm font-medium rounded-full border border-white/10 text-foreground bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 cursor-pointer"
          >
            <span className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: "0 0 20px rgba(160,230,200,0.15)" }} />
            Связаться
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
          aria-label="Меню навигации"
        >
          <span className={`block w-5 h-px bg-foreground transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[3.5px]" : ""}`} />
          <span className={`block w-5 h-px bg-foreground transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-px bg-foreground transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[3.5px]" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden glass overflow-hidden border-t border-white/[0.06]"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNav(item.href)}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm py-2 text-left cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => handleNav("#contacts")}
                className="mt-2 px-5 py-2.5 text-sm font-medium rounded-full border border-white/10 text-foreground bg-white/[0.04] text-center cursor-pointer"
              >
                Связаться
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
