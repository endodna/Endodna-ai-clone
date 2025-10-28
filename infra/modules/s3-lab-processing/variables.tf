variable "environment" {
  description = "Environment name (e.g., prod, staging)"
  type        = string
}

variable "bucket_name_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "biosai"
}

variable "lab_user_arn" {
  description = "ARN of the IAM user that the lab will use to push files"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "lambda_runtime" {
  description = "Lambda runtime (default: nodejs20.x)"
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 300
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "sqs_visibility_timeout" {
  description = "SQS visibility timeout in seconds"
  type        = number
  default     = 300
}

variable "sqs_message_retention_period" {
  description = "SQS message retention period in seconds (default: 4 days)"
  type        = number
  default     = 345600
}


variable "lambda_zip_path" {
  description = "Path to Lambda function ZIP file"
  type        = string
  default     = ""
}

