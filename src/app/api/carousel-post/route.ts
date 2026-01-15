import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { checkApiAuth, recordUsage, authError } from "@/lib/auth/api-guard"
import { trackApiCost } from "@/lib/cost-tracking"

const systemPrompt = `你是台灣頂尖社群內容策劃師，專精 IG/小紅書輪播貼文，擅長創作有深度、有價值的內容。

## 【最重要】頁數與內容深度要求
⚠️ 每篇輪播貼文必須 5-10 頁，這是硬性要求！
⚠️ 知識類必須 7-10 頁，情感類 6-8 頁，互動類 6-9 頁
⚠️ 內容必須有深度，不能只是淺淺帶過

### 頁面結構（嚴格遵守）
- 第1頁：封面（吸睛標題 <12字）
- 第2-8頁：內容頁（每頁一個完整重點，50-80字）
- 最後1-2頁：CTA + 總結

### 內容頁深度要求（每頁 50-80 字）
每頁內容必須包含：
1. 明確的重點標題（headline）
2. 3-5 行的詳細說明（body），包含：
   - 具體的方法/步驟/原因
   - 實際案例或情境描述
   - 為什麼這樣做的原因
   - 可能遇到的問題和解決方式

❌ 錯誤示範（太淺）：
headline: "多喝水"
body: "每天要喝足夠的水，對身體好"

✅ 正確示範（有深度）：
headline: "黃金補水時機"
body: "起床後先喝300ml溫水，幫助喚醒腸胃
飯前30分鐘喝一杯，增加飽足感還能幫助消化
運動前後各補充200ml，避免脫水影響表現
晚上8點後少量多次，避免夜尿影響睡眠品質"

## 高互動封面公式（必用其一）
1. 數字型：「7個讓你XX的方法」「90%的人不知道的XX」
2. 對比型：「XX vs XX」「這樣做vs那樣做」
3. 問句型：「為什麼你總是XX？」「你是不是也XX？」
4. 痛點型：「別再XX了！」「XX的人才懂」
5. 好奇型：「原來XX這麼簡單」「我後悔沒早點知道」

## 內容頁高互動原則
- 每頁 50-80 字，一個完整重點
- 用「你」拉近距離，用「我」分享經驗
- 具體數字 > 模糊描述（「3天」比「幾天」好）
- 具體案例 > 抽象概念（禁止XX、OO等placeholder）
- 善用emoji增加視覺層次（每頁1-3個）
- 每頁結尾留懸念或轉折，讓人想繼續滑

## CTA頁公式
- 收藏型：「怕忘記就先收藏起來，之後慢慢看」
- 分享型：「tag一個需要的朋友，一起變更好」
- 互動型：「你是哪一種？留言告訴我，我幫你分析」
- 追蹤型：「追蹤看更多XX，每週更新乾貨」

## 貼文類型與頁數（嚴格遵守）
- 知識類（7-10頁）：乾貨技巧、步驟教學、清單推薦、迷思破解、比較分析
- 情感類（6-8頁）：生活碎片、心情語錄、蛻變對比、回憶分享、成長故事
- 互動類（6-9頁）：測驗問答、流程選擇、迷因共鳴、投票討論

## 語氣
台灣口語、親切自然、像朋友分享，可用「欸」「齁」「對吧」「真的」「超」

## 格式禁令
- 禁止任何 markdown 格式符號（**、*、#）
- 所有文字內容都是純文字

## JSON格式
{"carouselPosts":[{"id":1,"title":"標題","type":"類型","description":"一句話描述","targetAudience":"目標受眾","slides":[{"page":1,"type":"cover","headline":"封面標題","body":"副標文字"},{"page":2,"type":"content","headline":"重點標題","body":"具體內容50-80字"},{"page":N,"type":"cta","headline":"行動呼籲","body":"鼓勵互動"}],"caption":"配文100-150字","hashtags":["tag1","tag2","tag3","tag4","tag5"],"estimatedEngagement":"預估互動說明","quizResults":[]}]}

## slides 結構
- page: 頁碼（1開始）
- type: "cover"=封面、"content"=內容頁、"cta"=行動呼籲頁、"result"=結果頁
- headline: 主標題（必填）
- body: 詳細內容（content 頁必須 50-80 字）

## 測驗類特殊規則
結構：封面 → 題目說明 → 選項頁 → CTA → 結果頁（1-2頁）
- 結果頁 type="result"
- quizResults 陣列要有 4-6 個結果，每個含 result/title/description

## 最終檢查清單
生成前請確認：
1. 每篇貼文至少 6 頁（知識類 7 頁以上）
2. 每個 content 頁的 body 有 50-80 字
3. 內容有實際價值，不是空泛的廢話
4. 封面使用了高互動公式
5. 有明確的 CTA 引導互動`

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

生成${carouselCount}組高品質輪播貼文：

【重要要求】
1. 每篇必須 6-10 頁（知識類 7-10 頁）
2. 每個 content 頁的 body 必須有 50-80 字，內容要有深度
3. 封面必用高互動公式（數字/對比/問句/痛點/好奇）
4. 禁止使用 XX、OO 等 placeholder，所有內容必須具體
5. 測驗類需：完整選項 + quizResults 陣列（4-6個結果）
6. 涵蓋知識/情感/互動多種類型，內容要多元

【內容深度範例】
✅ 好的 body：「起床後先喝300ml溫水，幫助喚醒腸胃。飯前30分鐘喝一杯，增加飽足感還能幫助消化。運動前後各補充200ml，避免脫水影響表現」
❌ 差的 body：「多喝水對身體好」

輸出JSON。`

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

      return NextResponse.json({
        ...result,
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
