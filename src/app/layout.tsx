import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { TooltipProvider } from "@/components/ui/tooltip"
import PWARegister from "@/components/PWARegister"

const inter = Inter({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "短影音助理",
  description: "短影音創作智能體，幫你打造爆款內容",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "短影音助理",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.className} antialiased`}>
        <PWARegister />
        <TooltipProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </TooltipProvider>
      </body>
    </html>
  )
}
