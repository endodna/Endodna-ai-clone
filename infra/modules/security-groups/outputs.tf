# Security Groups Module Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "eb_security_group_id" {
  description = "ID of the EB security group"
  value       = aws_security_group.eb.id
}

