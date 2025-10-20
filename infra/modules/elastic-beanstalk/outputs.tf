# Elastic Beanstalk Module Outputs
output "application_name" {
  description = "Name of the Elastic Beanstalk application"
  value       = aws_elastic_beanstalk_application.main.name
}

output "environment_name" {
  description = "Name of the Elastic Beanstalk environment"
  value       = aws_elastic_beanstalk_environment.main.name
}

output "environment_url" {
  description = "URL of the Elastic Beanstalk environment"
  value       = aws_elastic_beanstalk_environment.main.endpoint_url
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_elastic_beanstalk_environment.main.endpoint_url
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = "Z35SXDOTRQ7X7K"  # ALB zone ID for us-east-1
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_elastic_beanstalk_environment.main.load_balancers[0]
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_elastic_beanstalk_environment.main.load_balancers[0]
}


output "backend_port" {
  description = "Port number for the backend application"
  value       = var.backend_port
}
