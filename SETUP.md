# GitHub Deployment Setup

## Resolving GitHub Security Alert for Firebase API Keys

GitHub has detected exposed API keys in your Firebase configuration. While Firebase API keys are designed to be public (they're restricted by domain and security rules), GitHub's security scanner flags them. Here's how to properly handle them:

### Steps to Set Up GitHub Secrets

1. Go to your GitHub repository (https://github.com/hartman39/medallia-goodbye)

2. Click on **Settings** tab

3. In the left sidebar, click **Secrets and variables** → **Actions**

4. Click **New repository secret** and add each of these secrets (using your actual Firebase config values from your `.env` file):

   - **Name:** `REACT_APP_FIREBASE_API_KEY`
     **Value:** `<your-api-key>`

   - **Name:** `REACT_APP_FIREBASE_AUTH_DOMAIN`
     **Value:** `<your-project-id>.firebaseapp.com`

   - **Name:** `REACT_APP_FIREBASE_DATABASE_URL`
     **Value:** `https://<your-project-id>-default-rtdb.firebaseio.com`

   - **Name:** `REACT_APP_FIREBASE_PROJECT_ID`
     **Value:** `<your-project-id>`

   - **Name:** `REACT_APP_FIREBASE_STORAGE_BUCKET`
     **Value:** `<your-project-id>.firebasestorage.app`

   - **Name:** `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
     **Value:** `<your-sender-id>`

   - **Name:** `REACT_APP_FIREBASE_APP_ID`
     **Value:** `<your-app-id>`

5. The GitHub Actions workflow will automatically use these secrets during deployment

### Local Development

For local development, the `.env` file contains your Firebase configuration. This file is already in `.gitignore` and won't be committed.

### Security Notes

- Firebase API keys are meant to be public - they're protected by:
  - Domain restrictions (only works on your authorized domains)
  - Firebase Security Rules (database/storage access control)

- The GitHub security alert is precautionary - by using environment variables and GitHub secrets, we satisfy GitHub's security requirements while keeping the app functional.

### Manual Deployment (Alternative)

If you prefer to keep using `npm run deploy` instead of GitHub Actions:

```bash
npm run build
npm run deploy
```

The build will use your local `.env` file for the Firebase configuration.