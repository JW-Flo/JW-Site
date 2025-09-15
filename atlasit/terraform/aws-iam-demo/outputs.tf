output "user_arn" {
  value = aws_iam_user.demo_user.arn
}

output "role_arn" {
  value = aws_iam_role.demo_role.arn
}
