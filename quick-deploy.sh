#!/bin/bash

# DCOM Quick Deploy - Pre-configured for your project
# Your Google Cloud Project: gen-lang-client-0956346379

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  DCOM Quick Deploy to Cloud Run${NC}"
echo -e "${GREEN}========================================${NC}\n"

PROJECT_ID="gen-lang-client-0956346379"
REGION="us-central1"
SERVICE_NAME="dcom-analysis"
GEMINI_API_KEY="AIzaSyCbYt-_9YvEs05FxQmq7FHOmqjB_9ZTVHU"

# Check gcloud
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI not found${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo -e "${GREEN}Step 1: Setting project...${NC}"
gcloud config set project $PROJECT_ID

echo -e "\n${GREEN}Step 2: Enabling APIs...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com

echo -e "\n${GREEN}Step 3: Creating/Updating API key secret...${NC}"
echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
    --data-file=- \
    --replication-policy="automatic" 2>/dev/null || \
    echo -n "$GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key --data-file=-

echo -e "\n${GREEN}Step 4: Deploying to Cloud Run...${NC}"
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

echo -e "\n${GREEN}Step 5: Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format 'value(status.url)')

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"
echo -e "Your DCOM app is live at:"
echo -e "${GREEN}$SERVICE_URL${NC}\n"
echo -e "Test it now:"
echo -e "  ${YELLOW}$SERVICE_URL${NC}\n"
