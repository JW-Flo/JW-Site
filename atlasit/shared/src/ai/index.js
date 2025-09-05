import { z } from 'zod';
import { logger } from '../logger';
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
export class BaseAIProvider {
    config;
    logger = logger.withContext({ component: 'ai-provider' });
    constructor(config = {}) {
        this.config = {
            timeout: 30000,
            ...config,
        };
    }
}
export class OpenAIProvider extends BaseAIProvider {
    getProviderName() {
        return 'openai';
    }
    async generate(request) {
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
                signal: AbortSignal.timeout(this.config.timeout),
            });
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
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
        }
        catch (error) {
            this.logger.error('OpenAI API call failed', error);
            throw error;
        }
    }
}
export class AnthropicProvider extends BaseAIProvider {
    getProviderName() {
        return 'anthropic';
    }
    async generate(request) {
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
                signal: AbortSignal.timeout(this.config.timeout),
            });
            if (!response.ok) {
                throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
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
        }
        catch (error) {
            this.logger.error('Anthropic API call failed', error);
            throw error;
        }
    }
}
export class MockAIProvider extends BaseAIProvider {
    getProviderName() {
        return 'mock';
    }
    async generate(request) {
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
    provider;
    logger = logger.withContext({ component: 'ai-service' });
    constructor(provider = 'mock', config = {}) {
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
    async generate(request) {
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
        }
        catch (error) {
            this.logger.error('AI generation failed', error, {
                provider: this.provider.getProviderName(),
                prompt: request.prompt.substring(0, 100) + '...',
            });
            throw error;
        }
    }
    getProviderName() {
        return this.provider.getProviderName();
    }
}
// Export singleton instance with mock provider by default
export const aiService = new AIService('mock');
//# sourceMappingURL=index.js.map