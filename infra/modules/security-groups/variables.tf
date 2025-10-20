# Security Groups Module Variables
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where security groups will be created"
  type        = string
}

variable "backend_port" {
  description = "Port number for the backend application"
  type        = number
  default     = 3001
}

variable "health_check_port" {
  description = "Port number for health checks (usually same as backend_port)"
  type        = number
  default     = 3001
}

variable "enable_health_check" {
  description = "Enable health check port access"
  type        = bool
  default     = false
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}
