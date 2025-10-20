# CloudFront Private Module Variables
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
}

variable "private_bucket_domain_name" {
  description = "Domain name of the private S3 bucket"
  type        = string
}

variable "private_bucket_id" {
  description = "ID of the private S3 bucket"
  type        = string
}

variable "custom_domain" {
  description = "Custom domain for the CloudFront distribution"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for the custom domain"
  type        = string
  default     = null
}

variable "price_class" {
  description = "Price class for CloudFront distribution"
  type        = string
  default     = "PriceClass_100"
}

variable "enable_logging" {
  description = "Enable CloudFront access logging"
  type        = bool
  default     = false
}

variable "log_bucket_domain_name" {
  description = "Domain name of the S3 bucket for CloudFront logs"
  type        = string
  default     = null
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}
