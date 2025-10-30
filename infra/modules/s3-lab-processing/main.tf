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
  dmz_bucket_name    = "${var.bucket_name_prefix}-dmz-${var.environment}"
  private_bucket_name = "${var.bucket_name_prefix}-processing-${var.environment}"
  copy_lambda_name    = "${var.bucket_name_prefix}-copy-files-${var.environment}"
  preprocess_lambda_name = "${var.bucket_name_prefix}-preprocess-${var.environment}"
  sqs_queue_name     = "${var.bucket_name_prefix}-processing-queue-${var.environment}"
}

resource "aws_s3_bucket" "dmz" {
  bucket = local.dmz_bucket_name

  tags = merge(var.tags, {
    Name        = local.dmz_bucket_name
    Environment = var.environment
    Purpose     = "DMZ File Upload"
    BucketType  = "dmz"
  })
}

resource "aws_s3_bucket_versioning" "dmz" {
  bucket = aws_s3_bucket.dmz.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "dmz" {
  bucket = aws_s3_bucket.dmz.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "dmz" {
  bucket = aws_s3_bucket.dmz.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DMZ bucket policy - allow lab user to put files
resource "aws_s3_bucket_policy" "dmz" {
  bucket = aws_s3_bucket.dmz.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLabUserUpload"
        Effect = "Allow"
        Principal = {
          AWS = var.lab_user_arn
        }
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.dmz.arn}/*"
      },
      {
        Sid    = "AllowLabUserList"
        Effect = "Allow"
        Principal = {
          AWS = var.lab_user_arn
        }
        Action = "s3:ListBucket"
        Resource = aws_s3_bucket.dmz.arn
      }
    ]
  })
}

# ============ Private S3 Bucket ============
resource "aws_s3_bucket" "private" {
  bucket = local.private_bucket_name

  tags = merge(var.tags, {
    Name        = local.private_bucket_name
    Environment = var.environment
    Purpose     = "Processed Files Storage"
    BucketType  = "private"
  })
}

resource "aws_s3_bucket_versioning" "private" {
  bucket = aws_s3_bucket.private.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "private" {
  bucket = aws_s3_bucket.private.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "private" {
  bucket = aws_s3_bucket.private.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============ SQS Queue ============
resource "aws_sqs_queue" "processing" {
  name                       = local.sqs_queue_name
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds = var.sqs_message_retention_period

  tags = merge(var.tags, {
    Name        = local.sqs_queue_name
    Environment = var.environment
    Purpose     = "Processing Queue"
  })
}

# ============ IAM Role for Copy Lambda ============
resource "aws_iam_role" "copy_lambda" {
  name = "${local.copy_lambda_name}-role"

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
    Name        = "${local.copy_lambda_name}-role"
    Environment = var.environment
  })
}

resource "aws_iam_role_policy" "copy_lambda" {
  name = "${local.copy_lambda_name}-policy"
  role = aws_iam_role.copy_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.dmz.arn}/*",
          "${aws_s3_bucket.private.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# ============ IAM Role for Preprocess Lambda ============
resource "aws_iam_role" "preprocess_lambda" {
  name = "${local.preprocess_lambda_name}-role"

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
    Name        = "${local.preprocess_lambda_name}-role"
    Environment = var.environment
  })
}

resource "aws_iam_role_policy" "preprocess_lambda" {
  name = "${local.preprocess_lambda_name}-policy"
  role = aws_iam_role.preprocess_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${aws_s3_bucket.private.arn}/*",
          aws_s3_bucket.private.arn
        ]
      },
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
        Resource = aws_sqs_queue.processing.arn
      }
    ]
  })
}

# ============ Lambda Functions ============
data "archive_file" "lambda_placeholder" {
  type        = "zip"
  output_path = "/tmp/lambda_placeholder.zip"
  
  source {
    content = "exports.handler = async (event) => { return { statusCode: 200, body: '' }; };"
    filename = "index.js"
  }
}

resource "aws_lambda_function" "copy_files" {
  filename      = data.archive_file.lambda_placeholder.output_path
  function_name = local.copy_lambda_name
  role          = aws_iam_role.copy_lambda.arn
  handler       = "index.handler"
  runtime       = var.lambda_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  environment {
    variables = {
      PRIVATE_BUCKET = local.private_bucket_name
      SQS_QUEUE_URL = aws_sqs_queue.processing.url
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
    Name        = local.copy_lambda_name
    Environment = var.environment
    Purpose     = "Copy Files DMZ to Private"
  })
}

resource "aws_lambda_function" "preprocess_files" {
  filename      = data.archive_file.lambda_placeholder.output_path
  function_name = local.preprocess_lambda_name
  role          = aws_iam_role.preprocess_lambda.arn
  handler       = "index.handler"
  runtime       = var.lambda_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  environment {
    variables = {
      PRIVATE_BUCKET = local.private_bucket_name
      SQS_QUEUE_URL  = aws_sqs_queue.processing.url
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
    Name        = local.preprocess_lambda_name
    Environment = var.environment
    Purpose     = "Preprocess Files"
  })
}

# ============ S3 Event Trigger for Copy Lambda ============
resource "aws_s3_bucket_notification" "dmz_notification" {
  bucket = aws_s3_bucket.dmz.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.copy_files.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ""
  }

  depends_on = [aws_lambda_permission.allow_dmz_s3]
}

resource "aws_lambda_permission" "allow_dmz_s3" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.copy_files.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.dmz.arn
}

# ============ S3 Event Trigger for Preprocess Lambda (from private bucket) ============
resource "aws_s3_bucket_notification" "private_notification" {
  bucket = aws_s3_bucket.private.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.preprocess_files.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ""
  }

  depends_on = [aws_lambda_permission.allow_private_s3]
}

resource "aws_lambda_permission" "allow_private_s3" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.preprocess_files.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.private.arn
}

