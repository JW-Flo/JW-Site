# HRIS-Okta-AWS Integration Demo

## Architecture Overview

```
HRIS (BambooHR) → Webhooks → API Manager → Okta → Terraform → AWS IAM
```

## Key Demo Points

### 1. HRIS as Source of Truth
- **Employee Master Data**: HRIS contains all employee information
- **Webhook Events**: Real-time updates for new hires, role changes, terminations
- **System Access Rules**: HRIS defines which systems each employee needs

### 2. Automated Provisioning Flow

#### New Employee (Joiner)
```json
{
  "eventType": "employee.created",
  "employee": {
    "employeeId": "EMP001",
    "personalInfo": {
      "firstName": "Jordan",
      "lastName": "Miles", 
      "email": "jordan.miles@atlasit.pro",
      "startDate": "2025-01-15"
    },
    "jobInfo": {
      "title": "Security Engineer",
      "department": "Security"
    },
    "systemAccess": {
      "needsAWS": true,
      "role": "security_engineer"
    }
  }
}
```

**Automated Actions:**
1. Creates Okta user with HRIS data
2. Assigns to "AWS Access" and "Security Team" groups
3. Triggers Terraform to provision AWS IAM user with security engineer policies

#### Role Change (Mover)  
```json
{
  "eventType": "employee.updated", 
  "changes": {
    "jobInfo": {"title": "Senior Security Engineer"},
    "systemAccess": {"role": "security_engineer"}
  }
}
```

#### Termination (Leaver)
```json
{
  "eventType": "employee.terminated",
  "employee": {"employeeId": "EMP001"}
}
```

**Automated Actions:**
1. Removes from all Okta groups
2. Triggers AWS IAM deprovisioning
3. Deactivates Okta user

### 3. Demo API Endpoints

```bash
# HRIS Webhook (simulated)
curl -X POST http://localhost:3001/api/hris/webhook \
  -H "X-API-Key: atlasit-demo-api-key" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"employee.created","employee":{...}}'

# Bulk sync from HRIS
curl -X POST http://localhost:3001/api/hris/sync \
  -H "X-API-Key: atlasit-demo-api-key"

# Health check
curl http://localhost:3001/api/hris/health
```

## Interview Talking Points

1. **Single Source of Truth**: HRIS eliminates manual data entry and ensures consistency
2. **Zero-Touch Provisioning**: New employee → Automatic AWS access in minutes
3. **Compliance**: Every access change is tracked from HRIS to AWS
4. **Security**: Role-based policies ensure least privilege access
5. **Scalability**: Supports thousands of employees across multiple cloud providers

## Quick Start

```bash
# Start the demo
chmod +x setup-atlasit-demo.sh
./setup-atlasit-demo.sh
./start-demo.sh
```

Ready to demonstrate enterprise-grade HRIS-driven identity automation!
