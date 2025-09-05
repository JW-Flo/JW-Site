import { z } from 'zod';
export declare const baseEnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "staging", "production"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV?: "development" | "staging" | "production";
    LOG_LEVEL?: "error" | "debug" | "info" | "warn";
}, {
    NODE_ENV?: "development" | "staging" | "production";
    LOG_LEVEL?: "error" | "debug" | "info" | "warn";
}>;
export declare const databaseEnvSchema: z.ZodObject<{
    DATABASE_URL: z.ZodString;
    DB_MAX_CONNECTIONS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    DATABASE_URL?: string;
    DB_MAX_CONNECTIONS?: number;
}, {
    DATABASE_URL?: string;
    DB_MAX_CONNECTIONS?: string;
}>;
export declare const authEnvSchema: z.ZodObject<{
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    API_ALLOWED_KEYS: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    API_ALLOWED_KEYS?: string;
}, {
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    API_ALLOWED_KEYS?: string;
}>;
export declare const aiEnvSchema: z.ZodObject<{
    OPENAI_API_KEY: z.ZodOptional<z.ZodString>;
    ANTHROPIC_API_KEY: z.ZodOptional<z.ZodString>;
    AI_MODEL: z.ZodDefault<z.ZodString>;
    AI_TEMPERATURE: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    AI_MODEL?: string;
    AI_TEMPERATURE?: number;
}, {
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    AI_MODEL?: string;
    AI_TEMPERATURE?: string;
}>;
export declare const rateLimitEnvSchema: z.ZodObject<{
    RATE_LIMIT_MAX_REQUESTS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    RATE_LIMIT_WINDOW_SECONDS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    RATE_LIMIT_MAX_REQUESTS?: number;
    RATE_LIMIT_WINDOW_SECONDS?: number;
}, {
    RATE_LIMIT_MAX_REQUESTS?: string;
    RATE_LIMIT_WINDOW_SECONDS?: string;
}>;
export declare const cloudflareEnvSchema: z.ZodObject<{
    CF_ACCOUNT_ID: z.ZodString;
    CF_API_TOKEN: z.ZodString;
    CF_ZONE_ID: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    CF_ACCOUNT_ID?: string;
    CF_API_TOKEN?: string;
    CF_ZONE_ID?: string;
}, {
    CF_ACCOUNT_ID?: string;
    CF_API_TOKEN?: string;
    CF_ZONE_ID?: string;
}>;
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "staging", "production"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
} & {
    DATABASE_URL: z.ZodOptional<z.ZodString>;
    DB_MAX_CONNECTIONS: z.ZodOptional<z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>>;
} & {
    JWT_SECRET: z.ZodOptional<z.ZodString>;
    JWT_EXPIRES_IN: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    API_ALLOWED_KEYS: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    OPENAI_API_KEY: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    ANTHROPIC_API_KEY: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    AI_MODEL: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    AI_TEMPERATURE: z.ZodOptional<z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>>;
} & {
    RATE_LIMIT_MAX_REQUESTS: z.ZodOptional<z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>>;
    RATE_LIMIT_WINDOW_SECONDS: z.ZodOptional<z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>>;
} & {
    CF_ACCOUNT_ID: z.ZodOptional<z.ZodString>;
    CF_API_TOKEN: z.ZodOptional<z.ZodString>;
    CF_ZONE_ID: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV?: "development" | "staging" | "production";
    LOG_LEVEL?: "error" | "debug" | "info" | "warn";
    DATABASE_URL?: string;
    DB_MAX_CONNECTIONS?: number;
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    API_ALLOWED_KEYS?: string;
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    AI_MODEL?: string;
    AI_TEMPERATURE?: number;
    RATE_LIMIT_MAX_REQUESTS?: number;
    RATE_LIMIT_WINDOW_SECONDS?: number;
    CF_ACCOUNT_ID?: string;
    CF_API_TOKEN?: string;
    CF_ZONE_ID?: string;
}, {
    NODE_ENV?: "development" | "staging" | "production";
    LOG_LEVEL?: "error" | "debug" | "info" | "warn";
    DATABASE_URL?: string;
    DB_MAX_CONNECTIONS?: string;
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    API_ALLOWED_KEYS?: string;
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    AI_MODEL?: string;
    AI_TEMPERATURE?: string;
    RATE_LIMIT_MAX_REQUESTS?: string;
    RATE_LIMIT_WINDOW_SECONDS?: string;
    CF_ACCOUNT_ID?: string;
    CF_API_TOKEN?: string;
    CF_ZONE_ID?: string;
}>;
export type EnvConfig = z.infer<typeof envSchema>;
export declare class EnvValidator {
    private static instance;
    private validatedConfig;
    static getInstance(): EnvValidator;
    validate(env?: Record<string, string | undefined>): EnvConfig;
    getValidatedConfig(): EnvConfig;
    isProduction(): boolean;
    isDevelopment(): boolean;
}
export declare const envValidator: EnvValidator;
export declare const validateEnvironment: () => {
    NODE_ENV?: "development" | "staging" | "production";
    LOG_LEVEL?: "error" | "debug" | "info" | "warn";
    DATABASE_URL?: string;
    DB_MAX_CONNECTIONS?: number;
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    API_ALLOWED_KEYS?: string;
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    AI_MODEL?: string;
    AI_TEMPERATURE?: number;
    RATE_LIMIT_MAX_REQUESTS?: number;
    RATE_LIMIT_WINDOW_SECONDS?: number;
    CF_ACCOUNT_ID?: string;
    CF_API_TOKEN?: string;
    CF_ZONE_ID?: string;
};
//# sourceMappingURL=index.d.ts.map