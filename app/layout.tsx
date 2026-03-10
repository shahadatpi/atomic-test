import type { Metadata } from "next"
import { Roboto, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import React from "react"

import AuthProvider from "@/components/AuthProvider"
import "./globals.css"
import "./animations.css"

/* ── Fonts ──────────────────────────────────────────────────────────────── */
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

/* ── Metadata ───────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "AtomicTest — Master Maths & Physics",
  description:
    "500+ MCQ problems with LaTeX rendering, instant explanations, and AI-powered progress tracking for university entrance exams.",
  keywords: ["MCQ", "physics", "mathematics", "exam preparation", "BUET", "DU", "CUET"],
}

/* ── Root layout ────────────────────────────────────────────────────────── */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* KaTeX styles loaded from CDN — keeps fonts co-located with the CSS */}
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
            integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
            crossOrigin="anonymous"
          />
        </head>
        <body className={`${roboto.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </AuthProvider>
  )
}
