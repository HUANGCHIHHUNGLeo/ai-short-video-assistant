"use client"

import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"

interface ReelItem {
  id: string
  type: "p" | "reel"
}

// 在這裡加入你的 Instagram 貼文 / Reels 網址
// type: "p" = 一般貼文, "reel" = Reels 短影片
const REELS: ReelItem[] = [
  { id: "DUM7TcKEdi9", type: "p" },
  { id: "DUA5dcvkXPd", type: "p" },
  { id: "DT-SPnrEZxO", type: "p" },
  { id: "DTp2W-EEUlq", type: "p" },
  { id: "DTj2E06EboD", type: "p" },
]

export default function InstagramReelsCarousel() {
  const [selectedReel, setSelectedReel] = useState<ReelItem | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -220 : 220,
        behavior: "smooth",
      })
    }
  }

  if (REELS.length === 0) return null

  return (
    <div className="mb-2">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Play className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        推薦影片
      </h2>

      <div className="relative group/carousel">
        {/* 左滑按鈕 */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-full shadow-md"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* 可滾動容器 */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {REELS.map((reel) => (
            <div
              key={reel.id}
              className="flex-shrink-0 w-[180px] sm:w-[200px] h-[320px] sm:h-[355px] rounded-xl overflow-hidden cursor-pointer relative group border bg-muted"
              onClick={() => setSelectedReel(reel)}
            >
              <iframe
                src={`https://www.instagram.com/${reel.type}/${reel.id}/embed/`}
                width="100%"
                height="100%"
                className="pointer-events-none border-0"
                loading="lazy"
              />
              {/* 點擊遮罩 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <Play className="h-5 w-5 text-black fill-black ml-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 右滑按鈕 */}
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-full shadow-md"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 點擊彈窗 - 顯示完整 Instagram Embed */}
      <Dialog open={!!selectedReel} onOpenChange={() => setSelectedReel(null)}>
        <DialogContent className="max-w-[540px] p-0 overflow-hidden">
          <DialogTitle className="sr-only">Instagram Reel</DialogTitle>
          {selectedReel && (
            <iframe
              src={`https://www.instagram.com/${selectedReel.type}/${selectedReel.id}/embed/`}
              width="100%"
              height="680"
              className="border-0"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
