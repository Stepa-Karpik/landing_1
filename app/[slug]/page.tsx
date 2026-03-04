import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { contactLinks, routeBlocks, routeDetails, teamName } from "@/lib/data"

type Params = Promise<{ slug: string }>

interface RoutePageProps {
  params: Params
}

const STATIC_ROUTE_SLUGS = new Set(["craft"])

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

  if (!block || !detail) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#111111]">
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

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <p className="text-[11px] tracking-[0.24em] text-[#111]/52 uppercase">{block.label}</p>
        <h1 className="mt-3 w-[108%] text-[clamp(44px,9vw,132px)] leading-[0.84] tracking-[-0.05em]">{detail.title}</h1>
        <p className="mt-5 max-w-[72ch] text-[clamp(17px,1.7vw,28px)] leading-[1.2] text-[#111]/82">{detail.subtitle}</p>
        <p className="mt-4 max-w-[76ch] text-base leading-relaxed text-[#111]/72">{detail.description}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {detail.highlights.map((item) => (
            <article
              key={item}
              className="rounded-2xl border border-black/10 bg-white/56 p-5 text-sm leading-relaxed text-[#111]/82"
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
