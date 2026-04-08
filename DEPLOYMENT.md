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

---

# Post-Production Operations Guide

Once your app is live, follow these steps to maintain, monitor, and secure your deployment.

---

## Step 6: Monitoring & Alerts

### Enable Render Alerts

1. **Service Notifications**
   - Dashboard → epr-backend → Settings → Notifications
   - Enable email alerts for: Deploy failures, Build failures
   - Add your email and team members

2. **Monitor Service Health**
   - Dashboard → epr-backend → Metrics
   - Watch for: Memory usage (free tier: 512MB limit), CPU spikes, Response times
   - Cold starts: Free tier sleeps after 15 min inactivity (30s wake-up time)

### Check Application Health Daily (First Week)

```bash
# Test backend health
curl https://epr-backend.onrender.com/api/auth/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}

# Check frontend loads
# Simply visit https://epr-frontend.onrender.com
```

### Add Error Logging (Optional Upgrade)

```javascript
// Add to server/server.js for production error tracking
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', requestId: req.id });
});
```

---

## Step 7: Security Hardening

### Immediate Actions (Do This Week 1)

| Action | How To | Why |
|--------|--------|-----|
| Rotate JWT Secret | Render Dashboard → epr-backend → Environment → Edit `JWT_SECRET` | Prevents token forgery if key leaked |
| Restrict DB Access | Atlas → Database Access → Edit user → Restrict to `epr_db` only | Limits blast radius if credentials leaked |
| Remove .env from Git | `git rm --cached server/.env` → commit | Prevents credential exposure |
| Enable 2FA | Atlas → My Account → Two-Factor Authentication | Protects admin access |

### Verify Security Settings

```bash
# Check .env is NOT in git
git ls-files | grep -E "\.env$"
# Should return nothing

# Verify JWT strength (must be 32+ chars)
echo "your-jwt-secret" | wc -c
# Should show 33+ (includes newline)
```

### MongoDB Atlas Security

1. **Enable Cloud Backup**
   - Atlas → Project Settings → Backup
   - Enable "Cloud Backup" (free: 1 daily snapshot, 7-day retention)

2. **Review Connection Logs**
   - Atlas → Activity Feed → Filter by "Connection"
   - Look for unusual IPs or failed auth attempts

3. **Set Alert Thresholds**
   - Atlas → Alerts → Add Alert Configuration
   - Alert if: Connections > 50, CPU > 80%, Storage > 400MB

---

## Step 8: Database Maintenance

### Weekly Tasks

**Monday Morning Checks:**
1. Atlas → Metrics → Database → Check storage growth
2. Atlas → Collections → Check document counts trending
3. If storage > 400MB (80% of free tier), plan data archival

**Data Cleanup Strategy:**
```javascript
// Add to server/jobs/maintenance.js (create this file)
const cron = require('node-cron');

// Archive transactions older than 1 year (monthly)
cron.schedule('0 2 1 * *', async () => {
  const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  await Transaction.updateMany(
    { createdAt: { $lt: yearAgo }, status: 'completed' },
    { $set: { archived: true } }
  );
  console.log('Archived old transactions');
});
```

### Monthly Backups

**Export Critical Data:**
```bash
# Using mongodump (install MongoDB tools first)
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/epr_db" --out=./backups/$(date +%Y%m%d)

# Or use Atlas Export
# Atlas → Collections → Export Collection (JSON/CSV)
```

### Index Optimization

1. Atlas → Performance Advisor
2. Review slow queries ( > 100ms )
3. Create recommended indexes:
   ```javascript
   // Add to server/models setup
   db.transactions.createIndex({ franchise: 1, createdAt: -1 });
   db.shops.createIndex({ franchise: 1 });
   ```

---

## Step 9: User & Access Management

### Onboarding New Users

**Create User via API:**
```bash
curl -X POST https://epr-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "name": "Franchise Manager",
    "email": "manager@franchise.com",
    "password": "tempPassword123!",
    "role": "franchise"
  }'
```

**Password Reset Procedure:**
1. User requests reset via support
2. Admin generates temp password via direct DB update
3. Force user to change password on first login

### Role Management

| Role | Permissions |
|------|-------------|
| `owner` | Full system access, user management |
| `franchise` | Manage shops, stock, view own analytics |
| `shop` | Record sales, returns, view own data |
| `producer` | Record production, view inventory |
| `distributor` | Allocate stock, view distribution |

---

## Step 10: Update & Deployment Workflow

### Safe Update Process

**1. Staging Environment (Optional but Recommended)**
```bash
# Create staging branch
git checkout -b staging
# Update env vars to staging URLs
# Deploy to Render with "staging" service name
```

**2. Production Deploy Steps**
```bash
# Always pull latest first
git pull origin main

# Create feature branch
git checkout -b feature/new-feature

# Make changes, test locally
npm test  # if you have tests
npm run build  # verify build works

# Push and create PR
git push origin feature/new-feature
# GitHub → Create Pull Request → Review → Merge

# Render auto-deploys on main branch push
```

**3. Monitor Deploy**
- Render Dashboard → epr-backend → Events
- Check for build errors (5 min)
- Test login immediately after deploy
- Rollback if critical issues: Manual Deploy → Previous Commit

### Critical Update Checklist

Before pushing to production:
- [ ] Tested on local dev environment
- [ ] Database migrations planned (if schema changes)
- [ ] Environment variables documented
- [ ] Rollback plan ready (previous commit SHA noted)
- [ ] Team notified of maintenance window

---

## Step 11: Cost Management

### Monitor Usage (Prevent Unexpected Bills)

**Render Dashboard:**
1. Dashboard → Billing → View current usage
2. Set spending limit: Dashboard → Account Settings → Billing
   - Recommended: $10 limit for free tier users

**MongoDB Atlas:**
1. Atlas → Billing → Usage
2. Free tier limits: 512MB storage, 10GB data transfer/month
3. Alert if approaching limits

### Upgrade Path (When You Outgrow Free Tier)

| Current Limit | Bottleneck | Upgrade Option | Cost |
|---------------|------------|----------------|------|
| 15min sleep | Slow first requests | Render Starter ($7/mo) | Always on |
| 512MB RAM | Out of memory crashes | Render Starter ($7/mo) | 1GB RAM |
| 512MB DB | Cannot add more data | Atlas M10 ($10/mo) | 2GB storage |
| 100GB bandwidth | CDN needed | Cloudflare (free) | Static assets |

---

## Step 12: Disaster Recovery

### Test Monthly: Restore from Backup

**1. Export Current State**
```bash
# Quick data dump
mongodump --uri="$MONGODB_URI" --out=./emergency-backup
```

**2. Simulate Failure & Restore**
```bash
# Drop test collection (DANGER: only on test DB!)
mongo "$MONGODB_URI" --eval 'db.transactions.drop()'

# Restore from backup
mongorestore --uri="$MONGODB_URI" ./emergency-backup
```

**3. Document RTO (Recovery Time Objective)**
- Target: < 30 minutes to restore service
- Practice restore procedure quarterly

### Emergency Contacts & Procedures

Save this info in a secure location (not in repo):
```
Render Support: https://render.com/support
MongoDB Support: https://support.mongodb.com

Emergency Rollback:
1. Render Dashboard → epr-backend
2. Manual Deploy → Select previous working commit
3. Deploy takes ~3 minutes

Database Emergency:
1. Atlas → Clusters → ... → Restore
2. Select backup snapshot
3. Restore to new cluster or overwrite
```

---

## Step 13: Performance Optimization

### Quick Wins (Do These Now)

**1. Add Database Indexes**
```javascript
// server/models/Transaction.js - add inside schema
TransactionSchema.index({ franchise: 1, createdAt: -1 });  // Common query
TransactionSchema.index({ shop: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });  // For filtering
```

**2. Enable Compression**
```javascript
// server/server.js - add compression middleware
const compression = require('compression');
app.use(compression());  // Gzip responses
```
```bash
npm install compression
```

**3. Frontend Optimization**
- Build with `npm run build` generates optimized production files
- Images: Use WebP format, lazy loading
- Code splitting already handled by React

### Monitoring Performance

**Check Response Times:**
```bash
# Test API latency
curl -w "@curl-format.txt" -o /dev/null -s https://epr-backend.onrender.com/api/auth/health

# Create curl-format.txt:
# time_namelookup: %{time_namelookup}\n
# time_connect: %{time_connect}\n
# time_total: %{time_total}\n
```

Target: API responses < 500ms, page load < 3s

---

## Step 14: Long-Term Maintenance Schedule

### Weekly (Mondays, 15 min)
- [ ] Check Render service metrics
- [ ] Review MongoDB Atlas alerts
- [ ] Test login flow works

### Monthly (First Friday, 30 min)
- [ ] Review and archive old data
- [ ] Export database backup
- [ ] Check dependency updates: `npm outdated`
- [ ] Review access logs for suspicious activity

### Quarterly (Calendar reminder)
- [ ] Disaster recovery drill (restore from backup)
- [ ] Security audit (check dependencies for CVEs)
- [ ] Review and rotate API keys/JWT secrets
- [ ] Update documentation

### Annually
- [ ] Full security review
- [ ] Cost optimization analysis
- [ ] Plan for infrastructure scaling
- [ ] Update team access/roles

---

## Quick Reference: Common Commands

```bash
# Test backend locally with production env
cd server && NODE_ENV=production npm start

# Build and test frontend
cd client && npm run build && npx serve -s build

# Database operations
mongosh "$MONGODB_URI"  # Connect to Atlas
mongodump --uri="$MONGODB_URI"  # Backup
mongorestore --uri="$MONGODB_URI" ./backup  # Restore

# Git operations for deployment
git status  # Check uncommitted changes
git pull origin main  # Get latest
git checkout -b feature/x  # New feature
git push origin feature/x  # Push feature
git log --oneline -5  # View recent commits for rollback
```

---

## Support & Resources

- **Render Docs**: https://docs.render.com
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Node.js Best Practices**: https://nodejs.org/en/docs/

For urgent issues:
1. Check Render Status: https://status.render.com
2. Check MongoDB Status: https://status.mongodb.com
3. Review this troubleshooting section
4. Contact support with service logs
