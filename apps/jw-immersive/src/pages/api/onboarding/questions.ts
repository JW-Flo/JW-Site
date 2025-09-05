import type { APIRoute } from 'astro';
import { json } from '../../../utils/responses.js';

export const GET: APIRoute = async ({ request, locals, url }) => {
  const env: any = (locals as any)?.runtime?.env || (globalThis as any)?.process?.env || {};

  try {
    // Validate API key if configured
    const apiKey = request.headers.get('x-api-key');
    let actor = 'anonymous';

    if (env.API_ALLOWED_KEYS) {
      const allowedKeys = env.API_ALLOWED_KEYS.split(',');
      if (!apiKey || !allowedKeys.includes(apiKey)) {
        return json({
          error: 'Unauthorized',
          code: 'AUTH-001',
          requestId: crypto.randomUUID()
        }, { status: 401 });
      }
      actor = apiKey;
    }

    // Parse query parameters
    const industry = url.searchParams.get('industry') || 'technology';
    const requirements = url.searchParams.getAll('req');

    // Generate dynamic questions based on industry and requirements
    const questions = generateQuestions(industry, requirements);

    return json({
      industry,
      requirements,
      questions,
      requestId: crypto.randomUUID(),
      actor
    }, { status: 200 });

  } catch (error) {
    console.error('Questions generation error:', error);
    return json({
      error: 'Unknown error',
      code: 'ONB-999',
      requestId: crypto.randomUUID()
    }, { status: 500 });
  }
};

function generateQuestions(industry: string, requirements: string[]) {
  const baseQuestions = [
    {
      id: 'company_size',
      type: 'select',
      question: 'What is your company size?',
      options: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
      required: true
    },
    {
      id: 'primary_use_case',
      type: 'textarea',
      question: 'What is your primary use case for AtlasIT?',
      required: true
    }
  ];

  const industryQuestions = getIndustryQuestions(industry);
  const requirementQuestions = getRequirementQuestions(requirements);

  return [...baseQuestions, ...industryQuestions, ...requirementQuestions];
}

function getIndustryQuestions(industry: string) {
  const questions: any[] = [];

  switch (industry.toLowerCase()) {
    case 'healthcare':
      questions.push({
        id: 'hipaa_compliance',
        type: 'boolean',
        question: 'Do you require HIPAA compliance features?',
        required: true
      });
      questions.push({
        id: 'phi_handling',
        type: 'textarea',
        question: 'Describe how you currently handle Protected Health Information (PHI)',
        required: false
      });
      break;

    case 'finance':
      questions.push({
        id: 'pci_compliance',
        type: 'boolean',
        question: 'Do you require PCI DSS compliance?',
        required: true
      });
      questions.push({
        id: 'regulatory_requirements',
        type: 'multiselect',
        question: 'Which regulatory requirements apply to your organization?',
        options: ['SOX', 'GLBA', 'FFIEC', 'Other'],
        required: false
      });
      break;

    case 'retail':
      questions.push({
        id: 'ecommerce_platform',
        type: 'select',
        question: 'What e-commerce platform do you use?',
        options: ['Shopify', 'WooCommerce', 'Magento', 'Custom', 'Other'],
        required: false
      });
      break;
  }

  return questions;
}

function getRequirementQuestions(requirements: string[]) {
  const questions: any[] = [];

  if (requirements.includes('compliance')) {
    questions.push({
      id: 'compliance_frameworks',
      type: 'multiselect',
      question: 'Which compliance frameworks do you need to adhere to?',
      options: ['GDPR', 'CCPA', 'SOX', 'HIPAA', 'PCI DSS', 'ISO 27001'],
      required: true
    });
  }

  if (requirements.includes('analytics')) {
    questions.push({
      id: 'analytics_goals',
      type: 'textarea',
      question: 'What are your primary analytics and reporting goals?',
      required: false
    });
    questions.push({
      id: 'data_sources',
      type: 'multiselect',
      question: 'What data sources do you want to integrate?',
      options: ['CRM', 'ERP', 'HR System', 'Financial System', 'Custom APIs'],
      required: false
    });
  }

  if (requirements.includes('security')) {
    questions.push({
      id: 'security_priorities',
      type: 'multiselect',
      question: 'What are your top security priorities?',
      options: ['Access Control', 'Data Encryption', 'Threat Detection', 'Compliance Auditing', 'Zero Trust'],
      required: false
    });
  }

  return questions;
}
