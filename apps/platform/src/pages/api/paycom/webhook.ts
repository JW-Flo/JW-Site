// Paycom Webhook Handler
// Receives webhooks from Paycom and triggers AtlasIT automation workflows

export async function POST({ request, locals }) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-paycom-signature');
    
    // Validate webhook signature (in production, verify against shared secret)
    if (!validateSignature(body, signature)) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { event, data, timestamp, webhookId } = body;
    
    console.log(`Received Paycom webhook: ${event}`, { webhookId, timestamp });
    
    // Process webhook based on event type
    switch (event) {
      case 'employee.created':
        return await handleEmployeeCreated(data);
      case 'employee.updated':
        return await handleEmployeeUpdated(data);
      case 'employee.terminated':
        return await handleEmployeeTerminated(data);
      case 'employee.role_changed':
        return await handleEmployeeRoleChanged(data);
      case 'payroll.processed':
        return await handlePayrollProcessed(data);
      default:
        console.warn(`Unknown Paycom webhook event: ${event}`);
        return new Response(JSON.stringify({ 
          received: true, 
          message: `Unknown event: ${event}` 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Paycom webhook processing error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle new employee creation from Paycom
async function handleEmployeeCreated(employee) {
  console.log('Processing new employee from Paycom:', employee.employeeId);
  
  // Trigger AtlasIT onboarding workflow
  const workflow = {
    workflowId: `onboarding-${employee.employeeId}-${Date.now()}`,
    type: 'employee_onboarding',
    source: 'paycom_webhook',
    employee,
    steps: [
      {
        name: 'create_okta_account',
        status: 'pending',
        assignedTo: 'AtlasIT-Okta-Service',
        data: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          department: employee.department,
          jobCode: employee.jobCode
        }
      },
      {
        name: 'provision_aws_access',
        status: 'pending',
        assignedTo: 'AtlasIT-AWS-Service',
        data: {
          role: mapJobCodeToAWSRole(employee.jobCode),
          department: employee.department,
          accessLevel: determineAccessLevel(employee.jobCode)
        }
      },
      {
        name: 'setup_applications',
        status: 'pending',
        assignedTo: 'AtlasIT-App-Provisioner',
        data: {
          applications: getRequiredApplications(employee.department, employee.jobCode),
          licenses: calculateLicenseNeeds(employee.jobCode)
        }
      },
      {
        name: 'compliance_verification',
        status: 'pending',
        assignedTo: 'AtlasIT-Compliance-Engine',
        data: {
          requiredTraining: getComplianceTraining(employee.department),
          backgroundCheck: employee.startDate,
          equipment: getEquipmentNeeds(employee.jobCode)
        }
      }
    ],
    timeline: {
      started: new Date().toISOString(),
      expectedCompletion: calculateExpectedCompletion(employee.startDate),
      priority: 'high'
    }
  };
  
  // Save workflow to database and trigger execution
  await saveWorkflow(workflow);
  await triggerWorkflowExecution(workflow);
  
  return new Response(JSON.stringify({
    received: true,
    workflowTriggered: true,
    workflowId: workflow.workflowId,
    message: 'Employee onboarding workflow initiated',
    estimatedCompletion: workflow.timeline.expectedCompletion
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle employee updates from Paycom
async function handleEmployeeUpdated(employee) {
  console.log('Processing employee update from Paycom:', employee.employeeId);
  
  // Determine what changed and trigger appropriate workflows
  const changes = employee.changeLog?.[0]?.changes || [];
  const workflows = [];
  
  if (changes.includes('department') || changes.includes('jobCode')) {
    // Role change workflow
    workflows.push({
      type: 'role_change',
      priority: 'high',
      actions: ['review_access', 'update_permissions', 'notify_managers']
    });
  }
  
  if (changes.includes('email')) {
    // Email change workflow
    workflows.push({
      type: 'email_update',
      priority: 'medium',
      actions: ['update_okta', 'update_aws', 'notify_systems']
    });
  }
  
  if (changes.includes('status')) {
    // Status change workflow
    workflows.push({
      type: 'status_change',
      priority: 'high',
      actions: ['evaluate_access', 'compliance_check']
    });
  }
  
  // Execute all triggered workflows
  const workflowResults = await Promise.all(
    workflows.map(workflow => executeChangeWorkflow(employee, workflow))
  );
  
  return new Response(JSON.stringify({
    received: true,
    workflowsTriggered: workflows.length,
    workflows: workflowResults,
    message: 'Employee update workflows initiated'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle employee termination from Paycom
async function handleEmployeeTerminated(employee) {
  console.log('Processing employee termination from Paycom:', employee.employeeId);
  
  // Immediate security actions
  const securityWorkflow = {
    workflowId: `termination-${employee.employeeId}-${Date.now()}`,
    type: 'employee_termination',
    priority: 'critical',
    employee,
    immediateActions: [
      {
        name: 'disable_okta_account',
        status: 'executing',
        urgency: 'immediate',
        data: { employeeId: employee.employeeId, reason: 'termination' }
      },
      {
        name: 'revoke_aws_access',
        status: 'executing',
        urgency: 'immediate',
        data: { employeeId: employee.employeeId, preserveData: true }
      },
      {
        name: 'disable_applications',
        status: 'executing',
        urgency: 'immediate',
        data: { applications: 'all', preserveData: employee.terminationReason !== 'security' }
      }
    ],
    followUpActions: [
      {
        name: 'equipment_recovery',
        status: 'scheduled',
        scheduledFor: employee.lastWorkDay,
        data: { equipmentList: await getEmployeeEquipment(employee.employeeId) }
      },
      {
        name: 'data_archival',
        status: 'scheduled',
        scheduledFor: calculateArchivalDate(employee.terminationDate),
        data: { retentionPeriod: '7 years', complianceType: 'SOX' }
      },
      {
        name: 'knowledge_transfer',
        status: 'pending',
        assignedTo: employee.manager || 'HR',
        data: { deadline: employee.lastWorkDay }
      }
    ]
  };
  
  // Execute immediate security actions
  await executeImmediateTerminationActions(securityWorkflow);
  
  return new Response(JSON.stringify({
    received: true,
    securityActionsTriggered: true,
    workflowId: securityWorkflow.workflowId,
    immediateActions: securityWorkflow.immediateActions.length,
    message: 'Employee termination security workflow initiated',
    estimatedCompletion: '< 5 minutes for security actions'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle role changes from Paycom
async function handleEmployeeRoleChanged(employee) {
  console.log('Processing role change from Paycom:', employee.employeeId);
  
  const roleChangeWorkflow = {
    workflowId: `rolechange-${employee.employeeId}-${Date.now()}`,
    type: 'role_change_automation',
    employee,
    phases: [
      {
        name: 'access_review',
        steps: ['audit_current_access', 'determine_new_requirements', 'calculate_changes'],
        estimated: '5 minutes'
      },
      {
        name: 'permission_updates',
        steps: ['update_okta_groups', 'modify_aws_roles', 'adjust_app_access'],
        estimated: '10 minutes'
      },
      {
        name: 'verification',
        steps: ['test_new_access', 'compliance_check', 'manager_approval'],
        estimated: '15 minutes'
      }
    ]
  };
  
  await executeRoleChangeWorkflow(roleChangeWorkflow);
  
  return new Response(JSON.stringify({
    received: true,
    roleChangeTriggered: true,
    workflowId: roleChangeWorkflow.workflowId,
    estimatedCompletion: '30 minutes',
    message: 'Role change automation workflow initiated'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle payroll processing from Paycom
async function handlePayrollProcessed(payrollData) {
  console.log('Processing payroll completion from Paycom');
  
  // Update cost center allocations and usage tracking
  const costCenterUpdates = await updateCostCenterTracking(payrollData);
  
  return new Response(JSON.stringify({
    received: true,
    costCentersUpdated: costCenterUpdates.length,
    message: 'Payroll data processed for cost center tracking'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper functions for workflow execution
async function saveWorkflow(workflow) {
  // Save to D1 database
  console.log('Saving workflow:', workflow.workflowId);
  return { saved: true };
}

async function triggerWorkflowExecution(workflow) {
  // Trigger AtlasIT orchestrator
  console.log('Triggering workflow execution:', workflow.workflowId);
  return { triggered: true };
}

async function executeChangeWorkflow(employee, workflow) {
  console.log('Executing change workflow:', workflow.type);
  return { 
    type: workflow.type, 
    status: 'initiated',
    workflowId: `${workflow.type}-${employee.employeeId}-${Date.now()}`
  };
}

async function executeImmediateTerminationActions(workflow) {
  console.log('Executing immediate termination actions:', workflow.workflowId);
  return { executed: true };
}

async function executeRoleChangeWorkflow(workflow) {
  console.log('Executing role change workflow:', workflow.workflowId);
  return { executed: true };
}

async function updateCostCenterTracking(payrollData) {
  console.log('Updating cost center tracking');
  return [{ costCenter: 'CC-100', updated: true }];
}

// Utility functions
function validateSignature(body, signature) {
  // In production, verify HMAC signature against shared secret
  return signature?.startsWith('sha256=');
}

function mapJobCodeToAWSRole(jobCode) {
  const roleMap = {
    'SE1': 'Developer',
    'SE2': 'Senior-Developer', 
    'SE3': 'Lead-Developer',
    'DE1': 'DevOps-Engineer',
    'DE2': 'Senior-DevOps-Engineer',
    'MM1': 'Marketing-Manager',
    'PM1': 'Product-Manager'
  };
  return roleMap[jobCode] || 'Standard-User';
}

function determineAccessLevel(jobCode) {
  const seniorRoles = ['SE3', 'DE2', 'MM1', 'PM1'];
  return seniorRoles.includes(jobCode) ? 'elevated' : 'standard';
}

function getRequiredApplications(department, jobCode) {
  const apps = {
    'Engineering': ['GitHub', 'Jira', 'Confluence', 'Slack', 'AWS Console'],
    'Marketing': ['HubSpot', 'Google Analytics', 'Slack', 'Canva', 'Mailchimp'],
    'Product': ['Figma', 'Miro', 'Jira', 'Slack', 'Analytics']
  };
  return apps[department] || ['Slack', 'GSuite'];
}

function calculateLicenseNeeds(jobCode) {
  // Calculate required software licenses based on role
  return { count: 1, type: 'standard' };
}

function getComplianceTraining(department) {
  return ['Security Awareness', 'GDPR Training', 'Company Policies'];
}

function getEquipmentNeeds(jobCode) {
  const equipment = {
    'SE1': ['Laptop', 'Monitor', 'Keyboard', 'Mouse'],
    'SE2': ['Laptop', 'Dual Monitor', 'Keyboard', 'Mouse', 'Headset'],
    'SE3': ['High-spec Laptop', 'Dual Monitor', 'Mechanical Keyboard', 'Mouse', 'Headset']
  };
  return equipment[jobCode] || ['Laptop', 'Monitor'];
}

function calculateExpectedCompletion(startDate) {
  const date = new Date(startDate);
  date.setDate(date.getDate() - 3); // Complete 3 days before start
  return date.toISOString();
}

function calculateArchivalDate(terminationDate) {
  const date = new Date(terminationDate);
  date.setDate(date.getDate() + 90); // Archive after 90 days
  return date.toISOString();
}

async function getEmployeeEquipment(employeeId) {
  return ['Laptop-001', 'Monitor-002', 'Keyboard-003'];
}
