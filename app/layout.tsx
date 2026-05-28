import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { cookies } from "next/headers"
import { NextIntlClientProvider } from "next-intl"
import { ThemeProvider } from "@/components/theme-provider"
import { defaultLocale, locales } from "@/i18n/request"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get("locale")?.value
  const locale = locales.includes(localeCookie as (typeof locales)[number])
    ? (localeCookie as (typeof locales)[number])
    : defaultLocale
  const messages = (await import(`../messages/${locale}.json`)).default

  return {
    title: messages.metadata.title,
    description: messages.metadata.description,
    keywords: messages.metadata.keywords,
    authors: [{ name: "EconoLab" }],
    generator: "v0.app",
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1d2e" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get("locale")?.value
  const locale = locales.includes(localeCookie as (typeof locales)[number])
    ? (localeCookie as (typeof locales)[number])
    : defaultLocale
  const messages = (await import(`../messages/${locale}.json`)).default

  return (
    <html lang={locale} suppressHydrationWarning className="bg-background">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider
           locale={locale} messages={messages}
           >
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
