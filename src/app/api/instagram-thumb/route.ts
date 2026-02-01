import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  // 僅允許 Instagram CDN 網域
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith(".cdninstagram.com") && !parsed.hostname.endsWith(".fbcdn.net")) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 })
    }

    const contentType = res.headers.get("content-type") || "image/jpeg"
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    })
  } catch {
    return NextResponse.json({ error: "Proxy error" }, { status: 500 })
  }
}
