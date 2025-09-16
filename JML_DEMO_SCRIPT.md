# 🚀 Interactive JML Lifecycle Demo - Quick Guide

## Demo URL
**Live Demo**: `http://localhost:4321/jml-demo`

## Three Complete Storylines

### 1. 👋 **Joiner Workflow** - New Security Engineer
**Character**: Jordan Miles joins as Security Engineer
- **HRIS**: Employee created in BambooHR
- **Webhook**: Real-time notification to AtlasIT
- **Okta**: User created, added to "AWS Access" + "Security Team" 
- **AWS**: IAM user with security engineer policies
- **Result**: Complete access in ~90 seconds

### 2. 🔄 **Mover Workflow** - Role Change
**Character**: Maya Greene promoted Data Analyst → Security Engineer  
- **HRIS**: Role update detected
- **Okta**: Groups changed (Data Team → Security Team)
- **AWS**: Policies updated (data analyst → security engineer)
- **Result**: New permissions, audit trail maintained

### 3. 👋 **Leaver Workflow** - Contractor Departure
**Character**: Alex Johnson contract ends
- **HRIS**: Termination marked
- **Immediate**: All access revoked across systems
- **AWS**: IAM user destroyed, sessions terminated
- **Okta**: Account deactivated
- **Result**: Complete offboarding in ~60 seconds

## Demo Features

✅ **Interactive Timeline** - Click through each step  
✅ **Real-time Logs** - See actual API calls and responses  
✅ **Auto-Play Mode** - Full automation demonstration  
✅ **System Integration** - HRIS → Okta → AWS → Compliance  
✅ **Realistic Timing** - Actual workflow durations  

## Interview Talking Points

1. **Zero-Touch Automation**: No manual intervention required
2. **Single Source of Truth**: HRIS drives all downstream changes  
3. **Real-time Compliance**: Every change logged and audited
4. **Enterprise Scale**: Handles thousands of employees
5. **Security First**: Least privilege, MFA, session controls

## Quick Demo Script (5 minutes)

1. **Show Dashboard** → Click "Launch Interactive Demo"
2. **Select Joiner** → "Jordan Miles - New Security Engineer" 
3. **Click "Run Complete Demo"** → Watch full automation
4. **Highlight**: HRIS → Okta → AWS → CloudTrail in 90 seconds
5. **Show Logs**: Real API calls, timing, system interactions
6. **Select Leaver** → Show immediate access revocation
7. **Explain**: "This is what enterprise-grade identity automation looks like"

**Key Message**: "From HR clicking 'hire' to full AWS access with security policies - completely automated in under 2 minutes."
