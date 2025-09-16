# JML Lifecycle Automation
# This file contains resources for handling Joiner-Mover-Leaver scenarios

# CloudWatch Log Group for JML events
resource "aws_cloudwatch_log_group" "jml_events" {
  name              = "/atlasit/jml-events"
  retention_in_days = 90

  tags = {
    Purpose     = "JML lifecycle event logging"
    Environment = var.environment
  }
}

# SNS Topic for JML notifications
resource "aws_sns_topic" "jml_notifications" {
  name = "${var.environment}-jml-notifications"

  tags = {
    Purpose     = "JML lifecycle notifications"
    Environment = var.environment
  }
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "jml_notifications_policy" {
  arn = aws_sns_topic.jml_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "SNS:Publish"
        ]
        Resource = aws_sns_topic.jml_notifications.arn
      }
    ]
  })
}

# Lambda function for JML event processing
resource "aws_lambda_function" "jml_processor" {
  count = var.auto_provisioning ? 1 : 0
  
  filename         = "jml_processor.zip"
  function_name    = "${var.environment}-jml-processor"
  role            = aws_iam_role.lambda_execution_role[0].arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.jml_notifications.arn
      LOG_GROUP     = aws_cloudwatch_log_group.jml_events.name
      ENVIRONMENT   = var.environment
    }
  }

  tags = {
    Purpose     = "JML event processing"
    Environment = var.environment
  }
}

# Lambda execution role
resource "aws_iam_role" "lambda_execution_role" {
  count = var.auto_provisioning ? 1 : 0
  
  name = "${var.environment}-jml-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda execution policy
resource "aws_iam_role_policy" "lambda_execution_policy" {
  count = var.auto_provisioning ? 1 : 0
  
  name = "${var.environment}-jml-lambda-policy"
  role = aws_iam_role.lambda_execution_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.jml_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "iam:GetUser",
          "iam:ListGroupsForUser",
          "iam:AddUserToGroup",
          "iam:RemoveUserFromGroup",
          "iam:DeleteUser",
          "iam:DeleteAccessKey",
          "iam:ListAccessKeys"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "iam:UserPath" = "/atlasit/*"
          }
        }
      }
    ]
  })
}

# CloudTrail for IAM event monitoring
resource "aws_cloudtrail" "iam_monitoring" {
  count = var.enable_cloudtrail_monitoring ? 1 : 0
  
  name           = "${var.environment}-iam-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs[0].bucket

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::IAM::User"
      values = ["${aws_iam_user.demo_user.arn}"]
    }
  }

  tags = {
    Purpose     = "IAM event monitoring"
    Environment = var.environment
  }
}

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  count = var.enable_cloudtrail_monitoring ? 1 : 0
  
  bucket        = "${var.environment}-atlasit-cloudtrail-logs-${random_string.bucket_suffix[0].result}"
  force_destroy = true

  tags = {
    Purpose     = "CloudTrail log storage"
    Environment = var.environment
  }
}

# Random string for bucket naming
resource "random_string" "bucket_suffix" {
  count = var.enable_cloudtrail_monitoring ? 1 : 0
  
  length  = 8
  special = false
  upper   = false
}

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
  count = var.enable_cloudtrail_monitoring ? 1 : 0
  
  bucket = aws_s3_bucket.cloudtrail_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_logs[0].arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs[0].arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# EventBridge rule for IAM events
resource "aws_cloudwatch_event_rule" "iam_events" {
  count = var.auto_provisioning ? 1 : 0
  
  name        = "${var.environment}-iam-events"
  description = "Capture IAM events for JML processing"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["iam.amazonaws.com"]
      eventName = [
        "CreateUser",
        "DeleteUser",
        "AddUserToGroup",
        "RemoveUserFromGroup",
        "PutUserPolicy",
        "DeleteUserPolicy"
      ]
      resources = {
        ARN = [{
          prefix = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/atlasit/"
        }]
      }
    }
  })
}

# EventBridge target for Lambda
resource "aws_cloudwatch_event_target" "lambda_target" {
  count = var.auto_provisioning ? 1 : 0
  
  rule      = aws_cloudwatch_event_rule.iam_events[0].name
  target_id = "JMLProcessorTarget"
  arn       = aws_lambda_function.jml_processor[0].arn
}

# Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  count = var.auto_provisioning ? 1 : 0
  
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.jml_processor[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.iam_events[0].arn
}
