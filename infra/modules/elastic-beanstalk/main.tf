# Elastic Beanstalk Module
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}


# Elastic Beanstalk Application
resource "aws_elastic_beanstalk_application" "main" {
  name        = "${var.application_name}-${var.environment}"
  description = "BiosAI Backend Application"

  appversion_lifecycle {
    service_role          = aws_iam_role.eb_service_role.arn
    max_count             = 128
    delete_source_from_s3 = true
  }

  tags = merge(var.tags, {
    Name        = "${var.application_name}-${var.environment}-app"
    Environment = var.environment
    Purpose     = "EB Application for BiosAI Backend"
  })
}


# IAM Role for Elastic Beanstalk Service
resource "aws_iam_role" "eb_service_role" {
  name = "${var.application_name}-${var.environment}-eb-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "elasticbeanstalk.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.application_name}-${var.environment}-eb-service-role"
    Environment = var.environment
    Purpose     = "EB Service Role for BiosAI Backend"
  })
}

# Attach AWS managed policy for Elastic Beanstalk service role
resource "aws_iam_role_policy_attachment" "eb_service_role" {
  role       = aws_iam_role.eb_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService"
}

# IAM Role for Elastic Beanstalk EC2 instances
resource "aws_iam_role" "eb_instance_profile_role" {
  name = "${var.application_name}-${var.environment}-eb-instance-profile-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.application_name}-${var.environment}-eb-instance-profile-role"
    Environment = var.environment
    Purpose     = "EB Instance Profile Role for BiosAI Backend"
  })
}

# Attach AWS managed policies for EC2 instances
resource "aws_iam_role_policy_attachment" "eb_instance_profile_role_web_tier" {
  role       = aws_iam_role.eb_instance_profile_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_role_policy_attachment" "eb_instance_profile_role_worker_tier" {
  role       = aws_iam_role.eb_instance_profile_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
}

resource "aws_iam_role_policy_attachment" "eb_instance_profile_role_multicontainer_docker" {
  role       = aws_iam_role.eb_instance_profile_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker"
}

# IAM Policy for SQS and CloudWatch Logs access
resource "aws_iam_role_policy" "eb_instance_profile_sqs_cloudwatch" {
  name = "${var.application_name}-${var.environment}-eb-instance-sqs-cloudwatch-policy"
  role = aws_iam_role.eb_instance_profile_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      # SQS permissions for all queues
      length(var.sqs_queue_arns) > 0 ? [
        {
          Effect = "Allow"
          Action = [
            "sqs:ReceiveMessage",
            "sqs:SendMessage",
            "sqs:GetQueueAttributes",
            "sqs:GetQueueUrl",
            "sqs:DeleteMessage",
            "sqs:ChangeMessageVisibility"
          ]
          Resource = var.sqs_queue_arns
        }
      ] : [],
      # CloudWatch Logs permissions
      var.cloudwatch_log_group_arn != "" ? [
        {
          Effect = "Allow"
          Action = [
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogStreams"
          ]
          Resource = "${var.cloudwatch_log_group_arn}"
        }
      ] : [],
      # Bedrock permissions
      [
        {
          Effect = "Allow"
          Action = [
            "bedrock:InvokeModel",
            "bedrock:InvokeModelWithResponseStream",
            "bedrock:ApplyGuardrail"
          ]
          Resource = [
            "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v1",
            "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
            "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
          ]
        },
        {
          Effect = "Allow"
          Action = [
            "bedrock:GetFoundationModel",
            "bedrock:ListFoundationModels"
          ]
          Resource = "*"
        }
      ]
    )
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "eb_instance_profile" {
  name = "${var.application_name}-${var.environment}-eb-instance-profile"
  role = aws_iam_role.eb_instance_profile_role.name

  tags = merge(var.tags, {
    Name        = "${var.application_name}-${var.environment}-eb-instance-profile"
    Environment = var.environment
    Purpose     = "EB Instance Profile for BiosAI Backend"
  })
}

# Elastic Beanstalk Environment
resource "aws_elastic_beanstalk_environment" "main" {
  name                = "${var.application_name}-${var.environment}"
  application         = aws_elastic_beanstalk_application.main.name
  solution_stack_name = "64bit Amazon Linux 2023 v4.7.2 running Docker"

  # Environment configuration
  setting {
    namespace = "aws:ec2:vpc"
    name      = "VPCId"
    value     = var.vpc_id
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "Subnets"
    value     = join(",", var.public_subnet_ids)
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "ELBSubnets"
    value     = join(",", var.public_subnet_ids)
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "ELBScheme"
    value     = "public"
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "AssociatePublicIpAddress"
    value     = "true"
  }

  # Load Balancer configuration
  setting {
    namespace = "aws:elbv2:loadbalancer"
    name      = "IdleTimeout"
    value     = "60"
  }

  # Ensure ALB is used instead of Classic Load Balancer
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "LoadBalancerType"
    value     = "application"
  }

  # HTTPS Listener configuration
  setting {
    namespace = "aws:elbv2:listener:443"
    name      = "Protocol"
    value     = "HTTPS"
  }

  setting {
    namespace = "aws:elbv2:listener:443"
    name      = "SSLCertificateArns"
    value     = var.certificate_arn
  }


  # Auto Scaling configuration
  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MinSize"
    value     = var.min_instances
  }

  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MaxSize"
    value     = var.max_instances
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = var.instance_type
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "SecurityGroups"
    value     = var.eb_security_group_id
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.eb_instance_profile.name
  }

  # Application configuration
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "NODE_ENV"
    value     = var.environment
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "PORT"
    value     = var.backend_port
  }

  # Docker configuration
  dynamic "setting" {
    for_each = var.enable_health_check ? [1] : []
    content {
      namespace = "aws:elasticbeanstalk:environment:process:default"
      name      = "HealthCheckPath"
      value     = var.health_check_path
    }
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment:process:default"
    name      = "Port"
    value     = var.backend_port
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment:process:default"
    name      = "Protocol"
    value     = "HTTP"
  }

  # Health reporting - Use basic instead of enhanced
  setting {
    namespace = "aws:elasticbeanstalk:healthreporting:system"
    name      = "SystemType"
    value     = "basic"
  }

  # Environment variables
  dynamic "setting" {
    for_each = var.environment_variables
    content {
      namespace = "aws:elasticbeanstalk:application:environment"
      name      = setting.key
      value     = setting.value
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.application_name}-${var.environment}-env"
    Environment = var.environment
    Purpose     = "EB Environment for BiosAI Backend"
  })
}

