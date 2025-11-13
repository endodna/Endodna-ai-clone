# Elastic Beanstalk Module Variables
variable "application_name" {
  description = "Name of the application"
  type        = string
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where resources will be created"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for EB instances"
  type        = list(string)
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for HTTPS"
  type        = string
}

variable "backend_port" {
  description = "Port number for the backend application"
  type        = number
  default     = 3001
}

variable "eb_security_group_id" {
  description = "ID of the EB security group"
  type        = string
}

variable "health_check_path" {
  description = "Health check path for the backend"
  type        = string
  default     = "/health"
}

variable "enable_health_check" {
  description = "Enable custom health check configuration"
  type        = bool
  default     = false
}

variable "instance_type" {
  description = "EC2 instance type for EB instances"
  type        = string
  default     = "t2.medium"
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 3
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for the ALB"
  type        = bool
  default     = false
}

variable "environment_variables" {
  description = "Environment variables for the EB application"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}

variable "sqs_queue_arns" {
  description = "List of SQS queue ARNs to allow access to"
  type        = list(string)
  default     = []
}

variable "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group to allow access to"
  type        = string
  default     = ""
}

variable "s3_bucket_arns" {
  description = "List of S3 bucket ARNs to allow access to"
  type        = list(string)
  default     = []
}
