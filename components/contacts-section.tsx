"use client"

import { Github, Send, Mail } from "lucide-react"
import { SectionReveal } from "./section-reveal"

const contacts = [
  { label: "GitHub", icon: Github, url: "#", placeholder: true },
  { label: "Telegram", icon: Send, url: "#", placeholder: true },
  { label: "Email", icon: Mail, url: "mailto:team@example.com", placeholder: true },
]

export function ContactsSection() {
  return (
    <section id="contacts" className="relative py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-16">
            Связаться
          </h2>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <div className="glass rounded-2xl p-8 md:p-12 max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-4">
              {contacts.map((contact) => (
                <a
                  key={contact.label}
                  href={contact.url}
                  target={contact.label !== "Email" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300 flex-1"
                >
                  <contact.icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-sm text-foreground/80">{contact.label}</span>
                </a>
              ))}
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="py-8 border-t border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
        <span className="text-xs text-muted-foreground/40">
          {'Изи бриджи \u00B7 nerior.store'}
        </span>
        <span className="text-xs text-muted-foreground/30">
          {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  )
}
