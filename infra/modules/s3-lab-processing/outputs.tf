output "dmz_bucket_name" {
  description = "Name of the DMZ S3 bucket"
  value       = aws_s3_bucket.dmz.id
}

output "dmz_bucket_arn" {
  description = "ARN of the DMZ S3 bucket"
  value       = aws_s3_bucket.dmz.arn
}

output "private_bucket_name" {
  description = "Name of the private S3 bucket"
  value       = aws_s3_bucket.private.id
}

output "private_bucket_arn" {
  description = "ARN of the private S3 bucket"
  value       = aws_s3_bucket.private.arn
}

output "copy_lambda_arn" {
  description = "ARN of the copy Lambda function"
  value       = aws_lambda_function.copy_files.arn
}

output "copy_lambda_function_name" {
  description = "Name of the copy Lambda function"
  value       = aws_lambda_function.copy_files.function_name
}

output "preprocess_lambda_arn" {
  description = "ARN of the preprocess Lambda function"
  value       = aws_lambda_function.preprocess_files.arn
}

output "preprocess_lambda_function_name" {
  description = "Name of the preprocess Lambda function"
  value       = aws_lambda_function.preprocess_files.function_name
}

output "sqs_queue_url" {
  description = "URL of the processing SQS queue"
  value       = aws_sqs_queue.processing.url
}

output "sqs_queue_arn" {
  description = "ARN of the processing SQS queue"
  value       = aws_sqs_queue.processing.arn
}


output "copy_lambda_role_arn" {
  description = "ARN of the copy Lambda IAM role"
  value       = aws_iam_role.copy_lambda.arn
}

output "preprocess_lambda_role_arn" {
  description = "ARN of the preprocess Lambda IAM role"
  value       = aws_iam_role.preprocess_lambda.arn
}

