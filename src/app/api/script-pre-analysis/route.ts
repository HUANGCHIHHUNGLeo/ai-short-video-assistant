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

    const { creatorBackground, videoSettings, positioningData } = await request.json()

    if (!videoSettings?.topic) {
      return NextResponse.json({ error: "缺少影片主題" }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const shootingTypeName = SHOOTING_TYPE_NAMES[videoSettings.shootingType] || "口播型"

    // 組合定位資料摘要（如果有的話）
    let positioningContext = ''
    if (positioningData) {
      const parts: string[] = []
      if (positioningData.positioningStatement) parts.push(`定位宣言：${positioningData.positioningStatement}`)
      if (positioningData.niche) parts.push(`定位利基：${positioningData.niche}`)
      if (positioningData.uniqueValue) parts.push(`獨特價值：${positioningData.uniqueValue}`)
      if (positioningData.persona?.coreIdentity) parts.push(`人設定位：${positioningData.persona.coreIdentity}`)
      if (positioningData.targetAudience?.who) parts.push(`目標受眾：${positioningData.targetAudience.who}`)
      if (positioningData.targetAudience?.painPoints?.length) parts.push(`受眾痛點：${positioningData.targetAudience.painPoints.join('、')}`)
      if (positioningData.targetAudience?.desires?.length) parts.push(`受眾渴望：${positioningData.targetAudience.desires.join('、')}`)
      if (positioningData.contentPillars?.length) {
        const pillars = positioningData.contentPillars.map((p: { pillar?: string; topics?: string[] }) =>
          `${p.pillar || ''}（${(p.topics || []).join('、')}）`
        ).join('\n')
        parts.push(`內容支柱：\n${pillars}`)
      }
      if (positioningData.backgroundStoryAnalysis?.summary) parts.push(`背景故事摘要：${positioningData.backgroundStoryAnalysis.summary}`)
      if (positioningData.storyAssets?.workExperience) parts.push(`工作經歷：${positioningData.storyAssets.workExperience}`)
      if (positioningData.first10Videos?.length) {
        const videos = positioningData.first10Videos.slice(0, 5).map((v: { title?: string }) => v.title).filter(Boolean).join('、')
        if (videos) parts.push(`推薦影片主題：${videos}`)
      }
      if (positioningData.personaTags?.length) parts.push(`人設標籤：${positioningData.personaTags.join('、')}`)
      if (parts.length > 0) {
        positioningContext = `\n## 創作者的定位報告（重要！根據這些資料生成建議選項）\n${parts.join('\n')}`
      }
    }

    const prompt = `你是短影音腳本顧問。用戶要製作一支短影音，以下是他的基本資訊：

## 創作者資訊
- 領域：${creatorBackground?.niche || "未填"}
- 目標觀眾：${creatorBackground?.targetAudience || "未填"}
- 觀眾痛點：${creatorBackground?.audiencePainPoints || "未填"}
- 個人經歷：${creatorBackground?.expertise || "未填"}
${positioningContext}

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
3. ⚠️ 每個問題都要附帶 2-3 個「建議選項」(suggestions)，讓用戶可以直接點選！
   - 建議選項要具體、有料、有故事感
   - 如果有定位報告，建議選項必須根據定位報告的內容來生成（利用他的背景、痛點、人設、內容支柱）
   - 如果沒有定位報告，就根據領域和主題生成通用但具體的建議
   - 每個建議選項 20-50 字，要像是用戶真的會說的話

## 追問的原則
- 每個問題都要能幫助腳本有更具體的「價值輸出」
- 問題要引導用戶提供：具體的數字、真實的故事、實際的方法
${videoSettings.shootingType === 'behind_camera' ? '- 藏鏡人類型：問用戶「出鏡者有什麼具體故事可以講？」「藏鏡人可以從哪個角度切入提問？」' : ''}
${videoSettings.shootingType === 'acting' ? '- 演戲類型：問用戶「角色設定？」「劇情的衝突點是什麼？」' : ''}
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
      "why": "為什麼問這個（一句話，讓用戶知道回答這題的好處）",
      "suggestions": ["建議選項1（20-50字，具體有料）", "建議選項2", "建議選項3"]
    }
  ]
}

## 格式禁令
- 禁止 markdown（**粗體** *斜體* # 標題）
- 純文字，繁體中文
- 口語化，像朋友在聊天
- suggestions 要像是用戶自己會說的話，不是 AI 在寫的建議`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
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
            why: "真實故事是最吸引觀眾的素材",
            suggestions: [
              "剛入行的時候踩了很多坑，花了不少冤枉錢才學到教訓",
              "有一次遇到很大的挫折，差點想放棄，後來靠一個方法撐過來了",
            ]
          },
          {
            id: "q2",
            question: "你想讓觀眾看完之後能做到什麼？有沒有一個具體的行動步驟？",
            placeholder: "例如：學會用三步驟選出好基金",
            why: "有具體行動的影片觀眾更願意收藏",
            suggestions: [
              "至少知道一個馬上可以用的方法",
              "改變一個錯誤的觀念或習慣",
            ]
          },
          {
            id: "q3",
            question: "關於這個主題，一般人最容易有什麼誤解？",
            placeholder: "例如：大家以為要很多錢才能投資，其實100元就可以開始",
            why: "打破迷思能製造懸念，提高完播率",
            suggestions: [
              "大部分人以為很難，其實掌握關鍵就不難",
              "很多人做錯了第一步，後面全部白費",
            ]
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
