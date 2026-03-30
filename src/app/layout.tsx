import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlazeCrawl — The Web Scraping API That Doesn't Rip You Off",
  description:
    "Turn any website into LLM-ready data. Pay only for what you use. Credits never expire. Zero data retention. Open source with full feature parity. The Firecrawl alternative that actually respects developers.",
  keywords: [
    "web scraping api",
    "firecrawl alternative",
    "web crawler",
    "llm data extraction",
    "website to markdown",
    "ai web scraping",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
