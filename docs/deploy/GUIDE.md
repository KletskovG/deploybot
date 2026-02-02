# Deployment Guide

Automated deployment using GitHub Actions + Watchtower + Docker Compose.

## Architecture

```
GitHub Release → GitHub Actions → ghcr.io Registry → Watchtower → Docker Container
```

## How It Works

1. Create a release in GitHub UI
2. GitHub Actions builds and pushes Docker image to `ghcr.io`
3. Watchtower monitors registry every 5 minutes
4. Watchtower pulls new image and restarts container automatically
5. Zero-downtime deployment with health checks

## Prerequisites

- VPS with Docker and Docker Compose installed
- GitHub account
- Repository: `https://github.com/KletskovG/deploybot`

---

## Initial Setup

### Step 1: Configure GitHub Actions (Already Done)

The workflow file is at `.github/workflows/release.yml` and automatically:
- Builds Docker image on each release
- Pushes to GitHub Container Registry
- Tags with version numbers and `latest`

### Step 2: Choose Image Visibility

**Option A: Public Image (Simpler)**

Make the image public so no authentication is needed:

1. Go to: `https://github.com/users/KletskovG/packages`
2. Find `deploybot` package
3. Package Settings → Change visibility → Public

Skip to Step 4 if using public images.

**Option B: Private Image (More Secure)**

Keep image private and authenticate on VPS (recommended for production).

### Step 3: Authenticate VPS (For Private Images Only)

**3.1. Create GitHub Personal Access Token**

1. Go to: `https://github.com/settings/tokens`
2. Click "Generate new token (classic)"
3. Token name: `deploybot-vps`
4. Expiration: `No expiration` or `1 year`
5. Scopes: Check `read:packages`
6. Click "Generate token"
7. **Copy the token** (you won't see it again)

**3.2. Login on VPS**

```bash
# SSH to your VPS
ssh user@your-vps-ip

# Login to GitHub Container Registry
docker login ghcr.io -u YOUR_GITHUB_USERNAME

# Paste your token when prompted for password
# This creates /root/.docker/config.json with credentials
```

**3.3. Enable Auth in docker-compose.yml**

Edit `/deployment/docker/docker-compose.yml` and uncomment the line:

```yaml
watchtower:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - /root/.docker/config.json:/config.json:ro  # Uncomment this line
```

### Step 4: Deploy on VPS

**4.1. Clone Repository (if not already done)**

```bash
cd /home/d91580433832
git clone https://github.com/KletskovG/deploybot.git
cd deploybot
```

**4.2. Configure Environment Variables**

```bash
# Create/edit environment file
nano deployment/docker/deploybot.env
```

Add your configuration:

```env
BOT_TOKEN=your_telegram_bot_token
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
# Add other required vars
```

**4.3. Initial Deployment**

```bash
cd /home/d91580433832/deploybot

# Pull latest image
docker compose -f deployment/docker/docker-compose.yml pull

# Start services
docker compose -f deployment/docker/docker-compose.yml up -d

# Check status
docker compose -f deployment/docker/docker-compose.yml ps

# View logs
docker compose -f deployment/docker/docker-compose.yml logs -f
```

**Or use Makefile commands:**

```bash
make docker-pull
make docker-up
make docker-logs
```

### Step 5: Verify Deployment

**Check containers are running:**

```bash
docker ps
```

You should see:
- `deploybot` - Your application
- `deploybot-watchtower` - Auto-updater

**Check application health:**

```bash
curl http://localhost:3000/health
```

**Monitor Watchtower logs:**

```bash
docker logs deploybot-watchtower -f
```

---

## Creating Releases

### Method 1: GitHub UI (Recommended)

1. Go to: `https://github.com/KletskovG/deploybot/releases`
2. Click "Draft a new release"
3. Click "Choose a tag" → Create new tag (e.g., `v1.0.0`)
4. Release title: `v1.0.0` or descriptive name
5. Describe changes
6. Click "Publish release"

### Method 2: GitHub CLI

```bash
# Install gh CLI (if not installed)
# https://cli.github.com/

# Create release
gh release create v1.0.0 --title "v1.0.0" --notes "Release notes here"
```

### Method 3: Git Tags + Push

```bash
# Create and push tag
git tag v1.0.0
git push origin v1.0.0

# Then create release from tag in GitHub UI
```

---

## Deployment Timeline

After publishing a release:

1. **0 sec:** GitHub Actions starts building
2. **1-3 min:** Image built and pushed to registry
3. **3-8 min:** Watchtower detects new image (polls every 5 min)
4. **8-9 min:** Watchtower pulls image and restarts container
5. **Done:** New version running

**Total time:** ~5-10 minutes

---

## Manual Operations

### Pull Latest Image Manually

```bash
cd /home/d91580433832/deploybot
make docker-update
```

Or:

```bash
docker compose -f deployment/docker/docker-compose.yml pull
docker compose -f deployment/docker/docker-compose.yml up -d
```

### Restart Containers

```bash
make docker-restart
```

### View Logs

```bash
# All logs
make docker-logs

# Only deploybot logs
docker logs deploybot -f

# Only watchtower logs
docker logs deploybot-watchtower -f
```

### Stop Services

```bash
make docker-down
```

### Check Container Status

```bash
make docker-ps
```

---

## Troubleshooting

### Watchtower Not Pulling Updates

**Check Watchtower logs:**

```bash
docker logs deploybot-watchtower --tail 100
```

**Common issues:**

1. **Authentication failed (private images)**
   ```bash
   # Re-login to registry
   docker login ghcr.io -u YOUR_USERNAME
   
   # Restart watchtower
   docker restart deploybot-watchtower
   ```

2. **Image not found**
   - Verify image exists: `https://github.com/users/KletskovG/packages`
   - Check image name matches in `docker-compose.yml`

3. **Polling interval too long**
   - Default: 5 minutes
   - Adjust in `docker-compose.yml`: `WATCHTOWER_POLL_INTERVAL=60` (seconds)

### Application Not Starting

**Check logs:**

```bash
docker logs deploybot --tail 100
```

**Common issues:**

1. **Environment variables missing**
   - Check `deployment/docker/deploybot.env`
   - Verify all required vars are set

2. **Port already in use**
   ```bash
   # Check what's using port 3000
   sudo lsof -i :3000
   
   # Change port in docker-compose.yml if needed
   ```

3. **Memory limit reached**
   - Increase in `docker-compose.yml`: `mem_limit: 1g`

### Force Immediate Update

```bash
# Trigger watchtower to check now
docker restart deploybot-watchtower

# Or pull manually
docker compose -f deployment/docker/docker-compose.yml pull deploybot
docker compose -f deployment/docker/docker-compose.yml up -d deploybot
```

---

## Configuration Reference

### Watchtower Environment Variables

Current settings in `docker-compose.yml`:

- `WATCHTOWER_CLEANUP=true` - Remove old images after update
- `WATCHTOWER_POLL_INTERVAL=300` - Check every 5 minutes (300 seconds)
- `WATCHTOWER_LABEL_ENABLE=true` - Only update labeled containers
- `WATCHTOWER_INCLUDE_RESTARTING=true` - Update containers being restarted
- `WATCHTOWER_ROLLING_RESTART=true` - Restart one at a time

**Optional settings:**

```yaml
# Update once and exit (run-once mode)
- WATCHTOWER_RUN_ONCE=true

# Check more frequently (60 seconds)
- WATCHTOWER_POLL_INTERVAL=60

# Notify on updates (Slack, Email, etc)
- WATCHTOWER_NOTIFICATION_URL=slack://token@channel

# Update on specific schedule (cron format)
- WATCHTOWER_SCHEDULE=0 0 4 * * *  # 4 AM daily
```

### Docker Compose Commands

```bash
# Start services
docker compose -f deployment/docker/docker-compose.yml up -d

# Stop services
docker compose -f deployment/docker/docker-compose.yml down

# View logs
docker compose -f deployment/docker/docker-compose.yml logs -f

# Pull latest images
docker compose -f deployment/docker/docker-compose.yml pull

# Restart specific service
docker compose -f deployment/docker/docker-compose.yml restart deploybot

# View running containers
docker compose -f deployment/docker/docker-compose.yml ps
```

---

## Security Best Practices

1. **Keep image private** if it contains any sensitive data
2. **Use read-only token** (`read:packages` scope only)
3. **Rotate tokens** periodically
4. **Use `.env` file** for secrets, never commit to git
5. **Limit container resources** (CPU, memory)
6. **Monitor logs** for suspicious activity
7. **Keep Docker updated** on VPS

---

## Rollback Procedure

If a release has issues:

### Option 1: Deploy Previous Version

```bash
# Pull specific version
docker pull ghcr.io/kletskovg/deploybot:v1.0.0

# Update docker-compose.yml temporarily
# Change image: ghcr.io/kletskovg/deploybot:v1.0.0

# Restart
docker compose -f deployment/docker/docker-compose.yml up -d
```

### Option 2: Re-release Previous Version

1. Create new release with old code
2. Wait for automatic deployment

---

## Maintenance

### Clean Up Old Images

```bash
# Remove unused images
docker image prune -a

# View image sizes
docker images
```

### Update Watchtower

```bash
docker compose -f deployment/docker/docker-compose.yml pull watchtower
docker compose -f deployment/docker/docker-compose.yml up -d watchtower
```

### Backup Configuration

```bash
# Backup env file
cp deployment/docker/deploybot.env deploybot.env.backup

# Backup docker auth
cp /root/.docker/config.json config.json.backup
```

---

## Quick Reference

### First Time Setup

```bash
# 1. Clone repo
git clone https://github.com/KletskovG/deploybot.git
cd deploybot

# 2. Configure environment
nano deployment/docker/deploybot.env

# 3. Login to registry (if private)
docker login ghcr.io -u YOUR_USERNAME

# 4. Deploy
make docker-pull
make docker-up
```

### Deploy New Version

```bash
# Create release in GitHub UI
# Wait 5-10 minutes
# Done!
```

### Manual Update

```bash
make docker-update
```

### View Logs

```bash
make docker-logs
```

### Restart

```bash
make docker-restart
```

---

## Support

For issues or questions:

- GitHub Issues: `https://github.com/KletskovG/deploybot/issues`
- Watchtower Docs: `https://containrrr.dev/watchtower/`
- Docker Compose Docs: `https://docs.docker.com/compose/`
