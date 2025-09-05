const aiService = {
  generateText: async (prompt: string) => `Mock response for: ${prompt}`,
  getProviderName: () => 'mock',
  generate: async (options: any) => ({ content: `Mock response for: ${options.prompt}` }),
};

type Industry = 'technology' | 'healthcare' | 'finance' | 'retail' | 'manufacturing' | 'education' | 'government' | 'other';
type Requirement = 'compliance' | 'analytics' | 'automation' | 'security' | 'integration' | 'reporting' | 'monitoring' | 'backup';

export interface OnboardingTemplate {
  infrastructure: {
    cloudProvider?: string;
    region?: string;
    networking: {
      vpc?: boolean;
      subnets?: string[];
      securityGroups?: boolean;
    };
  };
  security: {
    mfaRequired: boolean;
    encryption: {
      atRest: boolean;
      inTransit: boolean;
    };
    monitoring: {
      enabled: boolean;
      alerts: string[];
    };
    compliance: {
      frameworks: string[];
      auditLogging: boolean;
    };
  };
  applications: {
    integrations: string[];
    apis: {
      enabled: boolean;
      rateLimiting: boolean;
    };
  };
  monitoring: {
    metrics: string[];
    dashboards: boolean;
    alerts: string[];
    alerting: {
      email: boolean;
      slack: boolean;
      sms: boolean;
    };
  };
  backup: {
    enabled: boolean;
    frequency: string;
    retention: string;
    locations: string[];
  };
  automation: {
    workflows: string[];
    scheduling: boolean;
    approvals: boolean;
  };
}

export async function createOnboardingTemplate(
  industry: Industry,
  answers: Record<string, any>,
  requirements: Requirement[]
): Promise<OnboardingTemplate> {
  // Start with industry-specific defaults
  const template = getIndustryDefaults(industry);

  // Apply requirement-specific configurations
  for (const requirement of requirements) {
    applyRequirementConfig(template, requirement, answers);
  }

  // Apply user answers
  applyUserAnswers(template, answers);

  // Use AI to enhance template if available
  try {
    if (aiService.getProviderName() !== 'mock') {
      const aiEnhancedTemplate = await enhanceTemplateWithAI(template, industry, requirements, answers);
      return aiEnhancedTemplate;
    }
  } catch (error) {
    console.warn('AI template enhancement failed, using base template');
  }

  return template;
}

function getIndustryDefaults(industry: Industry): OnboardingTemplate {
  const baseTemplate: OnboardingTemplate = {
    infrastructure: {
      networking: {},
    },
    security: {
      mfaRequired: true,
      encryption: {
        atRest: true,
        inTransit: true,
      },
      monitoring: {
        enabled: true,
        alerts: ['security-events', 'system-health'],
      },
      compliance: {
        frameworks: [],
        auditLogging: true,
      },
    },
    applications: {
      integrations: [],
      apis: {
        enabled: true,
        rateLimiting: true,
      },
    },
    monitoring: {
      metrics: ['cpu', 'memory', 'disk', 'network'],
      dashboards: true,
      alerts: ['system-health'],
      alerting: {
        email: true,
        slack: false,
        sms: false,
      },
    },
    backup: {
      enabled: true,
      frequency: 'daily',
      retention: '30days',
      locations: ['cloud'],
    },
    automation: {
      workflows: [],
      scheduling: true,
      approvals: false,
    },
  };

  // Industry-specific customizations
  switch (industry) {
    case 'healthcare':
      baseTemplate.security.compliance.frameworks = ['HIPAA', 'HITECH'];
      baseTemplate.security.encryption.atRest = true;
      baseTemplate.monitoring.alerts.push('phi-access');
      break;

    case 'finance':
      baseTemplate.security.compliance.frameworks = ['SOX', 'PCI-DSS'];
      baseTemplate.security.monitoring.alerts.push('financial-transactions');
      baseTemplate.backup.frequency = 'hourly';
      baseTemplate.backup.retention = '7years';
      break;

    case 'government':
      baseTemplate.security.compliance.frameworks = ['FISMA', 'NIST'];
      baseTemplate.security.mfaRequired = true;
      baseTemplate.monitoring.alerts.push('audit-events');
      baseTemplate.automation.approvals = true;
      break;

    case 'retail':
      baseTemplate.applications.integrations = ['ecommerce', 'payment-processing'];
      baseTemplate.monitoring.metrics.push('transaction-volume');
      baseTemplate.backup.frequency = 'real-time';
      break;

    case 'education':
      baseTemplate.security.compliance.frameworks = ['FERPA'];
      baseTemplate.monitoring.alerts.push('student-data-access');
      baseTemplate.applications.integrations = ['learning-management'];
      break;
  }

  return baseTemplate;
}

function applyRequirementConfig(
  template: OnboardingTemplate,
  requirement: Requirement,
  answers: Record<string, any>
): void {
  switch (requirement) {
    case 'compliance':
      template.security.compliance.auditLogging = true;
      template.monitoring.alerts.push('compliance-violations');
      break;

    case 'analytics':
      template.monitoring.metrics.push('user-behavior', 'performance');
      template.monitoring.dashboards = true;
      break;

    case 'automation':
      template.automation.workflows = ['user-provisioning', 'security-monitoring', 'backup'];
      template.automation.scheduling = true;
      break;

    case 'security':
      template.security.monitoring.enabled = true;
      template.security.monitoring.alerts = [
        ...template.security.monitoring.alerts,
        'threat-detection',
        'unauthorized-access',
        'suspicious-activity'
      ];
      break;

    case 'integration':
      template.applications.apis.enabled = true;
      template.applications.apis.rateLimiting = true;
      break;

    case 'reporting':
      template.monitoring.dashboards = true;
      template.monitoring.alerting.email = true;
      break;

    case 'monitoring':
      template.monitoring.metrics = [
        ...template.monitoring.metrics,
        'response-time',
        'error-rate',
        'throughput'
      ];
      break;

    case 'backup':
      template.backup.enabled = true;
      template.backup.locations = ['cloud', 'on-premise'];
      break;
  }
}

function applyUserAnswers(template: OnboardingTemplate, answers: Record<string, any>): void {
  // Apply cloud provider preference
  if (answers.cloud_provider) {
    template.infrastructure.cloudProvider = answers.cloud_provider;
  }

  // Apply security preferences
  if (answers.security_features) {
    if (answers.security_features.includes('Multi-factor authentication')) {
      template.security.mfaRequired = true;
    }
    if (answers.security_features.includes('Threat monitoring')) {
      template.security.monitoring.alerts.push('threats');
    }
  }

  // Apply monitoring preferences
  if (answers.alert_preferences) {
    template.monitoring.alerting.slack = answers.alert_preferences.includes('Slack');
    template.monitoring.alerting.sms = answers.alert_preferences.includes('SMS');
  }

  // Apply backup preferences
  if (answers.backup_frequency) {
    template.backup.frequency = answers.backup_frequency.toLowerCase();
  }
  if (answers.backup_retention) {
    template.backup.retention = answers.backup_retention.toLowerCase().replace(' ', '');
  }

  // Apply integration preferences
  if (answers.third_party_services) {
    template.applications.integrations = answers.third_party_services;
  }

  // Apply automation preferences
  if (answers.automation_scope) {
    template.automation.workflows = answers.automation_scope.map((scope: string) =>
      scope.toLowerCase().replace(/\s+/g, '-')
    );
  }

  // Apply compliance frameworks
  if (answers.compliance_frameworks) {
    template.security.compliance.frameworks = [
      ...template.security.compliance.frameworks,
      ...answers.compliance_frameworks
    ];
  }
}

async function enhanceTemplateWithAI(
  template: OnboardingTemplate,
  industry: Industry,
  requirements: Requirement[],
  answers: Record<string, any>
): Promise<OnboardingTemplate> {
  const prompt = `
    Based on the industry "${industry}", requirements "${requirements.join(', ')}",
    and user answers ${JSON.stringify(answers, null, 2)},

    Review this onboarding template and suggest enhancements or modifications
    that would be most valuable for this specific use case.

    Current template:
    ${JSON.stringify(template, null, 2)}

    Please enhance this template to be more tailored to ${industry} companies
    with these specific requirements and answers. Focus on practical,
    industry-appropriate configurations.

    Return the enhanced template in JSON format.
  `;

  try {
    const response = await aiService.generate({
      prompt,
      systemPrompt: 'You are an expert at creating IT infrastructure templates for different industries. Return only valid JSON that matches the OnboardingTemplate interface.',
      maxTokens: 3000,
    });

    const aiEnhancedTemplate = JSON.parse(response.content);
    return { ...template, ...aiEnhancedTemplate };
  } catch (error) {
    console.warn('AI template enhancement failed:', error);
    return template;
  }
}
