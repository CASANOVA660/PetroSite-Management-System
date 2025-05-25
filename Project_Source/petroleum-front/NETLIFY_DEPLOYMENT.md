# Deploying Petroleum Frontend to Netlify

This guide will walk you through deploying the Petroleum frontend application to Netlify.

## Prerequisites

1. A Netlify account (sign up at https://app.netlify.com/signup)
2. Your backend deployed on Render (https://petrosite-management-system.onrender.com)
3. Git repository with your frontend code

## Step 1: Prepare Your Frontend for Production

We've already made the necessary changes to the codebase:

1. Updated `.env.production` with the correct backend URL
2. Fixed all hard-coded API URLs to use the configured API URL
3. Created a `netlify.toml` file for build configuration
4. Updated socket connection to use the same base URL

## Step 2: Deploy to Netlify

### Option 1: Deploy from Git Repository

1. Log in to your Netlify account
2. Click "Add new site" → "Import an existing project"
3. Connect to your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your repository
5. Configure build settings:
   - Branch to deploy: `main` (or your preferred branch)
   - Base directory: `petroleum-front` (if your repo is a monorepo)
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

### Option 2: Deploy Manually (Drag and Drop)

1. Build your project locally:
   ```bash
   cd petroleum-front
   npm install
   npm run build
   ```
2. Log in to your Netlify account
3. Drag and drop the `dist` folder onto the Netlify dashboard
4. Configure your site settings

## Step 3: Configure Environment Variables

1. Go to your site settings in Netlify
2. Navigate to "Site configuration" → "Environment variables"
3. Add the following environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://petrosite-management-system.onrender.com`

## Step 4: Configure Custom Domain (Optional)

1. Go to your site settings in Netlify
2. Navigate to "Domain management" → "Domains"
3. Click "Add a domain"
4. Follow the instructions to set up your custom domain

## Step 5: Enable HTTPS

HTTPS is automatically enabled for all Netlify sites. No configuration needed.

## Step 6: Test Your Deployed Application

1. Visit your Netlify site URL
2. Test the login functionality
3. Verify API calls are working correctly
4. Check that socket connections are established properly

## Troubleshooting

If you encounter issues:

1. **API Connection Issues**:
   - Check the Network tab in your browser's developer tools
   - Verify the API URL is correct in the Netlify environment variables
   - Ensure CORS is configured correctly on your backend

2. **Build Failures**:
   - Check the Netlify build logs for errors
   - Try building locally to troubleshoot issues

3. **Routing Issues**:
   - Make sure the `_redirects` file or `netlify.toml` has the proper redirect rule for SPA

4. **Socket Connection Issues**:
   - Check that the socket URL is derived from the API URL
   - Ensure the backend socket server accepts connections from your frontend domain 