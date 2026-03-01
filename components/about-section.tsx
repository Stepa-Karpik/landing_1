"use client"

import { SectionReveal } from "./section-reveal"
import { Zap, Wrench, Lightbulb, Shield, Briefcase } from "lucide-react"

const accents = [
  { icon: Zap, text: "Скорость: MVP за считанные дни" },
  { icon: Wrench, text: "Инженерный подход" },
  { icon: Lightbulb, text: "Продуктовое мышление" },
  { icon: Shield, text: "Безопасность и стабильность" },
  { icon: Briefcase, text: "Предприниматель в команде" },
]

export function AboutSection() {
  return (
    <section id="about" className="relative py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance">
            Мы строим мост между идеей и продуктом.
          </h2>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Мультидисциплинарная команда из 6 человек. Закрываем полный цикл: аналитика, дизайн, разработка, деплой, презентация. Каждый участник усиливает общий результат.
          </p>
        </SectionReveal>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {accents.map((item, i) => (
            <SectionReveal key={item.text} delay={0.1 + i * 0.08}>
              <div className="glass glass-hover rounded-xl p-5 flex items-start gap-3 transition-all duration-500 h-full">
                <item.icon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="text-sm text-foreground/80 leading-snug">{item.text}</span>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
