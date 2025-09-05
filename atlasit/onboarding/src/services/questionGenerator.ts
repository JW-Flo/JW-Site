const aiService = {
  generateText: async (prompt: string) => `Mock response for: ${prompt}`,
  getProviderName: () => 'mock',
  generate: async (options: any) => ({ content: `Mock response for: ${options.prompt}` }),
};

type Industry = 'technology' | 'healthcare' | 'finance' | 'retail' | 'manufacturing' | 'education' | 'government' | 'other';
type Requirement = 'compliance' | 'analytics' | 'automation' | 'security' | 'integration' | 'reporting' | 'monitoring' | 'backup';

export interface OnboardingQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'boolean';
  options?: string[];
  required: boolean;
  category: string;
  helpText?: string;
}

// Industry-specific question templates
const industryQuestions: Record<Industry, OnboardingQuestion[]> = {
  technology: [
    {
      id: 'tech_stack',
      question: 'What is your primary technology stack?',
      type: 'multiselect',
      options: ['JavaScript/TypeScript', 'Python', 'Java', 'C#', '.NET', 'Go', 'Rust', 'Other'],
      required: true,
      category: 'Technology',
    },
    {
      id: 'cloud_provider',
      question: 'Which cloud provider do you primarily use?',
      type: 'select',
      options: ['AWS', 'Azure', 'GCP', 'DigitalOcean', 'Other', 'None'],
      required: true,
      category: 'Infrastructure',
    },
    {
      id: 'deployment_method',
      question: 'How do you currently deploy applications?',
      type: 'multiselect',
      options: ['Docker', 'Kubernetes', 'Serverless', 'VMs', 'Manual deployment', 'CI/CD pipelines'],
      required: false,
      category: 'DevOps',
    },
  ],
  healthcare: [
    {
      id: 'hipaa_compliance',
      question: 'Do you need HIPAA compliance features?',
      type: 'boolean',
      required: true,
      category: 'Compliance',
      helpText: 'Required for handling protected health information (PHI)',
    },
    {
      id: 'ehr_integration',
      question: 'Do you need integration with Electronic Health Records (EHR) systems?',
      type: 'boolean',
      required: false,
      category: 'Integration',
    },
    {
      id: 'patient_data_volume',
      question: 'What is your expected patient data volume?',
      type: 'select',
      options: ['Small (< 1,000 patients)', 'Medium (1,000 - 10,000 patients)', 'Large (> 10,000 patients)'],
      required: false,
      category: 'Data Management',
    },
  ],
  finance: [
    {
      id: 'regulatory_compliance',
      question: 'Which regulatory compliance standards do you need?',
      type: 'multiselect',
      options: ['SOX', 'PCI DSS', 'GDPR', 'FFIEC', 'Other'],
      required: true,
      category: 'Compliance',
    },
    {
      id: 'transaction_volume',
      question: 'What is your expected daily transaction volume?',
      type: 'select',
      options: ['Low (< 1,000)', 'Medium (1,000 - 10,000)', 'High (> 10,000)'],
      required: false,
      category: 'Operations',
    },
    {
      id: 'financial_systems',
      question: 'Which financial systems do you need to integrate with?',
      type: 'multiselect',
      options: ['ERP', 'CRM', 'Accounting software', 'Payment processors', 'Banking APIs'],
      required: false,
      category: 'Integration',
    },
  ],
  retail: [
    {
      id: 'ecommerce_platform',
      question: 'What e-commerce platform do you use?',
      type: 'select',
      options: ['Shopify', 'WooCommerce', 'Magento', 'Custom', 'Other'],
      required: false,
      category: 'E-commerce',
    },
    {
      id: 'inventory_management',
      question: 'Do you need inventory management features?',
      type: 'boolean',
      required: false,
      category: 'Operations',
    },
    {
      id: 'customer_data',
      question: 'How do you handle customer data and privacy?',
      type: 'multiselect',
      options: ['GDPR compliance', 'Customer profiles', 'Loyalty programs', 'Marketing automation'],
      required: false,
      category: 'Data & Privacy',
    },
  ],
  manufacturing: [
    {
      id: 'production_systems',
      question: 'What production management systems do you use?',
      type: 'multiselect',
      options: ['ERP', 'MES', 'SCADA', 'PLM', 'Quality Management', 'Other'],
      required: false,
      category: 'Production',
    },
    {
      id: 'iot_integration',
      question: 'Do you need IoT device integration?',
      type: 'boolean',
      required: false,
      category: 'IoT',
    },
    {
      id: 'supply_chain',
      question: 'Do you need supply chain management features?',
      type: 'boolean',
      required: false,
      category: 'Supply Chain',
    },
  ],
  education: [
    {
      id: 'student_management',
      question: 'Do you need student information system integration?',
      type: 'boolean',
      required: false,
      category: 'Student Management',
    },
    {
      id: 'learning_platform',
      question: 'What learning management system do you use?',
      type: 'select',
      options: ['Canvas', 'Blackboard', 'Moodle', 'Custom', 'Other'],
      required: false,
      category: 'Learning',
    },
    {
      id: 'data_privacy',
      question: 'Do you handle student PII that requires FERPA compliance?',
      type: 'boolean',
      required: false,
      category: 'Compliance',
      helpText: 'FERPA regulates access to student education records',
    },
  ],
  government: [
    {
      id: 'security_clearance',
      question: 'What security clearance level do you require?',
      type: 'select',
      options: ['Public', 'Internal', 'Confidential', 'Secret', 'Top Secret'],
      required: true,
      category: 'Security',
    },
    {
      id: 'compliance_frameworks',
      question: 'Which compliance frameworks apply to your agency?',
      type: 'multiselect',
      options: ['FISMA', 'NIST', 'FedRAMP', 'CJIS', 'Other'],
      required: true,
      category: 'Compliance',
    },
    {
      id: 'citizen_services',
      question: 'Do you provide digital citizen services?',
      type: 'boolean',
      required: false,
      category: 'Services',
    },
  ],
  other: [
    {
      id: 'business_type',
      question: 'What type of business are you?',
      type: 'text',
      required: true,
      category: 'Business',
    },
    {
      id: 'specific_requirements',
      question: 'What are your specific IT requirements?',
      type: 'text',
      required: false,
      category: 'Requirements',
    },
  ],
};

// Requirement-specific additional questions
const requirementQuestions: Record<Requirement, OnboardingQuestion[]> = {
  compliance: [
    {
      id: 'compliance_frameworks',
      question: 'Which compliance frameworks do you need to adhere to?',
      type: 'multiselect',
      options: ['GDPR', 'HIPAA', 'SOX', 'PCI DSS', 'ISO 27001', 'Other'],
      required: true,
      category: 'Compliance',
    },
    {
      id: 'audit_requirements',
      question: 'Do you need audit logging and reporting features?',
      type: 'boolean',
      required: true,
      category: 'Audit',
    },
  ],
  analytics: [
    {
      id: 'analytics_platform',
      question: 'What analytics platform do you currently use?',
      type: 'select',
      options: ['Google Analytics', 'Mixpanel', 'Amplitude', 'Custom', 'None'],
      required: false,
      category: 'Analytics',
    },
    {
      id: 'data_warehouse',
      question: 'Do you need a data warehouse integration?',
      type: 'boolean',
      required: false,
      category: 'Data',
    },
  ],
  automation: [
    {
      id: 'automation_scope',
      question: 'What processes do you want to automate?',
      type: 'multiselect',
      options: ['User provisioning', 'Security monitoring', 'Backup', 'Compliance checks', 'Reporting'],
      required: false,
      category: 'Automation',
    },
    {
      id: 'integration_points',
      question: 'Which systems need to be integrated?',
      type: 'multiselect',
      options: ['HR systems', 'Active Directory', 'Email', 'Cloud storage', 'Other'],
      required: false,
      category: 'Integration',
    },
  ],
  security: [
    {
      id: 'security_features',
      question: 'What security features do you require?',
      type: 'multiselect',
      options: ['Multi-factor authentication', 'Role-based access', 'Encryption', 'Threat monitoring', 'Incident response'],
      required: true,
      category: 'Security',
    },
    {
      id: 'threat_detection',
      question: 'Do you need advanced threat detection?',
      type: 'boolean',
      required: false,
      category: 'Security',
    },
  ],
  integration: [
    {
      id: 'api_integrations',
      question: 'Which APIs do you need to integrate with?',
      type: 'multiselect',
      options: ['REST APIs', 'GraphQL', 'SOAP', 'Webhooks', 'Database connections'],
      required: false,
      category: 'Integration',
    },
    {
      id: 'third_party_services',
      question: 'Which third-party services do you use?',
      type: 'multiselect',
      options: ['Slack', 'Microsoft 365', 'Google Workspace', 'Salesforce', 'Other'],
      required: false,
      category: 'Integration',
    },
  ],
  reporting: [
    {
      id: 'report_types',
      question: 'What types of reports do you need?',
      type: 'multiselect',
      options: ['Compliance reports', 'Usage reports', 'Security reports', 'Performance reports', 'Custom reports'],
      required: false,
      category: 'Reporting',
    },
    {
      id: 'report_frequency',
      question: 'How frequently do you need reports?',
      type: 'select',
      options: ['Real-time', 'Daily', 'Weekly', 'Monthly', 'Quarterly'],
      required: false,
      category: 'Reporting',
    },
  ],
  monitoring: [
    {
      id: 'monitoring_scope',
      question: 'What do you need to monitor?',
      type: 'multiselect',
      options: ['System performance', 'Security events', 'User activity', 'Application health', 'Infrastructure'],
      required: false,
      category: 'Monitoring',
    },
    {
      id: 'alert_preferences',
      question: 'How do you want to receive alerts?',
      type: 'multiselect',
      options: ['Email', 'SMS', 'Slack', 'Dashboard', 'API webhooks'],
      required: false,
      category: 'Monitoring',
    },
  ],
  backup: [
    {
      id: 'backup_frequency',
      question: 'How frequently do you need backups?',
      type: 'select',
      options: ['Real-time', 'Hourly', 'Daily', 'Weekly', 'Monthly'],
      required: false,
      category: 'Backup',
    },
    {
      id: 'backup_retention',
      question: 'How long do you need to retain backups?',
      type: 'select',
      options: ['30 days', '90 days', '1 year', '3 years', '7 years', 'Indefinite'],
      required: false,
      category: 'Backup',
    },
  ],
};

export async function generateQuestions(
  industry: Industry,
  requirements: Requirement[]
): Promise<OnboardingQuestion[]> {
  // Start with industry-specific questions
  let questions = [...industryQuestions[industry]];

  // Add requirement-specific questions
  for (const requirement of requirements) {
    if (requirementQuestions[requirement]) {
      questions = questions.concat(requirementQuestions[requirement]);
    }
  }

  // Add common questions for all industries
  const commonQuestions: OnboardingQuestion[] = [
    {
      id: 'company_size',
      question: 'What is your company size?',
      type: 'select',
      options: ['1-10 employees', '11-50 employees', '51-200 employees', '201-1000 employees', '1000+ employees'],
      required: true,
      category: 'Company',
    },
    {
      id: 'current_it_setup',
      question: 'How would you describe your current IT setup?',
      type: 'select',
      options: ['Basic (email, office suite)', 'Intermediate (some cloud services)', 'Advanced (comprehensive IT infrastructure)', 'Mixed (some legacy, some modern)'],
      required: false,
      category: 'IT Infrastructure',
    },
    {
      id: 'pain_points',
      question: 'What are your biggest IT challenges or pain points?',
      type: 'text',
      required: false,
      category: 'Challenges',
      helpText: 'This helps us understand your specific needs',
    },
  ];

  questions = questions.concat(commonQuestions);

  // Use AI to enhance questions if available
  try {
    if (aiService.getProviderName() !== 'mock') {
      const aiEnhancedQuestions = await enhanceQuestionsWithAI(questions, industry, requirements);
      return aiEnhancedQuestions;
    }
  } catch (error) {
    // If AI enhancement fails, continue with static questions
    console.warn('AI question enhancement failed, using static questions');
  }

  return questions;
}

async function enhanceQuestionsWithAI(
  questions: OnboardingQuestion[],
  industry: Industry,
  requirements: Requirement[]
): Promise<OnboardingQuestion[]> {
  const prompt = `
    Based on the industry "${industry}" and requirements "${requirements.join(', ')}",
    review these onboarding questions and suggest improvements or additions.
    Focus on questions that would be most valuable for this specific use case.
    Return the enhanced list of questions in JSON format.

    Current questions:
    ${JSON.stringify(questions, null, 2)}

    Please enhance these questions to be more specific and valuable for ${industry} companies
    with requirements: ${requirements.join(', ')}.
  `;

  try {
    const response = await aiService.generate({
      prompt,
      systemPrompt: 'You are an expert at creating onboarding questionnaires for IT management platforms. Return only valid JSON.',
      maxTokens: 2000,
    });

    // Parse AI response and merge with existing questions
    const aiSuggestions = JSON.parse(response.content);
    if (Array.isArray(aiSuggestions)) {
      return [...questions, ...aiSuggestions];
    }
  } catch (error) {
    console.warn('AI question enhancement failed:', error);
  }

  return questions;
}
