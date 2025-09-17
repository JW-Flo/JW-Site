<template>
  <div id="app">
    <div class="demo-banner">
      🚀 Interactive JML Lifecycle Demo - Paycom HRIS Integration with Enterprise IAM Automation
    </div>
    <div class="container">
      <!-- Copy all demo UI from jml-demo-new.astro here (already extracted above) -->
      <!-- ... -->
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentScenario: null,
      currentEmployee: null,
      currentStepIndex: 0,
      workflowComplete: false,
      demoRunning: false,
      autoAdvance: false,
      stepLogs: {},
      globalLogs: [],
      scenarios: [
        {
          id: 'joiner',
          icon: '👋',
          title: 'New Employee',
          subtitle: 'Joiner Workflow',
          description: 'Jordan Miles joins as Security Engineer. Watch automated provisioning across Paycom, Okta and AWS.',
          progress: 0,
          employee: {
            employeeId: 'EMP001',
            firstName: 'Jordan',
            lastName: 'Miles',
            email: 'jordan.miles@atlasit.pro',
            title: 'Security Engineer',
            department: 'Security',
            manager: 'security-lead@atlasit.pro',
            employeeType: 'fulltime',
            status: 'active',
            startDate: '2025-01-15'
          },
          steps: [
            {
              title: 'Paycom Employee Created',
              description: 'HR creates new employee record in Paycom with role requirements and triggers automated workflow',
              systems: ['Paycom HRIS', 'AtlasIT Orchestrator'],
              duration: '~5s',
              apiCall: 'POST /api/paycom/employees',
              payload: 'Employee data with security role requirements'
            },
            {
              title: 'Okta User Creation',
              description: 'API Manager calls Okta API to create user account with security group assignments',
              systems: ['AtlasIT API Manager', 'Okta'],
              duration: '~15s',
              apiCall: 'POST /api/v1/users',
              payload: 'User profile and security group memberships'
            },
            {
              title: 'AWS IAM Role Creation',
              description: 'AtlasIT creates AWS IAM role with security engineer permissions via direct API',
              systems: ['AtlasIT', 'AWS IAM'],
              duration: '~20s',
              apiCall: 'POST /api/aws/iam/roles',
              payload: 'Security engineer role and policy definitions'
            },
            {
              title: 'Application Access Provisioning',
              description: 'Automated provisioning of security tools and applications based on role requirements',
              systems: ['Slack', 'GitHub', 'AWS Console', 'Security Tools'],
              duration: '~25s',
              apiCall: 'POST /api/applications/provision',
              payload: 'Application access matrix for security role'
            },
            {
              title: 'Compliance Verification',
              description: 'Verify all access grants meet SOC2, ISO27001 and company security policies',
              systems: ['AtlasIT Compliance Engine', 'Audit Logger'],
              duration: '~10s',
              apiCall: 'POST /api/compliance/verify',
              payload: 'Access verification and compliance check results'
            }
          ]
        },
        {
          id: 'mover',
          icon: '🔄',
          title: 'Role Change',
          subtitle: 'Mover Workflow',
          description: 'Sarah Chen transfers from Engineering to DevOps team. Watch automated access adjustments.',
          progress: 0,
          employee: {
            employeeId: 'EMP002',
            firstName: 'Sarah',
            lastName: 'Chen',
            email: 'sarah.chen@atlasit.pro',
            title: 'Senior DevOps Engineer',
            department: 'DevOps',
            manager: 'devops-lead@atlasit.pro',
            employeeType: 'fulltime',
            status: 'active',
            transferDate: '2025-01-20'
          },
          steps: [
            {
              title: 'Paycom Role Update',
              description: 'Paycom detects department transfer and triggers role change workflow',
              systems: ['Paycom HRIS', 'AtlasIT Change Detector'],
              duration: '~3s',
              apiCall: 'PUT /api/paycom/employees/role-change',
              payload: 'Updated role and department information'
            },
            {
              title: 'Access Review',
              description: 'AtlasIT analyzes current permissions and identifies changes needed for DevOps role',
              systems: ['AtlasIT Access Analyzer', 'Policy Engine'],
              duration: '~8s',
              apiCall: 'POST /api/access/review',
              payload: 'Current vs required access comparison'
            },
            {
              title: 'New Permissions',
              description: 'Grant additional AWS and Kubernetes access required for DevOps role',
              systems: ['AWS IAM', 'Okta', 'Kubernetes RBAC'],
              duration: '~12s',
              apiCall: 'POST /api/permissions/grant',
              payload: 'DevOps role permissions and AWS policies'
            },
            {
              title: 'Legacy Access Removal',
              description: 'Remove engineering-specific permissions no longer needed',
              systems: ['Various Applications', 'AWS IAM', 'Active Directory'],
              duration: '~10s',
              apiCall: 'DELETE /api/permissions/revoke',
              payload: 'Deprecated access permissions list'
            },
            {
              title: 'Validation and Audit',
              description: 'Verify access changes and generate compliance audit trail',
              systems: ['AtlasIT Audit Trail', 'Compliance Dashboard'],
              duration: '~5s',
              apiCall: 'POST /api/audit/role-change',
              payload: 'Role change validation and audit log'
            }
          ]
        },
        {
          id: 'leaver',
          icon: '👋',
          title: 'Employee Exit',
          subtitle: 'Leaver Workflow',
          description: 'Mike Rodriguez leaves the company. Watch secure offboarding and access revocation.',
          progress: 0,
          employee: {
            employeeId: 'EMP003',
            firstName: 'Mike',
            lastName: 'Rodriguez',
            email: 'mike.rodriguez@atlasit.pro',
            title: 'Marketing Manager',
            department: 'Marketing',
            manager: 'marketing-director@atlasit.pro',
            employeeType: 'fulltime',
            status: 'terminated',
            lastWorkDate: '2025-01-25'
          },
          steps: [
            {
              title: 'Paycom Termination Event',
              description: 'Paycom triggers immediate offboarding workflow upon termination',
              systems: ['Paycom HRIS', 'AtlasIT Security Orchestrator'],
              duration: '~2s',
              apiCall: 'POST /api/paycom/termination',
              payload: 'Termination event with security requirements'
            },
            {
              title: 'Account Deactivation',
              description: 'Immediately disable Okta account and terminate all active sessions',
              systems: ['Okta', 'AtlasIT Session Manager'],
              duration: '~5s',
              apiCall: 'POST /api/okta/deactivate',
              payload: 'User deactivation and session termination'
            },
            {
              title: 'AWS Access Revocation',
              description: 'Remove all AWS permissions, access keys, and disable IAM user',
              systems: ['AWS IAM', 'AWS API Gateway', 'S3 Buckets'],
              duration: '~8s',
              apiCall: 'DELETE /api/aws/access',
              payload: 'Complete AWS access revocation request'
            },
            {
              title: 'Application Cleanup',
              description: 'Revoke access from all SaaS applications and collaboration tools',
              systems: ['Slack', 'GitHub', 'Salesforce', 'Google Workspace'],
              duration: '~15s',
              apiCall: 'POST /api/applications/revoke-all',
              payload: 'Application access revocation batch request'
            },
            {
              title: 'Data Security and Audit',
              description: 'Generate compliance report and ensure secure data transfer to manager',
              systems: ['AtlasIT Data Governor', 'Compliance Engine'],
              duration: '~10s',
              apiCall: 'POST /api/compliance/offboard-audit',
              payload: 'Offboarding compliance report and data transfer confirmation'
            }
          ]
        }
      ]
    };
  },
  mounted() {
      // Screenshot detection logic for JML Demo
      function sendScreenshotEvent(context = 'jml-demo') {
        const user = localStorage.getItem('atlasit_user');
        const userData = user ? JSON.parse(user) : {};
        fetch('/api/screenshot-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: userData.email || userData.company || 'unknown',
            page: window.location.pathname,
            context,
            risk_level: 'high',
            details: 'Possible screenshot detected via blur/visibilitychange.'
          })
        });
        window.dispatchEvent(new CustomEvent('atlasit-analytics', { detail: { event: 'screenshot', page: window.location.pathname, context } }));
        console.log('[Security] Screenshot event sent');
      }
      function screenshotDetectionHandler(e) {
        if (/Mobi|Android/i.test(navigator.userAgent)) {
          sendScreenshotEvent('jml-demo');
        }
      }
      window.addEventListener('blur', screenshotDetectionHandler);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          screenshotDetectionHandler();
        }
      });
  },
  methods: {
    async selectScenario(id) {
      this.currentScenario = this.scenarios.find(s => s.id === id);
      this.currentEmployee = this.currentScenario.employee;
      this.currentStepIndex = 0;
      this.workflowComplete = false;
      this.stepLogs = {};
      this.globalLogs = [];
      this.addGlobalLog('info', 'Demo System', `🎯 Selected ${this.currentScenario.title} scenario for ${this.currentEmployee.firstName} ${this.currentEmployee.lastName}`);
      this.addGlobalLog('info', 'Paycom HRIS', `📋 Employee record loaded: ${this.currentEmployee.employeeId}`);
      await this.saveDemoState();
    },
    async nextStep() {
      if (this.currentStepIndex < this.currentScenario.steps.length - 1) {
        await this.executeStep(this.currentStepIndex);
        this.currentStepIndex++;
        this.updateProgress();
        await this.saveDemoState();
      }
    },
    async previousStep() {
      if (this.currentStepIndex > 0) {
        this.currentStepIndex--;
        this.updateProgress();
        await this.saveDemoState();
      }
    },
    async executeStep(stepIndex) {
      const step = this.currentScenario.steps[stepIndex];
      this.addStepLog(stepIndex, `🚀 Executing: ${step.title}`);
      this.addGlobalLog('info', step.systems[0], `▶️ Starting: ${step.title}`);
      await this.delay(200);
      this.addStepLog(stepIndex, `📡 API Call: ${step.apiCall}`);
      if (step.title.includes('Paycom')) {
        this.addStepLog(stepIndex, `🏢 Paycom API: Processing employee data...`);
        await this.delay(500);
        this.addStepLog(stepIndex, `✅ Paycom: Employee record updated - ID: ${this.currentEmployee.employeeId}`);
        this.addStepLog(stepIndex, `📋 Event Type: ${this.getPaycomEventType(step.title)}`);
      }
      this.addStepLog(stepIndex, `📦 Payload: ${step.payload}`);
      const processingTime = parseInt(step.duration.match(/\d+/)[0]) * 100;
      await this.delay(processingTime);
      this.addStepLog(stepIndex, `⚙️ Processing: ${step.description}`);
      if (step.title.includes('Okta')) {
        await this.delay(300);
        this.addStepLog(stepIndex, `🔐 Okta Response: User account processed successfully`);
        this.addStepLog(stepIndex, `👤 Username: ${this.currentEmployee.firstName.toLowerCase()}.${this.currentEmployee.lastName.toLowerCase()}`);
        this.addStepLog(stepIndex, `📧 Email: ${this.currentEmployee.email}`);
      } else if (step.title.includes('AWS')) {
        await this.delay(400);
        this.addStepLog(stepIndex, `☁️ AWS Response: IAM operations completed`);
        this.addStepLog(stepIndex, `🔑 Role: ${this.currentEmployee.department}${this.currentEmployee.title.replace(/\s+/g, '')}`);
        this.addStepLog(stepIndex, `🏷️ Tags: Department=${this.currentEmployee.department}`);
      } else if (step.title.includes('Application')) {
        await this.delay(600);
        const apps = step.systems.filter(s => !s.includes('AtlasIT'));
        this.addStepLog(stepIndex, `📱 Applications: ${apps.length} systems processed`);
        apps.forEach(app => {
          this.addStepLog(stepIndex, `  ✓ ${app} access configured`);
        });
      } else if (step.title.includes('Compliance') || step.title.includes('Audit')) {
        await this.delay(300);
        this.addStepLog(stepIndex, `📋 Compliance: All operations meet policy requirements`);
        this.addStepLog(stepIndex, `🔍 Audit Trail: Generated and stored with ID: ${Date.now()}`);
      }
      await this.delay(500);
      this.addStepLog(stepIndex, `✅ ${step.title} completed successfully`);
      this.addGlobalLog('success', step.systems[step.systems.length - 1], `✅ Completed: ${step.title} (${step.duration})`);
      await this.saveStepResult(stepIndex, step);
    },
    async completeWorkflow() {
      this.workflowComplete = true;
      this.currentScenario.progress = 100;
      await this.executeStep(this.currentStepIndex);
      this.addGlobalLog('success', 'Demo System', `🎉 ${this.currentScenario.title} workflow completed for ${this.currentEmployee.firstName} ${this.currentEmployee.lastName}`);
      this.addGlobalLog('info', 'Paycom HRIS', `📊 Employee lifecycle event processed successfully`);
      await this.saveDemoState();
    },
    async runFullDemo() {
      if (!this.currentScenario || this.demoRunning) return;
      this.demoRunning = true;
      this.currentStepIndex = 0;
      this.workflowComplete = false;
      this.stepLogs = {};
      this.globalLogs = [];
      this.addGlobalLog('info', 'Demo System', `🚀 Starting full ${this.currentScenario.title} demonstration`);
      for (let i = 0; i < this.currentScenario.steps.length; i++) {
        this.currentStepIndex = i;
        await this.executeStep(i);
        await this.delay(1000);
      }
      this.workflowComplete = true;
      this.currentScenario.progress = 100;
      this.addGlobalLog('success', 'Demo System', `🎉 Full demonstration completed successfully!`);
      this.demoRunning = false;
    },
    resetDemo() {
      if (this.currentScenario) {
        this.currentStepIndex = 0;
        this.workflowComplete = false;
        this.currentScenario.progress = 0;
        this.stepLogs = {};
        this.globalLogs = [];
        this.demoRunning = false;
        this.addGlobalLog('info', 'Demo System', `🔄 Demo reset for ${this.currentScenario.title}`);
      }
    },
    toggleAutoAdvance() {
      this.autoAdvance = !this.autoAdvance;
      this.addGlobalLog('info', 'Demo System', `${this.autoAdvance ? '▶️ Auto-advance enabled' : '⏸️ Auto-advance disabled'}`);
    },
    addStepLog(stepIndex, message) {
      if (!this.stepLogs[stepIndex]) {
        this.stepLogs[stepIndex] = [];
      }
      this.stepLogs[stepIndex].push({
        timestamp: new Date().toLocaleTimeString(),
        message,
        type: this.getLogType(message)
      });
    },
    addGlobalLog(type, system, message) {
      this.globalLogs.push({
        timestamp: new Date().toLocaleTimeString(),
        type,
        system,
        message
      });
      if (this.globalLogs.length > 50) {
        this.globalLogs = this.globalLogs.slice(-40);
      }
    },
    getLogType(message) {
      if (message.includes('✅') || message.includes('completed')) return 'success';
      if (message.includes('🚀') || message.includes('▶️')) return 'info';
      if (message.includes('📡') || message.includes('Processing')) return 'processing';
      if (message.includes('⚠️') || message.includes('Warning')) return 'warning';
      if (message.includes('❌') || message.includes('Error')) return 'error';
      return 'info';
    },
    getStatusColor(type) {
      const colors = {
        'success': '#10b981',
        'info': '#3b82f6',
        'processing': '#f59e0b',
        'warning': '#f59e0b',
        'error': '#ef4444'
      };
      return colors[type] || '#94a3b8';
    },
    getStepIndicatorStyle(index) {
      if (index < this.currentStepIndex) {
        return { backgroundColor: '#10b981', color: 'white' };
      } else if (index === this.currentStepIndex) {
        return { backgroundColor: '#3b82f6', color: 'white' };
      } else {
        return { backgroundColor: '#64748b', color: 'white' };
      }
    },
    getPaycomEventType(stepTitle) {
      if (stepTitle.includes('Created')) return 'EMPLOYEE_HIRE';
      if (stepTitle.includes('Update') || stepTitle.includes('Role')) return 'EMPLOYEE_UPDATE';
      if (stepTitle.includes('Termination')) return 'EMPLOYEE_TERMINATION';
      return 'EMPLOYEE_EVENT';
    },
    updateProgress() {
      if (this.currentScenario) {
        this.currentScenario.progress = Math.round((this.currentStepIndex / this.currentScenario.steps.length) * 100);
      }
    },
    async saveDemoState() {
      try {
        const state = {
          scenario: this.currentScenario ? this.currentScenario.id : null,
          employee: this.currentEmployee,
          stepIndex: this.currentStepIndex,
          progress: this.currentScenario ? (this.currentScenario.progress || 0) : 0,
          timestamp: new Date().toISOString(),
          logs: this.globalLogs.slice(0, 10)
        };
        await fetch('/api/demo/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
        });
        console.log('📀 Demo state saved');
      } catch (error) {
        console.error('Failed to save demo state:', error);
      }
    },
    async saveStepResult(stepIndex, step) {
      try {
        const stepResult = {
          stepIndex,
          stepTitle: step.title,
          duration: step.duration,
          systems: step.systems,
          employee: this.currentEmployee,
          timestamp: new Date().toISOString(),
          logs: this.stepLogs[stepIndex] || []
        };
        await fetch('/api/demo/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stepResult)
        });
        console.log(`📋 Step ${stepIndex + 1} result saved`);
      } catch (error) {
        console.error('Failed to save step result:', error);
      }
    },
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
};
</script>

<style scoped>
/* Copy relevant styles from jml-demo-new.astro */
</style>
