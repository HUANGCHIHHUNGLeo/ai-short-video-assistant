import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { TooltipProvider } from "@/components/ui/tooltip"

const inter = Inter({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "顏董 AI 短影音助理",
  description: "AI 驅動的短影音創作智能體，幫你打造爆款內容",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.className} antialiased`}>
        <TooltipProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </TooltipProvider>
      </body>
    </html>
  )
}
