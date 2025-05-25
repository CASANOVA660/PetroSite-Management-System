# Deploying the Petroleum Backend to Render

This guide will walk you through deploying the Petroleum backend service to Render.

## Prerequisites

1. A Render account (https://render.com)
2. Access to the following services:
   - MongoDB Atlas (M0 free tier)
   - Upstash Redis (free tier)
   - SendGrid or an SMTP provider for emails
   - Cloudinary for file storage

## Deployment Steps

### 1. Push Your Code to GitHub

Make sure your code is pushed to a GitHub repository.

### 2. Create a New Web Service on Render

1. Log in to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Use the following settings:
   - **Name**: petroleum-backend (or your preferred name)
   - **Environment**: Docker
   - **Branch**: main (or your deployment branch)
   - **Root Directory**: Leave empty if the Dockerfile is in the root, otherwise specify
   - **Plan**: Free

### 3. Configure Environment Variables

Add the following environment variables in the Render dashboard:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_upstash_redis_url
JWT_SECRET=your_jwt_secret
SENDER_EMAIL=your_email
SENDER_NAME=Petroleum
EMAIL_USER=your_email_username
EMAIL_APP_PASSWORD=your_email_password
FRONTEND_URL=https://your-frontend-netlify-app.netlify.app
ENCRYPTION_KEY=your_encryption_key
ENCRYPTION_IV=your_encryption_iv
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
LOG_LEVEL=info
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14
LOG_DIRECTORY=./logs
```

Replace all `your_*` values with your actual credentials.

### 4. Deploy the Service

1. Click "Create Web Service"
2. Render will automatically build and deploy your Docker container
3. Wait for the build to complete (this may take a few minutes)
4. Once deployed, you can access your API at the provided URL

### 5. Verify the Deployment

1. Access the health check endpoint: `https://your-service-name.onrender.com/health`
2. You should receive a response with `{"status":"ok","timestamp":"..."}` 

### 6. Update Your Frontend

Update your frontend application's API URL to point to your new Render backend URL.

## Troubleshooting

If you encounter issues:

1. Check the Render logs for errors
2. Verify environment variables are set correctly
3. Ensure your MongoDB and Redis connections are working
4. Check that the health check endpoint is responding

## Next Steps

1. Set up automatic deployments through GitHub integration
2. Consider upgrading to a paid plan for better performance as your application scales
3. Set up monitoring and alerts for your service 