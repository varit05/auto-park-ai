/**
 * AutoPark AI - AI Service
 * Handles AI/LLM integration for intelligent parking decisions
 */

import { getTimeOfDay, getDayType } from "@utils/helpers";
import type { AIResponse, Location, ParkingSession } from "@app-types/index";

// AI Provider types
type AIProvider = "local" | "openai" | "ollama" | "claude" | "mock";

interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  apiEndpoint?: string;
  model?: string;
}

// System prompt for the AI
const SYSTEM_PROMPT = `You are an intelligent parking assistant that helps users determine the optimal parking duration based on various contextual factors.

Consider the following factors when making recommendations:
1. Time of day (morning, afternoon, evening, night)
2. Day type (weekday vs weekend)
3. Location type and typical parking patterns
4. User's historical parking behavior (if available)

Provide recommendations in the following format:
- suggestedDuration: Duration in minutes
- confidence: Confidence level (0-100)
- reasoning: Explanation for the recommendation
- alternativeOptions: Other viable options with their reasoning`;

class AIService {
  private config: AIConfig;
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private isInitialized = false;

  constructor() {
    this.config = {
      provider: "mock", // Default to mock for demo
      model: "gpt-3.5-turbo",
    };
  }

  /**
   * Initialize AI service with configuration
   */
  initialize(config: Partial<AIConfig>): boolean {
    try {
      this.config = { ...this.config, ...config };
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Error initializing AI service:", error);
      return false;
    }
  }

  /**
   * Get AI configuration
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }

  /**
   * Check if AI service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Suggest parking duration based on context
   */
  async suggestDuration(context: {
    location?: Location;
    currentDuration?: number;
    historicalSessions?: ParkingSession[];
    timeOfDay?: string;
    dayType?: string;
  }): Promise<AIResponse> {
    try {
      // Build context for the AI
      const userMessage = this.buildPrompt(context);

      // Get response based on provider
      switch (this.config.provider) {
        case "mock":
          return this.getMockResponse(context);
        case "ollama":
          return await this.queryOllama(userMessage);
        case "openai":
          return await this.queryOpenAI(userMessage);
        case "claude":
          return await this.queryClaude(userMessage);
        default:
          return this.getMockResponse(context);
      }
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      // Return a sensible default
      return {
        suggestedDuration: context.currentDuration || 120,
        confidence: 50,
        reasoning: "Using default duration as AI suggestion failed.",
      };
    }
  }

  /**
   * Build prompt from context
   */
  private buildPrompt(context: {
    location?: Location;
    currentDuration?: number;
    historicalSessions?: ParkingSession[];
    timeOfDay?: string;
    dayType?: string;
  }): string {
    const timeOfDay = context.timeOfDay || getTimeOfDay();
    const dayType = context.dayType || getDayType();

    let prompt = `Current context:\n`;
    prompt += `- Time of day: ${timeOfDay}\n`;
    prompt += `- Day type: ${dayType}\n`;

    if (context.location) {
      prompt += `- Location: ${context.location.name}\n`;
      if (context.location.parkingZone) {
        prompt += `- Parking zone: ${context.location.parkingZone}\n`;
      }
    }

    if (context.currentDuration) {
      prompt += `- Default duration: ${context.currentDuration} minutes\n`;
    }

    if (context.historicalSessions && context.historicalSessions.length > 0) {
      const avgDuration =
        context.historicalSessions.reduce(
          (sum, session) => sum + session.duration,
          0
        ) / context.historicalSessions.length;
      prompt += `- Average historical duration: ${Math.round(avgDuration)} minutes\n`;
      prompt += `- Number of historical sessions: ${context.historicalSessions.length}\n`;
    }

    prompt += `\nBased on this context, what is the optimal parking duration?`;

    return prompt;
  }

  /**
   * Get mock response (for demo/testing)
   */
  private getMockResponse(context: {
    location?: Location;
    currentDuration?: number;
    historicalSessions?: ParkingSession[];
  }): AIResponse {
    const timeOfDay = getTimeOfDay();
    const dayType = getDayType();
    const baseDuration = context.currentDuration || 120;

    // Adjust duration based on time and day
    let suggestedDuration = baseDuration;
    let reasoning = `Based on your default duration of ${baseDuration} minutes`;

    // Time-based adjustments
    if (timeOfDay === "morning" && dayType === "weekday") {
      suggestedDuration = Math.max(baseDuration, 480); // 8 hours for work
      reasoning = "Morning on a weekday - suggesting full work day parking";
    } else if (timeOfDay === "evening" && dayType === "weekend") {
      suggestedDuration = Math.min(baseDuration, 180); // 3 hours for evening out
      reasoning = "Evening on weekend - suggesting shorter duration for leisure";
    } else if (timeOfDay === "night") {
      suggestedDuration = Math.min(baseDuration, 60); // 1 hour for quick stops
      reasoning = "Night time - suggesting shorter duration";
    }

    // Historical adjustments
    if (context.historicalSessions && context.historicalSessions.length >= 3) {
      const avgDuration =
        context.historicalSessions.reduce(
          (sum, session) => sum + session.duration,
          0
        ) / context.historicalSessions.length;
      
      // Blend historical average with base duration
      suggestedDuration = Math.round((suggestedDuration + avgDuration) / 2);
      reasoning += `. Adjusted based on your average of ${Math.round(avgDuration)} minutes`;
    }

    return {
      suggestedDuration,
      confidence: 75,
      reasoning,
      alternativeOptions: [
        {
          duration: Math.round(suggestedDuration * 0.5),
          reason: "Shorter option if you're in a hurry",
        },
        {
          duration: Math.round(suggestedDuration * 1.5),
          reason: "Longer option to avoid extensions",
        },
      ],
    };
  }

  /**
   * Query Ollama (local LLM)
   */
  private async queryOllama(userMessage: string): Promise<AIResponse> {
    const endpoint = this.config.apiEndpoint || "http://localhost:11434/api/generate";
    const model = this.config.model || "llama2";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt: `${SYSTEM_PROMPT}\n\n${userMessage}`,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data.response);
    } catch (error) {
      console.error("Error querying Ollama:", error);
      throw error;
    }
  }

  /**
   * Query OpenAI API
   */
  private async queryOpenAI(userMessage: string): Promise<AIResponse> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || "gpt-3.5-turbo",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      return this.parseAIResponse(content);
    } catch (error) {
      console.error("Error querying OpenAI:", error);
      throw error;
    }
  }

  /**
   * Query Claude API
   */
  private async queryClaude(userMessage: string): Promise<AIResponse> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error("Claude API key not configured");
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.config.model || "claude-3-sonnet-20240229",
          max_tokens: 1024,
          messages: [
            { role: "user", content: `${SYSTEM_PROMPT}\n\n${userMessage}` },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0]?.text || "";
      return this.parseAIResponse(content);
    } catch (error) {
      console.error("Error querying Claude:", error);
      throw error;
    }
  }

  /**
   * Parse AI response text into structured AIResponse
   */
  private parseAIResponse(text: string): AIResponse {
    // Try to parse as JSON first
    try {
      // Extract JSON from the response if it's embedded in text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          suggestedDuration: parsed.suggestedDuration || 120,
          confidence: parsed.confidence || 75,
          reasoning: parsed.reasoning || "AI-generated suggestion",
          alternativeOptions: parsed.alternativeOptions,
        };
      }
    } catch (e) {
      // If JSON parsing fails, extract duration from text
    }

    // Fallback: Try to extract duration from text
    const durationMatch = text.match(/(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i);
    let suggestedDuration = 120; // Default

    if (durationMatch) {
      let value = parseInt(durationMatch[1]);
      // Check if it's in hours
      if (text.toLowerCase().includes("hour") || text.toLowerCase().includes("hr")) {
        value *= 60;
      }
      suggestedDuration = value;
    }

    return {
      suggestedDuration,
      confidence: 70,
      reasoning: text.substring(0, 200), // Limit reasoning length
    };
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): Array<{ role: string; content: string }> {
    return [...this.conversationHistory];
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;