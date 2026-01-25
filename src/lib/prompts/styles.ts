// 風格與情緒模組 - 根據用戶選擇載入對應指引
// 從 route.ts 移出，統一管理

export type ContentStyle = 'professional' | 'friendly' | 'energetic' | 'humorous' | 'storytelling' | 'authoritative' | 'relatable'
export type EmotionalTone = 'exciting' | 'calm' | 'funny' | 'serious' | 'inspiring' | 'curious' | 'relatable'
export type VideoGoal = 'awareness' | 'engagement' | 'trust' | 'conversion' | 'education' | 'entertainment'

// 內容風格對應說明
export const CONTENT_STYLES: Record<ContentStyle, string> = {
  professional: "專業但不無聊 - 像厲害的學長姐在教你，有料但不會讓人想睡。用案例和經驗說話，不要用教科書語氣",
  friendly: "親切自然 - 像好朋友在聊天分享，會說「欸我跟你說」「對啊我也覺得」。不要裝熟或太刻意親近",
  energetic: "有活力但不浮誇 - 語氣明快、有節奏感，但不是直銷或電視購物那種。用語氣帶動情緒，不是用誇張的詞",
  humorous: "幽默自嘲型 - 會吐槽、會講幹話，但有乾貨。笑點要自然不要硬擠，可以自嘲但不要貶低自己",
  storytelling: "說故事型 - 會鋪陳、會製造懸念，讓人想聽下去。用「後來你猜怎樣」「重點來了」帶節奏",
  authoritative: "專家型但不說教 - 用數據、案例、經驗建立權威感。語氣篤定但不要變成「你一定要」「千萬不要」",
  relatable: "共鳴型 - 用具體場景描述觀眾處境（『加班到 11 點回家只想躺著』）。讓人覺得你懂他，但不要每次都用『我以前也這樣』"
}

// 情緒基調對應說明
export const EMOTIONAL_TONES: Record<EmotionalTone, string> = {
  exciting: "興奮激動 - 語速稍快、語氣上揚，但不要像直銷或電視購物那麼誇張。用「超扯的是」「然後你猜怎樣」帶出驚喜感，不要用「震驚」「太神了」「你知道嗎」這種假掰或老套的詞",
  calm: "平靜舒服 - 像深夜跟朋友聊天的語氣，不急不徐，偶爾停頓。適合分享心得、反思、生活感悟。不要變成催眠或唸經",
  funny: "搞笑幽默 - 用自嘲、吐槽、誇張對比製造笑點，但要自然不刻意。可以講幹話但要有料，不要硬要搞笑變得很尷尬",
  serious: "認真嚴肅 - 語氣穩重但不要變成說教或唸課文。用事實和案例說服人，不要用「你一定要」「千萬不要」這種命令句",
  inspiring: "激勵人心 - 用自身經歷或真實案例帶出啟發，不要喊口號或講心靈雞湯。重點是讓人覺得「他可以我也可以」，不是「你一定要加油」",
  curious: "好奇引發探索 - 用懸念和假設句勾起興趣，像「如果你是...」「我本來以為...結果」。不要用「你知道嗎」「你有沒有想過」「欸你知道嗎」這種老套問句開頭",
  relatable: "引發共鳴 - 用具體生活場景描述觀眾的處境（『加班到 11 點回家只想躺著』而不是『很累』）。讓人覺得『對，就是在說我』，但不要每次都用『我以前也這樣』"
}

// 影片目標對應說明
export const VIDEO_GOALS: Record<VideoGoal, string> = {
  awareness: "讓更多人認識你，擴大曝光",
  engagement: "要讓人想留言互動，創造討論",
  trust: "建立專業信任感，展現專業度",
  conversion: "引導私訊或購買，導流變現",
  education: "教學傳遞價值，建立專業形象",
  entertainment: "純娛樂，增加好感度"
}

// 演員人數對應說明
export const CAST_COUNTS: Record<string, string> = {
  solo: "1人（自己拍）",
  duo: "2人（需要一個搭檔）",
  group: "3人以上（小團隊）",
  flexible: "彈性（可多可少）"
}

/**
 * 取得內容風格說明
 */
export function getContentStyle(style: string): string {
  return CONTENT_STYLES[style as ContentStyle] || CONTENT_STYLES.friendly
}

/**
 * 取得情緒基調說明
 */
export function getEmotionalTone(tone: string): string {
  return EMOTIONAL_TONES[tone as EmotionalTone] || EMOTIONAL_TONES.calm
}

/**
 * 取得影片目標說明
 */
export function getVideoGoal(goal: string): string {
  return VIDEO_GOALS[goal as VideoGoal] || VIDEO_GOALS.awareness
}

/**
 * 取得演員人數說明
 */
export function getCastCount(count: string): string {
  return CAST_COUNTS[count] || CAST_COUNTS.solo
}

// 版本風格建議（用於生成多版本腳本）
export const VERSION_STYLES = `版本風格建議（每個版本都要有乾貨！風格不同但價值都要有）：
- 版本 A：情緒張力版 - 用真實經歷的數字和轉折製造衝擊（「第一年虧了 50 萬」「後來我改了一件事」）
- 版本 B：輕鬆幽默版 - 用自嘲和吐槽帶出實用建議（「我以前也這樣蠢，後來學到...」）
- 版本 C：乾貨教學版 - 直接給步驟和方法（「三個步驟：第一...第二...第三...」）

⚠️ 重要：不管哪種風格，觀眾看完都要能學到東西或有收穫！
- 情緒張力版 → 要有「我怎麼解決的」
- 輕鬆幽默版 → 笑完要有「原來可以這樣」
- 乾貨教學版 → 要有「馬上能用的方法」`

export const VERSION_STYLES_EXTENDED = `版本風格建議（每個版本都要有乾貨！風格不同但價值都要有）：
- 版本 A：情緒張力版 - 用真實經歷的數字和轉折製造衝擊（「第一年虧了 50 萬」「後來我改了一件事」）
- 版本 B：輕鬆幽默版 - 用自嘲和吐槽帶出實用建議（「我以前也這樣蠢，後來學到...」）
- 版本 C：乾貨教學版 - 直接給步驟和方法（「三個步驟：第一...第二...第三...」）
- 版本 D：故事敘事版 - 用具體故事帶出啟發（「有個客戶跟我說...結果...」）
- 版本 E：互動討論版 - 拋出爭議觀點引發討論（「我覺得 ____ 根本沒用，因為...」）

⚠️ 重要：不管哪種風格，觀眾看完都要能學到東西或有收穫！
- 情緒張力版 → 要有「我怎麼解決的」
- 輕鬆幽默版 → 笑完要有「原來可以這樣」
- 乾貨教學版 → 要有「馬上能用的方法」
- 故事敘事版 → 要有「我學到什麼」
- 互動討論版 → 要有「為什麼我這樣想」`
