This is the complete implementation of a web application for English speaking practice featuring an AI chatbot.<br>
The project is accessible at:<br>
🔗 **[Web App URL](https://fyp-frontend-629590115382.asia-northeast1.run.app/)**

## Deployment
To start all services, run:
```bash
docker-compose up --build
```

This project is deployed using Google Cloud Run. The following commands are use to deploy the frontend and backend containers:<br>
Frontend:<br>
```bash
gcloud run deploy [SERVICE_NAME] \
  --image [IMAGE_URL] \
  --region [REGION] \
  --platform managed \
  --allow-unauthenticated \
  --project=[PROJECT_ID] \
  --port 3001 \
  --set-env-vars="^@^VITE_ALLOWED_HOSTS=[ALLOWED_HOSTS]"
```

Backend:<br>
```bash
gcloud run deploy [SERVICE_NAME] \
  --image [IMAGE_URL] \
  --region [REGION] \
  --platform managed \
  --allow-unauthenticated \
  --project=[PROJECT_ID] \
  --port 3000 \
  --update-secrets SECRETS=[SECRET_NAME]:latest
```

### Secrets
The backend requires the following secrets to run. All secrets should be stored as a single JSON file in Google Secret Manager before deployment.

| **Secret**               | **Description**                                      |
|--------------------------|------------------------------------------------------|
| `CRYPTO_KEY`            | Encryption key for secure data storage.              |
| `CRYPTO_IV`             | Initialization vector for encryption.                |
| `GOOGLE_TTS_API_KEY`    | API key for Google Speech service.                   |
| `AZURE_TTS_API_KEY_HK`  | API key for Azure TTS service.                       |
| `DEEPL_API_KEY`         | API key for DeepL translation service.               |
| `DICTIONARY_API_KEY`    | API key for Merriam Webster dictionary service.      |
| `GEMINI_API_KEY`        | API key for Gemini AI services.                      |
| `PASSPORT_SECRET`       | Secret for authentication with Passport.js.          |
| `MONGODB`              | Connection string for MongoDB database. (MongoDB Atlus was used in this project)  |
