import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { RouteAtmosphere, type AtmosphereBlob } from "@/components/route-atmosphere"
import { contactLinks, routeBlocks, routeDetails, teamName } from "@/lib/data"

type Params = Promise<{ slug: string }>

interface RoutePageProps {
  params: Params
}

const STATIC_ROUTE_SLUGS = new Set(["craft"])
const routeAtmosphere: Record<string, AtmosphereBlob[]> = {
  hero: [
    { id: "hero-pink", color: "#c89ad8", size: "clamp(760px,72vw,1180px)", top: "4%", left: "54%", maxShift: 100 },
    { id: "hero-blue", color: "#98b3e4", size: "clamp(600px,56vw,900px)", top: "54%", left: "-10%", opacity: 0.24, maxShift: 92 },
    { id: "hero-violet", color: "#baa9e2", size: "clamp(520px,48vw,780px)", top: "-10%", left: "76%", opacity: 0.2, maxShift: 84 },
  ],
  about: [
    { id: "about-pink", color: "#cfa0dc", size: "clamp(740px,70vw,1140px)", top: "10%", left: "52%", maxShift: 98 },
    { id: "about-blue", color: "#9bb6e4", size: "clamp(580px,54vw,880px)", top: "60%", left: "4%", opacity: 0.22, maxShift: 88 },
    { id: "about-violet", color: "#bbaee3", size: "clamp(520px,48vw,780px)", top: "-12%", left: "74%", opacity: 0.2, maxShift: 82 },
  ],
  services: [
    { id: "services-blue", color: "#93afe3", size: "clamp(760px,72vw,1180px)", top: "12%", left: "44%", maxShift: 100 },
    { id: "services-pink", color: "#cda3dc", size: "clamp(620px,58vw,920px)", top: "-10%", left: "62%", opacity: 0.24, maxShift: 90 },
    { id: "services-lilac", color: "#aea4df", size: "clamp(540px,50vw,820px)", top: "56%", left: "-8%", opacity: 0.2, maxShift: 84 },
  ],
  projects: [
    { id: "projects-violet", color: "#afa1e1", size: "clamp(760px,72vw,1180px)", top: "10%", left: "56%", maxShift: 100 },
    { id: "projects-blue", color: "#97b2e4", size: "clamp(600px,56vw,900px)", top: "-14%", left: "8%", opacity: 0.22, maxShift: 90 },
    { id: "projects-pink", color: "#cba1db", size: "clamp(560px,52vw,840px)", top: "58%", left: "6%", opacity: 0.22, maxShift: 86 },
  ],
  works: [
    { id: "works-blue", color: "#95b0e4", size: "clamp(760px,72vw,1180px)", top: "14%", left: "50%", maxShift: 100 },
    { id: "works-pink", color: "#cea2dc", size: "clamp(620px,58vw,920px)", top: "-10%", left: "66%", opacity: 0.24, maxShift: 92 },
    { id: "works-violet", color: "#b4a8e1", size: "clamp(560px,52vw,840px)", top: "58%", left: "-8%", opacity: 0.2, maxShift: 84 },
  ],
  contacts: [
    { id: "contacts-pink", color: "#c99dd9", size: "clamp(740px,70vw,1140px)", top: "12%", left: "50%", maxShift: 100 },
    { id: "contacts-blue", color: "#99b4e4", size: "clamp(600px,56vw,900px)", top: "56%", left: "2%", opacity: 0.22, maxShift: 90 },
    { id: "contacts-violet", color: "#b7ace2", size: "clamp(540px,50vw,820px)", top: "-12%", left: "74%", opacity: 0.2, maxShift: 84 },
  ],
}

export function generateStaticParams() {
  return routeBlocks.filter((block) => !STATIC_ROUTE_SLUGS.has(block.slug)).map((block) => ({ slug: block.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: RoutePageProps): Promise<Metadata> {
  const { slug } = await params
  const block = routeBlocks.find((item) => item.slug === slug)

  if (!block) {
    return {
      title: "Page not found",
    }
  }

  return {
    title: `${block.title} | ${teamName}`,
    description: block.description,
  }
}

export default async function RoutePage({ params }: RoutePageProps) {
  const { slug } = await params
  const block = routeBlocks.find((item) => item.slug === slug)
  const detail = routeDetails[slug]
  const atmosphere = routeAtmosphere[slug] ?? routeAtmosphere.about

  if (!block || !detail) {
    notFound()
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#f6f4ef] text-[#111111]">
      <RouteAtmosphere blobs={atmosphere} />
      <header className="sticky inset-x-0 top-0 z-20 border-b border-black/10 bg-[#f7f5ef]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] text-[#111]/76 uppercase transition-colors hover:text-[#111]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-[11px] tracking-[0.22em] text-[#111]/72 uppercase">{teamName}</span>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-[clamp(88px,10vh,120px)]">
        <h1 className="mt-3 w-[108%] text-[clamp(44px,9vw,132px)] leading-[0.84] tracking-[-0.05em]">{detail.title}</h1>
        <p className="mt-5 max-w-[72ch] text-[clamp(17px,1.7vw,28px)] leading-[1.2] text-[#111]/82">{detail.subtitle}</p>
        <p className="mt-4 max-w-[76ch] text-base leading-relaxed text-[#111]/72">{detail.description}</p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {detail.highlights.map((item) => (
            <article
              key={item}
              className="rounded-2xl border border-black/12 bg-[#f8f5f0]/78 p-6 text-sm leading-relaxed text-[#111]/82"
            >
              {item}
            </article>
          ))}
        </div>

        {slug === "contacts" && (
          <div className="mt-10 flex flex-wrap gap-3">
            {contactLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                className="rounded-full border border-black/12 bg-white/70 px-4 py-2 text-sm transition-colors hover:border-black/30"
              >
                <span className="text-[#111]/60">{item.label}: </span>
                <span className="font-medium">{item.value}</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
