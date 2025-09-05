export interface Tenant {
    id: string;
    name: string;
    industry: string;
    domain?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface User {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'viewer';
    createdAt: Date;
    updatedAt: Date;
}
export interface APIKey {
    id: string;
    tenantId: string;
    name: string;
    key: string;
    permissions: string[];
    createdAt: Date;
    expiresAt?: Date;
}
export interface Workflow {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    status: 'active' | 'inactive' | 'error';
    steps: WorkflowStep[];
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowStep {
    id: string;
    type: string;
    config: Record<string, any>;
    order: number;
}
export interface AuditEvent {
    id: string;
    tenantId: string;
    actor: string;
    action: string;
    resource: string;
    details: Record<string, any>;
    timestamp: Date;
    requestId: string;
}
export interface OnboardingConfig {
    tenantId: string;
    industry: string;
    requirements: string[];
    questions: OnboardingQuestion[];
    template: Record<string, any>;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}
export interface OnboardingQuestion {
    id: string;
    question: string;
    type: 'text' | 'select' | 'multiselect' | 'boolean';
    options?: string[];
    required: boolean;
    category: string;
}
export interface MarketplaceApp {
    id: string;
    name: string;
    description: string;
    category: string;
    provider: string;
    version: string;
    pricing: 'free' | 'paid' | 'freemium';
    tags: string[];
    configSchema: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface Integration {
    id: string;
    tenantId: string;
    appId: string;
    config: Record<string, any>;
    status: 'active' | 'inactive' | 'error';
    createdAt: Date;
    updatedAt: Date;
}
export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    requestId: string;
    timestamp: Date;
}
export interface PaginatedResponse<T> extends APIResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare class AtlasITError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: any;
    constructor(code: string, message: string, statusCode?: number, details?: any);
}
export type Industry = 'technology' | 'healthcare' | 'finance' | 'retail' | 'manufacturing' | 'education' | 'government' | 'other';
export type Requirement = 'compliance' | 'analytics' | 'automation' | 'security' | 'integration' | 'reporting' | 'monitoring' | 'backup';
//# sourceMappingURL=index.d.ts.map