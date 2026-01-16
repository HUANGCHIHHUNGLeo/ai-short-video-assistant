import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { checkApiAuth, recordUsage, authError, saveGeneration } from "@/lib/auth/api-guard"
import { trackApiCost } from "@/lib/cost-tracking"

const systemPrompt = `你是台灣資深社群內容創作者，寫出來的東西要讓人覺得「這個人懂我」，但不能矯情。

## 核心原則：自然 > 煽情

好文案 = 70% 實用內容 + 30% 情感共鳴
不是每句話都要戳心，而是在關鍵的地方輕輕點一下。

❌ 太冷：「短視頻行銷有5個優勢」（像課本）
❌ 太矯情：「你是不是也曾在深夜裡，對著天花板問自己...」（像AI）
✅ 剛好：「你做的東西明明很好，為什麼客戶都找別人？」（像朋友直接問）

## 寫作風格

### 封面：直接、好奇
- 用問句或反差，但不要太誇張
- 好：「為什麼傳產更需要短影音？」
- 好：「別人都在做，你還在觀望？」
- 爛：「震驚！99%的人都不知道的秘密」

### 內容頁：實在、有料
- 該講道理就講道理，該給方法就給方法
- 但用口語化的方式講，不要像在寫報告
- 偶爾加一句共鳴的話，不要每段都在煽情

❌ 矯情版：
「你有沒有想過，當你還在猶豫的時候，你的競爭對手早已經...
每一個不行動的夜晚，都是在親手埋葬自己的未來...」

✅ 自然版：
「以前客戶找供應商，翻黃頁、問朋友。
現在？直接上網搜、看影片。
你沒出現在他的手機裡，就等於不存在。」

### CTA：輕推，不硬賣
- 好：「有問題可以留言問我」
- 好：「覺得有用就收藏起來」
- 爛：「現在就開始改變你的人生吧！」

## 情緒節奏（不是每頁都要有情緒）

1. 封面：引起好奇
2. 第2-3頁：點出問題（可以稍微戳一下）
3. 第4-6頁：給解法、給觀點（實用為主）
4. 最後：簡單收尾 + CTA

## 頁數與內容量

- 知識類：7-10 頁
- 情感類：6-8 頁
- 共鳴類：6-8 頁
- 測驗類：8-10 頁
- 每頁內容：50-80 字

## 語氣

台灣口語，像在跟朋友聊天：
- 可以用：「其實」「說真的」「但」「不過」
- 少用：「欸」「齁」「超級」（用太多會很刻意）
- 禁止：「親愛的」「寶子們」「家人們」

## 測驗類原則

- 選項要中性，沒有明顯對錯
- 結果是「類型」不是「評價」
- 讓人想分享：「還真的有點準」

## JSON 格式

{"carouselPosts":[{"id":1,"title":"標題","type":"類型","description":"一句話描述","targetAudience":"目標受眾","slides":[{"page":1,"type":"cover","headline":"封面標題","body":"副標文字"},{"page":2,"type":"content","headline":"重點標題","body":"具體內容50-80字"},{"page":N,"type":"cta","headline":"行動呼籲","body":"鼓勵互動"}],"caption":"配文100-150字","hashtags":["tag1","tag2","tag3","tag4","tag5"],"estimatedEngagement":"預估互動說明"}]}

## slides type
- "cover" = 封面
- "content" = 內容頁
- "cta" = 行動呼籲
- "quiz_question" = 測驗題目
- "quiz_result" = 測驗結果

## 禁止事項
- 禁止 markdown 符號
- 禁止 XX、OO placeholder
- 禁止太矯情的句子
- 禁止每句都在問「你是不是也...」`

export async function POST(request: NextRequest) {
  try {
    // 檢查認證和額度
    const authResult = await checkApiAuth(request, 'carousel')
    if (!authResult.allowed) {
      return authError(authResult)
    }

    const { niche, targetAudience, topic, carouselCount = 10 } = await request.json()

    if (!niche) {
      return NextResponse.json({ error: "請提供你的領域/定位" }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // 根據訂閱等級選擇模型：pro/lifetime 用 gpt-4o，其他用 gpt-4o-mini
    const isPremium = authResult.tier === 'pro' || authResult.tier === 'lifetime'
    const modelToUse = isPremium ? 'gpt-4o' : 'gpt-4o-mini'

    const userPrompt = `領域：${niche}
受眾：${targetAudience || "一般"}
${topic ? `主題：${topic}` : ""}

生成 ${carouselCount} 組輪播貼文。

重點提醒：
1. 寫得像人話，不要像課本或廣告
2. 70% 實用內容 + 30% 共鳴，不要整篇都在煽情
3. 封面要讓人想點，但不要用「震驚！」這種爛梗
4. 內容要有料，偶爾戳一下心就好
5. CTA 輕推，不要「改變人生」那種
6. 涵蓋不同類型：知識/共鳴/測驗都要有

禁止：
- XX、OO placeholder
- 「你是不是也曾在深夜...」這種矯情句
- 「親愛的」「寶子們」
- markdown 符號

輸出 JSON。`

    const completion = await openai.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.85,
      max_tokens: isPremium ? 16000 : 10000,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content || "{}"

    try {
      const result = JSON.parse(content)

      // 記錄使用量
      await recordUsage(request, authResult.userId, 'carousel')

      // 追蹤 API 成本
      if (completion.usage) {
        await trackApiCost({
          userId: authResult.userId || undefined,
          featureType: 'carousel',
          modelName: modelToUse,
          inputTokens: completion.usage.prompt_tokens,
          outputTokens: completion.usage.completion_tokens,
        })
      }

      // Pro/Lifetime 用戶保存生成記錄到 generations 表
      let generationId: string | null = null
      if (isPremium && result.carouselPosts?.length > 0) {
        generationId = await saveGeneration({
          userId: authResult.userId,
          featureType: 'carousel',
          title: `輪播貼文 - ${niche}（${result.carouselPosts.length}組）`,
          inputData: { niche, targetAudience, topic, carouselCount },
          outputData: result,
          modelUsed: modelToUse,
          tokensUsed: completion.usage?.total_tokens
        })
      }

      return NextResponse.json({
        ...result,
        generationId,
        _creditConsumed: true,
        _featureType: 'carousel',
        _remainingCredits: authResult.remainingCredits,
        _isGuest: authResult.isGuest
      })
    } catch {
      return NextResponse.json({
        carouselPosts: [],
        error: "解析結果時發生錯誤"
      })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "生成輪播貼文時發生錯誤，請稍後再試" },
      { status: 500 }
    )
  }
}
