// 腳本框架模組 - 可選，讓 AI 根據內容自己選
// 每個約 60-80 字

export const FRAMEWORKS: Record<string, string> = {
  'hook-content-cta': `## HOOK-CONTENT-CTA 框架
- HOOK（0-3秒）：用痛點/懸念/衝擊感抓住注意力
- CONTENT（4秒-結尾前）：核心內容，要有節奏和轉折
- CTA（最後3秒）：呼籲行動，但要自然不硬推`,

  'pas': `## PAS 痛點框架
- Problem（問題）：點出觀眾的痛點
- Agitate（加劇）：放大痛點，製造焦慮
- Solution（解法）：提供解決方案`,

  'story': `## 故事三幕式框架
- 第一幕：設定情境、帶入
- 第二幕：衝突/轉折/高潮
- 第三幕：結局/啟示/CTA`,

  'list': `## 清單式框架
- 開場 HOOK
- 第一點（最吸引人的放第一個）
- 第二點
- 第三點
- 彩蛋/CTA`,
}

// 所有框架的簡短列表（讓 AI 知道有哪些選項）
export const FRAMEWORKS_LIST = `## 可選用的腳本框架
請根據主題選擇最適合的框架：
1. HOOK-CONTENT-CTA：適合教學、乾貨分享
2. PAS 痛點框架：適合解決問題、銷售類
3. 故事三幕式：適合故事、經歷分享
4. 清單式：適合懶人包、多點整理`
