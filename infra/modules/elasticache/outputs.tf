# ElastiCache Module Outputs
output "replication_group_id" {
  description = "ElastiCache replication group ID"
  value       = aws_elasticache_replication_group.main.replication_group_id
}

output "primary_endpoint" {
  description = "Primary endpoint for the Valkey cluster"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.main.port
}

output "redis_url" {
  description = "Complete Valkey URL for application configuration (Redis compatible)"
  value       = "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:${aws_elasticache_replication_group.main.port}"
}

output "security_group_id" {
  description = "Security group ID for the ElastiCache cluster"
  value       = aws_security_group.elasticache.id
}

output "subnet_group_name" {
  description = "ElastiCache subnet group name"
  value       = aws_elasticache_subnet_group.main.name
}

output "parameter_group_name" {
  description = "ElastiCache parameter group name"
  value       = aws_elasticache_parameter_group.main.name
}

output "cluster_address" {
  description = "Valkey cluster address"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}
