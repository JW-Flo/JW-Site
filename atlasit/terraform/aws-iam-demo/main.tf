provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

resource "aws_iam_user" "demo_user" {
  name = var.demo_user_name
}

data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_user.demo_user.arn]
    }
  }
}

resource "aws_iam_role" "demo_role" {
  name               = var.demo_role_name
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_policy" {
  role       = aws_iam_role.demo_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

output "user_arn" {
  value = aws_iam_user.demo_user.arn
}

output "role_arn" {
  value = aws_iam_role.demo_role.arn
}
