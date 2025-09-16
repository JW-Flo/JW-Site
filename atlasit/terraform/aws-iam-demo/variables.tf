# AWS Configuration
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key" {
  description = "AWS access key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS secret access key"
  type        = string
  sensitive   = true
}

# Environment Configuration
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "demo"
  validation {
    condition     = contains(["dev", "staging", "prod", "demo"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod, demo."
  }
}

variable "cost_center" {
  description = "Cost center for billing purposes"
  type        = string
  default     = "IT-Demo"
}

# User Configuration (JML Integration)
variable "demo_user_name" {
  description = "Name of the demo IAM user"
  type        = string
  default     = "atlasit-demo-user"
}

variable "okta_user_id" {
  description = "Okta user ID for integration tracking"
  type        = string
  default     = "u-okta-001"
}

variable "user_email" {
  description = "User email address from Okta"
  type        = string
  default     = "demo-user@atlasit.pro"
  validation {
    condition     = can(regex("^[^@]+@[^@]+\\.[^@]+$", var.user_email))
    error_message = "User email must be a valid email address."
  }
}

variable "user_department" {
  description = "User department for policy assignment"
  type        = string
  default     = "Engineering"
}

variable "employee_type" {
  description = "Type of employee (fulltime, contractor, intern)"
  type        = string
  default     = "fulltime"
  validation {
    condition     = contains(["fulltime", "contractor", "intern"], var.employee_type)
    error_message = "Employee type must be one of: fulltime, contractor, intern."
  }
}

variable "manager_email" {
  description = "Manager email for approval workflows"
  type        = string
  default     = "manager@atlasit.pro"
}

variable "start_date" {
  description = "Employee start date (YYYY-MM-DD)"
  type        = string
  default     = "2025-01-01"
  validation {
    condition     = can(regex("^\\d{4}-\\d{2}-\\d{2}$", var.start_date))
    error_message = "Start date must be in YYYY-MM-DD format."
  }
}

variable "user_role" {
  description = "User role for policy assignment"
  type        = string
  default     = "developer"
  validation {
    condition     = contains(["developer", "security_engineer", "data_analyst", "contractor"], var.user_role)
    error_message = "User role must be one of: developer, security_engineer, data_analyst, contractor."
  }
}

# Role Configuration
variable "demo_role_name" {
  description = "Name of the demo IAM role"
  type        = string
  default     = "atlasit-demo-role"
}

variable "external_id" {
  description = "External ID for secure role assumption"
  type        = string
  default     = "atlasit-demo-external-id-2025"
  sensitive   = true
}

# Access Configuration
variable "create_access_keys" {
  description = "Whether to create programmatic access keys"
  type        = bool
  default     = false
}

variable "contractor_allowed_ips" {
  description = "List of IP addresses allowed for contractor access"
  type        = list(string)
  default     = ["203.0.113.0/24", "198.51.100.0/24"]
}

# JML Lifecycle Variables
variable "jml_action" {
  description = "JML action to perform (joiner, mover, leaver)"
  type        = string
  default     = "joiner"
  validation {
    condition     = contains(["joiner", "mover", "leaver"], var.jml_action)
    error_message = "JML action must be one of: joiner, mover, leaver."
  }
}

variable "previous_role" {
  description = "Previous role for mover scenarios"
  type        = string
  default     = ""
}

variable "effective_date" {
  description = "Effective date for JML action (YYYY-MM-DD)"
  type        = string
  default     = ""
}

# Okta Integration Variables
variable "okta_groups" {
  description = "List of Okta groups the user belongs to"
  type        = list(string)
  default     = ["AWS Access", "AtlasIT Workforce"]
}

variable "auto_provisioning" {
  description = "Enable automatic provisioning from Okta"
  type        = bool
  default     = true
}

# Compliance and Security
variable "require_mfa" {
  description = "Require MFA for this user"
  type        = bool
  default     = true
}

variable "session_duration" {
  description = "Maximum session duration in seconds"
  type        = number
  default     = 7200  # 2 hours
}

variable "enable_cloudtrail_monitoring" {
  description = "Enable CloudTrail monitoring for this user"
  type        = bool
  default     = true
}
