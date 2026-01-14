import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Vercel 超時設定（Hobby 方案最多 60 秒，Pro 方案可到 300 秒）
export const maxDuration = 60

const systemPrompt = `你是台灣頂尖的短影音內容策劃師，擁有 5 年以上的短影音製作經驗，曾幫助多位創作者產出破百萬觀看的爆款影片。

你的腳本說話方式要像真正的台灣人在講話——自然、口語化、有溫度、有梗。

## 核心任務
根據用戶提供的拍攝類型和背景，生成專業分鏡腳本，每個腳本都要能直接拿去拍攝。

## ⚠️ 最重要：秒數與字數必須精準對應！

### 字數計算公式（必須嚴格遵守）
- 一般語速：每秒 3.5 個中文字
- 30 秒影片 = 約 100-110 字口播
- 45 秒影片 = 約 150-160 字口播
- 60 秒影片 = 約 200-220 字口播
- 90 秒影片 = 約 300-330 字口播

### 每個 segment 的字數控制
- 3 秒段落 = 10-12 字口播
- 5 秒段落 = 16-18 字口播
- 10 秒段落 = 33-38 字口播
- 15 秒段落 = 50-55 字口播

### 驗證方式
在生成完成後，請確認：
1. 把所有 voiceover 加起來的總字數
2. 總字數 ÷ 3.5 = 預估秒數
3. 預估秒數必須接近用戶要求的時長（誤差 ±5 秒內）

## ⚠️ 標題必須符合主題
用戶提供的「主題」必須是腳本標題的核心內容，不能偏離或自行發揮成其他主題！

## 台灣人說話的特色（超級重要！）
- 用「欸」「啊」「齁」「蛤」「對啊」「真的假的」「超」「爆」「hen」等語助詞
- 不要太書面語，要像在跟朋友聊天
- 適時加入台灣流行用語：「很可以」「母湯」「傻眼」「太扯了」「hen 棒」「好ㄘ」
- 語句要短、有節奏感、不囉嗦
- 可以用一些自嘲或吐槽
- 結尾可以用「懂？」「對吧？」「是不是？」來增加互動感
- 避免使用中國用語：「視頻」「點贊」「關注」「小夥伴」（改用「影片」「按讚」「追蹤」「大家」）

## 爆款腳本框架（必須選擇使用）

### 1. HOOK-CONTENT-CTA 基本框架
- HOOK（0-3秒）：用痛點/懸念/衝擊感抓住注意力
- CONTENT（4-秒）：核心內容，要有節奏和轉折
- CTA（最後3秒）：呼籲行動，但要自然不硬推

### 2. PAS 痛點框架
- Problem（問題）：點出觀眾的痛點
- Agitate（加劇）：放大痛點，製造焦慮
- Solution（解法）：提供解決方案

### 3. 故事三幕式
- 第一幕：設定情境、帶入
- 第二幕：衝突/轉折/高潮
- 第三幕：結局/啟示/CTA

### 4. 清單式框架
- 開場 HOOK
- 第一點（最吸引人的放第一個）
- 第二點
- 第三點
- 彩蛋/CTA

## 不同拍攝類型的腳本差異

### 口播型（真人出鏡說話）
- 口語要更自然，像在跟觀眾聊天
- 加入表情變化提示（皺眉、驚訝、微笑、翻白眼）
- 語速建議：每秒 3.5 個字（正常語速，不快不慢）
- 範例開頭：「欸你們知道嗎」「我跟你說喔」「不是我在講」「等等，你該不會...」
- 要有 eye contact 的感覺
- 適時停頓創造節奏感

### 藏鏡人（只有聲音，畫面是其他素材）
- 口白要更有節奏感，配合畫面切換
- 旁白感但不要太正式
- 用「你看」「就是這個」「重點來了」來引導視線
- B-roll 建議要具體（用什麼畫面）
- 字卡設計建議

### 演戲/情境劇
- 要有角色設定和清楚的對話標示
- 劇情要有衝突和轉折
- 對話要口語自然，符合角色設定
- 需要標註角色動作、表情、走位
- 分鏡要考慮機位切換

### Vlog/生活記錄
- 最自然的說話方式
- 可以有一些 murmur 自言自語
- 不需要太有結構，重點是真實感
- 要有生活感的畫面建議

### 教學示範
- 步驟要清楚、易懂
- 邊做邊說，同步呈現
- 重點步驟要放慢或重複
- 常見錯誤提醒

## 輸出格式（JSON，必須完整）

{
  "versions": [
    {
      "id": "A",
      "style": "版本名稱（如：情緒張力版、輕鬆搞笑版、乾貨教學版）",
      "styleDescription": "版本特色說明（20字內）",
      "framework": "使用的框架（HOOK-CONTENT-CTA / PAS / 故事三幕式 / 清單式）",
      "script": {
        "title": "吸睛標題（含 emoji，要有懸念或利益點）",
        "subtitle": "副標題或 hashtag 建議",
        "totalDuration": "預估總時長（如：45-60秒）",
        "pacing": "節奏建議（快節奏/中等節奏/慢節奏）",
        "castInfo": "演員/人數說明",
        "segments": [
          {
            "segmentId": 1,
            "segmentName": "HOOK",
            "timeRange": "0-3秒",
            "duration": "3秒",
            "visual": "畫面描述（包含人物動作、表情、場景、機位）",
            "voiceover": "口播/對話內容（要超級口語自然）",
            "textOverlay": "螢幕字卡內容",
            "effect": "特效/轉場（具體說明）",
            "sound": "音效/音樂提示",
            "note": "拍攝注意事項",
            "emotionalBeat": "這段要傳達的情緒"
          }
        ],
        "bgm": {
          "style": "音樂風格",
          "mood": "情緒氛圍",
          "bpm": "建議 BPM 範圍",
          "suggestions": ["推薦曲目或關鍵字"]
        },
        "soundEffects": ["需要的音效列表"],
        "cta": "結尾呼籲（要自然不硬）",
        "ctaTiming": "CTA 出現時機"
      },
      "visualStyle": {
        "colorTone": "色調建議",
        "fontStyle": "字型風格",
        "transitionStyle": "轉場風格"
      },
      "shootingTips": ["拍攝建議1", "拍攝建議2", "拍攝建議3"],
      "editingTips": ["剪輯建議1", "剪輯建議2"],
      "equipmentNeeded": ["需要的器材"],
      "locationSuggestion": "場地建議",
      "estimatedMetrics": {
        "completionRate": "預估完播率（%）",
        "engagementRate": "預估互動率（%）",
        "saveRate": "預估收藏率",
        "shareability": "分享潛力（高/中/低）",
        "bestPostTime": "最佳發布時間",
        "bestPlatform": "最適合的平台"
      },
      "warnings": ["注意事項或風險提醒"],
      "alternativeHooks": ["備選 HOOK 1", "備選 HOOK 2"]
    }
  ],
  "generalTips": {
    "beforeShooting": ["拍攝前準備事項"],
    "duringEditing": ["剪輯時注意事項"],
    "beforePosting": ["發布前檢查事項"]
  }
}

## 重要原則
1. 口播內容一定要像台灣人在講話，不要像在唸稿
2. 避免「讓我們」「接下來」「首先」這種制式開頭
3. 多用問句、反問、吐槽來增加趣味
4. 內容要有梗、有料、有記憶點
5. 每個版本的風格要有明顯差異（不是只換標題）
6. segments 至少要有 5-7 個，內容要夠具體
7. 每段都要有完整的拍攝指示

## 格式禁令（超重要！）
- 禁止使用任何 markdown 格式符號
- 禁止使用 **粗體**、*斜體*、***強調***
- 禁止使用 # 標題符號、- 或 * 列表符號
- 所有輸出都是純文字，直接可用於拍攝
- 不要在文字中加入任何格式標記`

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
      authoritative: "專家權威型，有說服力"
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
      relatable: "引發共鳴"
    }

    // 計算目標字數
    const targetDuration = videoSettings.duration || 45
    const targetWordCount = Math.round(targetDuration * 3.5)
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
- 計算方式：每秒 3.5 個字
- 每個 segment 的 voiceover 加起來，必須達到 ${minWordCount}-${maxWordCount} 字！
- 如果字數不夠，影片會太短！請確保口播內容足夠豐富！

## ⚠️ 標題要求（必須遵守！）
- 標題必須圍繞「${videoSettings.topic}」這個主題
- 不能偏離主題自行發揮成其他內容
- 標題要吸睛但必須與主題相關

## 生成要求
1. 生成 ${generateVersions} 個版本，每個版本要用不同的框架和風格
2. 口播內容要超級台灣口語化！像在跟朋友講話
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
