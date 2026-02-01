import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { checkApiAuth, authError } from "@/lib/auth/api-guard"

const SHOOTING_TYPE_NAMES: Record<string, string> = {
  talking_head: "口播型",
  behind_camera: "藏鏡人（一人掌鏡提問，一人出鏡回答）",
  voiceover: "純配音",
  acting: "演戲/情境劇",
  vlog: "Vlog",
  tutorial: "教學示範",
  interview: "訪談對談",
  storytime: "說故事",
}

export async function POST(request: NextRequest) {
  try {
    // 認證檢查（不扣額度，只驗證身份）
    const authResult = await checkApiAuth(request, 'script')
    if (!authResult.allowed) {
      return authError(authResult)
    }

    const { creatorBackground, videoSettings } = await request.json()

    if (!videoSettings?.topic) {
      return NextResponse.json({ error: "缺少影片主題" }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const shootingTypeName = SHOOTING_TYPE_NAMES[videoSettings.shootingType] || "口播型"

    const prompt = `你是短影音腳本顧問。用戶要製作一支短影音，以下是他的基本資訊：

## 創作者資訊
- 領域：${creatorBackground?.niche || "未填"}
- 目標觀眾：${creatorBackground?.targetAudience || "未填"}
- 觀眾痛點：${creatorBackground?.audiencePainPoints || "未填"}
- 個人經歷：${creatorBackground?.expertise || "未填"}

## 影片設定
- 主題：${videoSettings.topic}
- 拍攝方式：${shootingTypeName}
- 影片長度：${videoSettings.duration || 45} 秒
- 影片目標：${videoSettings.goal || "未選"}
- 影片氛圍：${videoSettings.emotionalTone || "未選"}
${videoSettings.valuePoints ? `- 想傳達的價值：${videoSettings.valuePoints}` : ''}
${videoSettings.storyToShare ? `- 想分享的故事：${videoSettings.storyToShare}` : ''}
${videoSettings.keyTakeaway ? `- 觀眾該學到：${videoSettings.keyTakeaway}` : ''}

## 你的任務
1. 先用 2-3 句話做一個「微分析」，告訴用戶你理解他要做什麼，以及你覺得這支影片的關鍵是什麼
2. 然後根據他的主題和拍攝方式，提出 3-4 個「追問」，幫助你產出更好的腳本

## 追問的原則
- 每個問題都要能幫助腳本有更具體的「價值輸出」
- 問題要引導用戶提供：具體的數字、真實的故事、實際的方法
- ${videoSettings.shootingType === 'behind_camera' ? '藏鏡人類型：問用戶「出鏡者有什麼具體故事可以講？」「藏鏡人可以從哪個角度切入提問？」' : ''}
- ${videoSettings.shootingType === 'acting' ? '演戲類型：問用戶「角色設定？」「劇情的衝突點是什麼？」' : ''}
- 不要問太泛的問題（例如「你想傳達什麼？」用戶已經填了主題）
- 要問具體的、能幫腳本加分的細節

## 輸出 JSON 格式（必須嚴格遵守！）
{
  "analysis": "微分析文字（2-3 句，繁體中文，口語化）",
  "questions": [
    {
      "id": "q1",
      "question": "問題內容（繁體中文）",
      "placeholder": "引導用戶怎麼回答的提示文字",
      "why": "為什麼問這個（一句話，讓用戶知道回答這題的好處）"
    }
  ]
}

## 格式禁令
- 禁止 markdown（**粗體** *斜體* # 標題）
- 純文字，繁體中文
- 口語化，像朋友在聊天`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content || "{}"

    try {
      const result = JSON.parse(content)
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({
        analysis: "我看了你的設定，讓我幫你把腳本做得更有料！先回答幾個問題。",
        questions: [
          {
            id: "q1",
            question: "你在這個領域遇過最印象深刻的事是什麼？有沒有具體的故事可以帶入影片？",
            placeholder: "例如：創業第一年虧了50萬，後來靠一個策略翻身...",
            why: "真實故事是最吸引觀眾的素材"
          },
          {
            id: "q2",
            question: "你想讓觀眾看完之後能做到什麼？有沒有一個具體的行動步驟？",
            placeholder: "例如：學會用三步驟選出好基金",
            why: "有具體行動的影片觀眾更願意收藏"
          },
          {
            id: "q3",
            question: "關於這個主題，一般人最容易有什麼誤解？",
            placeholder: "例如：大家以為要很多錢才能投資，其實100元就可以開始",
            why: "打破迷思能製造懸念，提高完播率"
          }
        ]
      })
    }
  } catch (error) {
    console.error("Pre-analysis Error:", error)
    return NextResponse.json(
      { error: "分析時發生錯誤" },
      { status: 500 }
    )
  }
}
