#!/bin/bash
set -e

# Configuration
SERVICE_NAME="crabuddy-app"
REGION="us-central1"
DOMAIN="crabuddy.com"
# PROJECT_ID=$("./google-cloud-sdk/bin/gcloud" config get-value project)
PROJECT_ID="kazicra-app-1041995787291"

if [ -z "$PROJECT_ID" ]; then
    echo "Error: No Google Cloud Project set. Run './google-cloud-sdk/bin/gcloud config set project [PROJECT_ID]' first."
    exit 1
fi

# Alias gcloud to local path
GCLOUD="./google-cloud-sdk/bin/gcloud"
export CLOUDSDK_PYTHON_SITEPACKAGES=1

echo "Deploying $SERVICE_NAME to project $PROJECT_ID in $REGION..."

# Deploy from source (builds automatically using Dockerfile)
# --allow-unauthenticated: Makes it public
# env vars: Set DB_TYPE to sqlite (default) or postgres if you have Cloud SQL ready. 
# For now, we use default SQLite on /tmp as per codebase fallback.
$GCLOUD run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NODE_ENV=production \
  --quiet

echo "Deployment successful."

# Domain Mapping
echo "Mapping domain $DOMAIN to $SERVICE_NAME..."
# Check if mapping exists
if $GCLOUD beta run domain-mappings describe --domain "$DOMAIN" --region "$REGION" >/dev/null 2>&1; then
    echo "Domain mapping already exists."
else
    $GCLOUD beta run domain-mappings create \
      --service "$SERVICE_NAME" \
      --domain "$DOMAIN" \
      --region "$REGION" \
      --quiet
fi

echo "Done! Verify by visiting https://$DOMAIN"
echo "Note: It may take some time for the SSL certificate to provision."
