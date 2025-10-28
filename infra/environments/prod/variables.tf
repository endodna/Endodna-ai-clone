variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "AWS profile"
  type        = string
  default     = "s3-gen-ai"
}

variable "base_domain" {
  description = "Base domain name (e.g., bios.med)"
  type        = string
  default     = "bios.med"
}

variable "frontend_subdomain" {
  description = "Frontend subdomain (e.g., app for app.bios.med)"
  type        = string
  default     = "app"
}

variable "domain_name" {
  description = "Full domain name for CloudFront (e.g., app.bios.med)"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "SSL certificate ARN for custom domain"
  type        = string
  default     = null
}

variable "hosted_zone_id" {
  description = "Existing hosted zone ID"
  type        = string
  default     = null
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition = contains([
      "PriceClass_All",
      "PriceClass_200", 
      "PriceClass_100"
    ], var.price_class)
    error_message = "Price class must be one of: PriceClass_All, PriceClass_200, PriceClass_100."
  }
}

variable "enable_logging" {
  description = "Enable CloudFront logging"
  type        = bool
  default     = true
}

# Backend/Elastic Beanstalk Variables
variable "backend_domain_name" {
  description = "Domain name for the backend API (e.g., api.bios.med)"
  type        = string
  default     = null
}

variable "assets_domain_name" {
  description = "Domain name for the assets CDN (e.g., assets.bios.med)"
  type        = string
  default     = null
}

variable "backend_port" {
  description = "Port number for the backend application"
  type        = number
  default     = 3001
}

variable "backend_health_check_path" {
  description = "Health check path for the backend"
  type        = string
  default     = "/health"
}

variable "backend_enable_health_check" {
  description = "Enable custom health check configuration for the backend"
  type        = bool
  default     = false
}

variable "backend_instance_type" {
  description = "EC2 instance type for EB instances"
  type        = string
  default     = "t2.medium"
  validation {
    condition = can(regex("^t[0-9]+\\.[a-z]+$", var.backend_instance_type))
    error_message = "Instance type must be a valid EC2 instance type (e.g., t2.medium, t3.small)."
  }
}

variable "backend_min_instances" {
  description = "Minimum number of backend instances"
  type        = number
  default     = 1
  validation {
    condition     = var.backend_min_instances >= 1
    error_message = "Minimum instances must be at least 1."
  }
}

variable "backend_max_instances" {
  description = "Maximum number of backend instances"
  type        = number
  default     = 1
}

variable "backend_enable_deletion_protection" {
  description = "Enable deletion protection for the backend ALB"
  type        = bool
  default     = false
}

variable "backend_environment_variables" {
  description = "Environment variables for the backend application"
  type        = map(string)
  default     = {}
}

# VPC Configuration Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}


variable "enable_s3_endpoint" {
  description = "Enable VPC endpoint for S3"
  type        = bool
  default     = true
}

# S3 Processing Pipeline Variables
variable "lab_user_arn" {
  description = "ARN of the IAM user that the lab will use to push files to DMZ bucket"
  type        = string
  default     = null
}

