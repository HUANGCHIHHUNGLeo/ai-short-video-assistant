import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  const type = request.nextUrl.searchParams.get("type") || "p"

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const postUrl = `https://www.instagram.com/${type}/${id}/`

  try {
    // Instagram oEmbed API — 公開貼文可直接取得
    const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(postUrl)}`
    const res = await fetch(oembedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "Instagram API 回應失敗" },
        { status: 502 }
      )
    }

    const data = await res.json()

    return NextResponse.json({
      author_name: data.author_name || "",
      title: data.title || "",
      thumbnail_url: data.thumbnail_url || "",
    })
  } catch (error) {
    console.error("Instagram meta fetch error:", error)
    return NextResponse.json(
      { error: "無法取得 Instagram 貼文資訊" },
      { status: 500 }
    )
  }
}
