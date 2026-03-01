"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import { X, Github, Send, Palette, Globe, Mail, User } from "lucide-react"
import { teamMembers, type TeamMember } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

const linkIcons: Record<string, typeof Github> = {
  github: Github,
  telegram: Send,
  figma: Palette,
  portfolio: Globe,
  email: Mail,
}

function MemberAvatar({ member, isActive, onClick, onHover, onLeave }: {
  member: TeamMember
  isActive: boolean
  onClick: () => void
  onHover: () => void
  onLeave: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-500 cursor-pointer border ${
        isActive
          ? "border-white/20 shadow-[0_0_30px_rgba(160,230,200,0.08)]"
          : "border-white/[0.06] hover:border-white/15"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="absolute inset-0 bg-white/[0.03] flex items-center justify-center">
        <User className="w-7 h-7 text-muted-foreground/50" strokeWidth={1} />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={member.photo}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none"
        }}
      />
      {isActive && (
        <motion.div
          layoutId="avatar-ring"
          className="absolute inset-0 rounded-2xl border border-white/20"
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  )
}

function MemberProfile({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const hasRealLinks = member.links.some((l) => l.url && l.url !== "https://github.com/" && l.url !== "https://t.me/")
  const qrGridCols = member.links.length <= 1 ? "grid-cols-1" :
    member.links.length === 2 ? "grid-cols-2" :
    member.links.length === 3 ? "grid-cols-2 lg:grid-cols-3" :
    "grid-cols-2"

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, filter: "blur(12px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -20, filter: "blur(12px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors duration-300 cursor-pointer z-10"
        aria-label="Закрыть профиль"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Photo area */}
        <div className="flex-shrink-0 w-full lg:w-48">
          <div className="w-full aspect-[3/4] lg:aspect-[3/4] rounded-xl overflow-hidden bg-white/[0.02] flex items-center justify-center relative">
            <User className="w-16 h-16 text-muted-foreground/30" strokeWidth={1} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={member.photo}
              alt={member.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none"
              }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{member.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground font-medium">{member.role}</p>

          {member.achievement && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-foreground/70">
              {member.achievement}
            </div>
          )}

          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{member.description}</p>

          {/* Stack tags */}
          <div className="mt-5 flex flex-wrap gap-2">
            {member.stack.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs text-muted-foreground border border-white/[0.06] bg-white/[0.02]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* QR codes or link buttons */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          {hasRealLinks ? (
            <div className={`grid ${qrGridCols} gap-4`}>
              {member.links.map((link) => {
                const Icon = linkIcons[link.icon] || Globe
                return (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                  >
                    <div className="bg-white rounded-lg p-2">
                      <QRCodeSVG value={link.url} size={80} level="M" bgColor="#ffffff" fgColor="#000000" />
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className="w-3.5 h-3.5" />
                      {link.label}
                    </span>
                  </a>
                )
              })}
            </div>
          ) : (
            <div className={`grid ${qrGridCols} gap-3`}>
              {member.links.map((link) => {
                const Icon = linkIcons[link.icon] || Globe
                return (
                  <div
                    key={link.label}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                  >
                    <div className="w-20 h-20 rounded-lg bg-white/[0.04] border border-dashed border-white/[0.08] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                    <span className="text-xs text-muted-foreground/50">{link.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* Mobile profile (full screen overlay) */
function MobileProfile({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const hasRealLinks = member.links.some((l) => l.url && l.url !== "https://github.com/" && l.url !== "https://t.me/")

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass w-full max-h-[90vh] overflow-y-auto rounded-t-3xl p-6 pb-10 border-t border-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center cursor-pointer"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Photo */}
        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/[0.02] relative mb-6">
          <User className="absolute inset-0 m-auto w-16 h-16 text-muted-foreground/30" strokeWidth={1} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={member.photo}
            alt={member.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none"
            }}
          />
        </div>

        <h3 className="text-2xl font-bold text-foreground">{member.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground font-medium">{member.role}</p>

        {member.achievement && (
          <div className="mt-3 inline-flex px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-foreground/70">
            {member.achievement}
          </div>
        )}

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{member.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {member.stack.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full text-xs text-muted-foreground border border-white/[0.06] bg-white/[0.02]">
              {tag}
            </span>
          ))}
        </div>

        {/* QR/links */}
        <div className="mt-6">
          {hasRealLinks ? (
            <div className="grid grid-cols-2 gap-4">
              {member.links.map((link) => {
                const Icon = linkIcons[link.icon] || Globe
                return (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                  >
                    <div className="bg-white rounded-lg p-2">
                      <QRCodeSVG value={link.url} size={72} level="M" bgColor="#ffffff" fgColor="#000000" />
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className="w-3.5 h-3.5" />
                      {link.label}
                    </span>
                  </a>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {member.links.map((link) => {
                const Icon = linkIcons[link.icon] || Globe
                return (
                  <div key={link.label} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="w-16 h-16 rounded-lg bg-white/[0.04] border border-dashed border-white/[0.08] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                    <span className="text-xs text-muted-foreground/50">{link.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function TeamSection() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinnedId(null)
        setActiveId(null)
      }
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [])

  const displayId = pinnedId || activeId
  const displayMember = teamMembers.find((m) => m.id === displayId) || null

  const handleClick = useCallback((id: string) => {
    if (isMobile) {
      setPinnedId(id)
    } else {
      setPinnedId((prev) => (prev === id ? null : id))
    }
  }, [isMobile])

  const handleHover = useCallback((id: string) => {
    if (!isMobile && !pinnedId) setActiveId(id)
  }, [isMobile, pinnedId])

  const handleLeave = useCallback(() => {
    if (!isMobile && !pinnedId) setActiveId(null)
  }, [isMobile, pinnedId])

  const handleClose = useCallback(() => {
    setPinnedId(null)
    setActiveId(null)
  }, [])

  return (
    <section id="team" className="relative py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-16">
            Участники
          </h2>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Left: avatar column */}
            <div className="flex md:flex-col gap-3 md:gap-4 flex-wrap md:flex-nowrap">
              {teamMembers.map((member) => (
                <MemberAvatar
                  key={member.id}
                  member={member}
                  isActive={displayId === member.id}
                  onClick={() => handleClick(member.id)}
                  onHover={() => handleHover(member.id)}
                  onLeave={handleLeave}
                />
              ))}
            </div>

            {/* Right: profile expansion (desktop) */}
            <div className="hidden md:block flex-1 min-h-[400px] relative">
              <AnimatePresence mode="wait">
                {displayMember ? (
                  <MemberProfile
                    key={displayMember.id}
                    member={displayMember}
                    onClose={handleClose}
                  />
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass rounded-2xl h-full flex items-center justify-center"
                  >
                    <p className="text-muted-foreground/30 text-sm">
                      {/* No instructional text per requirements */}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Vignette when pinned */}
              <AnimatePresence>
                {pinnedId && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -inset-6 rounded-3xl pointer-events-none"
                    style={{
                      background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)",
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </SectionReveal>
      </div>

      {/* Mobile profile overlay */}
      <AnimatePresence>
        {isMobile && pinnedId && displayMember && (
          <MobileProfile member={displayMember} onClose={handleClose} />
        )}
      </AnimatePresence>
    </section>
  )
}
