import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { buildSystemPrompt } from "@/lib/prompts"
import { checkApiAuth, recordUsage, authError, saveGeneration } from "@/lib/auth/api-guard"
import { trackApiCost } from "@/lib/cost-tracking"

// Vercel 超時設定（Hobby 方案最多 60 秒，Pro 方案可到 300 秒）
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // 檢查認證和額度
    const authResult = await checkApiAuth(request, 'script')
    if (!authResult.allowed) {
      return authError(authResult)
    }

    const { creatorBackground, videoSettings, generateVersions = 3, positioningData } = await request.json()

    if (!creatorBackground?.niche || !videoSettings?.topic) {
      return NextResponse.json({ error: "請提供完整的創作者背景和影片設定" }, { status: 400 })
    }

    // 如果有定位報告資料，建立額外的上下文
    let positioningContext = ""
    if (positioningData) {
      positioningContext = `
## 已完成的定位分析（重要！請據此設計腳本）
這位創作者已經完成了專業的定位分析，請根據以下定位報告來設計腳本：

- 定位宣言：${positioningData.positioningStatement || ''}
- 細分領域：${positioningData.niche || ''}
- 獨特價值：${positioningData.uniqueValue || ''}
- 目標受眾：${positioningData.targetAudience?.who || ''} (${positioningData.targetAudience?.age || ''})
- 受眾特徵：${positioningData.targetAudience?.characteristics || ''}
- 受眾痛點：${Array.isArray(positioningData.painPoints) ? positioningData.painPoints.join('、') : ''}
- 內容支柱：${Array.isArray(positioningData.contentPillars) ? positioningData.contentPillars.map((p: { pillar: string }) => p.pillar).join('、') : ''}
- 個人品牌風格：${positioningData.personalBrand?.tone || ''}
- 人設關鍵字：${Array.isArray(positioningData.personaTags) ? positioningData.personaTags.join('、') : ''}

請確保腳本：
1. 符合定位宣言的方向
2. 針對指定的目標受眾說話（用他們的語言、解決他們的問題）
3. 痛點要戳到他們的真實困擾
4. 使用建議的品牌風格和語調
5. 內容主題符合內容支柱方向
`
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const styleMap: Record<string, string> = {
      professional: "專業但不無聊 - 像厲害的學長姐在教你，有料但不會讓人想睡。用案例和經驗說話，不要用教科書語氣",
      friendly: "親切自然 - 像好朋友在聊天分享，會說「欸我跟你說」「對啊我也覺得」。不要裝熟或太刻意親近",
      energetic: "有活力但不浮誇 - 語氣明快、有節奏感，但不是直銷或電視購物那種。用語氣帶動情緒，不是用誇張的詞",
      humorous: "幽默自嘲型 - 會吐槽、會講幹話，但有乾貨。笑點要自然不要硬擠，可以自嘲但不要貶低自己",
      storytelling: "說故事型 - 會鋪陳、會製造懸念，讓人想聽下去。用「後來你猜怎樣」「重點來了」帶節奏",
      authoritative: "專家型但不說教 - 用數據、案例、經驗建立權威感。語氣篤定但不要變成「你一定要」「千萬不要」",
      relatable: "共鳴型 - 用具體場景描述觀眾處境（『加班到 11 點回家只想躺著』）。讓人覺得你懂他，但不要每次都用『我以前也這樣』"
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
      follow: `追蹤導向 - 必須用「預告下集內容」製造期待感
範例：「追蹤我，下集教你 ____」「想知道 ____ 怎麼解決？追蹤看下集」
❌ 禁止：「追蹤我吧」「記得追蹤」（沒給理由）`,
      like: `按讚收藏導向 - 必須給具體的「使用場景」
範例：「存起來，下次 ____ 的時候打開看」「這個方法先存著，遲早用得到」
❌ 禁止：「記得按讚收藏」（沒給理由）`,
      comment: `留言互動導向 - 必須問「觀眾能回答的具體問題」
範例：「你做 ____ 幾年了？留言告訴我」「你遇過最扯的 ____ 是什麼？」「A 還是 B？留言選一個」
❌ 禁止：「留言告訴我你的想法」（太空泛）`,
      share: `分享導向 - 必須「指定轉發對象」
範例：「Tag 那個也在 ____ 的朋友」「分享給你那個 ____ 的同事」
❌ 禁止：「分享給朋友」（沒指定誰）`,
      dm: `私訊導向 - 必須提供「明確的好處」
範例：「私訊『____ 』送你完整攻略」「想要模板？私訊我」
❌ 禁止：「有問題可以私訊我」（太被動）`,
      link: `連結導向 - 必須製造「急迫感或獨家感」
範例：「連結只放三天，要的快點」「完整版在連結，這裡只講 30%」
❌ 禁止：「連結在 bio」（沒給理由點）`,
      save: `收藏導向 - 必須強調「未來會用到」
範例：「這個清單先存著，____ 的時候會救你一命」「收藏起來，下次 ____ 直接照著做」
❌ 禁止：「記得收藏」（沒給場景）`
    }

    const shootingTypeMap: Record<string, string> = {
      talking_head: "口播型 - 真人出鏡對著鏡頭說話，要自然像跟朋友聊天",
      behind_camera: "藏鏡人 - 一人在鏡頭後以觀眾視角提問/吐槽/引導，另一人出鏡回答互動。藏鏡人的聲音入鏡但不露臉，像街訪、IP問答、開箱那種形式。腳本要設計好兩人對話的節奏、提問點和反轉點，讓互動自然有趣",
      voiceover: "純配音 - 只有聲音旁白，畫面是 B-roll 素材、螢幕錄製或圖片輪播，適合不想露臉的創作者。旁白要有節奏感，搭配畫面轉場",
      acting: "演戲/情境劇 - 有劇情、角色、對話，要有衝突和轉折",
      vlog: "Vlog - 生活記錄風格，邊走邊拍邊說，最自然的呈現方式",
      tutorial: "教學示範 - 邊做邊說，步驟清楚，適合知識技能類內容",
      interview: "訪談/對談 - 兩人以上正式對話，有來有往的討論",
      storytime: "說故事 - narrative 敘事，有起承轉合，用故事帶出觀點"
    }

    const castCountMap: Record<string, string> = {
      solo: "1人（自己拍）",
      duo: "2人（需要一個搭檔）",
      group: "3人以上（小團隊）",
      flexible: "彈性（可多可少）"
    }

    const emotionalToneMap: Record<string, string> = {
      exciting: "興奮激動 - 語速稍快、語氣上揚，但不要像直銷或電視購物那麼誇張。用「超扯的是」「然後你猜怎樣」帶出驚喜感，不要用「震驚」「太神了」「你知道嗎」這種假掰或老套的詞",
      calm: "平靜舒服 - 像深夜跟朋友聊天的語氣，不急不徐，偶爾停頓。適合分享心得、反思、生活感悟。不要變成催眠或唸經",
      funny: "搞笑幽默 - 用自嘲、吐槽、誇張對比製造笑點，但要自然不刻意。可以講幹話但要有料，不要硬要搞笑變得很尷尬",
      serious: "認真嚴肅 - 語氣穩重但不要變成說教或唸課文。用事實和案例說服人，不要用「你一定要」「千萬不要」這種命令句",
      inspiring: "激勵人心 - 用自身經歷或真實案例帶出啟發，不要喊口號或講心靈雞湯。重點是讓人覺得「他可以我也可以」，不是「你一定要加油」",
      curious: "好奇引發探索 - 用懸念和假設句勾起興趣，像「如果你是...」「我本來以為...結果」。不要用「你知道嗎」「你有沒有想過」「欸你知道嗎」這種老套問句開頭",
      relatable: "引發共鳴 - 用具體生活場景描述觀眾的處境（『加班到 11 點回家只想躺著』而不是『很累』）。讓人覺得『對，就是在說我』，但不要每次都用『我以前也這樣』"
    }

    // 計算目標字數（每秒 5.5 字，短影音節奏較快）
    const targetDuration = videoSettings.duration || 45
    const targetWordCount = Math.round(targetDuration * 5.5)
    const minWordCount = Math.round(targetWordCount * 0.85)
    const maxWordCount = Math.round(targetWordCount * 1.15)

    const userPrompt = `
請幫我生成 ${generateVersions} 個不同風格的短影音腳本：
${positioningContext}
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

## ⚠️ 根據「${creatorBackground.niche}」產業設計腳本內容
這位創作者是「${creatorBackground.niche}」領域的，腳本內容要：
- 展現這個產業的專業知識和日常
- 用這個產業的真實情境和案例
- 解決這個產業目標受眾的真實問題
- 說話方式符合這個產業的調性

${videoSettings.shootingType === 'talking_head' ? `
## 口播型特別指引
根據「${creatorBackground.niche}」產業，口播內容應該：
- 分享這個領域的實戰經驗和乾貨
- 用具體案例說明，不要講空泛的道理
- 可以講自己遇過的問題、怎麼解決的
- 語氣像在跟同行或有興趣的人聊天
` : ''}${videoSettings.shootingType === 'behind_camera' ? `
## ⚠️ 藏鏡人腳本特別指引（必須遵守！）
這是藏鏡人模式！藏鏡人要根據創作者的「${creatorBackground.niche}」產業來發問。

藏鏡人的角色 = 代替觀眾問問題的人
- 問一般人對「${creatorBackground.niche}」這個產業會有的疑問
- 問外行人好奇的點、可能的誤解、刻板印象
- 用問句引導出鏡者解釋專業內容

根據「${creatorBackground.niche}」產業，藏鏡人可以問：
- 這個工作最辛苦/最爽的是什麼？
- 一般人對你們這行最大的誤解是什麼？
- 你們怎麼處理 XXX 問題？（根據產業痛點）
- 這樣做不會很累/很貴/很花時間嗎？
- 入行多久了？當初怎麼開始的？

⚠️ 藏鏡人絕對不能講旁白式的話！
❌ 禁止：「每天的 XXX 災難，還有誰懂？」
❌ 禁止：「進入 XXX 迷宮！」
❌ 禁止：任何不是問句的話

✅ 藏鏡人只能用短問句：
✅「欸，這個要弄多久？」
✅「真假？那怎麼辦？」
✅「這樣不會很累嗎？」
` : ''}${videoSettings.shootingType === 'voiceover' ? `
## 純配音特別指引
根據「${creatorBackground.niche}」產業，旁白內容應該：
- 用這個產業的真實數據、案例、現象
- 畫面建議要具體（例如：螢幕錄製工作畫面、產品特寫、工作環境）
- 旁白節奏要配合畫面切換
- 用「你看」「這個就是」「重點來了」引導視線
` : ''}${videoSettings.shootingType === 'acting' ? `
## 演戲/情境劇特別指引
根據「${creatorBackground.niche}」產業，情境劇應該：
- 演出這個產業會遇到的真實情境（客戶互動、工作日常、常見問題）
- 角色要符合產業特性（例如：設計師 vs 客戶、工程師 vs PM）
- 對話要自然，像真的會發生的對話
- 有衝突、有轉折、有解決方案
` : ''}${videoSettings.shootingType === 'vlog' ? `
## Vlog 特別指引
根據「${creatorBackground.niche}」產業，Vlog 應該：
- 記錄這個產業的真實工作日常
- 邊做邊說，展現工作過程
- 可以分享遇到的問題、怎麼解決
- 最自然的說話方式，像在自言自語
` : ''}${videoSettings.shootingType === 'tutorial' ? `
## 教學示範特別指引
根據「${creatorBackground.niche}」產業，教學內容應該：
- 教這個領域的實用技巧或知識
- 步驟要清楚，邊做邊說
- 用這個產業的真實案例示範
- 提醒常見錯誤和注意事項
` : ''}${videoSettings.shootingType === 'interview' ? `
## 訪談特別指引
根據「${creatorBackground.niche}」產業，訪談應該：
- 問這個產業的專業問題
- 引導受訪者分享經驗和見解
- 問題要有深度，能挖出乾貨
- 對話要有來有往，不是單向問答
` : ''}${videoSettings.shootingType === 'storytime' ? `
## 說故事特別指引
根據「${creatorBackground.niche}」產業，故事應該：
- 講這個產業真實發生的故事（自己的經歷、客戶案例、業界傳說）
- 有起承轉合，有情緒起伏
- 用具體細節營造畫面感
- 結尾要有啟示或反思
` : ''}

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
2. ⚠️【最最最重要】內容必須有價值！有乾貨！
   - 每個腳本問自己：「觀眾看完能學到什麼？能用什麼？」
   - 必須有：具體方法、真實數字、可執行的步驟、業內知識
   - ❌ 禁止空洞內容：「時間管理很重要」「堅持就會成功」「創業很辛苦」
   - ✅ 要有料：「我每天早上做這三件事：第一...」「用這個方法，我的 ____ 提升了 30%」
3. ⚠️【同樣重要】口播內容要像正常台灣人說話！
   - 每句話都問自己：「我跟朋友聊天會這樣講嗎？」
   - 禁止「打怪」「解謎」「闘關」「升級」這種遊戲化用語（除非主題是遊戲）
   - 禁止「讓我們」「接下來」「首先其次最後」這種簡報用語
   - 句子要短、要自然、要口語
4. 避免無聊開頭，開頭 3 秒要能 HOOK 住觀眾
5. 每個版本要有足夠的 segments 來填滿 ${targetDuration} 秒
6. 每段都要有具體的：畫面描述、口播內容（足夠長！）、字卡、特效、音效
7. 根據拍攝類型調整腳本格式
8. 提供備選 HOOK，讓創作者有更多選擇
9. 每個版本風格要有明顯差異，不只是換標題
10. 最終驗證：把所有 voiceover 字數加總，確保達到 ${minWordCount}-${maxWordCount} 字

## ⚠️ 內容價值檢查（生成後自我檢查！）
- ❌ 只講概念沒給方法 → 加上具體步驟
- ❌ 只有情緒沒有乾貨 → 加上實際建議
- ❌ 講大家都知道的事 → 換成業內人才知道的觀點
- ✅ 觀眾看完會想「這個有用，存起來」→ OK

## ⚠️ 口語自然度檢查（生成後自我檢查！）
- ❌ 聽起來像在念稿 → 重寫
- ❌ 用了「打怪」「解謎」「闘關」等遊戲用語 → 改掉
- ❌ 用了「讓我們」「接下來」「首先」等簡報用語 → 改掉
- ✅ 聽起來像朋友在跟你聊天 → OK

版本風格建議（每個版本都要有乾貨！風格不同但價值都要有）：
- 版本 A：情緒張力版 - 用真實經歷的數字和轉折製造衝擊（「第一年虧了 50 萬」「後來我改了一件事」）
- 版本 B：輕鬆幽默版 - 用自嘲和吐槽帶出實用建議（「我以前也這樣蠢，後來學到...」）
- 版本 C：乾貨教學版 - 直接給步驟和方法（「三個步驟：第一...第二...第三...」）
${generateVersions > 3 ? '- 版本 D：故事敘事版 - 用具體故事帶出啟發（「有個客戶跟我說...結果...」）\n- 版本 E：互動討論版 - 拋出爭議觀點引發討論（「我覺得 ____ 根本沒用，因為...」）' : ''}

⚠️ 重要：不管哪種風格，觀眾看完都要能學到東西或有收穫！
- 情緒張力版 → 要有「我怎麼解決的」
- 輕鬆幽默版 → 笑完要有「原來可以這樣」
- 乾貨教學版 → 要有「馬上能用的方法」
- 故事敘事版 → 要有「我學到什麼」
- 互動討論版 → 要有「為什麼我這樣想」

請用 JSON 格式輸出。`

    // 使用模組化 prompt - 根據拍攝類型動態組合
    const systemPrompt = buildSystemPrompt({
      shootingType: videoSettings.shootingType || 'talking_head',
      includeFrameworks: true,
    })

    // 根據訂閱等級設定 token 上限：付費版可生成更完整的內容
    const isPremium = authResult.tier === 'pro' || authResult.tier === 'lifetime'
    const maxTokens = isPremium ? 16000 : 12000

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.85,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content || "{}"

    try {
      const result = JSON.parse(content)

      // 記錄使用量
      await recordUsage(request, authResult.userId, 'script')

      // 追蹤 API 成本
      if (completion.usage) {
        await trackApiCost({
          userId: authResult.userId || undefined,
          featureType: 'script',
          modelName: 'gpt-4o',
          inputTokens: completion.usage.prompt_tokens,
          outputTokens: completion.usage.completion_tokens,
        })
      }

      // Pro/Lifetime 用戶保存生成記錄到 generations 表
      const isPremium = authResult.tier === 'pro' || authResult.tier === 'lifetime'
      let generationId: string | null = null
      if (isPremium && result.versions?.length > 0) {
        generationId = await saveGeneration({
          userId: authResult.userId,
          featureType: 'script',
          title: `腳本 - ${videoSettings.topic}（${result.versions.length}版本）`,
          inputData: { creatorBackground, videoSettings, generateVersions },
          outputData: result,
          modelUsed: 'gpt-4o',
          tokensUsed: completion.usage?.total_tokens
        })
      }

      return NextResponse.json({
        ...result,
        generationId,
        _creditConsumed: true,
        _featureType: 'script',
        _remainingCredits: authResult.remainingCredits,
        _isGuest: authResult.isGuest
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
