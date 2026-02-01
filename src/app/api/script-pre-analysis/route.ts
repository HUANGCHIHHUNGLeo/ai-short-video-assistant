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
1. 先用 2-3 句話做一個「微分析」，告訴用戶你理解他要做什麼，點出這支影片的關鍵
2. 然後提出 3-4 個追問（q1-q3 必填，q4 可選），幫腳本補充更多好素材
3. ⚠️ 每個問題都要附帶 2-3 個「建議選項」(suggestions)，讓用戶可以直接點選
   - 如果有定位報告，建議選項必須根據定位報告來生成（利用背景、痛點、人設、內容支柱）
   - 如果沒有定位報告，就根據領域和主題生成通用但具體的建議
   - 每個建議選項 20-50 字，要像是用戶自己會說的話

## ⚠️⚠️⚠️ 這一步的核心目的：跟用戶「同頻」！

### 什麼是同頻？
這一步不是在收集資料，而是在「理解用戶的視角」。
用戶想透過這支影片傳達什麼痛點給觀眾？他怎麼看待這個主題？他的親身感受是什麼？
你的問題要幫用戶「說出他心裡的話」，讓 AI 能站在他的角度去寫腳本。

### 前提：Step 2 已經有的資訊不要重複問！
用戶在上面已經填了主題、價值點、故事、觀眾學到什麼。
你的問題是要「延伸」這些已有內容，挖出更具體的細節和用戶的真實感受，不是重新問一遍。

### 問題的設計邏輯（每題都從前一題延伸，圍繞「觀眾痛點」）：

**q1（故事延伸 — 痛點的真實場景）**：從用戶的主題出發，挖一個跟觀眾痛點直接相關的「真實經歷或具體場景」
- 如果用戶已經在 Step 2 填了「想分享的故事」→ 從那個故事延伸問細節（時間、數字、過程、當下感受）
- 如果沒填故事 → 問他在這個主題上，自己或觀眾最常遇到的困境是什麼
- 目的：讓用戶描述出「觀眾會有共鳴的痛點場景」

**q2（價值代入故事 — 痛點怎麼解決的）**：從 q1 的痛點接著問，把 Step 2 的「核心價值/觀點」融進來
- 「在這個經歷之後，你學到了什麼？」「你發現的關鍵方法是什麼？」
- 目的：讓故事不只是故事，而是帶出用戶想傳達的核心價值，讓觀眾覺得「有解法」

**q3（完整故事線 — 觀眾能帶走什麼）**：從 q1+q2 延伸，問怎麼讓這個痛點→解法對觀眾有用
- 「如果觀眾遇到跟你一樣的情況，你會建議他第一步怎麼做？」
- 目的：讓腳本有一條「痛點共鳴 → 解法乾貨 → 行動建議」的完整弧線

**q4（可選補充）**：一個開放性問題，讓用戶補充任何想強調的細節
- 例如：「還有什麼你覺得觀眾一定要知道的？」
- 這題不回答也完全不影響腳本品質

### 範例（主題：「新手創業最常犯的錯」，Step 2 填了核心價值：成本控制）

q1：「你自己創業初期犯過最貴的一個錯是什麼？花了多少錢學到這個教訓？」
→ 從主題挖出觀眾也會遇到的痛點故事

q2：「後來你是怎麼解決成本失控的問題的？有沒有一個具體的做法讓你止血？」
→ 從 q1 的痛點接著問，帶入 Step 2 的核心價值「成本控制」

q3：「如果有人現在要創業，你會建議他在成本上先做好哪一件事？」
→ 從 q2 的方法延伸成觀眾能帶走的行動

q4：「還有什麼你覺得新手一定會踩的坑，想在影片裡提醒一下？」
→ 可選補充

### 為什麼這樣問有效？
這三題幫用戶理清了「觀眾的痛點→自己的解法→觀眾能帶走的東西」
答案串起來 = 一支完整腳本的骨架：
HOOK（q1 的痛點故事）→ 中段乾貨（q2 的方法）→ CTA 落地（q3 的行動建議）
AI 拿到這些素材就能站在用戶的角度生成連貫的故事線，而不是零散的片段。

### 禁止的問法：
❌ 重複 Step 2 已填的內容（「你想傳達什麼？」「目標觀眾是誰？」）
❌ 三題各問各的毫無關聯（q1 問故事、q2 問受眾、q3 問風格）
❌ 太抽象的問題（「你覺得最重要的是什麼？」→ 答案也會抽象）
❌ 跟腳本內容無關的問題（「你想在哪個平台發？」「配什麼音樂？」）
❌ 沒有圍繞觀眾痛點的問題（問了半天跟觀眾會遇到的困境無關）

${videoSettings.shootingType === 'behind_camera' ? '### 藏鏡人類型的問題調整：\n- q1：「出鏡者在這個主題上有什麼讓人意外的真實經歷？」\n- q2：「接續那個經歷，藏鏡人可以從哪個角度追問，讓出鏡者講出具體方法？」\n- q3：「觀眾看完這段對話，應該能馬上做到什麼？」' : ''}
${videoSettings.shootingType === 'acting' ? '### 演戲類型的問題調整：\n- q1：「這個情境劇的起因是什麼？角色之間的衝突從哪裡開始？」\n- q2：「劇情的轉折在哪裡？觀眾會在哪一刻被反轉？」\n- q3：「看完這個短劇，觀眾應該得到什麼啟發？」' : ''}

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
        analysis: "我看了你的設定，讓我幫你把腳本做得更有料！以下幾題都是可選的，回答越多腳本越好。",
        questions: [
          {
            id: "q1",
            question: "關於這個主題，你有沒有一段印象深刻的真實經歷？越具體越好（時間、數字、過程）",
            placeholder: "例如：三年前我花了50萬投資，結果全虧了，那時候每天失眠...",
            why: "真實故事會成為腳本開頭的 HOOK，吸引觀眾看下去",
            suggestions: [
              "剛入行的時候踩了很多坑，花了不少冤枉錢才學到教訓",
              "有一次遇到很大的挫折，差點想放棄，後來靠一個方法撐過來了",
            ]
          },
          {
            id: "q2",
            question: "在那段經歷之後，你發現了什麼關鍵方法或觀念，讓事情開始好轉？",
            placeholder: "例如：後來我改變了一個觀念，開始用定期定額的方式，三個月就回血了...",
            why: "這會成為腳本中段的乾貨，讓觀眾覺得有學到東西",
            suggestions: [
              "後來改了一個做法，結果效果出乎意料的好",
              "有前輩教了我一個觀念，從此完全改變了我的做法",
            ]
          },
          {
            id: "q3",
            question: "如果觀眾遇到跟你一樣的情況，你會建議他第一步先做什麼？",
            placeholder: "例如：先把每月開銷列出來，找到最大的漏洞...",
            why: "這會成為腳本結尾的行動呼籲，讓觀眾看完有東西可以馬上做",
            suggestions: [
              "先搞清楚一個最基本的觀念，很多人這一步就搞錯了",
              "不用想太多，先從最簡單的一件事開始做就好",
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
