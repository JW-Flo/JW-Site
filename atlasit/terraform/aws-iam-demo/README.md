# AWS IAM Terraform Automation Demo

## Purpose
Demonstrates fully automated AWS IAM user, role, and permission management using Terraform. Intended for AtlasIT/Okta lifecycle automation interviews.

## Setup

1. Copy `.env.example` to `.env` and fill in your AWS credentials.
2. Export your credentials:
   ```
   export AWS_ACCESS_KEY=your-access-key
   export AWS_SECRET_KEY=your-secret-key
   ```
3. Initialize and apply Terraform:
   ```
   cd atlasit/terraform/aws-iam-demo
   terraform init
   terraform apply
   ```
4. Outputs will show the created user and role ARNs.

## Clean Up

To destroy resources:
```
terraform destroy
```


## Extend

- Add more users, roles, or policies as needed.
- Integrate with Okta as the central IdP for full lifecycle automation across AWS, Microsoft Entra ID (Azure AD), and Active Directory.
- See `IAM_AUTOMATION_OVERVIEW.md` in this directory for a cohesive plan and demo steps for Okta-driven IAM automation across all systems.
