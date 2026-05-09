#!/bin/bash
# deploy-gcp.sh — Script de despliegue a Google Cloud Run

set -e

echo "🚀 Desplegando EduGest a Google Cloud..."

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="edugest"
DB_INSTANCE="edugest-db"

echo "📦 Instalando dependencias..."
npm install

echo "🔨 Compilando frontend..."
npm run build

echo "🐳 Construyendo imagen Docker..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

echo "🚀 Desplegando a Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="DB_USER=postgres,DB_NAME=edugest,DB_HOST=/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE},CLOUD_SQL_CONNECTION_NAME=${PROJECT_ID}:${REGION}:${DB_INSTANCE}" \
  --add-cloudsql-instances ${PROJECT_ID}:${REGION}:${DB_INSTANCE}

echo "✅ Despliegue completado!"
echo "🌐 URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"
