variable "bucket_name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "base_domain" {
  description = "Base domain name (optional, not used without custom domain)"
  type        = string
  default     = ""
}

variable "custom_domain_name" {
  description = "Custom domain name for API Gateway (deprecated, not used)"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID (optional, not used without custom domain)"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for custom domain (optional, not used without custom domain)"
  type        = string
  default     = ""
}

variable "stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 256
}

variable "sqs_visibility_timeout" {
  description = "SQS visibility timeout in seconds"
  type        = number
  default     = 30
}

variable "sqs_message_retention_period" {
  description = "SQS message retention period in seconds"
  type        = number
  default     = 345600 # 4 days
}

variable "usage_plan_burst_limit" {
  description = "Usage plan burst limit"
  type        = number
  default     = 10
}

variable "usage_plan_rate_limit" {
  description = "Usage plan rate limit (requests per second)"
  type        = number
  default     = 100
}

variable "usage_plan_quota_limit" {
  description = "Usage plan quota limit (requests per period)"
  type        = number
  default     = 100000
}

variable "usage_plan_quota_period" {
  description = "Usage plan quota period (DAY, WEEK, MONTH)"
  type        = string
  default     = "MONTH"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

