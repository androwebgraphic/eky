# Render.com Deployment Guide

## Recent Fixes for Login Issues

### 1. Fixed JWT Secret (CRITICAL)
**File:** `server/.env`
- Changed `JWT_SECRET` from placeholder `your_super_secure_jwt_secret_key_here` to a secure, unique value
- This was the primary cause of login failures - the placeholder would cause token verification to fail

### 2. Improved CORS Configuration
**File:** `server/server.cjs`
- Updated Express CORS to properly handle origins
- Added specific allowed origins: `http://localhost:3000` and `https://eky-3xf1.onrender.com`
- Configured proper credentials support
- Updated Socket.IO CORS to match Express CORS settings

### 3. Environment Variables Verified

**Client (`client/.env`):**
```
REACT_APP_API_URL=https://sharedog-backend-o8ta.onrender.com
```

**Server (`server/.env`):**
```
CLIENT_ORIGIN=https://eky-3xf1.onrender.com
API_BASE=https://sharedog-backend-o8ta.onrender.com
CLIENT_URL=https://eky-3xf1.onrender.com
JWT_SECRET=eky_secure_jwt_secret_for_render_deployment_2026_a7b9c3d5e8f1g2h4i6j8k0l2m4n6o8p0q2r4s6t8u0v2w4x6y8z0
MONGO_URI=mongodb+srv://andreassklizovic:jl31156l@eky.zw3yij8.mongodb.net/eky?retryWrites=true&w=majority
```

## Deployment Steps

### 1. Commit and Push Changes
```bash
git add client/.env server/.env server/server.cjs
git commit -m "Fix login issues on Render - update JWT secret and CORS config"
git push origin main
```

### 2. Redeploy Services on Render

**Backend (sharedog-backend-o8ta):**
1. Go to Render dashboard
2. Select the backend service
3. Click "Manual Deploy" → "Clear build cache & deploy"
4. Wait for deployment to complete
5. Check logs for any errors

**Frontend (eky-3xf1):**
1. Go to Render dashboard
2. Select the frontend service
3. Click "Manual Deploy" → "Clear build cache & deploy"
4. Wait for deployment to complete
5. Check logs for any errors

### 3. Verify Deployment

After both services are deployed:

1. **Check Backend Health:**
   - Visit: `https://sharedog-backend-o8ta.onrender.com/health`
   - Should return: `{"status":"OK","uptime":<number>}`

2. **Test Login:**
   - Visit: `https://eky-3xf1.onrender.com`
   - Try logging in with an existing account
   - Check browser console for any errors

3. **Check Browser Network Tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Try logging in
   - Check the `/api/users/logiranje` request:
     - Status should be 200
     - Response should contain token and user data

## Troubleshooting

### Login Still Fails

1. **Check Backend Logs:**
   - Go to Render backend service
   - View logs
   - Look for errors related to JWT or authentication

2. **Verify JWT Secret:**
   - Make sure `JWT_SECRET` in server/.env matches what's deployed
   - In Render dashboard, check environment variables for the backend service

3. **Check CORS Errors:**
   - In browser console, look for CORS errors
   - Verify the frontend URL is in the allowed origins

4. **Test API Directly:**
   ```bash
   curl -X POST https://sharedog-backend-o8ta.onrender.com/api/users/logiranje \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword"}'
   ```

### Common Issues

**Issue: "Invalid email or password" even with correct credentials**
- Cause: JWT_SECRET mismatch between client and server
- Fix: Redeploy backend with correct JWT_SECRET

**Issue: CORS errors in browser console**
- Cause: Frontend URL not in allowed origins
- Fix: Add frontend URL to `allowedOrigins` in server/server.cjs

**Issue: Network error / Request timeout**
- Cause: Backend not responding or CORS blocking request
- Fix: Check backend is running and reachable

## Security Notes

1. **JWT Secret:** Keep the JWT_SECRET value secret and unique
2. **MongoDB URI:** The MongoDB connection string contains credentials - ensure it's secure
3. **Email Configuration:** Update EMAIL_USER and EMAIL_PASS with real values for password reset functionality

## Production Checklist

- [x] JWT_SECRET updated to secure value
- [x] CORS configured for production URLs
- [x] Client API URL set to backend URL
- [x] Server CLIENT_ORIGIN and API_BASE set correctly
- [x] MongoDB URI configured
- [ ] Email credentials configured (for password reset)
- [ ] Test login on production
- [ ] Test registration on production
- [ ] Test all authenticated endpoints
- [ ] Test file uploads
- [ ] Test Socket.IO connections

## Monitoring

After deployment, monitor:
- Backend logs for errors
- Frontend console for client-side errors
- Network tab for failed requests
- Database connection health

## Contact

If issues persist after following this guide:
1. Check Render service logs
2. Verify all environment variables match
3. Test API endpoints directly with curl/Postman
4. Check MongoDB connection status