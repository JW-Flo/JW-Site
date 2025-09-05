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
export declare abstract class BaseAIProvider {
    protected config: AIProviderConfig;
    protected logger: import("..").Logger;
    constructor(config?: AIProviderConfig);
    abstract generate(request: AIRequest): Promise<AIResponse>;
    abstract getProviderName(): string;
}
export declare class OpenAIProvider extends BaseAIProvider {
    getProviderName(): string;
    generate(request: AIRequest): Promise<AIResponse>;
}
export declare class AnthropicProvider extends BaseAIProvider {
    getProviderName(): string;
    generate(request: AIRequest): Promise<AIResponse>;
}
export declare class MockAIProvider extends BaseAIProvider {
    getProviderName(): string;
    generate(request: AIRequest): Promise<AIResponse>;
}
export declare class AIService {
    private readonly provider;
    private readonly logger;
    constructor(provider?: AIProvider, config?: AIProviderConfig);
    generate(request: AIRequest): Promise<AIResponse>;
    getProviderName(): string;
}
export declare const aiService: AIService;
//# sourceMappingURL=index.d.ts.map