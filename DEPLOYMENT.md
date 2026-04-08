# Deployment Guide - EPR System

## Prerequisites
- GitHub account
- MongoDB Atlas account (free tier)
- Render account (free tier)

---

## Step 1: MongoDB Atlas Setup

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create free shared cluster (M0)
   - Choose region closest to your users (e.g., Mumbai for India)

2. **Create Database User**
   - Database Access > Add New Database User
   - Username: `epr_user`
   - Password: Generate a strong password
   - Privileges: Read and write to any database

3. **Configure Network Access**
   - Network Access > Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is required for Render to connect

4. **Get Connection String**
   - Database > Connect > Drivers > Node.js
   - Copy the connection string
   - Replace `<username>` and `<password>` with your credentials
   - Format: `mongodb+srv://epr_user:password@cluster.mongodb.net/epr_db?retryWrites=true&w=majority`

---

## Step 2: Prepare Your Code

### Backend Configuration

1. Copy `.env.example` to `.env` in `/server`:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Update `.env` with your MongoDB URI and a secure JWT secret

3. Update CORS in `server.js` to allow production frontend:
   ```javascript
   // Replace line 16 in server/server.js
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     credentials: true
   }));
   ```

### Frontend Configuration

1. Copy `.env.example` to `.env` in `/client`:
   ```bash
   cd client
   cp .env.example .env
   ```

2. For local development, keep the default localhost URL

3. Remove proxy from `package.json` (line 46):
   ```json
   // Remove this line from client/package.json
   "proxy": "http://localhost:5000"
   ```

### Push to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## Step 3: Deploy Backend to Render

1. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - New > Web Service
   - Connect your GitHub repository
   - Select the `epr` repository

2. **Configure Service**
   - Name: `epr-backend`
   - Root Directory: `server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Environment Variables**
   Add these in the dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=<your_mongodb_atlas_connection_string>
   JWT_SECRET=<your_32+_character_secret>
   JWT_EXPIRE=30d
   FRONTEND_URL=https://epr-frontend.onrender.com
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the URL: `https://epr-backend.onrender.com`

---

## Step 4: Deploy Frontend to Render

1. **Create Static Site**
   - New > Static Site
   - Connect same repository

2. **Configure Service**
   - Name: `epr-frontend`
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

3. **Environment Variables**
   ```
   REACT_APP_API_URL=https://epr-backend.onrender.com/api
   ```

4. **Deploy**
   - Click "Create Static Site"
   - Wait for build and deploy

---

## Step 5: Update CORS & Redeploy Backend

After frontend deploys, update backend environment variable:

1. Go to `epr-backend` service in Render dashboard
2. Environment > Edit
3. Update `FRONTEND_URL` to actual frontend URL
4. Save and redeploy automatically

---

## Alternative: Using render.yaml (Blueprint)

If you prefer infrastructure-as-code:

1. Push the included `render.yaml` to your repo root
2. In Render dashboard: Blueprints > New Blueprint
3. Connect repository
4. During setup, you'll be prompted for:
   - `MONGODB_URI`
   - `JWT_SECRET`

Render will create both services automatically.

---

## Post-Deployment

### Create Initial Admin User

Use the seed script or API to create your first admin:

```bash
# Local method
curl -X POST https://epr-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@epr.com",
    "password": "securepassword123",
    "role": "owner"
  }'
```

Or use MongoDB Compass to manually insert an admin user.

### Verify Deployment

- Backend health: `https://epr-backend.onrender.com/api/auth/health`
- Frontend: `https://epr-frontend.onrender.com`
- Login with admin credentials

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Check `FRONTEND_URL` env var matches actual URL |
| MongoDB connection fails | Verify IP whitelist (0.0.0.0/0) and credentials |
| 404 on API calls | Check `REACT_APP_API_URL` ends with `/api` |
| Build fails | Check Node version (18+), run `npm audit fix` |
| JWT errors | Ensure `JWT_SECRET` is set and 32+ characters |

---

## Free Tier Limits (Render)

- **Web Service**: 512 MB RAM, sleeps after 15 min inactivity (cold start ~30s)
- **Static Site**: 100 GB bandwidth/month, unlimited requests
- **MongoDB Atlas**: 512 MB-5 GB storage, shared RAM

---

## Production Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user with strong password
- [ ] Network access configured (0.0.0.0/0)
- [ ] Backend deployed with all env vars
- [ ] Frontend deployed with correct API URL
- [ ] CORS updated with production frontend URL
- [ ] Admin user created
- [ ] Login tested successfully
- [ ] All features tested (stock, sales, returns)
