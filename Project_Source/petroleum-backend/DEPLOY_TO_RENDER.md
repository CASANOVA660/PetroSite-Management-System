# Deploying Petroleum Backend to Render

## Option 1: Manual Deployment

1. Go to https://dashboard.render.com/
2. Sign in or create an account
3. Click "New" button → select "Web Service"
4. Connect your GitHub account if not already connected
5. Select the repository: `CASANOVA660/PetroSite-Management-System`
6. Configure the service:
   - Name: `petroleum-backend`
   - Environment: `Docker`
   - Branch: `main`
   - Root Directory: `Project_Source/petroleum-backend`
   - Plan: `Free`

7. Set the following environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://admin:admin@cluster0.pmxg5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   REDIS_URL=rediss://default:AXC7AAIjcDE1YTNmYTdjMjU0MTI0NThhYTViMDQ2YTk2MWNiNzBiN3AxMA@daring-boxer-28859.upstash.io:6379
   JWT_SECRET=[copy from your .env file]
   SENDER_EMAIL=boual.boual@gmail.com
   SENDER_NAME=Petroleum
   EMAIL_USER=boualiamino0123@gmail.com
   EMAIL_APP_PASSWORD=[copy from your .env file]
   FRONTEND_URL=https://petroleum-project.netlify.app
   ENCRYPTION_KEY=[copy from your .env file]
   ENCRYPTION_IV=[copy from your .env file]
   CLOUDINARY_CLOUD_NAME=dx9psug39
   CLOUDINARY_API_KEY=298853364839265
   CLOUDINARY_API_SECRET=[copy from your .env file]
   LOG_LEVEL=info
   LOG_FILE_ENABLED=false
   ```

8. Click "Create Web Service"
9. Wait for deployment (this may take 5-10 minutes)

## Option 2: Blueprint Deployment (Using render.yaml)

1. Go to https://render.com/deploy
2. Enter your GitHub repository URL: `https://github.com/CASANOVA660/PetroSite-Management-System`
3. Render will detect the render.yaml file in the petroleum-backend directory
4. Fill in the secret environment variables that are marked as `sync: false` in the render.yaml
5. Click "Apply"

## After Deployment

1. Test the health check endpoint: `https://your-service-name.onrender.com/health`
2. If successful, you'll see a response like: `{"status":"ok","timestamp":"2023-10-12T12:34:56.789Z"}`
3. Update your frontend to use the new backend URL

## Troubleshooting

If deployment fails:

1. Check Render logs for error messages
2. Verify environment variables are set correctly
3. If there are permission issues with logs, make sure LOG_FILE_ENABLED=false is set
4. For Redis connection issues, check the REDIS_URL value

## Important Notes

- The changes we made disable file logging on Render to avoid permission issues
- All logs will go to the console, which you can view in the Render dashboard
- The /health endpoint can be used to check if your service is running properly 