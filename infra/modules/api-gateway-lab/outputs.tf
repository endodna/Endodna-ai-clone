output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.tempus_lab.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.tempus_lab.arn
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.lab_api.id
}

data "aws_region" "current" {}

output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = "https://${aws_api_gateway_rest_api.lab_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${var.stage_name}"
}

output "api_key_id" {
  description = "API Gateway API key ID"
  value       = aws_api_gateway_api_key.lab_api_key.id
}

output "api_key_value" {
  description = "API Gateway API key value"
  value       = aws_api_gateway_api_key.lab_api_key.value
  sensitive   = true
}

output "sqs_queue_url" {
  description = "SQS queue URL"
  value       = aws_sqs_queue.tempus_lab.url
}

output "sqs_queue_arn" {
  description = "SQS queue ARN"
  value       = aws_sqs_queue.tempus_lab.arn
}

