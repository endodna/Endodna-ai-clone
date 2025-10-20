# S3 Private Module Outputs
output "bucket_id" {
  description = "The name (id) of the S3 bucket"
  value       = aws_s3_bucket.private.id
}

output "bucket_arn" {
  description = "The ARN of the S3 bucket"
  value       = aws_s3_bucket.private.arn
}

output "bucket_domain_name" {
  description = "The S3 bucket regional domain name"
  value       = aws_s3_bucket.private.bucket_regional_domain_name
}
