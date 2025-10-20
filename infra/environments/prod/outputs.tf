output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = module.cloudfront.distribution_url
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = module.s3_frontend.bucket_id
}

output "domain_name" {
  description = "The frontend domain name"
  value       = module.route53.domain_name
}

output "hosted_zone_id" {
  description = "The manually created hosted zone ID"
  value       = var.hosted_zone_id
}

output "certificate_arn" {
  description = "The manually created ACM certificate ARN"
  value       = var.certificate_arn
}

# Backend/Elastic Beanstalk Outputs
output "backend_application_name" {
  description = "Name of the Elastic Beanstalk application"
  value       = module.elastic_beanstalk.application_name
}

output "backend_environment_name" {
  description = "Name of the Elastic Beanstalk environment"
  value       = module.elastic_beanstalk.environment_name
}

output "backend_environment_url" {
  description = "URL of the Elastic Beanstalk environment"
  value       = module.elastic_beanstalk.environment_url
}

output "backend_alb_dns_name" {
  description = "DNS name of the backend Application Load Balancer"
  value       = module.elastic_beanstalk.alb_dns_name
}

output "backend_alb_arn" {
  description = "ARN of the backend Application Load Balancer"
  value       = module.elastic_beanstalk.alb_arn
}

output "backend_domain_name" {
  description = "Domain name of the backend API"
  value       = module.route53.alb_domain_name
}

output "backend_port" {
  description = "Port number for the backend application"
  value       = module.elastic_beanstalk.backend_port
}

output "backend_alb_security_group_id" {
  description = "ID of the backend ALB security group"
  value       = module.security_groups.alb_security_group_id
}

output "backend_eb_security_group_id" {
  description = "ID of the backend EB security group"
  value       = module.security_groups.eb_security_group_id
}

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = module.security_groups.alb_security_group_id
}

output "eb_security_group_id" {
  description = "ID of the EB security group"
  value       = module.security_groups.eb_security_group_id
}


