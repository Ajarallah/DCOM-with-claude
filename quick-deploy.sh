#!/bin/bash

# DCOM Quick Deploy - Fully Automated
# Just run: ./quick-deploy.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration (already set for you!)
PROJECT_ID="gen-lang-client-0956346379"
REGION="us-central1"
SERVICE_NAME="dcom-analysis"
GEMINI_API_KEY="AIzaSyCbYt-_9YvEs05FxQmq7FHOmqjB_9ZTVHU"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                            ║${NC}"
echo -e "${BLUE}║   ${GREEN}DCOM Automated Deployment${BLUE}             ║${NC}"
echo -e "${BLUE}║   ${YELLOW}Deep Contextual Output Model${BLUE}          ║${NC}"
echo -e "${BLUE}║                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Function to print step
print_step() {
    echo -e "\n${BLUE}▶${NC} ${GREEN}$1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check gcloud
print_step "Step 1/6: Checking prerequisites..."
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found"
    echo ""
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    echo ""
    echo "Installation commands:"
    echo "  Mac:     brew install google-cloud-sdk"
    echo "  Linux:   curl https://sdk.cloud.google.com | bash"
    echo "  Windows: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
print_success "gcloud CLI found"

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    print_error "Not authenticated with Google Cloud"
    echo ""
    echo "Please run:"
    echo "  gcloud auth login"
    echo "  gcloud auth application-default login"
    exit 1
fi
print_success "Authenticated with Google Cloud"

# Set project
print_step "Step 2/6: Configuring Google Cloud project..."
gcloud config set project $PROJECT_ID --quiet
print_success "Project set to: $PROJECT_ID"

# Enable APIs
print_step "Step 3/6: Enabling required APIs..."
echo "  This may take a minute..."
gcloud services enable run.googleapis.com --quiet 2>&1 | grep -v "^$" || true
gcloud services enable cloudbuild.googleapis.com --quiet 2>&1 | grep -v "^$" || true
gcloud services enable secretmanager.googleapis.com --quiet 2>&1 | grep -v "^$" || true
print_success "APIs enabled (Cloud Run, Cloud Build, Secret Manager)"

# Create/update secret
print_step "Step 4/6: Storing API key securely in Secret Manager..."
if gcloud secrets describe gemini-api-key &>/dev/null; then
    echo -n "$GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key --data-file=- --quiet
    print_success "API key updated in Secret Manager"
else
    echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
        --data-file=- \
        --replication-policy="automatic" \
        --quiet
    print_success "API key created in Secret Manager"
fi

# Deploy to Cloud Run
print_step "Step 5/6: Building and deploying to Cloud Run..."
echo "  This will take 3-5 minutes (building container image)..."
echo ""

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
    --min-instances 0 \
    --quiet

print_success "Deployment completed!"

# Get service URL
print_step "Step 6/6: Getting your live URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format 'value(status.url)')

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                            ║${NC}"
echo -e "${BLUE}║   ${GREEN}🎉 Deployment Successful! 🎉${BLUE}           ║${NC}"
echo -e "${BLUE}║                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Your DCOM app is now LIVE at:${NC}"
echo -e "${YELLOW}$SERVICE_URL${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Open the URL in your browser"
echo "  2. Try the example analyses"
echo "  3. Test 'Deep Thinking' mode"
echo ""
echo -e "${GREEN}Manage your app:${NC}"
echo "  View logs:   gcloud run services logs read $SERVICE_NAME --region $REGION"
echo "  Update app:  ./quick-deploy.sh"
echo "  Delete app:  gcloud run services delete $SERVICE_NAME --region $REGION"
echo ""
echo -e "${BLUE}Share this URL with anyone to use your DCOM platform!${NC}"
echo ""
