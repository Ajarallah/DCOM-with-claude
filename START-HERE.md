# 🚀 Deploy DCOM in 3 Simple Steps

Your DCOM (Deep Contextual Output Model) is **100% ready** to deploy!

---

## Prerequisites (One-Time Setup)

### 1️⃣ Install Google Cloud CLI

**Mac:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows:**
Download from: https://cloud.google.com/sdk/docs/install

### 2️⃣ Authenticate

```bash
gcloud auth login
gcloud auth application-default login
```

### 3️⃣ Enable Billing

Visit: https://console.cloud.google.com/billing/linkedaccount?project=gen-lang-client-0956346379

---

## 🎯 Deploy Now (ONE COMMAND)

```bash
./quick-deploy.sh
```

That's it! Wait 5 minutes and you'll get your live URL.

---

## What the Script Does Automatically

✅ Configures your Google Cloud project
✅ Enables all required APIs
✅ Stores your Gemini API key securely
✅ Builds the application
✅ Deploys to Cloud Run
✅ Gives you the live URL

**No coding. No configuration. Just one command.**

---

## After Deployment

You'll get a URL like:
```
https://dcom-analysis-xxxxx-uc.a.run.app
```

### Test Your App
1. Open the URL in your browser
2. Click on an example question
3. Enable "Deep Thinking" to see AI reasoning
4. Share the URL with anyone!

### View Logs
```bash
gcloud run services logs read dcom-analysis --region us-central1
```

### Update Your App
Make changes, then run:
```bash
./quick-deploy.sh
```

---

## 💰 Costs

- **Free tier**: 2 million requests/month
- **After free tier**: ~$30-60/month for moderate usage
- **Gemini API**: Pay per use (~$0.02 per analysis)

You'll get billing alerts if costs spike.

---

## 🆘 Troubleshooting

### "gcloud: command not found"
Install the Google Cloud CLI (see Prerequisites above)

### "Permission denied" or "Not authenticated"
Run:
```bash
gcloud auth login
gcloud auth application-default login
```

### "Billing not enabled"
Enable at: https://console.cloud.google.com/billing

### Build fails
Make sure you're in the project directory:
```bash
cd /path/to/DCOM-with-claude
./quick-deploy.sh
```

---

## 📱 What You Built

**DCOM** is a strategic intelligence platform that:
- Analyzes complex economic & geopolitical scenarios
- Synthesizes 19+ knowledge sources (embedded)
- Uses Google's Gemini Pro AI
- Shows "deep thinking" internal reasoning
- Provides cited sources
- Runs entirely in the cloud

---

## 🎉 Ready to Deploy?

Run this now:
```bash
./quick-deploy.sh
```

Your app will be live in 5 minutes! 🚀

---

**Questions?** Check `DEPLOYMENT.md` for the full guide.
