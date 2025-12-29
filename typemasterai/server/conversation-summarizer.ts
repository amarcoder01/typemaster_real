import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Conversation Memory Management Service
 * 
 * Manages conversation context to prevent token limit errors
 * Uses intelligent summarization to maintain context while reducing tokens
 * 
 * Features:
 * - Token estimation
 * - Smart context window management
 * - Conversation summarization
 * - Rolling window with summary
 */

class ConversationSummarizerService {
  // Conservative token limits
  private readonly MAX_CONTEXT_TOKENS = 8000; // Leave room for response
  private readonly SUMMARY_TRIGGER_TOKENS = 6000;
  private readonly KEEP_RECENT_MESSAGES = 6; // Last 3 exchanges

  /**
   * Estimate token count for a message
   * Using rough approximation: 1 token ≈ 4 characters
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate total tokens for message array
   */
  estimateMessageTokens(messages: ChatMessage[]): number {
    let total = 0;
    for (const message of messages) {
      total += this.estimateTokens(message.content);
      total += 4; // Account for role and formatting tokens
    }
    return total;
  }

  /**
   * Check if conversation needs summarization
   */
  needsSummarization(messages: ChatMessage[]): boolean {
    const tokens = this.estimateMessageTokens(messages);
    return tokens > this.SUMMARY_TRIGGER_TOKENS;
  }

  /**
   * Summarize older conversation context
   */
  async summarizeConversation(messages: ChatMessage[]): Promise<string> {
    try {
      console.log(`[ConvMemory] Summarizing ${messages.length} messages`);
      
      // Create conversation text for summarization
      let conversationText = "";
      for (const msg of messages) {
        if (msg.role === "user") {
          conversationText += `User: ${msg.content}\n\n`;
        } else if (msg.role === "assistant") {
          conversationText += `Assistant: ${msg.content}\n\n`;
        }
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use cheaper model for summarization
        messages: [
          {
            role: "system",
            content: `You are a conversation summarizer. Create a concise summary of the conversation that preserves:
1. Key topics discussed
2. Important questions asked
3. Main points from answers
4. Any specific details or context that might be relevant later

Keep the summary under 300 words but include all important context.`,
          },
          {
            role: "user",
            content: `Summarize this conversation:\n\n${conversationText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const summary = response.choices[0]?.message?.content || "";
      console.log(`[ConvMemory] Summary created (${this.estimateTokens(summary)} tokens)`);
      
      return summary;
    } catch (error) {
      console.error("[ConvMemory] Summarization failed:", error);
      // Fallback: create simple summary
      return `Previous conversation covered ${messages.length} messages discussing various topics.`;
    }
  }

  /**
   * Optimize conversation context to fit within token limits
   */
  async optimizeConversationContext(messages: ChatMessage[]): Promise<ChatMessage[]> {
    // Filter out system messages for analysis
    const nonSystemMessages = messages.filter(m => m.role !== "system");
    
    if (nonSystemMessages.length === 0) {
      return messages;
    }

    const totalTokens = this.estimateMessageTokens(nonSystemMessages);
    
    // If within limits, return as-is
    if (totalTokens <= this.SUMMARY_TRIGGER_TOKENS) {
      console.log(`[ConvMemory] Context OK (${totalTokens} tokens)`);
      return messages;
    }

    console.log(`[ConvMemory] Context too long (${totalTokens} tokens), optimizing...`);

    // Keep recent messages
    const recentMessages = nonSystemMessages.slice(-this.KEEP_RECENT_MESSAGES);
    const olderMessages = nonSystemMessages.slice(0, -this.KEEP_RECENT_MESSAGES);

    if (olderMessages.length === 0) {
      // All messages are recent, can't optimize further
      console.log(`[ConvMemory] All messages are recent, truncating oldest`);
      return messages.slice(-(this.KEEP_RECENT_MESSAGES + 1)); // +1 for system message
    }

    // Summarize older messages
    const summary = await this.summarizeConversation(olderMessages);

    // Create optimized message array
    const systemMessage = messages.find(m => m.role === "system");
    const optimizedMessages: ChatMessage[] = [];

    if (systemMessage) {
      optimizedMessages.push(systemMessage);
    }

    // Add summary as a system message
    optimizedMessages.push({
      role: "system",
      content: `# Previous Conversation Summary\n\n${summary}`,
    });

    // Add recent messages
    optimizedMessages.push(...recentMessages);

    const finalTokens = this.estimateMessageTokens(optimizedMessages);
    console.log(`[ConvMemory] Optimized: ${messages.length} → ${optimizedMessages.length} messages (${totalTokens} → ${finalTokens} tokens)`);

    return optimizedMessages;
  }

  /**
   * Smart truncation for emergency cases
   * When summarization fails or isn't fast enough
   */
  emergencyTruncate(messages: ChatMessage[], maxTokens: number = this.MAX_CONTEXT_TOKENS): ChatMessage[]  {
    console.log(`[ConvMemory] Emergency truncation to ${maxTokens} tokens`);
    
    const result: ChatMessage[] = [];
    let currentTokens = 0;

    // Always keep system message if present
    const systemMessage = messages.find(m => m.role === "system");
    if (systemMessage) {
      result.push(systemMessage);
      currentTokens += this.estimateTokens(systemMessage.content);
    }

    // Add messages from most recent backwards
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "system") continue; // Already added

      const messageTokens = this.estimateTokens(message.content);
      
      if (currentTokens + messageTokens <= maxTokens) {
        result.unshift(message); // Add to front since we're going backwards
        currentTokens += messageTokens;
      } else {
        break;
      }
    }

    console.log(`[ConvMemory] Truncated to ${result.length} messages (${currentTokens} tokens)`);
    return result;
  }

  /**
   * Validate message array won't exceed limits
   */
  validateContext(messages: ChatMessage[]): { valid: boolean; tokens: number; maxTokens: number } {
    const tokens = this.estimateMessageTokens(messages);
    const valid = tokens <= this.MAX_CONTEXT_TOKENS;

    return {
      valid,
      tokens,
      maxTokens: this.MAX_CONTEXT_TOKENS,
    };
  }
}

// Singleton instance
export const conversationSummarizer = new ConversationSummarizerService();

export default conversationSummarizer;

