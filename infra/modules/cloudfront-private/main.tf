# CloudFront Private Module for User Files
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# CloudFront Origin Access Control for Private S3
resource "aws_cloudfront_origin_access_control" "private" {
  name                              = "${var.name_prefix}-${var.environment}-private-oac"
  description                       = "OAC for ${var.name_prefix}-${var.environment} private files"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution for Private Files
resource "aws_cloudfront_distribution" "private" {
  origin {
    domain_name              = var.private_bucket_domain_name
    origin_id                = "S3-${var.private_bucket_id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.private.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for BiosAI private user files"
  default_root_object = "index.html"

  # Custom domain configuration
  aliases = var.custom_domain != null ? [var.custom_domain] : []

  # SSL certificate configuration
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Default cache behavior for presigned URLs
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.private_bucket_id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true  # Important for presigned URLs
      headers      = ["Authorization", "CloudFront-Forwarded-Proto"]
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 0      # No caching for private files
    max_ttl     = 0      # No caching for private files
  }

  # Price class
  price_class = var.price_class

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Logging configuration
  dynamic "logging_config" {
    for_each = var.enable_logging ? [1] : []
    content {
      bucket          = var.log_bucket_domain_name
      prefix          = "cloudfront-private-logs/"
      include_cookies = false
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-${var.environment}-private-cdn"
    Environment = var.environment
    Purpose     = "Private Files CDN for BiosAI"
  })
}
