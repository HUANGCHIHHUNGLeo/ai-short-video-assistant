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
export const VERSION_STYLES = `## ⚠️⚠️⚠️ 版本風格建議（每個版本品質必須一樣好！）

### 核心原則：三個版本 = 三個獨立作品！
- ⚠️ 每個版本都是完整、獨立的腳本，不是「好版本 + 兩個湊數的」
- ⚠️ B 和 C 的 voiceover 字數、乾貨密度、故事具體程度，必須跟 A 一樣多！
- ⚠️ 不能把最好的素材全放在 A，B/C 用空泛的話敷衍！每個版本都要用到核心素材！
- ❌ 禁止：A 有具體數字和故事，B/C 只有空泛的道理和雞湯

### 三個版本的差異在「切入角度」，不是品質！
- 版本 A：故事切入 - 從一個真實經歷開場，用故事帶出核心觀點（「三年前我做了一個決定...」）
- 版本 B：觀點切入 - 先丟出一個顛覆認知的觀點，再用事實佐證（「大部分人都搞錯了一件事...」）
- 版本 C：方法切入 - 直接給具體可操作的步驟，用案例說明（「只要做到這三件事...」）

### 品質標準（每個版本都要達到！）：
- ✅ 有具體的數字、案例、方法（不能空泛）
- ✅ voiceover 字數達標（不能比其他版本少）
- ✅ 有完整的故事線或邏輯線（不能虎頭蛇尾）
- ✅ 觀眾看完能學到具體的東西
- ❌ 如果 B 或 C 明顯比 A 短、空泛、敷衍，整組重寫！`

export const VERSION_STYLES_EXTENDED = `## ⚠️⚠️⚠️ 版本風格建議（每個版本品質必須一樣好！）

### 核心原則：五個版本 = 五個獨立作品！
- ⚠️ 每個版本都是完整、獨立的腳本，不是「好版本 + 四個湊數的」
- ⚠️ 每個版本的 voiceover 字數、乾貨密度、故事具體程度必須一樣多！
- ❌ 禁止：A 有具體數字和故事，其他版本只有空泛的話敷衍！

### 五個版本的差異在「切入角度」，不是品質！
- 版本 A：故事切入 - 從一個真實經歷開場，用故事帶出核心觀點（「三年前我做了一個決定...」）
- 版本 B：觀點切入 - 先丟出一個顛覆認知的觀點，再用事實佐證（「大部分人都搞錯了一件事...」）
- 版本 C：方法切入 - 直接給具體可操作的步驟，用案例說明（「只要做到這三件事...」）
- 版本 D：共鳴切入 - 描述觀眾的痛點場景開場，讓人覺得「就是在說我」（「你是不是也遇過...」）
- 版本 E：爭議切入 - 拋出一個違反直覺的觀點引發好奇（「我覺得 ____ 根本沒用，因為...」）

### 品質標準（每個版本都要達到！）：
- ✅ 有具體的數字、案例、方法（不能空泛）
- ✅ voiceover 字數達標（不能比其他版本少）
- ✅ 有完整的故事線或邏輯線（不能虎頭蛇尾）
- ✅ 觀眾看完能學到具體的東西
- ❌ 如果任何版本明顯比 A 短、空泛、敷衍，整組重寫！`
