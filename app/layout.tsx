import type { Metadata, Viewport } from "next"
import { Exo_2, JetBrains_Mono, Manrope, Montserrat, Playfair_Display, Playfair_Display_SC } from "next/font/google"
import { CustomCursor } from "@/components/custom-cursor"
import { EdgeMenuReturn } from "@/components/edge-menu-return"
import { ProfileProvider } from "@/components/profile-provider"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
})

const exo2 = Exo_2({
  subsets: ["latin", "cyrillic"],
  variable: "--font-syne",
  weight: ["500", "600", "700", "800"],
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
})

const playfairDisplaySc = Playfair_Display_SC({
  subsets: ["latin"],
  variable: "--font-playfair-sc",
  weight: ["400", "700", "900"],
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
})

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "TEAM NERIOR - Инженерия идей в реальность",
  description:
    "Хакатон-ориентированная продуктовая команда: AI, backend-архитектура, дизайн-системы и быстрый запуск MVP.",
  icons: {
    icon: [
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${exo2.variable} ${jetBrainsMono.variable} ${playfairDisplaySc.variable} ${playfairDisplay.variable} ${montserrat.variable}`}
    >
      <body className="font-sans antialiased">
        <CustomCursor />
        <ProfileProvider>
          <EdgeMenuReturn />
          {children}
        </ProfileProvider>
      </body>
    </html>
  )
}
