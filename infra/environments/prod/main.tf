# Production Environment Configuration

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  # Using local file state for now
  # backend "s3" {
  #   bucket         = "biosai-terraform-state-prod"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "biosai-terraform-locks-prod"
  #   encrypt        = true
  # }
}

# Provider configuration
provider "aws" {
  region = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = {
      Project     = "BiosAI"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner = "Dev-Team"
    }
  }
}

# Local values
locals {
  common_tags = {
    Project     = "BiosAI"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner = "Dev-Team"
  }
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  name_prefix                = "biosai-${var.environment}"
  environment                = var.environment
  vpc_cidr                   = var.vpc_cidr
  availability_zones         = var.availability_zones
  public_subnet_cidrs        = var.public_subnet_cidrs
  private_subnet_cidrs       = var.private_subnet_cidrs
  enable_s3_endpoint         = var.enable_s3_endpoint
  tags                       = local.common_tags
}

# Security Groups Module
module "security_groups" {
  source = "../../modules/security-groups"

  name_prefix         = "biosai-${var.environment}"
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  backend_port         = var.backend_port
  health_check_port    = var.backend_port  # Same port for health checks
  enable_health_check  = var.backend_enable_health_check
  tags                 = local.common_tags
}
module "s3_frontend" {
  source = "../../modules/s3-frontend"

  bucket_name                  = "biosai-frontend-${var.environment}"
  environment                  = var.environment
  cloudfront_distribution_arn  = "arn:aws:cloudfront::placeholder" # Will be updated after CloudFront creation
  tags                        = local.common_tags
}

# S3 bucket for public files
module "s3_public" {
  source = "../../modules/s3-public"

  bucket_name                  = "biosai-public"
  environment                  = var.environment
  cloudfront_distribution_arn  = "arn:aws:cloudfront::placeholder" # Will be updated after CloudFront creation
  tags                        = local.common_tags
}

# S3 bucket for private user files
module "s3_private" {
  source = "../../modules/s3-private"

  bucket_name                  = "biosai-private"
  environment                  = var.environment
  cloudfront_distribution_arn  = "arn:aws:cloudfront::placeholder" # Will be updated after CloudFront creation
  tags                        = local.common_tags
}

# CloudFront distribution
module "cloudfront" {
  source = "../../modules/cloudfront"

  bucket_domain_name         = module.s3_frontend.bucket_domain_name
  bucket_id                  = module.s3_frontend.bucket_id
  public_bucket_domain_name  = module.s3_public.bucket_domain_name
  public_bucket_id           = module.s3_public.bucket_id
  environment                = var.environment
  domain_name                = var.domain_name
  certificate_arn            = var.certificate_arn
  price_class                = var.price_class
  enable_logging             = var.enable_logging
  tags                       = local.common_tags
}

# CloudFront distribution for private user files
module "cloudfront_private" {
  source = "../../modules/cloudfront-private"

  name_prefix                = "biosai"
  environment                = var.environment
  private_bucket_domain_name = module.s3_private.bucket_domain_name
  private_bucket_id          = module.s3_private.bucket_id
  custom_domain              = var.assets_domain_name != null ? var.assets_domain_name : "assets.${var.base_domain}"
  certificate_arn            = var.certificate_arn
  price_class                = var.price_class
  enable_logging             = var.enable_logging
  tags                       = local.common_tags
}

# Route53 DNS Management Module
module "route53" {
  source = "../../modules/route53"

  # CloudFront Configuration
  domain_name                = var.base_domain
  subdomain                  = var.frontend_subdomain
  hosted_zone_id            = var.hosted_zone_id
  cloudfront_domain_name    = module.cloudfront.distribution_domain_name
  cloudfront_hosted_zone_id = module.cloudfront.distribution_hosted_zone_id

  # Private CloudFront Configuration
  private_cloudfront_domain_name = module.cloudfront_private.distribution_domain_name
  private_cloudfront_subdomain   = var.assets_domain_name != null ? split(".", var.assets_domain_name)[0] : "assets"

  # ALB Configuration - Only set when EB exists
  alb_domain_name = var.backend_domain_name
  alb_subdomain   = "api"  # Extract from backend_domain_name
  alb_dns_name    = try(module.elastic_beanstalk.alb_dns_name, null)
  alb_zone_id     = try(module.elastic_beanstalk.alb_zone_id, null)

  depends_on = [module.cloudfront]
}

# Update S3 bucket policy with actual CloudFront ARN
resource "aws_s3_bucket_policy" "frontend_update" {
  bucket = module.s3_frontend.bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${module.s3_frontend.bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = module.cloudfront.distribution_arn
          }
        }
      }
    ]
  })

  depends_on = [module.cloudfront]
}

# Update S3 public bucket policy with actual CloudFront ARN
resource "aws_s3_bucket_policy" "public_update" {
  bucket = module.s3_public.bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${module.s3_public.bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = module.cloudfront.distribution_arn
          }
        }
      }
    ]
  })

  depends_on = [module.cloudfront]
}

# Update S3 private bucket policy with actual CloudFront ARN
resource "aws_s3_bucket_policy" "private_update" {
  bucket = module.s3_private.bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${module.s3_private.bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = module.cloudfront_private.distribution_arn
          }
        }
      }
    ]
  })

  depends_on = [module.cloudfront_private]
}

# Elastic Beanstalk for backend
module "elastic_beanstalk" {
  source = "../../modules/elastic-beanstalk"

  application_name    = "biosai-backend"
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  private_subnet_ids  = module.vpc.private_subnet_ids
  certificate_arn     = var.certificate_arn
  backend_port       = var.backend_port
  health_check_path  = var.backend_health_check_path
  enable_health_check = var.backend_enable_health_check
  instance_type      = var.backend_instance_type
  min_instances      = var.backend_min_instances
  max_instances      = var.backend_max_instances
  enable_deletion_protection = var.backend_enable_deletion_protection
  environment_variables = var.backend_environment_variables
  eb_security_group_id = module.security_groups.eb_security_group_id
  tags               = local.common_tags
}
