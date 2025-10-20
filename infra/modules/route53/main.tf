# Route53 Module

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Route53 record for CloudFront distribution
resource "aws_route53_record" "cloudfront" {
  zone_id = var.hosted_zone_id
  name    = var.subdomain != null ? "${var.subdomain}.${var.domain_name}" : var.domain_name
  type    = "A"

  alias {
    name                   = var.cloudfront_domain_name
    zone_id                = var.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# Route53 record for Private CloudFront distribution
resource "aws_route53_record" "private_cloudfront" {
  zone_id = var.hosted_zone_id
  name    = "${var.private_cloudfront_subdomain}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.private_cloudfront_domain_name
    zone_id                = var.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# Route53 record for ALB (backend) - Only create if ALB details are provided
resource "aws_route53_record" "alb" {
  zone_id = var.hosted_zone_id
  name    = var.alb_subdomain != null ? "${var.alb_subdomain}.${var.domain_name}" : var.alb_domain_name
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}