terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  lambda_name      = "${var.bucket_name_prefix}-tempus-lab-${var.environment}"
  api_gateway_name = "${var.bucket_name_prefix}-lab-api-${var.environment}"
  usage_plan_name  = "${var.bucket_name_prefix}-lab-usage-plan-${var.environment}"
  api_key_name     = "${var.bucket_name_prefix}-lab-api-key-${var.environment}"
}

resource "aws_sqs_queue" "tempus_lab" {
  name                      = "${var.bucket_name_prefix}-tempus-lab-queue-${var.environment}"
  message_retention_seconds  = var.sqs_message_retention_period
  visibility_timeout_seconds = var.sqs_visibility_timeout

  tags = merge(var.tags, {
    Name        = "${var.bucket_name_prefix}-tempus-lab-queue-${var.environment}"
    Environment = var.environment
    Purpose     = "Tempus Lab Upload Notifications"
  })
}

resource "aws_iam_role" "tempus_lab_lambda" {
  name = "${local.lambda_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${local.lambda_name}-role"
    Environment = var.environment
  })
}

resource "aws_iam_role_policy" "tempus_lab_lambda" {
  name = "${local.lambda_name}-policy"
  role = aws_iam_role.tempus_lab_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = aws_sqs_queue.tempus_lab.arn
      }
    ]
  })
}

data "archive_file" "lambda_placeholder" {
  type        = "zip"
  output_path = "/tmp/lambda_placeholder.zip"
  
  source {
    content = "exports.handler = async (event) => { return { statusCode: 200, body: JSON.stringify({ message: 'Placeholder' }) }; };"
    filename = "index.js"
  }
}

resource "aws_lambda_function" "tempus_lab" {
  filename      = data.archive_file.lambda_placeholder.output_path
  function_name = local.lambda_name
  role          = aws_iam_role.tempus_lab_lambda.arn
  handler       = "index.handler"
  runtime       = var.lambda_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  environment {
    variables = {
      SQS_QUEUE_URL = aws_sqs_queue.tempus_lab.url
    }
  }

  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash,
      last_modified
    ]
  }

  tags = merge(var.tags, {
    Name        = local.lambda_name
    Environment = var.environment
    Purpose     = "Tempus Lab Upload Notification"
  })
}

resource "aws_api_gateway_rest_api" "lab_api" {
  name        = local.api_gateway_name
  description = "API Gateway for lab partner integrations"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(var.tags, {
    Name        = local.api_gateway_name
    Environment = var.environment
  })
}

resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.lab_api.id
  parent_id   = aws_api_gateway_rest_api.lab_api.root_resource_id
  path_part   = "api"
}

resource "aws_api_gateway_resource" "v1" {
  rest_api_id = aws_api_gateway_rest_api.lab_api.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "v1"
}

resource "aws_api_gateway_resource" "lab" {
  rest_api_id = aws_api_gateway_rest_api.lab_api.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "lab"
}

resource "aws_api_gateway_resource" "upload_notify_endpoint" {
  rest_api_id = aws_api_gateway_rest_api.lab_api.id
  parent_id   = aws_api_gateway_resource.lab.id
  path_part   = "upload-notify"
}

resource "aws_api_gateway_method" "upload_notify_post" {
  rest_api_id   = aws_api_gateway_rest_api.lab_api.id
  resource_id   = aws_api_gateway_resource.upload_notify_endpoint.id
  http_method   = "POST"
  authorization = "NONE"
  api_key_required = true
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tempus_lab.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.lab_api.execution_arn}/*/*"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.lab_api.id
  resource_id = aws_api_gateway_resource.upload_notify_endpoint.id
  http_method = aws_api_gateway_method.upload_notify_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.tempus_lab.invoke_arn
}

resource "aws_api_gateway_deployment" "lab_api" {
  depends_on = [
    aws_api_gateway_method.upload_notify_post,
    aws_api_gateway_integration.lambda,
  ]

  rest_api_id = aws_api_gateway_rest_api.lab_api.id
  stage_name  = var.stage_name

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_api_key" "lab_api_key" {
  name        = local.api_key_name
  description = "API key for lab partner integrations"
  enabled     = true

  tags = merge(var.tags, {
    Name        = local.api_key_name
    Environment = var.environment
  })
}

resource "aws_api_gateway_usage_plan" "lab_api" {
  name        = local.usage_plan_name
  description = "Usage plan for lab partner API integrations"

  api_stages {
    api_id = aws_api_gateway_rest_api.lab_api.id
    stage  = aws_api_gateway_deployment.lab_api.stage_name
  }

  throttle_settings {
    burst_limit = var.usage_plan_burst_limit
    rate_limit  = var.usage_plan_rate_limit
  }

  quota_settings {
    limit  = var.usage_plan_quota_limit
    period = var.usage_plan_quota_period
  }

  tags = merge(var.tags, {
    Name        = local.usage_plan_name
    Environment = var.environment
  })
}

resource "aws_api_gateway_usage_plan_key" "lab_api" {
  key_id        = aws_api_gateway_api_key.lab_api_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.lab_api.id
}

