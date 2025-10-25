# Deployment Setup

This repository uses GitHub Actions for automatic deployment to the production server.

## GitHub Secrets Required

You need to add the following secrets to your GitHub repository:

1. **SERVER_IP**: Your server's IP address
2. **SERVER_USERNAME**: SSH username for your server (e.g., `root` or your user)
3. **SERVER_PASSWORD**: SSH password for your server

### How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of the secrets listed above

## Deployment Process

When you push to the `main` branch, the workflow will:

1. Connect to your server via SSH
2. Navigate to `agross/agross-admin/`
3. Force pull the latest code from `origin/main`
4. Install dependencies with `npm install`
5. Build the project with `npm run build`
6. Copy the `dist` folder to `/var/www/admin.agross.uz/dist`

## Manual Deployment

If you need to deploy manually, you can trigger the workflow from the Actions tab in GitHub.

## Notes

- Make sure your server has Node.js and npm installed
- The workflow uses SSH password authentication
- The deployment script uses `git reset --hard` to ensure a clean state before pulling
