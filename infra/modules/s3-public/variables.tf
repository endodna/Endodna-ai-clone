# S3 Public Bucket Module Variables

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
  default     = "biosai-public"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN for bucket policy"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
