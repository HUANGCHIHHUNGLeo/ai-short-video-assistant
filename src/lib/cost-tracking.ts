// API 成本追蹤服務
import { createServiceClient } from '@/lib/supabase/server'

// OpenAI 模型價格（每 1000 tokens，單位：USD）
// 價格來源：https://openai.com/pricing（2024 年 1 月）
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // GPT-4o
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-2024-08-06': { input: 0.0025, output: 0.01 },
  'gpt-4o-2024-11-20': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o-mini-2024-07-18': { input: 0.00015, output: 0.0006 },

  // GPT-4 Turbo
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
  'gpt-4-1106-preview': { input: 0.01, output: 0.03 },

  // GPT-4
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-32k': { input: 0.06, output: 0.12 },

  // GPT-3.5 Turbo
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'gpt-3.5-turbo-0125': { input: 0.0005, output: 0.0015 },
  'gpt-3.5-turbo-1106': { input: 0.001, output: 0.002 },

  // Claude 模型（Anthropic）
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  'claude-3-5-haiku-20241022': { input: 0.001, output: 0.005 },
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
}

// 美元轉台幣匯率（可設為環境變數）
const USD_TO_TWD = parseFloat(process.env.USD_TO_TWD_RATE || '32')

export interface CostTrackingInput {
  userId?: string
  featureType: 'script' | 'carousel' | 'positioning' | 'copy_optimizer' | 'topic_ideas'
  modelName: string
  inputTokens: number
  outputTokens: number
  generationId?: string
}

export interface CostResult {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
  costTwd: number
}

// 計算成本
export function calculateCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number
): CostResult {
  const pricing = MODEL_PRICING[modelName] || MODEL_PRICING['gpt-4o']

  const inputCost = (inputTokens / 1000) * pricing.input
  const outputCost = (outputTokens / 1000) * pricing.output
  const totalCostUsd = inputCost + outputCost
  const totalCostTwd = totalCostUsd * USD_TO_TWD

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    costUsd: Math.round(totalCostUsd * 1000000) / 1000000, // 保留 6 位小數
    costTwd: Math.round(totalCostTwd * 100) / 100, // 保留 2 位小數
  }
}

// 記錄 API 成本到資料庫
export async function trackApiCost(input: CostTrackingInput): Promise<CostResult | null> {
  try {
    const cost = calculateCost(input.modelName, input.inputTokens, input.outputTokens)

    const supabase = createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('api_cost_logs') as any).insert({
      user_id: input.userId || null,
      feature_type: input.featureType,
      model_name: input.modelName,
      input_tokens: cost.inputTokens,
      output_tokens: cost.outputTokens,
      total_tokens: cost.totalTokens,
      cost_usd: cost.costUsd,
      cost_twd: cost.costTwd,
      generation_id: input.generationId || null,
    })

    if (error) {
      console.error('Error tracking API cost:', error)
    }

    return cost
  } catch (error) {
    console.error('Error in trackApiCost:', error)
    return null
  }
}

// 取得模型價格資訊
export function getModelPricing(modelName: string) {
  return MODEL_PRICING[modelName] || MODEL_PRICING['gpt-4o']
}

// 取得所有支援的模型列表
export function getSupportedModels() {
  return Object.keys(MODEL_PRICING)
}
