// Terraform scaffold (not applied yet)
// Requires: export CLOUDFLARE_API_TOKEN & CLOUDFLARE_ACCOUNT_ID environment variables
// Then: terraform init && terraform plan

terraform {
  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
      version = ">= 4.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "aws" {
  region = var.aws_region
}

variable "cloudflare_api_token" { type = string }
variable "account_id" { type = string }
variable "aws_region" { type = string, default = "us-east-1" }

# Cloudflare Resources
resource "cloudflare_kv_namespace" "visits" {
  account_id = var.account_id
  title      = "jw-site-visits"
}

resource "cloudflare_kv_namespace" "leaderboard" {
  account_id = var.account_id
  title      = "jw-site-leaderboard"
}

resource "cloudflare_kv_namespace" "analytics" {
  account_id = var.account_id
  title      = "jw-site-analytics"
}

# AWS Security Infrastructure
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "jw-site-vpc"
    Environment = "production"
    Project     = "portfolio"
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "jw-site-public-subnet-${count.index + 1}"
  }
}

resource "aws_security_group" "web" {
  name_prefix = "jw-site-web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "jw-site-web-sg"
  }
}

resource "aws_security_group" "database" {
  name_prefix = "jw-site-db-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "jw-site-db-sg"
  }
}

# AWS Security Services
resource "aws_guardduty_detector" "main" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = false
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        enable = true
      }
    }
  }

  tags = {
    Name = "jw-site-guardduty"
  }
}

resource "aws_securityhub_account" "main" {}

resource "aws_config_configuration_recorder" "main" {
  name     = "jw-site-config-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "jw-site-config-delivery"
  s3_bucket_name = aws_s3_bucket.config.bucket
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
}

# IAM Roles and Policies
resource "aws_iam_role" "config" {
  name = "jw-site-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSConfigRole"
}

# S3 Bucket for Config
resource "aws_s3_bucket" "config" {
  bucket = "jw-site-config-${random_string.suffix.result}"

  tags = {
    Name = "jw-site-config-bucket"
  }
}

resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Example D1 database (currently not supported directly by Terraform; placeholder)
# resource "cloudflare_d1_database" "guestbook" {
#   account_id = var.account_id
#   name       = "guestbook_demo"
# }

# Pages project (Terraform support limited; this is illustrative)
# resource "cloudflare_pages_project" "site" {
#   account_id = var.account_id
#   name       = "jw-site"
#   production_branch = "main"
# }
