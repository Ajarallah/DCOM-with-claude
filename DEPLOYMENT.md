# DCOM - Deployment Guide for Google Cloud Run

This guide will walk you through deploying the DCOM (Deep Contextual Output Model) application to Google Cloud Run.

## 🚀 Quick Start (Automated Deployment)

If you just want to deploy quickly:

```bash
./deploy.sh
```

The script will:
1. Verify gcloud CLI is installed
2. Prompt for your Google Cloud Project ID
3. Prompt for your Gemini API Key
4. Enable required APIs
5. Store the API key in Google Secret Manager
6. Build and deploy the application
7. Provide you with the live URL

## 📋 Prerequisites

### 1. Google Cloud Account
- Create a Google Cloud account at https://cloud.google.com
- Create a new project or select an existing one
- Enable billing for your project

### 2. Google Cloud CLI
Install the gcloud CLI:
- **Mac**: `brew install google-cloud-sdk`
- **Linux**: https://cloud.google.com/sdk/docs/install#linux
- **Windows**: https://cloud.google.com/sdk/docs/install#windows

After installation, authenticate:
```bash
gcloud auth login
gcloud auth application-default login
```

### 3. Gemini API Key
Get your API key from Google AI Studio:
- Visit https://ai.google.dev/
- Click "Get API Key"
- Create or select a project
- Copy your API key

## 🛠️ Manual Deployment Steps

If you prefer manual control:

### Step 1: Set Your Project

```bash
# Replace with your actual project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID
```

### Step 2: Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### Step 3: Store Gemini API Key in Secret Manager

```bash
# Create the secret (first time only)
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
    --data-file=- \
    --replication-policy="automatic"

# Or update existing secret
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key --data-file=-
```

### Step 4: Deploy to Cloud Run

```bash
gcloud run deploy dcom-analysis \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-secrets GEMINI_API_KEY=gemini-api-key:latest \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0
```

### Step 5: Get Your Service URL

```bash
gcloud run services describe dcom-analysis \
    --region us-central1 \
    --format 'value(status.url)'
```

## 🔧 Configuration Options

### Memory and CPU

Adjust resources based on your needs:

```bash
--memory 512Mi    # Minimum (may cause OOM with large analyses)
--memory 1Gi      # Recommended
--memory 2Gi      # For heavy usage
--cpu 1           # Recommended
--cpu 2           # For better performance
```

### Scaling

Control instance scaling:

```bash
--min-instances 0   # Scale to zero (save costs)
--min-instances 1   # Always have 1 instance (faster response)
--max-instances 10  # Limit concurrent users
--max-instances 100 # For high traffic
```

### Timeout

Set request timeout (max 3600 seconds):

```bash
--timeout 300   # 5 minutes (recommended for AI analysis)
--timeout 600   # 10 minutes (for very deep thinking mode)
```

### Regions

Choose a region close to your users:

```bash
--region us-central1       # Iowa, USA
--region us-east1          # South Carolina, USA
--region europe-west1      # Belgium
--region asia-northeast1   # Tokyo, Japan
```

See all regions: https://cloud.google.com/run/docs/locations

## 🔒 Security Best Practices

### 1. Use Secret Manager (Already Implemented)
✅ API keys are stored in Google Secret Manager, not in code
✅ Secrets are injected at runtime as environment variables
✅ No secrets in the container image

### 2. Enable Authentication (Optional)

To require authentication:

```bash
gcloud run deploy dcom-analysis \
    --source . \
    --no-allow-unauthenticated \
    --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

Then invoke with authentication:
```bash
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
    https://your-service-url/health
```

### 3. Set Up Rate Limiting

Use Google Cloud Armor for rate limiting:
https://cloud.google.com/armor/docs/rate-limiting-overview

### 4. Monitor Usage

Set up budget alerts:
```bash
gcloud billing budgets create --billing-account=BILLING_ACCOUNT_ID \
    --display-name="DCOM Budget" \
    --budget-amount=100USD \
    --threshold-rule=percent=50 \
    --threshold-rule=percent=90 \
    --threshold-rule=percent=100
```

## 📊 Monitoring and Logging

### View Logs

```bash
# Recent logs
gcloud run services logs read dcom-analysis --region us-central1 --limit 50

# Follow logs in real-time
gcloud run services logs tail dcom-analysis --region us-central1
```

### View Metrics

Visit Google Cloud Console:
- Go to Cloud Run → Select your service
- View metrics: Requests, Latency, CPU/Memory usage
- Set up alerts for errors or high latency

### Check Service Status

```bash
# Get service details
gcloud run services describe dcom-analysis --region us-central1

# Check health endpoint
curl https://YOUR-SERVICE-URL/health
```

## 💰 Cost Estimation

Cloud Run pricing is based on:
1. **Requests**: Free tier includes 2 million requests/month
2. **CPU time**: $0.00002400 per vCPU-second
3. **Memory time**: $0.00000250 per GiB-second
4. **Networking**: $0.12 per GB outbound

**Example costs** (1Gi memory, 1 CPU):
- 1000 users/month, 5 analyses each, 30s avg: ~$10-15/month
- 10,000 users/month, 5 analyses each: ~$100-150/month

**Plus Gemini API costs:**
- Flash model: $0.075 per 1M input chars, $0.30 per 1M output
- Pro model: $1.25 per 1M input chars, $5.00 per 1M output

Use the pricing calculator: https://cloud.google.com/products/calculator

## 🔄 Updating Your Deployment

To deploy updates:

```bash
# Simply re-run the deploy command
./deploy.sh

# Or manually:
gcloud run deploy dcom-analysis \
    --source . \
    --region us-central1
```

Cloud Run automatically:
- Builds a new container image
- Gradually shifts traffic to the new version
- Keeps the old version running during rollout
- Rolls back automatically if the new version fails health checks

## 🗑️ Cleanup / Deletion

### Delete the Cloud Run Service

```bash
gcloud run services delete dcom-analysis --region us-central1
```

### Delete the Secret

```bash
gcloud secrets delete gemini-api-key
```

### Delete Container Images

```bash
# List images
gcloud container images list

# Delete specific image
gcloud container images delete gcr.io/PROJECT_ID/cloud-run-source-deploy/dcom-analysis
```

## 🐛 Troubleshooting

### "Service not found" Error

Make sure you're using the correct region:
```bash
gcloud run services list
```

### "Permission denied" Error

Grant yourself permissions:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="user:YOUR_EMAIL" \
    --role="roles/run.admin"
```

### Container Fails to Start

Check logs:
```bash
gcloud run services logs read dcom-analysis --region us-central1 --limit 100
```

Common issues:
- Missing GEMINI_API_KEY environment variable
- Port 8080 not exposed (Cloud Run requires port 8080)
- Application crashes during startup

### API Key Issues

Verify secret exists:
```bash
gcloud secrets versions access latest --secret="gemini-api-key"
```

Grant Cloud Run access to the secret:
```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding gemini-api-key \
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### Out of Memory Errors

Increase memory allocation:
```bash
gcloud run services update dcom-analysis \
    --region us-central1 \
    --memory 2Gi
```

### Slow Cold Starts

Set minimum instances:
```bash
gcloud run services update dcom-analysis \
    --region us-central1 \
    --min-instances 1
```

## 📚 Additional Resources

- **Cloud Run Documentation**: https://cloud.google.com/run/docs
- **Gemini API Documentation**: https://ai.google.dev/docs
- **Google Secret Manager**: https://cloud.google.com/secret-manager/docs
- **Cloud Run Pricing**: https://cloud.google.com/run/pricing
- **Support**: https://cloud.google.com/support

## 🎯 Next Steps After Deployment

1. **Test Your Application**: Visit the service URL and try a few analyses
2. **Set Up Monitoring**: Create alerts for errors and high costs
3. **Configure Custom Domain** (Optional):
   ```bash
   gcloud run services update dcom-analysis \
       --region us-central1 \
       --add-custom-domain your-domain.com
   ```
4. **Set Up CI/CD**: Automate deployments with Cloud Build triggers
5. **Add Authentication**: Implement user authentication if needed
6. **Monitor Costs**: Check billing daily for the first week

---

**Need Help?** Open an issue or check the troubleshooting section above.
