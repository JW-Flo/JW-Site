const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/platform/src/pages/jml-basic.astro');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix the runDemo function to use contextual steps
const oldRunDemoPattern = /if \(currentWorkflow\.steps\[i\]\.includes\('Paycom'\)\) \{[\s\S]*?log\.innerHTML \+= `<div style="color: #f59e0b;">\[.*?\] 📡 API calls in progress\.\.\.<\/div>`;[\s\S]*?\}/;

const newRunDemoCode = `if (currentStep.includes('Paycom')) {
          log.innerHTML += \`<div style="color: #8b5cf6;">[\${new Date().toLocaleTimeString()}] 🏢 Paycom HRIS API: Connecting to tenant HWCO-2025...</div>\`;
          await new Promise(resolve => setTimeout(resolve, 1200));
          log.innerHTML += \`<div style="color: #10b981;">[\${new Date().toLocaleTimeString()}] ✅ Paycom: Retrieved \${employeeName} profile from \${department} department</div>\`;
          
          if (currentStep.includes('webhook')) {
            log.innerHTML += \`<div style="color: #f59e0b;">[\${new Date().toLocaleTimeString()}] 📡 Webhook: Payload validated, triggering AtlasIT orchestrator</div>\`;
          }
          
        } else if (currentStep.includes('Okta')) {
          log.innerHTML += \`<div style="color: #3b82f6;">[\${new Date().toLocaleTimeString()}] 🔐 Okta Identity API: Connecting to \${department.toLowerCase()}.atlasit.okta.com...</div>\`;
          await new Promise(resolve => setTimeout(resolve, 800));
          log.innerHTML += \`<div style="color: #10b981;">[\${new Date().toLocaleTimeString()}] ✅ Okta: User \${currentStep.includes('disable') ? 'disabled' : 'processed'} with \${department}-specific groups</div>\`;
          
        } else if (currentStep.includes('AWS')) {
          log.innerHTML += \`<div style="color: #f59e0b;">[\${new Date().toLocaleTimeString()}] ☁️ AWS IAM API: Executing Terraform via AtlasIT automation...</div>\`;
          await new Promise(resolve => setTimeout(resolve, 1500));
          log.innerHTML += \`<div style="color: #10b981;">[\${new Date().toLocaleTimeString()}] ✅ Terraform: \${currentStep.includes('Revoke') ? 'Revoked' : 'Configured'} IAM role with \${awsAccess} permissions</div>\`;
          
        } else if (currentStep.includes('Application')) {
          log.innerHTML += \`<div style="color: #8b5cf6;">[\${new Date().toLocaleTimeString()}] 📱 SaaS Integration: Processing \${selectedApps.length} applications...</div>\`;
          await new Promise(resolve => setTimeout(resolve, selectedApps.length * 200));
          log.innerHTML += \`<div style="color: #10b981;">[\${new Date().toLocaleTimeString()}] ✅ Applications: \${currentStep.includes('Revoke') ? 'Access revoked' : 'Access granted'} for \${selectedApps.length} systems</div>\`;
          
        } else {
          log.innerHTML += \`<div style="color: #f59e0b;">[\${new Date().toLocaleTimeString()}] 📡 API Integration: Processing step...</div>\`;
          await new Promise(resolve => setTimeout(resolve, 1000));
          log.innerHTML += \`<div style="color: #10b981;">[\${new Date().toLocaleTimeString()}] ✅ Integration: Step completed successfully</div>\`;
        }`;

// Replace the old pattern
content = content.replace(oldRunDemoPattern, newRunDemoCode);

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ JML demo workflow execution fixed!');
console.log('📋 Fixed issues:');
console.log('   - Updated to use contextual workflow steps');
console.log('   - Enhanced API simulation with realistic timing');
console.log('   - Added employee context to logging');
console.log('   - Improved Terraform and AWS integration messaging');
