# 🚀 Deploy DCOM to Google Cloud Run - Ready to Go!

Your project is configured and ready to deploy with your credentials:
- **Project ID:** `gen-lang-client-0956346379`
- **API Key:** Configured ✅

## Option 1: One-Command Deployment (Easiest)

Just run this from your terminal:

```bash
./quick-deploy.sh
```

**That's it!** The script will:
1. ✅ Set your Google Cloud project
2. ✅ Enable required APIs
3. ✅ Store your API key securely
4. ✅ Build and deploy your app
5. ✅ Give you the live URL

**Time:** 5-10 minutes

---

## Option 2: Manual Cloud Run Deployment

If you prefer to run commands yourself:

```bash
# 1. Set project
gcloud config set project gen-lang-client-0956346379

# 2. Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com

# 3. Store API key securely
echo -n "AIzaSyCbYt-_9YvEs05FxQmq7FHOmqjB_9ZTVHU" | gcloud secrets create gemini-api-key \
    --data-file=- --replication-policy="automatic"

# 4. Deploy to Cloud Run
gcloud run deploy dcom-analysis \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-secrets GEMINI_API_KEY=gemini-api-key:latest \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300

# 5. Get your URL
gcloud run services describe dcom-analysis \
    --region us-central1 \
    --format 'value(status.url)'
```

---

## Prerequisites

Before deploying, make sure you have:

1. **gcloud CLI installed**
   - Mac: `brew install google-cloud-sdk`
   - Linux/Windows: https://cloud.google.com/sdk/docs/install

2. **Authenticated with Google Cloud**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

3. **Billing enabled** on project `gen-lang-client-0956346379`
   - Visit: https://console.cloud.google.com/billing

---

## After Deployment

Once deployed, you'll get a URL like:
```
https://dcom-analysis-xxxxx-uc.a.run.app
```

### Test Your App
1. Open the URL in your browser
2. Try the example questions:
   - "Will the US dollar lose its reserve currency status?"
   - "Semiconductor Supply Chain vulnerabilities"
3. Enable "Deep Thinking" mode to see AI's internal reasoning

### View Logs
```bash
gcloud run services logs read dcom-analysis --region us-central1 --limit 50
```

### Update Your App
Just commit changes and run `./quick-deploy.sh` again!

---

## Troubleshooting

### "Permission denied"
Run:
```bash
gcloud auth login
gcloud config set project gen-lang-client-0956346379
```

### "Billing not enabled"
Enable billing at:
https://console.cloud.google.com/billing/linkedaccount?project=gen-lang-client-0956346379

### "Secret already exists"
Update it instead:
```bash
echo -n "AIzaSyCbYt-_9YvEs05FxQmq7FHOmqjB_9ZTVHU" | \
  gcloud secrets versions add gemini-api-key --data-file=-
```

### Build fails
Make sure you're in the project directory:
```bash
cd /path/to/DCOM-with-claude
./quick-deploy.sh
```

---

## Need Help?

Check the full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

Or open an issue on GitHub.

---

## 🎉 You're Ready!

Run this command now:
```bash
./quick-deploy.sh
```

Your DCOM intelligence platform will be live in ~5 minutes!
