provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key

  default_tags {
    tags = {
      Environment   = var.environment
      Project       = "AtlasIT-IAM-Demo"
      ManagedBy     = "Terraform"
      OktaManaged   = "true"
      Department    = var.user_department
      CostCenter    = var.cost_center
    }
  }
}

# IAM Groups for role-based access control
resource "aws_iam_group" "developers" {
  name = "${var.environment}-developers"
  path = "/atlasit/"
}

resource "aws_iam_group" "security_engineers" {
  name = "${var.environment}-security-engineers"
  path = "/atlasit/"
}

resource "aws_iam_group" "data_analysts" {
  name = "${var.environment}-data-analysts"
  path = "/atlasit/"
}

resource "aws_iam_group" "contractors" {
  name = "${var.environment}-contractors"
  path = "/atlasit/"
}

# Custom IAM Policies for different roles
resource "aws_iam_policy" "developer_policy" {
  name        = "${var.environment}-developer-policy"
  description = "Policy for developers with limited compute and storage access"
  path        = "/atlasit/"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:RunInstances",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:TerminateInstances",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "lambda:*",
          "logs:*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      },
      {
        Effect = "Deny"
        Action = [
          "iam:*",
          "organizations:*",
          "account:*"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_policy" "security_engineer_policy" {
  name        = "${var.environment}-security-engineer-policy"
  description = "Policy for security engineers with monitoring and compliance access"
  path        = "/atlasit/"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudtrail:*",
          "config:*",
          "guardduty:*",
          "securityhub:*",
          "inspector:*",
          "macie:*",
          "detective:*",
          "access-analyzer:*",
          "iam:Get*",
          "iam:List*",
          "organizations:Describe*",
          "organizations:List*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:CreateRole",
          "iam:CreatePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "iam:PolicyArn" = "arn:aws:iam::*:policy/atlasit/*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "data_analyst_policy" {
  name        = "${var.environment}-data-analyst-policy"
  description = "Policy for data analysts with read access to data services"
  path        = "/atlasit/"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
          "athena:*",
          "glue:GetTable",
          "glue:GetDatabase",
          "glue:GetPartitions",
          "redshift:DescribeClusters",
          "redshift:GetClusterCredentials",
          "quicksight:*"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_policy" "contractor_policy" {
  name        = "${var.environment}-contractor-policy"
  description = "Restricted policy for contractors with time-based access"
  path        = "/atlasit/"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "s3:GetObject",
          "s3:ListBucket",
          "logs:Describe*",
          "logs:Get*"
        ]
        Resource = "*"
        Condition = {
          DateGreaterThan = {
            "aws:CurrentTime" = "2025-01-01T00:00:00Z"
          }
          DateLessThan = {
            "aws:CurrentTime" = "2025-12-31T23:59:59Z"
          }
          IpAddress = {
            "aws:SourceIp" = var.contractor_allowed_ips
          }
        }
      }
    ]
  })
}

# Attach policies to groups
resource "aws_iam_group_policy_attachment" "developers_policy" {
  group      = aws_iam_group.developers.name
  policy_arn = aws_iam_policy.developer_policy.arn
}

resource "aws_iam_group_policy_attachment" "security_engineers_policy" {
  group      = aws_iam_group.security_engineers.name
  policy_arn = aws_iam_policy.security_engineer_policy.arn
}

resource "aws_iam_group_policy_attachment" "data_analysts_policy" {
  group      = aws_iam_group.data_analysts.name
  policy_arn = aws_iam_policy.data_analyst_policy.arn
}

resource "aws_iam_group_policy_attachment" "contractors_policy" {
  group      = aws_iam_group.contractors.name
  policy_arn = aws_iam_policy.contractor_policy.arn
}

# Main demo user (Joiner scenario)
resource "aws_iam_user" "demo_user" {
  name = var.demo_user_name
  path = "/atlasit/"

  tags = {
    OktaUserId     = var.okta_user_id
    EmailAddress   = var.user_email
    Department     = var.user_department
    EmployeeType   = var.employee_type
    Manager        = var.manager_email
    StartDate      = var.start_date
    JMLStatus      = "joiner"
  }
}

# Create access keys for programmatic access (if needed)
resource "aws_iam_access_key" "demo_user_key" {
  count = var.create_access_keys ? 1 : 0
  user  = aws_iam_user.demo_user.name
}

# Add user to appropriate group based on role
resource "aws_iam_user_group_membership" "demo_user_groups" {
  user = aws_iam_user.demo_user.name
  groups = [
    var.user_role == "developer" ? aws_iam_group.developers.name :
    var.user_role == "security_engineer" ? aws_iam_group.security_engineers.name :
    var.user_role == "data_analyst" ? aws_iam_group.data_analysts.name :
    var.user_role == "contractor" ? aws_iam_group.contractors.name :
    aws_iam_group.developers.name # default
  ]
}

# Assume role policy for cross-account access
data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_user.demo_user.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.external_id]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }
}

# Role for elevated permissions (when needed)
resource "aws_iam_role" "demo_role" {
  name               = var.demo_role_name
  path               = "/atlasit/"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json

  tags = {
    Purpose      = "Demo elevated access role"
    OktaManaged  = "true"
    MaxDuration  = "2h"
  }
}

# Attach appropriate policy based on user role
resource "aws_iam_role_policy_attachment" "demo_role_policy" {
  role = aws_iam_role.demo_role.name
  policy_arn = var.user_role == "developer" ? aws_iam_policy.developer_policy.arn :
               var.user_role == "security_engineer" ? aws_iam_policy.security_engineer_policy.arn :
               var.user_role == "data_analyst" ? aws_iam_policy.data_analyst_policy.arn :
               aws_iam_policy.contractor_policy.arn
}

output "user_arn" {
  value = aws_iam_user.demo_user.arn
}

output "role_arn" {
  value = aws_iam_role.demo_role.arn
}
