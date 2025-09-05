import { z } from 'zod';
import { logger } from '../logger';

// AI provider types
export type AIProvider = 'openai' | 'anthropic' | 'mock';

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

export interface AIProviderConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
}

// AI response schema for validation
const aiResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }).optional(),
  model: z.string(),
  finishReason: z.string().optional(),
});

export abstract class BaseAIProvider {
  protected config: AIProviderConfig;
  protected logger = logger.withContext({ component: 'ai-provider' });

  constructor(config: AIProviderConfig = {}) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  abstract generate(request: AIRequest): Promise<AIResponse>;
  abstract getProviderName(): string;
}

export class OpenAIProvider extends BaseAIProvider {
  getProviderName(): string {
    return 'openai';
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model || 'gpt-4',
          messages: [
            ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
            { role: 'user', content: request.prompt }
          ],
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 1000,
        }),
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      const choice = data.choices[0];

      return {
        content: choice.message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        model: data.model,
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      this.logger.error('OpenAI API call failed', error);
      throw error;
    }
  }
}

export class AnthropicProvider extends BaseAIProvider {
  getProviderName(): string {
    return 'anthropic';
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: request.model || 'claude-3-sonnet-20240229',
          system: request.systemPrompt,
          messages: [{ role: 'user', content: request.prompt }],
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 1000,
        }),
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;

      return {
        content: data.content[0].text,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        model: data.model,
        finishReason: data.stop_reason,
      };
    } catch (error) {
      this.logger.error('Anthropic API call failed', error);
      throw error;
    }
  }
}

export class MockAIProvider extends BaseAIProvider {
  getProviderName(): string {
    return 'mock';
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const mockResponses = [
      "This is a mock AI response for testing purposes.",
      "I'm a simulated AI assistant helping with AtlasIT platform development.",
      "Mock response: Your request has been processed successfully.",
      "This is a placeholder response from the mock AI provider.",
    ];

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

    return {
      content: randomResponse,
      usage: {
        promptTokens: request.prompt.length / 4, // Rough token estimation
        completionTokens: randomResponse.length / 4,
        totalTokens: (request.prompt.length + randomResponse.length) / 4,
      },
      model: 'mock-model',
      finishReason: 'stop',
    };
  }
}

export class AIService {
  private readonly provider: BaseAIProvider;
  private readonly logger = logger.withContext({ component: 'ai-service' });

  constructor(provider: AIProvider = 'mock', config: AIProviderConfig = {}) {
    switch (provider) {
      case 'openai':
        this.provider = new OpenAIProvider(config);
        break;
      case 'anthropic':
        this.provider = new AnthropicProvider(config);
        break;
      case 'mock':
      default:
        this.provider = new MockAIProvider(config);
        break;
    }
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    this.logger.info('Generating AI response', {
      provider: this.provider.getProviderName(),
      model: request.model,
      promptLength: request.prompt.length,
    });

    try {
      const startTime = Date.now();
      const response = await this.provider.generate(request);
      const duration = Date.now() - startTime;

      this.logger.info('AI response generated successfully', {
        duration,
        responseLength: response.content.length,
        model: response.model,
      });

      return response;
    } catch (error) {
      this.logger.error('AI generation failed', error, {
        provider: this.provider.getProviderName(),
        prompt: request.prompt.substring(0, 100) + '...',
      });
      throw error;
    }
  }

  getProviderName(): string {
    return this.provider.getProviderName();
  }
}

// Export singleton instance with mock provider by default
export const aiService = new AIService('mock');
