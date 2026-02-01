// 輸出格式模組 - 精簡版 JSON 結構定義
// 約 400 字，每次必送

export const OUTPUT_FORMAT = `## 輸出格式（JSON，必須完整）

{
  "versions": [
    {
      "id": "A",
      "style": "版本名稱（如：情緒張力版、輕鬆搞笑版）",
      "styleDescription": "版本特色說明（20字內）",
      "framework": "使用的框架（HOOK-CONTENT-CTA / PAS / 故事三幕式 / 清單式 / 問答對話式）",
      "script": {
        "title": "吸睛標題（含 emoji，要有懸念或利益點）",
        "subtitle": "副標題或 hashtag 建議",
        "totalDuration": "預估總時長",
        "pacing": "節奏建議（快/中/慢）",
        "segments": [
          {
            "segmentId": 1,
            "segmentName": "段落名稱",
            "timeRange": "0-3秒",
            "duration": "3秒",
            "visual": "畫面描述（人物動作、表情、場景、機位）",
            "voiceover": "口播內容（⚠️ 藏鏡人類型必須用【藏鏡人】【出鏡者】對話格式！每段至少50字以上！）",
            "textOverlay": "螢幕字卡內容",
            "effect": "特效/轉場",
            "sound": "音效/音樂提示",
            "emotionalBeat": "這段要傳達的情緒"
          }
        ],
        "bgm": {
          "style": "音樂風格",
          "mood": "情緒氛圍",
          "suggestions": ["推薦曲目或關鍵字"]
        },
        "cta": "結尾呼籲（要自然不硬）"
      },
      "shootingTips": ["拍攝建議1", "拍攝建議2"],
      "editingTips": ["剪輯建議"],
      "equipmentNeeded": ["需要的器材"],
      "alternativeHooks": ["備選 HOOK 1", "備選 HOOK 2"]
    }
  ],
  "generalTips": {
    "beforeShooting": ["拍攝前準備事項"],
    "duringEditing": ["剪輯時注意事項"]
  }
}

### voiceover 欄位注意事項
- 每個 segment 的 voiceover 都要夠長、夠具體！不能只有一兩句
- 口播型：自然口語，像跟朋友聊天
- 藏鏡人型：必須用【藏鏡人】和【出鏡者】的對話格式，每段包含多輪問答
- 演戲型：用【角色名】標示台詞
- voiceover 是腳本最重要的部分，內容要豐富、有乾貨、有細節！`
