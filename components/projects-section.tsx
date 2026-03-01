"use client"

import { ExternalLink, Github } from "lucide-react"
import { projects } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

function ProjectCard({ project, index }: { project: typeof projects[0]; index: number }) {
  return (
    <SectionReveal delay={0.08 * index}>
      <div
        className="glass glass-hover rounded-2xl p-6 md:p-8 transition-all duration-500 h-full flex flex-col relative overflow-hidden group hover:-translate-y-1"
      >
        <h3 className="text-xl font-semibold text-foreground tracking-tight">{project.title}</h3>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{project.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {project.stack.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-xs text-muted-foreground border border-white/[0.06] bg-white/[0.02]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Buttons: always visible on mobile, hover-triggered on desktop */}
        <div className="mt-6 flex gap-3 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:transition-all md:duration-300">
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors duration-300"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Демо
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border border-white/10 text-foreground bg-white/[0.04] hover:bg-white/[0.08] transition-colors duration-300"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          )}
        </div>
      </div>
    </SectionReveal>
  )
}

export function ProjectsSection() {
  return (
    <section id="projects" className="relative py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Проекты
          </h2>
        </SectionReveal>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
