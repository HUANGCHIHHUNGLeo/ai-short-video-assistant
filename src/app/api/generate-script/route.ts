import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { buildSystemPrompt } from "@/lib/prompts"

// Vercel 超時設定（Hobby 方案最多 60 秒，Pro 方案可到 300 秒）
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { creatorBackground, videoSettings, generateVersions = 3 } = await request.json()

    if (!creatorBackground?.niche || !videoSettings?.topic) {
      return NextResponse.json({ error: "請提供完整的創作者背景和影片設定" }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const styleMap: Record<string, string> = {
      professional: "專業但不無聊，像厲害的學長姐在教你",
      friendly: "超親切，像好朋友在聊天分享",
      energetic: "很嗨很有活力，像直播主那種感染力",
      humorous: "搞笑吐槽型，講幹話但有料",
      storytelling: "會說故事，讓人想一直聽下去",
      authoritative: "專家權威型，有說服力",
      relatable: "共鳴型 - 用具體生活場景讓觀眾一聽就覺得『這在說我』。重點是描述他們的真實處境和感受，不是直接說教。可以用自身經驗拉近距離，但方式要多變，不要每次都用『我以前也這樣』"
    }

    const goalMap: Record<string, string> = {
      awareness: "讓更多人認識你，擴大曝光",
      engagement: "要讓人想留言互動，創造討論",
      trust: "建立專業信任感，展現專業度",
      conversion: "引導私訊或購買，導流變現",
      education: "教學傳遞價值，建立專業形象",
      entertainment: "純娛樂，增加好感度"
    }

    const ctaMap: Record<string, string> = {
      follow: "追蹤（要講得自然，不要硬推）",
      like: "按讚收藏（給個理由）",
      comment: "留言互動（問個好問題）",
      share: "分享給朋友（給轉發動機）",
      dm: "私訊諮詢",
      link: "點連結（限時或獨家感）",
      save: "收藏備用"
    }

    const shootingTypeMap: Record<string, string> = {
      talking_head: "口播型 - 真人出鏡對著鏡頭說話，要自然像跟朋友聊天",
      voiceover: "藏鏡人 - 只有聲音，畫面是 B-roll 或素材，旁白要有節奏感",
      acting: "演戲/情境劇 - 有劇情、角色、對話，要有衝突和轉折",
      vlog: "Vlog - 生活記錄風格，最自然的呈現方式",
      tutorial: "教學示範 - 邊做邊說，步驟清楚",
      interview: "訪談/對談 - 兩人以上對話，要有來有往",
      storytime: "說故事 - narrative 敘事，有起承轉合"
    }

    const castCountMap: Record<string, string> = {
      solo: "1人（自己拍）",
      duo: "2人（需要一個搭檔）",
      group: "3人以上（小團隊）",
      flexible: "彈性（可多可少）"
    }

    const emotionalToneMap: Record<string, string> = {
      exciting: "興奮激動",
      calm: "平靜舒服",
      funny: "搞笑幽默",
      serious: "認真嚴肅",
      inspiring: "激勵人心",
      curious: "好奇引發探索",
      relatable: "引發共鳴 - 開頭用具體生活場景描述觀眾的處境，讓他們一聽就覺得『對，就是在說我』。場景要具體有畫面感（不是抽象的『很累』，而是『加班到 11 點回家只想躺著』）。拉近距離的方式要多變化，不要公式化"
    }

    // 計算目標字數（每秒 4.5 字）
    const targetDuration = videoSettings.duration || 45
    const targetWordCount = Math.round(targetDuration * 4.5)
    const minWordCount = Math.round(targetWordCount * 0.9)
    const maxWordCount = Math.round(targetWordCount * 1.1)

    const userPrompt = `
請幫我生成 ${generateVersions} 個不同風格的短影音腳本：

## 創作者資訊
- 領域：${creatorBackground.niche}
- 專業背景：${creatorBackground.expertise || "一般素人"}
- 目標觀眾：${creatorBackground.targetAudience}
- 觀眾的痛點：${creatorBackground.audiencePainPoints || "待挖掘"}
- 說話風格：${styleMap[creatorBackground.contentStyle] || "自然親切"}
- 發布平台：${creatorBackground.platforms?.join("、") || "IG/抖音"}

## 這支影片的設定
- 主題：${videoSettings.topic}
- 目標：${goalMap[videoSettings.goal] || "曝光"}
- 時長：${targetDuration} 秒
- 核心訊息：${videoSettings.keyMessage || "待定"}
- CTA：${ctaMap[videoSettings.cta] || "追蹤"}
- 情緒：${emotionalToneMap[videoSettings.emotionalTone] || "輕鬆"}

## 拍攝規格（重要！）
- 拍攝類型：${shootingTypeMap[videoSettings.shootingType] || "口播型"}
- 演員人數：${castCountMap[videoSettings.castCount] || "1人"}
- 特殊需求：${videoSettings.specialRequirements || "無"}

## ⚠️ 字數要求（最重要！必須遵守！）
- 目標時長：${targetDuration} 秒
- 目標總字數：${targetWordCount} 字（範圍：${minWordCount}-${maxWordCount} 字）
- 計算方式：每秒 4.5 個字
- 每個 segment 的 voiceover 加起來，必須達到 ${minWordCount}-${maxWordCount} 字！
- 如果字數不夠，影片會太短！請確保口播內容足夠豐富！

## ⚠️ 標題要求（必須遵守！）
- 標題必須圍繞「${videoSettings.topic}」這個主題
- 不能偏離主題自行發揮成其他內容
- 標題要吸睛但必須與主題相關

## 生成要求
1. 生成 ${generateVersions} 個版本，每個版本要用不同的框架和風格
2. 口播內容要自然口語化，像在跟朋友聊天，不要刻意裝腔或塞流行語
3. 避免無聊開頭，開頭 3 秒要能 HOOK 住觀眾
4. 每個版本要有足夠的 segments 來填滿 ${targetDuration} 秒
5. 每段都要有具體的：畫面描述、口播內容（足夠長！）、字卡、特效、音效
6. 根據拍攝類型調整腳本格式
7. 提供備選 HOOK，讓創作者有更多選擇
8. 每個版本風格要有明顯差異，不只是換標題
9. 最終驗證：把所有 voiceover 字數加總，確保達到 ${minWordCount}-${maxWordCount} 字

版本風格建議：
- 版本 A：情緒張力版（製造衝擊感）
- 版本 B：輕鬆幽默版（搞笑親切）
- 版本 C：乾貨教學版（實用價值）
${generateVersions > 3 ? '- 版本 D：故事敘事版（情感共鳴）\n- 版本 E：互動討論版（引發留言）' : ''}

請用 JSON 格式輸出。`

    // 使用模組化 prompt - 根據拍攝類型動態組合
    const systemPrompt = buildSystemPrompt({
      shootingType: videoSettings.shootingType || 'talking_head',
      includeFrameworks: true,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.85,
      max_tokens: 12000,  // 增加 token 上限確保不被截斷
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content || "{}"

    try {
      const result = JSON.parse(content)
      return NextResponse.json({
        ...result,
        _creditConsumed: true,
        _featureType: 'script'
      })
    } catch {
      return NextResponse.json({
        versions: [{
          id: "A",
          style: "標準版",
          styleDescription: "AI 生成的腳本",
          framework: "HOOK-CONTENT-CTA",
          script: {
            title: videoSettings.topic,
            segments: [],
            bgm: { style: "輕快", mood: "活潑", suggestions: [] },
            cta: "追蹤看更多～"
          },
          shootingTips: ["光線要夠", "收音要清楚", "多拍幾次"],
          equipmentNeeded: ["手機", "腳架"],
          estimatedMetrics: {
            completionRate: "50-60%",
            engagementRate: "5-8%",
            bestPostTime: "晚上 8-10 點"
          },
          rawContent: content
        }],
        error: "解析腳本時發生問題，已返回基本格式"
      })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "生成腳本時發生錯誤，請稍後再試" },
      { status: 500 }
    )
  }
}
