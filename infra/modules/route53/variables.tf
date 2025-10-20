# Route53 Module Variables - CloudFront DNS Management Only

variable "domain_name" {
  description = "The domain name (e.g., bios.med)"
  type        = string
}

variable "subdomain" {
  description = "The subdomain (e.g., 'app' for app.bios.med)"
  type        = string
  default     = null
}

variable "hosted_zone_id" {
  description = "Existing hosted zone ID"
  type        = string
}

variable "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  type        = string
}

variable "cloudfront_hosted_zone_id" {
  description = "CloudFront hosted zone ID (always Z2FDTNDATAQYW2)"
  type        = string
  default     = "Z2FDTNDATAQYW2"
}

variable "create_www_redirect" {
  description = "Whether to create www subdomain redirect"
  type        = bool
  default     = false
}

# ALB Configuration Variables
variable "alb_domain_name" {
  description = "ALB domain name for backend"
  type        = string
  default     = null
}

variable "alb_dns_name" {
  description = "ALB DNS name"
  type        = string
  default     = null
}

variable "alb_zone_id" {
  description = "ALB hosted zone ID"
  type        = string
  default     = null
}

variable "alb_subdomain" {
  description = "The subdomain for ALB (e.g., 'api' for api.bios.med)"
  type        = string
  default     = null
}

# Private CloudFront Configuration Variables
variable "private_cloudfront_domain_name" {
  description = "Private CloudFront distribution domain name"
  type        = string
  default     = null
}

variable "private_cloudfront_subdomain" {
  description = "The subdomain for private CloudFront (e.g., 'files' for files.bios.med)"
  type        = string
  default     = null
}
