"use client"

import { ExternalLink, Github } from "lucide-react"
import { projects, type Project } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <SectionReveal delay={index * 0.08}>
      <article className="glass glass-hover group relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-2xl p-6 md:p-7">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/45 to-transparent opacity-70" />

        <h3 className="text-2xl font-semibold tracking-tight text-white">{project.title}</h3>
        <p className="mt-4 flex-1 text-sm leading-relaxed text-white/68 md:text-base">{project.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {project.stack.map((tag) => (
            <span
              key={`${project.id}-${tag}`}
              className="rounded-full border border-white/14 bg-white/[0.05] px-3 py-1 text-[10px] tracking-[0.08em] text-white/72 uppercase"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-7 flex items-center gap-3 opacity-100 transition-all duration-300 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-100/58 bg-white px-4 py-2 text-[10px] font-semibold tracking-[0.12em] text-black uppercase transition-colors duration-300 hover:bg-cyan-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Демо
            </a>
          )}

          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-[10px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-300 hover:border-cyan-100/58 hover:bg-white/[0.15]"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          )}
        </div>
      </article>
    </SectionReveal>
  )
}

export function ProjectsSection() {
  return (
    <section id="projects" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <div className="glass rounded-2xl p-7 max-w-[340px] min-h-[300px]">
            <p className="text-xs tracking-[0.2em] text-cyan-100/72 uppercase">Проекты команды</p>
            <h2 className="mt-4 font-display text-4xl tracking-tight text-white md:text-5xl">Витрина решений</h2>
            <p className="mt-6 text-sm leading-relaxed text-white/68 md:text-base">
              Решения, которые дошли до рабочего состояния в условиях жёстких сроков и реальных требований.
            </p>
          </div>
        </SectionReveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
