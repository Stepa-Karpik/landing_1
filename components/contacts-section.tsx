"use client"

import { Github, Mail, Send } from "lucide-react"
import { contactLinks, teamName } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

const iconMap: Record<string, typeof Github> = {
  "GitHub команды": Github,
  Telegram: Send,
  Email: Mail,
}

export function ContactsSection() {
  return (
    <section id="contacts" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <div className="glass mx-auto max-w-4xl rounded-3xl p-8 md:p-12">
            <p className="text-xs tracking-[0.2em] text-cyan-100/72 uppercase">Контакты</p>
            <h2 className="mt-4 font-display text-4xl tracking-tight text-white md:text-6xl">Открыты к хакатонам и коллаборациям</h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
              Если нужна команда, которая быстро проектирует и запускает продукт, напишите нам.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {contactLinks.map((contact) => {
                const Icon = iconMap[contact.label] ?? Send

                return (
                  <a
                    key={contact.label}
                    href={contact.href}
                    target={contact.href.startsWith("http") ? "_blank" : undefined}
                    rel={contact.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="glass-hover rounded-2xl border border-white/14 bg-white/[0.05] p-5 transition-all duration-300"
                  >
                    <Icon className="h-5 w-5 text-cyan-100" strokeWidth={1.7} />
                    <p className="mt-4 text-xs tracking-[0.12em] text-white/55 uppercase">{contact.label}</p>
                    <p className="mt-1 text-sm text-white/82">{contact.value}</p>
                  </a>
                )
              })}
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-7">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <span className="text-xs tracking-[0.12em] text-white/45 uppercase">{teamName}</span>
        <span className="text-xs tracking-[0.12em] text-white/32 uppercase">{new Date().getFullYear()}</span>
      </div>
    </footer>
  )
}
