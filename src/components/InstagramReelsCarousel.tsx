"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play, Loader2 } from "lucide-react"

interface ReelItem {
  id: string
  type: "p" | "reel"
  username: string
}

interface PostMeta {
  author_name: string
  title: string
  thumbnail_url: string
}

// 在這裡加入你的 Instagram 貼文 / Reels 網址
// type: "p" = 一般貼文, "reel" = Reels 短影片
// username: Instagram 帳號名稱（不含 @）
const REELS: ReelItem[] = [
  { id: "DUM7TcKEdi9", type: "p", username: "kai_chi77" },
  { id: "DUA5dcvkXPd", type: "p", username: "kai_chi77" },
  { id: "DT-SPnrEZxO", type: "p", username: "kai_chi77" },
  { id: "DTp2W-EEUlq", type: "p", username: "kai_chi77" },
  { id: "DTj2E06EboD", type: "p", username: "kai_chi77" },
  { id: "DTU43BSCXCw", type: "p", username: "kai_chi77" },
  { id: "DTaIQpsk88v", type: "p", username: "kai_chi77" },
  { id: "DTK79yok13-", type: "p", username: "kai_chi77" },
  { id: "DTM3jowCUph", type: "p", username: "kai_chi77" },
  { id: "DTdKK3dAURf", type: "p", username: "kai_chi77" },
]

// Instagram SVG icon path
const IG_ICON_PATH =
  "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"

export default function InstagramReelsCarousel() {
  const [selectedReel, setSelectedReel] = useState<ReelItem | null>(null)
  const [postMeta, setPostMeta] = useState<PostMeta | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const metaCache = useRef<Record<string, PostMeta>>({})

  // 拖曳滑動狀態（用 ref 避免不必要的 re-render）
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragScrollLeft = useRef(0)
  const hasDragged = useRef(false)

  // 選取貼文時抓取內文
  useEffect(() => {
    if (!selectedReel) {
      setPostMeta(null)
      return
    }

    const cached = metaCache.current[selectedReel.id]
    if (cached) {
      setPostMeta(cached)
      return
    }

    setMetaLoading(true)
    setPostMeta(null)

    fetch(`/api/instagram-meta?id=${selectedReel.id}&type=${selectedReel.type}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          metaCache.current[selectedReel.id] = data
          setPostMeta(data)
        }
      })
      .catch(() => {})
      .finally(() => setMetaLoading(false))
  }, [selectedReel])

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -220 : 220,
      behavior: "smooth",
    })
  }

  // 滑鼠拖曳：按住左右移動橫幅
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    hasDragged.current = false
    dragStartX.current = e.pageX
    dragScrollLeft.current = scrollRef.current?.scrollLeft ?? 0
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    e.preventDefault()
    const dx = e.pageX - dragStartX.current
    if (Math.abs(dx) > 5) hasDragged.current = true
    if (scrollRef.current) scrollRef.current.scrollLeft = dragScrollLeft.current - dx
  }, [])

  const onMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const onCardClick = useCallback((reel: ReelItem) => {
    if (!hasDragged.current) setSelectedReel(reel)
  }, [])

  if (REELS.length === 0) return null

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="mb-2 overflow-hidden">
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

          {/* 可滾動容器（支援拖曳滑動） */}
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 select-none cursor-grab active:cursor-grabbing hide-scrollbar"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {REELS.map((reel) => (
              <div
                key={reel.id}
                className="flex-shrink-0 w-[140px] sm:w-[200px] h-[250px] sm:h-[355px] rounded-xl overflow-hidden cursor-pointer relative group border bg-black"
                onClick={() => onCardClick(reel)}
              >
                {/* 只顯示影片封面（裁掉 IG 嵌入的頭尾 UI） */}
                <iframe
                  src={`https://www.instagram.com/${reel.type}/${reel.id}/embed/`}
                  width="326"
                  height="580"
                  className="pointer-events-none border-0 absolute left-1/2 -translate-x-1/2"
                  style={{ top: -56 }}
                  loading="lazy"
                  allow="encrypted-media"
                  draggable={false}
                />

                {/* Hover 霧面遮罩 + IG 帳號 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 group-hover:backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center flex-col gap-2 pointer-events-none">
                  <svg
                    className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d={IG_ICON_PATH} />
                  </svg>
                  <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">
                    @{reel.username}
                  </span>
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

        {/* 彈窗 - 手機：上影片下內文 / 桌機：左影片右內文 */}
        <Dialog open={!!selectedReel} onOpenChange={() => setSelectedReel(null)}>
          <DialogContent className="max-w-[950px] max-h-[90vh] md:max-h-[85vh] p-0 overflow-hidden">
            <DialogTitle className="sr-only">Instagram Post</DialogTitle>
            {selectedReel && (
              <div className="flex flex-col md:flex-row h-[85vh] md:h-[80vh]">
                {/* 影片嵌入：手機上方 / 桌機左側 */}
                <div className="h-[40vh] md:h-auto md:flex-1 bg-black min-w-0 shrink-0">
                  <iframe
                    src={`https://www.instagram.com/${selectedReel.type}/${selectedReel.id}/embed/`}
                    width="100%"
                    height="100%"
                    className="border-0"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  />
                </div>

                {/* 內文面板：手機下方 / 桌機右側 */}
                <div className="flex-1 md:flex-none md:w-95 md:border-l overflow-hidden bg-white flex flex-col">
                  {/* 帳號 header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
                    <svg
                      className="w-5 h-5 text-pink-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d={IG_ICON_PATH} />
                    </svg>
                    <a
                      href={`https://www.instagram.com/${selectedReel.username}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sm text-gray-900 hover:underline"
                    >
                      @{selectedReel.username}
                    </a>
                  </div>

                  {/* 內文區域 */}
                  <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4">
                    {metaLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : postMeta?.title ? (
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                        {postMeta.title}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-8">
                        無法載入貼文內文
                      </p>
                    )}
                  </div>

                  {/* 底部連結 */}
                  <div className="px-4 py-3 border-t text-center shrink-0">
                    <a
                      href={`https://www.instagram.com/${selectedReel.type}/${selectedReel.id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                    >
                      到 Instagram 查看完整貼文 →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
