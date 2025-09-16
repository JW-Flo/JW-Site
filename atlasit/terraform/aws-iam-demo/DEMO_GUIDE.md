# AtlasIT Okta-AWS IAM Automation Demo

This comprehensive demo showcases the complete integration between Okta and AWS IAM using Terraform for automated user lifecycle management (JML - Joiner, Mover, Leaver).

## Demo Architecture

```
Okta (IdP) → API Manager → Terraform → AWS IAM
     ↓            ↓            ↓         ↓
User Events → JML Workflow → Infrastructure → Provisioning
```

## Components Overview

### 1. Okta Integration Service (`/atlasit/api-manager/src/services/oktaService.ts`)
- **User Management**: Create, update, deactivate users
- **Group Management**: Manage group memberships for system access
- **JML Workflows**: Automated joiner/mover/leaver processes
- **System Integration**: Triggers downstream provisioning

### 2. Enhanced Terraform Configuration (`/atlasit/terraform/aws-iam-demo/`)
- **Role-Based Policies**: Developer, Security Engineer, Data Analyst, Contractor
- **JML Lifecycle Support**: Comprehensive user lifecycle automation
- **Compliance Features**: CloudTrail monitoring, SNS notifications
- **Security Controls**: MFA requirements, session limits, IP restrictions

### 3. API Manager (`/atlasit/api-manager/`)
- **RESTful APIs**: Complete Okta and AWS IAM operations
- **Authentication**: API key-based security
- **Rate Limiting**: Protection against abuse
- **Logging**: Comprehensive audit trails

## Demo Scenarios

### Scenario 1: New Employee Onboarding (Joiner)

**Story**: Jordan Miles joins AtlasIT as a Security Engineer

1. **Okta Admin Action**: Create user and assign to "AWS Access" group
2. **Automated Workflow**: 
   - API Manager detects group assignment
   - Triggers JML workflow with `action: "joiner"`
   - Executes Terraform with security engineer variables
3. **AWS Provisioning**:
   - Creates IAM user with security engineer policies
   - Assigns to security-engineers group
   - Sets up CloudTrail monitoring
   - Configures MFA requirements

**API Call Example**:
```bash
curl -X POST http://localhost:3001/api/okta/jml \
  -H "X-API-Key: atlasit-demo-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "jordan.miles@atlasit.pro",
    "action": "joiner",
    "targetSystems": ["aws"],
    "metadata": {
      "department": "Security",
      "role": "security_engineer",
      "startDate": "2025-01-15",
      "manager": "security-lead@atlasit.pro"
    }
  }'
```

**Terraform Variables Auto-Generated**:
```hcl
demo_user_name     = "jordan-miles-atlasit-pro"
okta_user_id       = "u-okta-security-001"
user_email         = "jordan.miles@atlasit.pro"
user_department    = "Security"
user_role          = "security_engineer"
employee_type      = "fulltime"
jml_action         = "joiner"
```

### Scenario 2: Role Change (Mover)

**Story**: Maya Greene moves from Clinical Data Analyst to Security Engineer

1. **Okta Admin Action**: Update user profile, change group memberships
2. **Automated Workflow**:
   - Detects group changes
   - Triggers `action: "mover"` workflow
   - Updates AWS permissions
3. **AWS Updates**:
   - Removes from data-analysts group
   - Adds to security-engineers group
   - Updates attached policies
   - Logs access changes

**API Call Example**:
```bash
curl -X POST http://localhost:3001/api/okta/jml \
  -H "X-API-Key: atlasit-demo-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "maya.greene@atlasit.pro",
    "action": "mover",
    "targetSystems": ["aws"],
    "metadata": {
      "role": "security_engineer",
      "previousRole": "data_analyst",
      "department": "Security",
      "manager": "security-lead@atlasit.pro"
    }
  }'
```

### Scenario 3: Employee Departure (Leaver)

**Story**: Contractor access removal at project end

1. **Okta Admin Action**: Remove from system groups or deactivate user
2. **Automated Workflow**:
   - Triggers `action: "leaver"` workflow
   - Schedules or immediate deprovisioning
3. **AWS Cleanup**:
   - Removes from all groups
   - Deactivates access keys
   - Maintains audit logs
   - Optional: Destroys user (configurable)

**API Call Example**:
```bash
curl -X POST http://localhost:3001/api/okta/jml \
  -H "X-API-Key: atlasit-demo-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "contractor@atlasit.pro",
    "action": "leaver",
    "targetSystems": ["aws"],
    "metadata": {
      "endDate": "2025-02-01",
      "reason": "Contract completion"
    }
  }'
```

## IAM Policy Framework

### 1. Developer Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*", "ec2:RunInstances", "ec2:StartInstances",
        "s3:GetObject", "s3:PutObject", "lambda:*", "logs:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": { "aws:RequestedRegion": "us-east-1" }
      }
    },
    {
      "Effect": "Deny",
      "Action": ["iam:*", "organizations:*"],
      "Resource": "*"
    }
  ]
}
```

### 2. Security Engineer Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudtrail:*", "config:*", "guardduty:*",
        "securityhub:*", "inspector:*", "macie:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["iam:CreateRole", "iam:CreatePolicy"],
      "Resource": "*",
      "Condition": {
        "StringLike": { "iam:PolicyArn": "arn:aws:iam::*:policy/atlasit/*" }
      }
    }
  ]
}
```

### 3. Contractor Policy (Time-based)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ec2:Describe*", "s3:GetObject", "logs:Describe*"],
      "Resource": "*",
      "Condition": {
        "DateGreaterThan": { "aws:CurrentTime": "2025-01-01T00:00:00Z" },
        "DateLessThan": { "aws:CurrentTime": "2025-12-31T23:59:59Z" },
        "IpAddress": { "aws:SourceIp": ["203.0.113.0/24"] }
      }
    }
  ]
}
```

## Compliance & Security Features

### 1. CloudTrail Integration
- **IAM Event Monitoring**: Tracks all user/role changes
- **Lambda Processing**: Automated event analysis
- **SNS Notifications**: Real-time alerts for security events

### 2. Session Controls
- **MFA Enforcement**: Required for all users
- **Session Timeouts**: 2-hour maximum sessions
- **IP Restrictions**: Contractor access limited to approved networks

### 3. Audit Logging
- **JML Event Tracking**: Complete lifecycle audit trail
- **CloudWatch Logs**: Centralized log aggregation
- **Compliance Reports**: Automated compliance reporting

## Running the Demo

### Prerequisites
```bash
# 1. Environment Setup
cp /atlasit/api-manager/.env.example /atlasit/api-manager/.env
cp /atlasit/terraform/aws-iam-demo/.env.example /atlasit/terraform/aws-iam-demo/.env

# 2. Configure Okta credentials in .env files
# 3. Configure AWS credentials in .env files
```

### Start API Manager
```bash
cd /atlasit/api-manager
npm install
npm run dev
```

### Initialize Terraform
```bash
cd /atlasit/terraform/aws-iam-demo
terraform init
```

### Build Lambda Function
```bash
chmod +x build-lambda.sh
./build-lambda.sh
```

### Demo Execution

1. **Health Check**:
```bash
curl http://localhost:3001/health/detailed
```

2. **View Okta Users**:
```bash
curl -H "X-API-Key: atlasit-demo-api-key" \
     http://localhost:3001/api/okta/users
```

3. **View Okta Groups**:
```bash
curl -H "X-API-Key: atlasit-demo-api-key" \
     http://localhost:3001/api/okta/groups
```

4. **Trigger Joiner Workflow**:
```bash
curl -X POST http://localhost:3001/api/okta/jml \
  -H "X-API-Key: atlasit-demo-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user@atlasit.pro",
    "action": "joiner",
    "targetSystems": ["aws"],
    "metadata": {
      "department": "Engineering",
      "role": "developer"
    }
  }'
```

5. **Execute Terraform** (manually for demo):
```bash
cd /atlasit/terraform/aws-iam-demo
terraform plan -var="demo_user_name=demo-user-atlasit-pro"
terraform apply -auto-approve
```

6. **View AWS Resources**:
```bash
terraform output
```

## Integration Points

### 1. Frontend Integration
The existing API Manager UI (`/apps/platform/src/pages/api-manager.astro`) can be enhanced to:
- Display real-time JML workflow status
- Show integration health checks
- Provide user provisioning controls

### 2. Workflow Builder Integration
Connect with the existing Workflow Builder to:
- Create custom JML approval processes
- Define multi-system provisioning sequences
- Set up automated compliance checks

### 3. Monitoring Integration
Connect with existing monitoring tools:
- AtlasIT dashboard for workflow visualization
- CloudWatch integration for metrics
- Security Center integration for compliance

## Security Considerations

### 1. Secrets Management
- **API Keys**: Rotate regularly, store in secure vault
- **Terraform State**: Use remote state with encryption
- **Okta Tokens**: Implement token rotation

### 2. Network Security
- **API Gateway**: Use in production for additional security
- **VPC Endpoints**: Secure AWS API communication
- **Private Subnets**: Isolate sensitive operations

### 3. Audit & Compliance
- **SOC 2**: Comprehensive logging for compliance
- **PCI DSS**: Data protection for financial roles
- **HIPAA**: Healthcare-specific controls for clinical roles

## Next Steps

1. **Production Readiness**:
   - Implement secrets management (AWS Secrets Manager/HashiCorp Vault)
   - Set up monitoring and alerting
   - Configure backup and disaster recovery

2. **Enhanced Features**:
   - Multi-region AWS deployment
   - Cross-account role assumptions
   - Advanced approval workflows

3. **Additional Integrations**:
   - Microsoft Entra ID automation
   - Google Workspace provisioning
   - ServiceNow ticket integration

This demo provides a complete foundation for enterprise-grade identity lifecycle automation, demonstrating the power of combining Okta's identity management with AWS's infrastructure automation through Terraform.
