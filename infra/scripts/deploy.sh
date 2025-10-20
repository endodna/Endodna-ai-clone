#!/bin/bash

# Simple Terraform deployment script
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh dev plan

set -e

ENVIRONMENT=${1:-"dev"}
ACTION=${2:-"plan"}

# Basic validation
if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
    echo "Invalid environment. Use: dev or prod"
    exit 1
fi

if [[ ! "$ACTION" =~ ^(init|plan|apply|destroy|output)$ ]]; then
    echo "Invalid action. Use: init, plan, apply, destroy, or output"
    exit 1
fi

TERRAFORM_DIR="infra/environments/$ENVIRONMENT"

echo "Deploying $ENVIRONMENT environment..."
echo "Action: $ACTION"
echo ""

# Check if directory exists
if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Directory not found: $TERRAFORM_DIR"
    exit 1
fi

cd "$TERRAFORM_DIR"

# Check AWS credentials
AWS_PROFILE=${AWS_PROFILE:-"s3-gen-ai"}
echo "Checking AWS credentials..."
echo "AWS Profile: $AWS_PROFILE"
echo "AWS Identity:"
aws sts get-caller-identity
echo ""

if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

# Handle terraform.tfvars
if [ ! -f "terraform.tfvars" ]; then
    if [ -f "terraform.tfvars.example" ]; then
        echo "Copying terraform.tfvars.example to terraform.tfvars"
        cp terraform.tfvars.example terraform.tfvars
        echo "Edit terraform.tfvars with your values before continuing"
        echo "Note: Using local state file (terraform.tfstate) - no S3 backend required"
    else
        echo "No terraform.tfvars.example found"
        exit 1
    fi
fi

# Run terraform command
case $ACTION in
    "init")
        terraform init
        echo "Terraform initialized. Next: edit terraform.tfvars and run plan"
        ;;
    "plan")
        terraform plan
        echo "Plan complete. Run apply to deploy changes"
        ;;
    "apply")
        terraform refresh
        terraform apply
        echo "Deployment complete!"
        terraform output
        ;;
    "destroy")
        echo "This will destroy all resources in $ENVIRONMENT"
        read -p "Continue? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            terraform destroy
        else
            echo "Cancelled"
        fi
        ;;
    "output")
        terraform output
        ;;
esac
