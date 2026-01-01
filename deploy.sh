#!/bin/bash

# DCOM Analysis - Google Cloud Run Deployment Script
# This script automates the deployment process to Google Cloud Run

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  DCOM Deployment to Google Cloud Run ${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
echo -e "${YELLOW}Enter your Google Cloud Project ID:${NC}"
read -p "> " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: Project ID cannot be empty${NC}"
    exit 1
fi

# Get Gemini API key
echo -e "\n${YELLOW}Enter your Gemini API Key:${NC}"
read -sp "> " GEMINI_API_KEY
echo ""

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}Error: Gemini API Key cannot be empty${NC}"
    exit 1
fi

# Set project
echo -e "\n${GREEN}Setting Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "\n${GREEN}Enabling required Google Cloud APIs...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Create secret for API key
echo -e "\n${GREEN}Creating secret for Gemini API key...${NC}"
echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
    --data-file=- \
    --replication-policy="automatic" 2>/dev/null || \
    echo -n "$GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key --data-file=-

# Get region
echo -e "\n${YELLOW}Enter deployment region (default: us-central1):${NC}"
read -p "> " REGION
REGION=${REGION:-us-central1}

# Set service name
SERVICE_NAME="dcom-analysis"

# Build and deploy
echo -e "\n${GREEN}Building and deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-secrets GEMINI_API_KEY=gemini-api-key:latest \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format 'value(status.url)')

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Successful! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nYour DCOM app is now live at:"
echo -e "${GREEN}${SERVICE_URL}${NC}\n"
echo -e "To view logs:"
echo -e "  gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50\n"
echo -e "To delete the service:"
echo -e "  gcloud run services delete $SERVICE_NAME --region $REGION\n"
