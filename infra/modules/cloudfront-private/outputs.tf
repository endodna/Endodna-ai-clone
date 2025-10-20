# CloudFront Private Module Outputs
output "distribution_id" {
  description = "The CloudFront distribution ID"
  value       = aws_cloudfront_distribution.private.id
}

output "distribution_arn" {
  description = "The CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.private.arn
}

output "distribution_domain_name" {
  description = "The CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.private.domain_name
}

output "distribution_hosted_zone_id" {
  description = "The CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.private.hosted_zone_id
}

output "distribution_url" {
  description = "The CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.private.domain_name}"
}

output "origin_access_control_id" {
  description = "The Origin Access Control ID"
  value       = aws_cloudfront_origin_access_control.private.id
}
