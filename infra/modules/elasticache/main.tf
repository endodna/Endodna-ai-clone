# ElastiCache Module
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.name_prefix}-${var.environment}-cache-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-${var.environment}-cache-subnet-group"
    Environment = var.environment
    Purpose     = "ElastiCache Subnet Group for BiosAI Redis"
  })
}

# Security Group for ElastiCache
resource "aws_security_group" "elasticache" {
  name_prefix = "${var.name_prefix}-${var.environment}-elasticache-"
  vpc_id      = var.vpc_id
  description = "Security group for ElastiCache Redis cluster"

  # Allow inbound Redis traffic from EB instances
  ingress {
    description = "Redis from EB instances"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    security_groups = var.allowed_security_group_ids
  }

  # Allow inbound Redis traffic from VPC CIDR 
  ingress {
    description = "Redis from VPC"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-${var.environment}-elasticache-sg"
    Environment = var.environment
    Purpose     = "Security Group for BiosAI ElastiCache Redis"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ElastiCache Parameter Group (for Valkey configuration)
resource "aws_elasticache_parameter_group" "main" {
  family = "valkey8"
  name   = "${var.name_prefix}-${var.environment}-valkey-params"

  # Basic Valkey parameters for cost optimization
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-${var.environment}-valkey-params"
    Environment = var.environment
    Purpose     = "Parameter Group for BiosAI Valkey"
  })
}

# ElastiCache Replication Group (Valkey Cluster)
resource "aws_elasticache_replication_group" "main" {
  # Basic configuration
  replication_group_id         = "${var.name_prefix}-${var.environment}-valkey"
  description                  = "Valkey cluster for BiosAI backend"
  
  # Engine configuration
  engine               = "valkey"
  engine_version       = var.valkey_version
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.main.name

  node_type                  = var.node_type
  num_cache_clusters         = var.num_cache_nodes
  automatic_failover_enabled = var.num_cache_nodes > 1

  # Network configuration
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.elasticache.id]

  # Backup configuration 
  snapshot_retention_limit = var.snapshot_retention_days
  snapshot_window         = var.snapshot_window
  maintenance_window       = var.maintenance_window

  # Security
  at_rest_encryption_enabled = var.enable_encryption_at_rest
  transit_encryption_enabled = var.enable_encryption_in_transit
  apply_immediately = var.apply_immediately

  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-${var.environment}-valkey"
    Environment = var.environment
    Purpose     = "Valkey Cluster for BiosAI Backend"
  })

  lifecycle {
    ignore_changes = [num_cache_clusters]
  }
}
