/**
 * AI Provider Abstraction with Fallback Support
 */

import OpenAI from "openai";
import { getCircuitBreaker } from "./circuit-breaker";

export interface AIProvider {
  name: string;
  analyze(prompt: string, systemPrompt: string): Promise<string>;
}

class OpenAIProvider implements AIProvider {
  name = "openai";
  private client: OpenAI;
  private circuitBreaker = getCircuitBreaker("openai-provider");

  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    });
  }

  async analyze(prompt: string, systemPrompt: string): Promise<string> {
    return await this.circuitBreaker.execute(async () => {
      const response = await this.client.chat.completions.create(
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: "json_object" },
        },
        { timeout: 10000 }
      );

      return response.choices[0]?.message?.content || "";
    });
  }
}

class LocalLLMProvider implements AIProvider {
  name = "local-llm";

  async analyze(prompt: string, systemPrompt: string): Promise<string> {
    // Fallback to simple heuristics
    return JSON.stringify({
      sentimentScore: 0,
      sentimentLabel: "neutral",
      suggestedCategoryId: null,
      summary: "Feedback received and queued for manual review.",
      priorityScore: 0.5,
      tags: ["needs-review"],
    });
  }
}

export class AIProviderManager {
  private providers: AIProvider[] = [];
  private currentProviderIndex = 0;

  constructor() {
    this.providers.push(new OpenAIProvider());
    this.providers.push(new LocalLLMProvider());
  }

  async analyzeWithFallback(prompt: string, systemPrompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[this.currentProviderIndex];
      try {
        console.log(`[AIProviderManager] Attempting analysis with ${provider.name}`);
        const result = await provider.analyze(prompt, systemPrompt);
        return result;
      } catch (error: any) {
        console.warn(`[AIProviderManager] ${provider.name} failed:`, error.message);
        lastError = error;
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
      }
    }

    throw lastError || new Error("All AI providers failed");
  }
}

export const aiProviderManager = new AIProviderManager();

