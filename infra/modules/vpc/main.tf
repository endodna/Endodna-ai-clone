# VPC Module
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-vpc"
    Environment = var.environment
    Purpose     = "VPC for BiosAI Infrastructure"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-igw"
    Environment = var.environment
    Purpose     = "Internet Gateway for BiosAI VPC"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-public-subnet-${count.index + 1}"
    Environment = var.environment
    Purpose     = "Public Subnet for ALB and NAT Gateway"
    Type        = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone  = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-private-subnet-${count.index + 1}"
    Environment = var.environment
    Purpose     = "Private Subnet for EB instances and databases"
    Type        = "Private"
  })
}


# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-public-rt"
    Environment = var.environment
    Purpose     = "Route table for public subnets"
  })
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-private-rt"
    Environment = var.environment
    Purpose     = "Route table for private subnets"
  })
}

# Route Table Association for Public Subnets
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Association for Private Subnets
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}



# VPC Endpoints for S3
resource "aws_vpc_endpoint" "s3" {
  count = var.enable_s3_endpoint ? 1 : 0

  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [aws_route_table.public.id, aws_route_table.private.id]

  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-s3-endpoint"
    Environment = var.environment
    Purpose     = "S3 VPC Endpoint for cost optimization"
  })
}

# Data source for current AWS region
data "aws_region" "current" {}

