# Route53 Module Outputs - CloudFront DNS Management Only

output "domain_name" {
  description = "The domain name"
  value       = var.subdomain != null ? "${var.subdomain}.${var.domain_name}" : var.domain_name
}

output "www_domain_name" {
  description = "The www domain name"
  value       = var.create_www_redirect ? "www.${var.domain_name}" : null
}

output "alb_domain_name" {
  description = "The ALB domain name"
  value       = var.alb_subdomain != null ? "${var.alb_subdomain}.${var.domain_name}" : var.alb_domain_name
}

output "cloudfront_record_name" {
  description = "The CloudFront DNS record name"
  value       = aws_route53_record.cloudfront.name
}

output "alb_record_name" {
  description = "The ALB DNS record name"
  value       = var.alb_dns_name
}

output "private_cloudfront_record_name" {
  description = "The private CloudFront DNS record name"
  value       = var.private_cloudfront_domain_name
}

output "private_cloudfront_domain_name" {
  description = "The private CloudFront domain name"
  value       = var.private_cloudfront_subdomain
}
