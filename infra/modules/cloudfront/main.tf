# CloudFront Module

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# CloudFront origin access control for frontend
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "biosai-${var.environment}-frontend-oac"
  description                       = "OAC for BiosAI ${var.environment} frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront origin access control for public files
resource "aws_cloudfront_origin_access_control" "public" {
  name                              = "biosai-${var.environment}-public-oac"
  description                       = "OAC for BiosAI ${var.environment} public files"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "frontend" {
  # Frontend origin
  origin {
    domain_name              = var.bucket_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = "S3-${var.bucket_id}"
  }

  # Public files origin
  origin {
    domain_name              = var.public_bucket_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.public.id
    origin_id                = "S3-${var.public_bucket_id}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for BiosAI ${var.environment} frontend"
  default_root_object = "index.html"

  # Custom domain configuration
  # Include main domain, id subdomain, and ensure wildcard certificate covers all subdomains
  aliases = compact(concat(
    var.domain_name != null ? [var.domain_name] : [],
    var.base_domain != null ? ["id.${var.base_domain}"] : [],
    ["*.${var.base_domain}"]
  ))

  # SSL certificate configuration
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = var.certificate_arn != null ? "sni-only" : "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Cache behavior for public files (must come before default)
  ordered_cache_behavior {
    path_pattern           = "/public/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.public_bucket_id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # Default cache behavior (catches everything else)
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.bucket_id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # Custom error pages
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  # Price class
  price_class = var.price_class

  # Logging configuration
  dynamic "logging_config" {
    for_each = var.enable_logging ? [1] : []
    content {
      bucket          = aws_s3_bucket.logs[0].bucket_domain_name
      prefix          = "cloudfront-logs/"
      include_cookies = false
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-frontend-distribution"
    Environment = var.environment
    Purpose     = "Frontend CDN"
  })
}

# S3 bucket for CloudFront logs (if logging is enabled)
resource "aws_s3_bucket" "logs" {
  count  = var.enable_logging ? 1 : 0
  bucket = "${var.environment}-cloudfront-logs-${random_string.bucket_suffix[0].result}"

  tags = merge(var.tags, {
    Name        = "biosai-${var.environment}-cloudfront-logs"
    Environment = var.environment
    Purpose     = "CloudFront Logs"
  })
}

# Random string for unique bucket names
resource "random_string" "bucket_suffix" {
  count   = var.enable_logging ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

# S3 bucket policy for CloudFront logs
resource "aws_s3_bucket_policy" "logs" {
  count  = var.enable_logging ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs[0].arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })
}
