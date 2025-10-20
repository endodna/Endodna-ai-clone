#!/bin/bash

# Deploy script for frontend to S3
# Usage: ./deploy.sh [bucket-name] [region] [cloudfront-distribution-id]

set -e

# Default values
BUCKET_NAME=${1:-"s3-bucket-name"}
AWS_REGION=${2:-"us-east-1"}
CLOUDFRONT_DISTRIBUTION_ID=${3:-"cloudfront-distribution-id"}

echo "Starting deployment to S3..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if bucket name is provided
if [ "$BUCKET_NAME" = "" ]; then
    echo "Please provide a valid S3 bucket name"
    exit 1
fi

# Build the frontend
echo "Building frontend..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "Build failed. dist directory not found."
    exit 1
fi

# Deploy to S3
echo "Deploying to S3 bucket: $BUCKET_NAME"
aws s3 sync dist/ s3://$BUCKET_NAME --delete --region $AWS_REGION

# Invalidate CloudFront if distribution ID is provided
if [ "$CLOUDFRONT_DISTRIBUTION_ID" = "" ]; then
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
fi

echo "Deployment completed successfully!"
echo "Frontend app deployed"
