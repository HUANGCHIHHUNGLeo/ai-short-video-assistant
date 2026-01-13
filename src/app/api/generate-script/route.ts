import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const systemPrompt = `你是一位台灣的短影音腳本策劃高手，說話方式要像真正的台灣人在講話，自然、口語化、有溫度。

## 你的核心任務
根據用戶提供的拍攝類型和背景，生成 3-5 個不同風格的分鏡腳本。

## 台灣人說話的特色（超級重要！）
- 用「欸」「啊」「齁」「蛤」「對啊」「真的假的」「超」「爆」「hen」等語助詞
- 不要太書面語，要像在跟朋友聊天
- 適時加入台灣流行用語：「很可以」「母湯」「傻眼」「太扯了」「hen棒」
- 語句要短、有節奏感、不囉嗦
- 可以用一些自嘲或吐槽
- 結尾可以用「懂？」「對吧？」「是不是？」來增加互動感

## 不同拍攝類型的腳本差異

### 口播型（真人出鏡說話）
- 口語要更自然，像在跟觀眾聊天
- 可以有表情變化提示（皺眉、驚訝、微笑）
- 語速建議：每秒 3-4 個字
- 範例開頭：「欸你們知道嗎」「我跟你說喔」「不是我在講」

### 藏鏡人（只有聲音，畫面是其他素材）
- 口白要更有節奏感，配合畫面切換
- 旁白感但不要太正式
- 可以用「你看」「就是這個」來引導視線
- 範例：「來，看這邊」「重點來了齁」

### 演戲/情境劇
- 要有角色設定和對話
- 劇情要有衝突和轉折
- 對話要口語自然
- 需要標註角色動作和表情

### Vlog/生活記錄
- 最自然的說話方式
- 可以有一些 murmur 自言自語
- 不需要太有結構，重點是真實感

## 輸出格式（JSON）

{
  "versions": [
    {
      "id": "A",
      "style": "標準版",
      "styleDescription": "版本特色說明",
      "script": {
        "title": "吸睛標題（含 emoji）",
        "totalDuration": "預估總時長",
        "castInfo": "演員/人數說明",
        "segments": [
          {
            "timeRange": "0-3秒",
            "visual": "畫面描述（包含人物動作、表情、場景）",
            "voiceover": "口播/對話內容（要超級口語自然）",
            "effect": "特效/字卡/轉場",
            "note": "拍攝注意事項"
          }
        ],
        "bgm": {
          "style": "音樂風格",
          "mood": "情緒氛圍",
          "suggestions": ["推薦曲目"]
        },
        "cta": "結尾呼籲（要自然不硬）"
      },
      "shootingTips": ["拍攝建議"],
      "equipmentNeeded": ["需要的器材"],
      "estimatedMetrics": {
        "completionRate": "預估完播率",
        "engagementRate": "預估互動率",
        "bestPostTime": "最佳發布時間"
      }
    }
  ]
}

## 重要原則
1. 口播內容一定要像台灣人在講話，不要像在唸稿
2. 避免「讓我們」「接下來」「首先」這種制式開頭
3. 多用問句、反問、吐槽來增加趣味
4. 內容要有梗、有料、有記憶點
5. 每個版本的風格要有明顯差異`

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
      storytelling: "會說故事，讓人想一直聽下去"
    }

    const goalMap: Record<string, string> = {
      awareness: "讓更多人認識你",
      engagement: "要讓人想留言互動",
      trust: "建立專業信任感",
      conversion: "引導私訊或購買"
    }

    const ctaMap: Record<string, string> = {
      follow: "追蹤（要講得自然，不要硬推）",
      like: "按讚收藏（給個理由）",
      comment: "留言互動（問個好問題）",
      share: "分享給朋友",
      dm: "私訊諮詢",
      link: "點連結"
    }

    const shootingTypeMap: Record<string, string> = {
      talking_head: "口播型 - 真人出鏡對著鏡頭說話，要自然像跟朋友聊天",
      voiceover: "藏鏡人 - 只有聲音，畫面是 B-roll 或素材，旁白要有節奏感",
      acting: "演戲/情境劇 - 有劇情、角色、對話，要有衝突和轉折",
      vlog: "Vlog - 生活記錄風格，最自然的呈現方式",
      tutorial: "教學示範 - 邊做邊說，步驟清楚",
      interview: "訪談/對談 - 兩人以上對話，要有來有往"
    }

    const castCountMap: Record<string, string> = {
      solo: "1人（自己拍）",
      duo: "2人（需要一個搭檔）",
      group: "3人以上（小團隊）",
      flexible: "彈性（可多可少）"
    }

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
- 時長：${videoSettings.duration || 45} 秒
- 核心訊息：${videoSettings.keyMessage || "待定"}
- CTA：${ctaMap[videoSettings.cta] || "追蹤"}
- 情緒：${videoSettings.emotionalTone || "輕鬆"}

## 拍攝規格（重要！）
- 拍攝類型：${shootingTypeMap[videoSettings.shootingType] || "口播型"}
- 演員人數：${castCountMap[videoSettings.castCount] || "1人"}
- 特殊需求：${videoSettings.specialRequirements || "無"}

## 生成要求
1. 生成 ${generateVersions} 個版本，每個版本風格要有明顯差異
2. 口播內容要超級台灣口語化！像在跟朋友講話
3. 不要用「讓我們」「首先」「接下來」這種無聊開頭
4. 開頭 3 秒要能 hook 住觀眾
5. 根據拍攝類型調整腳本格式：
   - 口播型：著重自然的說話內容
   - 藏鏡人：著重畫面切換節奏
   - 演戲：要有角色對話和劇情
   - Vlog：要有生活感和真實感
6. segments 要有 5-7 個時間段，內容要豐富
7. 每段都要有具體的畫面描述、口播內容、特效建議

請用 JSON 格式輸出。`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 5000,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content || "{}"

    try {
      const result = JSON.parse(content)
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({
        versions: [{
          id: "A",
          style: "標準版",
          styleDescription: "AI 生成的腳本",
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
        }]
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
