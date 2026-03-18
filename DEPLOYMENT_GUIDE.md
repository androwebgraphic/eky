# Deployment Guide for EKY App

## Problem: 404 Errors on Vercel

Your app has both a React frontend and Express backend with Socket.IO. The 404 errors occur because:

1. **Client-side routing**: React Router uses client-side routing, so all routes need to redirect to `index.html`
2. **Backend separation**: The Express server with Socket.IO needs a persistent connection, which doesn't work well with Vercel's serverless functions

## Solution: Separate Deployment

### Frontend (React) - Deploy to Vercel

The `vercel.json` file I created will handle the frontend deployment correctly by redirecting all routes to `index.html`.

**Deploy to Vercel:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from the project root
vercel
```

**Vercel Configuration:**
- ✅ `vercel.json` is configured
- ✅ All routes redirect to `index.html` (fixes 404s)
- ✅ Build command: `cd client && npm install && npm run build`
- ✅ Output directory: `client/build`

### Backend (Express + Socket.IO) - Deploy to Render

Since your backend uses Socket.IO and needs persistent connections, **you cannot deploy it to Vercel**. Use Render, Railway, or similar services instead.

#### Option 1: Render (Recommended - Free tier available)

1. **Prepare your code for production:**

   The server is already configured to work with Render. The only change needed is to update the CORS origins.

2. **Update CORS Origins:**

   In `server/server.cjs`, update the `allowedOrigins` array:

   ```javascript
   const allowedOrigins = [
     'https://your-frontend.vercel.app',  // Replace with your Vercel URL
     'https://your-custom-domain.com',     // Add your custom domain if you have one
     'http://localhost:3000',              // Keep for local development
     'http://127.0.0.1:3000'
   ];
   ```

3. **Deploy to Render:**

   - Go to [render.com](https://render.com)
   - Create a new account or login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Build Command**: `cd server && npm install`
     - **Start Command**: `cd server && npm start`
     - **Root Directory**: `server` (optional, can leave empty)
   - Add Environment Variables (from your `.env` file):
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret
     - Any other environment variables from `server/.env`
   - Click "Deploy Web Service"

4. **Get your backend URL:**
   After deployment, Render will give you a URL like: `https://your-api.onrender.com`

#### Option 2: Railway

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Deploy from GitHub
4. Configure environment variables
5. Railway will provide a URL for your backend

### Update Frontend API Configuration

Once your backend is deployed, update the frontend to use the production API URL:

1. **Update `client/src/utils/api.ts`:**

   ```typescript
   // Development vs Production API URL
   const API_URL = process.env.NODE_ENV === 'production' 
     ? 'https://your-api.onrender.com'  // Replace with your Render URL
     : 'http://localhost:3001';
   
   export const axiosInstance = axios.create({
     baseURL: API_URL,
     withCredentials: true,
   });
   ```

2. **Or use environment variable:**

   In Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Add: `REACT_APP_API_URL = https://your-api.onrender.com`

   Then in your code:
   ```typescript
   const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
   ```

### Environment Variables Checklist

**Frontend (Vercel):**
- `REACT_APP_API_URL`: Your backend URL (e.g., `https://your-api.onrender.com`)

**Backend (Render):**
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Your JWT secret
- `NODE_ENV`: `production`
- `PORT`: `3001` (or let Render choose)
- Any other variables from your `.env` file

### Socket.IO Configuration

Your Socket.IO setup is already configured for production. Just ensure:

1. **Update CORS origins** in `server/server.cjs` to include your production frontend URL
2. **No changes needed** in the client - it will use the same API URL

### Testing the Deployment

1. **Test Frontend:**
   - Visit your Vercel URL
   - Navigate to different routes - should work without 404s
   - Check browser console for any errors

2. **Test Backend:**
   - Test API endpoints using Postman or curl
   - Check Render logs for any errors

3. **Test Socket.IO:**
   - Try sending a message in chat
   - Check both frontend and backend logs

### Common Issues & Solutions

**Issue: 404 errors on page refresh**
- ✅ Fixed by `vercel.json` rewrite rule

**Issue: API requests failing**
- Check CORS origins in backend
- Verify API URL in frontend
- Check backend logs

**Issue: Socket.IO not working**
- Socket.IO requires persistent connections (won't work on Vercel serverless)
- Must deploy backend to Render/Railway/Heroku
- Verify CORS includes your production frontend URL

**Issue: Images not loading**
- Ensure `/uploads` routes are accessible
- Check CORS headers for image routes

### Summary of Architecture

```
┌─────────────────────────────────────┐
│         Vercel (Frontend)           │
│    React SPA + Client Routing       │
│   https://your-app.vercel.app       │
└──────────────┬──────────────────────┘
               │ API Requests
               │
               ↓
┌─────────────────────────────────────┐
│        Render (Backend)              │
│    Express + Socket.IO + MongoDB    │
│    https://your-api.onrender.com    │
└─────────────────────────────────────┘
```

## Quick Start Deployment

1. **Push code to GitHub**
2. **Deploy frontend to Vercel:** `vercel`
3. **Deploy backend to Render:** Follow Render instructions above
4. **Update frontend API URL** to point to Render backend
5. **Update backend CORS** to allow Vercel frontend
6. **Test everything!**

## Need Help?

- Vercel docs: https://vercel.com/docs
- Render docs: https://render.com/docs
- Railway docs: https://docs.railway.app