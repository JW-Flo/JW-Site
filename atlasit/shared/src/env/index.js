import { z } from 'zod';
// Environment validation schemas
export const baseEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});
export const databaseEnvSchema = z.object({
    DATABASE_URL: z.string().url(),
    DB_MAX_CONNECTIONS: z.string().transform(Number).default('10'),
});
export const authEnvSchema = z.object({
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('24h'),
    API_ALLOWED_KEYS: z.string().optional(),
});
export const aiEnvSchema = z.object({
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    AI_MODEL: z.string().default('gpt-4'),
    AI_TEMPERATURE: z.string().transform(Number).default('0.7'),
});
export const rateLimitEnvSchema = z.object({
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
    RATE_LIMIT_WINDOW_SECONDS: z.string().transform(Number).default('60'),
});
export const cloudflareEnvSchema = z.object({
    CF_ACCOUNT_ID: z.string(),
    CF_API_TOKEN: z.string(),
    CF_ZONE_ID: z.string().optional(),
});
// Combined environment schema
export const envSchema = baseEnvSchema
    .merge(databaseEnvSchema.partial())
    .merge(authEnvSchema.partial())
    .merge(aiEnvSchema.partial())
    .merge(rateLimitEnvSchema.partial())
    .merge(cloudflareEnvSchema.partial());
export class EnvValidator {
    static instance;
    validatedConfig = null;
    static getInstance() {
        if (!EnvValidator.instance) {
            EnvValidator.instance = new EnvValidator();
        }
        return EnvValidator.instance;
    }
    validate(env) {
        if (this.validatedConfig) {
            return this.validatedConfig;
        }
        try {
            // Use provided env or fallback to global env (for Node.js compatibility)
            const envVars = env || (typeof process !== 'undefined' ? process.env : {});
            this.validatedConfig = envSchema.parse(envVars);
            return this.validatedConfig;
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n');
                throw new Error(`Environment validation failed:\n${issues}`);
            }
            throw error;
        }
    }
    getValidatedConfig() {
        if (!this.validatedConfig) {
            return this.validate();
        }
        return this.validatedConfig;
    }
    // Helper method to check if we're in production
    isProduction() {
        return this.getValidatedConfig().NODE_ENV === 'production';
    }
    // Helper method to check if we're in development
    isDevelopment() {
        return this.getValidatedConfig().NODE_ENV === 'development';
    }
}
// Export singleton instance
export const envValidator = EnvValidator.getInstance();
// Export convenience function
export const validateEnvironment = () => envValidator.validate();
//# sourceMappingURL=index.js.map