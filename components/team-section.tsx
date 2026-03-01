"use client"

import { ExternalLink } from "lucide-react"
import { teamMembers, type TeamMember } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function MemberCard({ member, delay }: { member: TeamMember; delay: number }) {
  return (
    <SectionReveal delay={delay}>
      <article className="glass glass-hover group relative h-full min-h-[390px] overflow-hidden rounded-2xl p-6">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-100/28 bg-cyan-100/12 font-mono text-lg font-medium text-cyan-100">
          {getInitials(member.name)}
        </div>

        <h3 className="text-xl font-semibold tracking-tight text-white">{member.name}</h3>
        <p className="mt-1 text-xs tracking-[0.14em] text-white/56 uppercase">{member.role}</p>

        <p className="mt-4 text-sm leading-relaxed text-white/70">{member.focus}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {member.stack.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/14 bg-white/[0.04] px-3 py-1 text-[10px] tracking-[0.08em] text-white/72 uppercase"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {member.links.map((link) => (
            <a
              key={`${member.id}-${link.label}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/16 bg-white/[0.06] px-3 py-1.5 text-[10px] tracking-[0.08em] text-white/76 uppercase transition-all duration-300 hover:border-cyan-100/48 hover:text-white"
            >
              {link.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-4 bottom-4 translate-y-3 rounded-xl border border-cyan-100/20 bg-cyan-100/10 px-4 py-3 opacity-0 backdrop-blur transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="text-[10px] tracking-[0.1em] text-cyan-100/75 uppercase">Достижение</p>
          <p className="mt-1 text-xs leading-relaxed text-white/82">{member.achievement}</p>
        </div>
      </article>
    </SectionReveal>
  )
}

export function TeamSection() {
  return (
    <section id="team" className="relative py-28 md:py-40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-12">
        <SectionReveal>
          <aside className="glass rounded-2xl p-7 max-w-[340px] min-h-[300px] lg:sticky lg:top-24">
            <p className="text-xs tracking-[0.2em] text-cyan-100/72 uppercase">Ядро команды</p>
            <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight text-white md:text-5xl">Ядро системы</h2>
            <p className="mt-6 text-sm leading-relaxed text-white/68 md:text-base">
              Мультидисциплинарная команда для работы в режиме давления: стратегия, продукт, backend и интерфейс в одном цикле.
            </p>
            <p className="mt-6 text-xs tracking-[0.12em] text-white/46 uppercase">Наведи на карточку, чтобы увидеть достижения</p>
          </aside>
        </SectionReveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teamMembers.map((member, index) => (
            <MemberCard key={member.id} member={member} delay={index * 0.08} />
          ))}
        </div>
      </div>
    </section>
  )
}
