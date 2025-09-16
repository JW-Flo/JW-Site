# User Outputs
output "user_arn" {
  description = "ARN of the created IAM user"
  value       = aws_iam_user.demo_user.arn
}

output "user_name" {
  description = "Name of the created IAM user"
  value       = aws_iam_user.demo_user.name
}

output "user_unique_id" {
  description = "Unique ID of the IAM user"
  value       = aws_iam_user.demo_user.unique_id
}

# Role Outputs
output "role_arn" {
  description = "ARN of the created IAM role"
  value       = aws_iam_role.demo_role.arn
}

output "role_name" {
  description = "Name of the created IAM role"
  value       = aws_iam_role.demo_role.name
}

output "role_unique_id" {
  description = "Unique ID of the IAM role"
  value       = aws_iam_role.demo_role.unique_id
}

# Group Membership
output "user_groups" {
  description = "Groups the user is a member of"
  value       = aws_iam_user_group_membership.demo_user_groups.groups
}

# Access Keys (if created)
output "access_key_id" {
  description = "Access key ID (if created)"
  value       = var.create_access_keys ? aws_iam_access_key.demo_user_key[0].id : "Not created"
  sensitive   = true
}

output "secret_access_key" {
  description = "Secret access key (if created)"
  value       = var.create_access_keys ? aws_iam_access_key.demo_user_key[0].secret : "Not created"
  sensitive   = true
}

# Policy ARNs
output "policy_arns" {
  description = "ARNs of created custom policies"
  value = {
    developer_policy        = aws_iam_policy.developer_policy.arn
    security_engineer_policy = aws_iam_policy.security_engineer_policy.arn
    data_analyst_policy     = aws_iam_policy.data_analyst_policy.arn
    contractor_policy       = aws_iam_policy.contractor_policy.arn
  }
}

# Group ARNs
output "group_arns" {
  description = "ARNs of created IAM groups"
  value = {
    developers        = aws_iam_group.developers.arn
    security_engineers = aws_iam_group.security_engineers.arn
    data_analysts     = aws_iam_group.data_analysts.arn
    contractors       = aws_iam_group.contractors.arn
  }
}

# JML Information
output "jml_status" {
  description = "Current JML status and metadata"
  value = {
    action          = var.jml_action
    user_role       = var.user_role
    employee_type   = var.employee_type
    okta_user_id    = var.okta_user_id
    start_date      = var.start_date
    effective_date  = var.effective_date
  }
}

# Okta Integration Information
output "okta_integration" {
  description = "Okta integration metadata"
  value = {
    okta_groups         = var.okta_groups
    auto_provisioning   = var.auto_provisioning
    okta_user_id       = var.okta_user_id
  }
}

# Security Configuration
output "security_config" {
  description = "Security configuration applied"
  value = {
    require_mfa                  = var.require_mfa
    session_duration            = var.session_duration
    enable_cloudtrail_monitoring = var.enable_cloudtrail_monitoring
    external_id                 = "configured"  # Don't expose actual value
  }
}

# Console Login URL
output "console_login_url" {
  description = "AWS Console login URL for the user"
  value       = "https://${data.aws_caller_identity.current.account_id}.signin.aws.amazon.com/console"
}

# Role Assumption Command
output "assume_role_command" {
  description = "AWS CLI command to assume the created role"
  value       = "aws sts assume-role --role-arn ${aws_iam_role.demo_role.arn} --role-session-name ${var.demo_user_name}-session --external-id ${var.external_id}"
  sensitive   = true
}

# Data source for account ID
data "aws_caller_identity" "current" {}
