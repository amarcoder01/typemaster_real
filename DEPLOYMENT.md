# TypeMasterAI - Google Cloud Run Deployment Guide

This guide covers deploying TypeMasterAI to Google Cloud Run with zero-downtime continuous deployment from GitHub.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial GCP Setup](#initial-gcp-setup)
3. [Secret Manager Configuration](#secret-manager-configuration)
4. [Artifact Registry Setup](#artifact-registry-setup)
5. [GitHub Actions Setup (Recommended)](#github-actions-setup-recommended)
6. [Cloud Build Setup (Alternative)](#cloud-build-setup-alternative)
7. [Manual Deployment](#manual-deployment)
8. [Custom Domain Setup](#custom-domain-setup)
9. [Monitoring & Logging](#monitoring--logging)
10. [Rollback Procedures](#rollback-procedures)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Google Cloud account with billing enabled
- [ ] `gcloud` CLI installed and authenticated
- [ ] Docker installed (for local testing)
- [ ] PostgreSQL database (Neon, Supabase, or Cloud SQL)
- [ ] OpenAI API key

### Required Tools

```bash
# Install Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login
gcloud auth application-default login
```

---

## Initial GCP Setup

### 1. Create a new GCP Project

```bash
# Create project
gcloud projects create typemasterai-prod --name="TypeMasterAI Production"

# Set as default
gcloud config set project typemasterai-prod

# Enable billing (required for Cloud Run)
# Do this in the GCP Console: https://console.cloud.google.com/billing
```

### 2. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com
```

### 3. Set Default Region

```bash
gcloud config set run/region us-central1
```

---

## Secret Manager Configuration

Store sensitive values in Secret Manager (never in environment variables):

### 1. Create Secrets

```bash
# Database URL
echo -n "postgresql://user:password@host:5432/db?sslmode=require" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Session Secret (generate a secure random string)
openssl rand -base64 64 | tr -d '\n' | \
  gcloud secrets create SESSION_SECRET --data-file=-

# OpenAI API Key
echo -n "sk-your-openai-api-key" | \
  gcloud secrets create OPENAI_API_KEY --data-file=-
```

### 2. Create Optional Secrets (if using these features)

```bash
# Push Notifications (VAPID keys)
# Generate with: npx web-push generate-vapid-keys
echo -n "your-vapid-public-key" | \
  gcloud secrets create VAPID_PUBLIC_KEY --data-file=-

echo -n "your-vapid-private-key" | \
  gcloud secrets create VAPID_PRIVATE_KEY --data-file=-

echo -n "mailto:your-email@example.com" | \
  gcloud secrets create VAPID_SUBJECT --data-file=-

# Google OAuth
echo -n "your-google-client-id" | \
  gcloud secrets create GOOGLE_CLIENT_ID --data-file=-

echo -n "your-google-client-secret" | \
  gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-

# GitHub OAuth
echo -n "your-github-client-id" | \
  gcloud secrets create GITHUB_CLIENT_ID --data-file=-

echo -n "your-github-client-secret" | \
  gcloud secrets create GITHUB_CLIENT_SECRET --data-file=-
```

### 3. Grant Cloud Run Access to Secrets

```bash
# Get the Cloud Run service account
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant access to all secrets
for SECRET in DATABASE_URL SESSION_SECRET OPENAI_API_KEY VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY VAPID_SUBJECT GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" 2>/dev/null || true
done
```

---

## Artifact Registry Setup

Create a Docker repository to store container images:

```bash
# Create repository
gcloud artifacts repositories create typemasterai \
  --repository-format=docker \
  --location=us-central1 \
  --description="TypeMasterAI container images"

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

## GitHub Actions Setup (Recommended)

This is the recommended approach for continuous deployment.

### 1. Create a Workload Identity Federation

This allows GitHub Actions to authenticate without storing service account keys:

```bash
PROJECT_ID=$(gcloud config get-value project)

# Create a Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create a Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Create a Service Account for GitHub Actions
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Allow GitHub Actions to impersonate the service account
# Replace YOUR_GITHUB_USERNAME/YOUR_REPO with your actual repo
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@${PROJECT_ID}.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/YOUR_REPO"
```

### 2. Get Workload Identity Provider Name

```bash
# Get the full provider name (needed for GitHub secrets)
gcloud iam workload-identity-pools providers describe github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)"
# Output: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

### 3. Configure GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | Your GCP project ID (e.g., `typemasterai-prod`) |
| `WIF_PROVIDER` | The full provider name from step 2 |
| `WIF_SERVICE_ACCOUNT` | `github-actions@PROJECT_ID.iam.gserviceaccount.com` |

### 4. Push to Main Branch

The GitHub Actions workflow (`.github/workflows/deploy-cloud-run.yml`) will automatically:
1. Build and test the application
2. Build the Docker image
3. Push to Artifact Registry
4. Deploy to Cloud Run
5. Verify health check
6. Route traffic to new revision

---

## Cloud Build Setup (Alternative)

If you prefer using Cloud Build triggers instead of GitHub Actions:

### 1. Connect GitHub Repository

```bash
# Open the Cloud Console to connect your repo
echo "https://console.cloud.google.com/cloud-build/triggers/connect?project=$(gcloud config get-value project)"
```

### 2. Create a Cloud Build Trigger

```bash
gcloud builds triggers create github \
  --name="typemasterai-deploy" \
  --repo-name="typemasterai" \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml"
```

### 3. Grant Cloud Build Permissions

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

# Grant Service Account User role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

---

## Manual Deployment

For one-time or testing deployments:

### 1. Build Locally

```bash
# Build Docker image
docker build -t typemasterai .

# Test locally
docker run -p 8080:8080 --env-file .env typemasterai
```

### 2. Push to Artifact Registry

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION=us-central1

# Tag the image
docker tag typemasterai ${REGION}-docker.pkg.dev/${PROJECT_ID}/typemasterai/typemasterai:latest

# Push
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/typemasterai/typemasterai:latest
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy typemasterai \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/typemasterai/typemasterai:latest \
  --region=${REGION} \
  --platform=managed \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=1 \
  --max-instances=10 \
  --concurrency=80 \
  --cpu-boost \
  --session-affinity \
  --no-cpu-throttling \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest"
```

---

## Custom Domain Setup

### 1. Verify Domain Ownership

```bash
# Add your domain
gcloud domains verify yourdomain.com
```

### 2. Map Domain to Cloud Run

```bash
gcloud run domain-mappings create \
  --service=typemasterai \
  --domain=typemasterai.yourdomain.com \
  --region=us-central1
```

### 3. Update DNS Records

Add the DNS records shown by the command above to your domain registrar.

### 4. Update Application URLs

After setting up your custom domain, update:

1. `client/index.html` - Update canonical URL and Open Graph URLs
2. `client/public/robots.txt` - Update sitemap URL
3. `client/public/sitemap.xml` - Update all URLs
4. OAuth provider callback URLs in Google/GitHub/Facebook developer consoles

---

## Monitoring & Logging

### View Logs

```bash
# Stream logs
gcloud run services logs read typemasterai --region=us-central1 --limit=100

# Or use Cloud Logging
echo "https://console.cloud.google.com/logs?project=$(gcloud config get-value project)"
```

### View Metrics

```bash
echo "https://console.cloud.google.com/run/detail/us-central1/typemasterai/metrics?project=$(gcloud config get-value project)"
```

### Set Up Alerts

```bash
# Create an uptime check
gcloud monitoring uptime-check-configs create typemasterai-health \
  --display-name="TypeMasterAI Health Check" \
  --http-check-path="/api/health" \
  --monitored-resource-type="cloud_run_revision"
```

---

## Rollback Procedures

### Quick Rollback via Console

1. Go to Cloud Run → typemasterai → Revisions
2. Click on a previous healthy revision
3. Click "Manage Traffic"
4. Route 100% traffic to that revision

### Rollback via CLI

```bash
# List revisions
gcloud run revisions list --service=typemasterai --region=us-central1

# Route traffic to a specific revision
gcloud run services update-traffic typemasterai \
  --region=us-central1 \
  --to-revisions=typemasterai-00005-abc=100
```

### Rollback via GitHub Actions

Trigger the rollback job manually from GitHub Actions:
1. Go to Actions → Deploy to Cloud Run
2. Click "Run workflow"
3. This will automatically rollback to the previous revision

---

## Troubleshooting

### Common Issues

#### 1. Cold Start Timeouts

If requests timeout during cold starts:

```bash
# Increase min instances (costs more but eliminates cold starts)
gcloud run services update typemasterai \
  --min-instances=2 \
  --region=us-central1
```

#### 2. WebSocket Connection Issues

Ensure these settings are configured:

```bash
gcloud run services update typemasterai \
  --region=us-central1 \
  --no-cpu-throttling \
  --session-affinity
```

#### 3. Database Connection Timeouts

For Neon serverless, ensure your connection string includes:

```
?sslmode=require&connect_timeout=10
```

#### 4. Memory Issues

Increase memory allocation:

```bash
gcloud run services update typemasterai \
  --memory=1Gi \
  --region=us-central1
```

#### 5. Secret Access Denied

Ensure the service account has access:

```bash
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Health Check Endpoints

The application provides these health endpoints:

- `/api/health` - Full health check with metrics
- `/api/health/live` - Liveness probe (is the app running?)
- `/api/health/ready` - Readiness probe (can it handle traffic?)

### Getting Help

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Troubleshooting](https://cloud.google.com/run/docs/troubleshooting)
- [TypeMasterAI GitHub Issues](https://github.com/amarcoder01/typemasterai/issues)

---

## Cost Optimization

### Recommended Settings for Different Traffic Levels

**Low Traffic (< 1000 requests/day)**
```bash
--min-instances=0 --max-instances=3 --cpu=1 --memory=256Mi
```

**Medium Traffic (1000-10000 requests/day)**
```bash
--min-instances=1 --max-instances=5 --cpu=1 --memory=512Mi
```

**High Traffic (> 10000 requests/day)**
```bash
--min-instances=2 --max-instances=10 --cpu=2 --memory=1Gi
```

### Estimate Costs

Use the [Cloud Run Pricing Calculator](https://cloud.google.com/products/calculator/#/addProduct/cloud-run).

