#!/bin/bash

# Deploy script - creates app version only
set -e

APP_NAME="biosai-backend-production"
APP_VERSION="1.0.0"
S3_BUCKET="biosai-deployments"
PROFILE="s3-gen-ai"
REGION="us-east-1"

# Cleanup function
cleanup() {
    if [ -f "${APP_NAME}.zip" ]; then
        rm "${APP_NAME}.zip"
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Build
npm run build

# Create zip file
python3 scripts/zip.py "$APP_NAME"

# Create version label
VERSION_LABEL="${APP_NAME}-${APP_VERSION}-$(date +%s)"
S3_KEY="${VERSION_LABEL}.zip"

# Upload to S3
aws s3 cp "${APP_NAME}.zip" "s3://${S3_BUCKET}/${S3_KEY}" --region "$REGION" --profile "$PROFILE"

# Create app version
aws elasticbeanstalk create-application-version \
  --application-name "$APP_NAME" \
  --version-label "$VERSION_LABEL" \
  --region "$REGION" \
  --source-bundle "S3Bucket=${S3_BUCKET},S3Key=${S3_KEY}" \
  --description "Deployed $(date)" \
  --auto-create-application \
  --profile "$PROFILE"