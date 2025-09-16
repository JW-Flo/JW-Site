// Paycom API Integration Service
// Handles direct API calls to Paycom's REST endpoints (no XaaS support)

export async function POST({ request, locals }) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    // Simulate Paycom API responses based on action
    switch (action) {
      case 'createEmployee':
        return createEmployee(data);
      case 'updateEmployee':
        return updateEmployee(data);
      case 'terminateEmployee':
        return terminateEmployee(data);
      case 'getEmployee':
        return getEmployee(data);
      case 'listEmployees':
        return listEmployees(data);
      case 'getJobCodes':
        return getJobCodes();
      case 'getDepartments':
        return getDepartments();
      case 'setupWebhook':
        return setupWebhook(data);
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Paycom API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Create new employee in Paycom
async function createEmployee(data) {
  const { firstName, lastName, email, departmentId, jobCodeId, startDate } = data;
  
  // Simulate Paycom employee creation
  const employee = {
    employeeId: `PAY-${Date.now()}`,
    firstName,
    lastName,
    email,
    department: departmentId,
    jobCode: jobCodeId,
    startDate,
    status: 'Active',
    payrollId: `PR-${Math.floor(Math.random() * 10000)}`,
    hireDate: startDate,
    employeeNumber: Math.floor(Math.random() * 100000),
    workLocation: 'Main Office',
    payType: 'Salary',
    created: new Date().toISOString(),
    paycomSpecific: {
      clockNumber: Math.floor(Math.random() * 1000),
      benefitClass: 'FT-Standard',
      workersCompCode: 'WC-001',
      unionCode: null,
      shiftCode: 'DAY',
      costCenter: departmentId
    }
  };
  
  // Simulate webhook trigger to AtlasIT
  await triggerWebhook('employee.created', employee);
  
  return new Response(JSON.stringify({
    success: true,
    employee,
    message: 'Employee created successfully in Paycom',
    webhookTriggered: true,
    integrationNotes: {
      method: 'Paycom REST API',
      limitations: ['No XaaS support', 'Webhook delay ~30 seconds', 'Limited real-time sync'],
      complianceStatus: 'SOX and GDPR compliant'
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Update employee in Paycom
async function updateEmployee(data) {
  const { employeeId, updates } = data;
  
  const updatedEmployee = {
    employeeId,
    ...updates,
    lastModified: new Date().toISOString(),
    modifiedBy: 'AtlasIT-System',
    changeLog: [
      {
        timestamp: new Date().toISOString(),
        changes: Object.keys(updates),
        reason: 'Role change automation',
        approvedBy: 'System-Auto'
      }
    ]
  };
  
  // Trigger webhook for role changes
  await triggerWebhook('employee.updated', updatedEmployee);
  
  return new Response(JSON.stringify({
    success: true,
    employee: updatedEmployee,
    message: 'Employee updated successfully in Paycom',
    webhookTriggered: true,
    changeTracking: {
      changesApplied: Object.keys(updates),
      auditTrail: true,
      complianceVerified: true
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Terminate employee in Paycom
async function terminateEmployee(data) {
  const { employeeId, terminationDate, reason, lastWorkDay } = data;
  
  const terminatedEmployee = {
    employeeId,
    status: 'Terminated',
    terminationDate,
    lastWorkDay,
    terminationReason: reason,
    finalPayDate: calculateFinalPayDate(lastWorkDay),
    benefitEndDate: terminationDate,
    processedBy: 'AtlasIT-Automation',
    processedAt: new Date().toISOString(),
    paycomTermination: {
      cobraEligible: true,
      severanceEligible: false,
      reHireEligible: true,
      unemploymentEligible: true,
      finalPayAmount: 5250.00,
      accrualBalances: {
        vacation: 40.0,
        sick: 16.0,
        personalTime: 8.0
      }
    }
  };
  
  // Trigger immediate webhook for termination
  await triggerWebhook('employee.terminated', terminatedEmployee);
  
  return new Response(JSON.stringify({
    success: true,
    employee: terminatedEmployee,
    message: 'Employee terminated successfully in Paycom',
    webhookTriggered: true,
    securityActions: {
      immediate: ['Account deactivation queued', 'Access review triggered'],
      compliance: ['Exit interview scheduled', 'Equipment return reminder sent'],
      payroll: ['Final pay calculated', 'Benefit termination processed']
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Get employee details from Paycom
async function getEmployee(data) {
  const { employeeId } = data;
  
  // Simulate fetching employee data
  const employee = {
    employeeId,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@hardworkco.com',
    department: 'Engineering',
    jobCode: 'Software Engineer III',
    status: 'Active',
    startDate: '2023-03-15',
    payrollData: {
      salary: 95000,
      payFrequency: 'Bi-weekly',
      lastPayDate: '2025-09-15',
      ytdGross: 71250.00,
      ytdTaxes: 18525.00
    },
    benefits: {
      healthInsurance: 'Active',
      dentalInsurance: 'Active',
      vision: 'Active',
      retirement401k: 'Active - 6% contribution',
      lifeInsurance: '2x salary'
    },
    timeOff: {
      vacation: { accrued: 120.0, used: 40.0 },
      sick: { accrued: 80.0, used: 16.0 },
      personal: { accrued: 40.0, used: 8.0 }
    }
  };
  
  return new Response(JSON.stringify({
    success: true,
    employee,
    lastSync: new Date().toISOString(),
    dataSource: 'Paycom REST API'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// List all employees from Paycom
async function listEmployees(filters = {}) {
  const employees = [
    {
      employeeId: 'PAY-1001',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@hardworkco.com',
      department: 'Engineering',
      jobCode: 'Software Engineer III',
      status: 'Active'
    },
    {
      employeeId: 'PAY-1002',
      firstName: 'Mike',
      lastName: 'Chen',
      email: 'mike.chen@hardworkco.com',
      department: 'DevOps',
      jobCode: 'Senior DevOps Engineer',
      status: 'Active'
    },
    {
      employeeId: 'PAY-1003',
      firstName: 'Alex',
      lastName: 'Rodriguez',
      email: 'alex.rodriguez@hardworkco.com',
      department: 'Marketing',
      jobCode: 'Marketing Manager',
      status: 'Terminated'
    }
  ];
  
  return new Response(JSON.stringify({
    success: true,
    employees,
    totalCount: employees.length,
    filters: filters,
    lastSync: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Get job codes from Paycom
async function getJobCodes() {
  const jobCodes = [
    { id: 'SE1', name: 'Software Engineer I', department: 'Engineering', level: 'Junior' },
    { id: 'SE2', name: 'Software Engineer II', department: 'Engineering', level: 'Mid' },
    { id: 'SE3', name: 'Software Engineer III', department: 'Engineering', level: 'Senior' },
    { id: 'DE1', name: 'DevOps Engineer', department: 'Engineering', level: 'Mid' },
    { id: 'DE2', name: 'Senior DevOps Engineer', department: 'Engineering', level: 'Senior' },
    { id: 'MM1', name: 'Marketing Manager', department: 'Marketing', level: 'Manager' },
    { id: 'PM1', name: 'Product Manager', department: 'Product', level: 'Manager' }
  ];
  
  return new Response(JSON.stringify({
    success: true,
    jobCodes,
    lastUpdated: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Get departments from Paycom
async function getDepartments() {
  const departments = [
    { id: 'ENG', name: 'Engineering', costCenter: 'CC-100', manager: 'John Smith' },
    { id: 'MKT', name: 'Marketing', costCenter: 'CC-200', manager: 'Jane Doe' },
    { id: 'PRD', name: 'Product', costCenter: 'CC-300', manager: 'Bob Wilson' },
    { id: 'OPS', name: 'Operations', costCenter: 'CC-400', manager: 'Lisa Garcia' },
    { id: 'FIN', name: 'Finance', costCenter: 'CC-500', manager: 'Tom Brown' }
  ];
  
  return new Response(JSON.stringify({
    success: true,
    departments,
    lastUpdated: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Setup webhook in Paycom
async function setupWebhook(data) {
  const { endpoint, events } = data;
  
  const webhook = {
    id: `webhook-${Date.now()}`,
    endpoint,
    events,
    status: 'Active',
    created: new Date().toISOString(),
    lastTriggered: null,
    triggerCount: 0,
    paycomConfig: {
      retryPolicy: '3 attempts with exponential backoff',
      timeout: '30 seconds',
      authentication: 'Bearer token',
      format: 'JSON'
    }
  };
  
  return new Response(JSON.stringify({
    success: true,
    webhook,
    message: 'Webhook configured successfully in Paycom',
    supportedEvents: [
      'employee.created',
      'employee.updated',
      'employee.terminated',
      'employee.role_changed',
      'payroll.processed'
    ]
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Simulate webhook trigger to AtlasIT
async function triggerWebhook(event, data) {
  const webhook = {
    event,
    timestamp: new Date().toISOString(),
    data,
    source: 'Paycom',
    webhookId: `wh-${Date.now()}`,
    signature: `sha256=${generateMockSignature(data)}`
  };
  
  // In real implementation, this would make HTTP POST to AtlasIT webhook endpoint
  console.log('Paycom Webhook Triggered:', webhook);
  
  // Simulate AtlasIT processing
  setTimeout(() => {
    console.log('AtlasIT processed Paycom webhook:', webhook.webhookId);
  }, 100);
  
  return webhook;
}

// Helper functions
function calculateFinalPayDate(lastWorkDay) {
  const date = new Date(lastWorkDay);
  date.setDate(date.getDate() + 14); // 2 weeks from last work day
  return date.toISOString().split('T')[0];
}

function generateMockSignature(data) {
  return 'mock_signature_' + Date.now();
}
