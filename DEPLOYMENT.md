# Web Chat App - Deployment Guide

**Last Updated**: 2025-11-04
**Target Environment**: Production Linux Server
**MVP Status**: Localhost development complete, production deployment preparatory

---

## Overview

This guide provides instructions for deploying the Web Chat App to a production environment. The MVP was designed for localhost development, so additional security and operational considerations are documented for production use.

**Important**: Review [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md) before deploying to production, especially security limitations (#13-15).

---

## Deployment Options

### Option 1: Development/Demo Deployment (Simplest)

**Use Case**: Internal demos, development server, single-user testing

**Characteristics**:
- HTTP only (no HTTPS)
- No authentication
- Manual service management
- Direct port access (3001, 3000)

**Setup Time**: 15-30 minutes

### Option 2: Production Deployment (Recommended)

**Use Case**: Public-facing deployment, multi-user access

**Characteristics**:
- HTTPS with TLS certificate
- Nginx reverse proxy
- systemd service management
- Authentication (add-on required)
- Monitoring and logging

**Setup Time**: 2-4 hours (including security hardening)

---

## Prerequisites

### Server Requirements

**Minimum Specifications**:
- OS: Ubuntu 20.04 LTS or newer / Debian 11+ / CentOS 8+
- CPU: 2 cores (4+ recommended for LLM)
- RAM: 4GB (8GB+ recommended for LLM)
- Disk: 20GB available (more if storing conversation history)
- Network: Public IP with open ports 80, 443

**Software Dependencies**:
- Node.js 18+ (`curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -`)
- Python 3.9+ (`sudo apt install python3 python3-pip`)
- Git (`sudo apt install git`)
- nginx (`sudo apt install nginx`)
- certbot for HTTPS (`sudo apt install certbot python3-certbot-nginx`)

**Optional**:
- LMStudio (if running on same server - resource intensive)
- PM2 for process management (`npm install -g pm2`)
- Docker (if using containerized deployment)

---

## Option 1: Development/Demo Deployment

### Step 1: Clone Repository

```bash
cd /opt
sudo git clone https://github.com/your-org/web-chat-app.git
cd web-chat-app
```

### Step 2: Install Dependencies

```bash
# Backend
cd server
npm install
cp .env.example .env
# Edit .env if needed
cd ..

# Frontend
cd client
npm install
cd ..
```

### Step 3: Build Frontend

```bash
cd client
npm run build
# Creates optimized production build in client/build/
cd ..
```

### Step 4: Start Services

**Backend** (terminal 1):
```bash
cd server
PORT=3001 npm start
```

**Frontend** (terminal 2):
```bash
cd client
npx serve -s build -l 3000
```

**LMStudio** (terminal 3 or separate machine):
```bash
# Start LMStudio GUI application
# Load a model
# Start server on localhost:1234
```

### Step 5: Verify

```bash
curl http://localhost:3001/health
# Expected: {"status":"ok"}

curl http://localhost:3000
# Expected: HTML response
```

**Access**: `http://<server-ip>:3000`

---

## Option 2: Production Deployment

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs

# Install other dependencies
sudo apt install -y python3 python3-pip git nginx certbot python3-certbot-nginx

# Install PM2 for process management
sudo npm install -g pm2

# Create application user (security best practice)
sudo useradd -m -s /bin/bash chatapp
sudo usermod -aG sudo chatapp
```

### Step 2: Clone and Build Application

```bash
# Switch to application user
sudo su - chatapp

# Clone repository
cd /home/chatapp
git clone https://github.com/your-org/web-chat-app.git
cd web-chat-app

# Build backend
cd server
npm install --production
cp .env.example .env
# Edit .env (see configuration section below)
npm run build

# Build frontend
cd ../client
npm install --production
npm run build

cd /home/chatapp/web-chat-app
```

### Step 3: Configure Environment Variables

Edit `/home/chatapp/web-chat-app/server/.env`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# CORS (update after configuring domain)
CORS_ORIGIN=https://your-domain.com

# LLM Configuration
LLM_CLI_PATH=/path/to/llm_caller_cli/llm_call.py
PYTHON_PATH=/usr/bin/python3
LLM_TIMEOUT_MS=30000

# Logging (optional, if implementing)
LOG_LEVEL=info
LOG_FILE=/var/log/chatapp/app.log
```

### Step 4: Create systemd Services

**Backend Service** (`/etc/systemd/system/chatapp-backend.service`):

```ini
[Unit]
Description=Web Chat App Backend
After=network.target

[Service]
Type=simple
User=chatapp
WorkingDirectory=/home/chatapp/web-chat-app/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Frontend Service** (`/etc/systemd/system/chatapp-frontend.service`):

```ini
[Unit]
Description=Web Chat App Frontend
After=network.target

[Service]
Type=simple
User=chatapp
WorkingDirectory=/home/chatapp/web-chat-app/client
ExecStart=/usr/bin/npx serve -s build -l 3000
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Enable and Start Services**:

```bash
sudo systemctl daemon-reload
sudo systemctl enable chatapp-backend
sudo systemctl enable chatapp-frontend
sudo systemctl start chatapp-backend
sudo systemctl start chatapp-frontend

# Verify services are running
sudo systemctl status chatapp-backend
sudo systemctl status chatapp-frontend
```

### Step 5: Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/chatapp`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;

    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    # SSL certificates (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend (root)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for LLM responses
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Enable site and test**:

```bash
sudo ln -s /etc/nginx/sites-available/chatapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com
# Follow prompts to obtain Let's Encrypt certificate

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 7: Configure Firewall

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Verify
sudo ufw status
```

### Step 8: Verify Deployment

```bash
# Check services
sudo systemctl status chatapp-backend
sudo systemctl status chatapp-frontend
sudo systemctl status nginx

# Check logs
sudo journalctl -u chatapp-backend -n 50
sudo journalctl -u chatapp-frontend -n 50

# Test health endpoint
curl https://your-domain.com/health

# Access application
# Open browser to: https://your-domain.com
```

---

## Using PM2 (Alternative to systemd)

### Install PM2

```bash
sudo npm install -g pm2
```

### Create PM2 Ecosystem File

Create `ecosystem.config.js` in `/home/chatapp/web-chat-app/`:

```javascript
module.exports = {
  apps: [
    {
      name: 'chatapp-backend',
      cwd: '/home/chatapp/web-chat-app/server',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: '/var/log/chatapp/backend-error.log',
      out_file: '/var/log/chatapp/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'chatapp-frontend',
      cwd: '/home/chatapp/web-chat-app/client',
      script: 'npx',
      args: 'serve -s build -l 3000',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '200M',
      error_file: '/var/log/chatapp/frontend-error.log',
      out_file: '/var/log/chatapp/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

### Start with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/chatapp
sudo chown chatapp:chatapp /var/log/chatapp

# Start applications
pm2 start ecosystem.config.js

# Configure PM2 to start on boot
pm2 startup systemd
# Run the command PM2 outputs

pm2 save

# Monitor
pm2 status
pm2 logs
```

---

## Docker Deployment (Future)

**Note**: Docker deployment not yet implemented but can be added for easier deployment.

**Future Dockerfile structure**:
```
web-chat-app/
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── .dockerignore
```

---

## Monitoring and Logging

### Log Locations

**systemd Services**:
```bash
# Backend logs
sudo journalctl -u chatapp-backend -f

# Frontend logs
sudo journalctl -u chatapp-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**PM2 Logs**:
```bash
pm2 logs
pm2 logs chatapp-backend
pm2 logs chatapp-frontend
```

### Health Checks

**Manual Health Check**:
```bash
curl https://your-domain.com/health
# Expected: {"status":"ok"}
```

**Automated Monitoring** (recommended add-on):
- Use UptimeRobot or similar for uptime monitoring
- Configure alerts for downtime
- Monitor response times

---

## Backup and Recovery

### What to Backup

**Currently (MVP - no database)**:
- Application code: `/home/chatapp/web-chat-app/`
- Configuration: `/home/chatapp/web-chat-app/server/.env`
- Nginx config: `/etc/nginx/sites-available/chatapp`
- systemd services: `/etc/systemd/system/chatapp-*.service`

**Future (with database)**:
- Database files or SQL dumps
- User-uploaded content
- Conversation history

### Backup Script Example

```bash
#!/bin/bash
# /home/chatapp/backup.sh

BACKUP_DIR="/home/chatapp/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="chatapp-backup-$DATE.tar.gz"

mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/$BACKUP_FILE \
    /home/chatapp/web-chat-app/server/.env \
    /etc/nginx/sites-available/chatapp \
    /etc/systemd/system/chatapp-*.service

echo "Backup created: $BACKUP_DIR/$BACKUP_FILE"

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "chatapp-backup-*.tar.gz" -mtime +7 -delete
```

**Add to crontab**:
```bash
crontab -e
# Add line:
0 2 * * * /home/chatapp/backup.sh
```

---

## Updating the Application

### Production Update Process

```bash
# 1. Backup current deployment
/home/chatapp/backup.sh

# 2. Pull latest code
cd /home/chatapp/web-chat-app
git pull origin main

# 3. Rebuild backend
cd server
npm install --production
npm run build

# 4. Rebuild frontend
cd ../client
npm install --production
npm run build

# 5. Restart services (systemd)
sudo systemctl restart chatapp-backend
sudo systemctl restart chatapp-frontend

# OR restart with PM2
pm2 restart all

# 6. Verify
curl https://your-domain.com/health
```

### Zero-Downtime Updates (Future Enhancement)

For production with high availability needs:
1. Use blue-green deployment
2. Run multiple backend instances behind load balancer
3. Update instances one at a time
4. Use PM2 cluster mode

---

## Security Hardening Checklist

### Required for Production

- [ ] HTTPS with valid SSL certificate
- [ ] Firewall configured (UFW or iptables)
- [ ] Non-root user for application
- [ ] Environment variables in .env (not hardcoded)
- [ ] Security headers in nginx (X-Frame-Options, etc.)
- [ ] Nginx rate limiting configured
- [ ] SSH key-based authentication (disable password auth)
- [ ] Regular security updates (`sudo apt update && sudo apt upgrade`)
- [ ] Monitoring and alerting configured
- [ ] Backups automated and tested

### Recommended Additions

- [ ] Fail2ban for brute force protection
- [ ] WAF (Web Application Firewall) like ModSecurity
- [ ] DDoS protection (Cloudflare or similar)
- [ ] Intrusion detection (OSSEC or Wazuh)
- [ ] Log aggregation (ELK stack or similar)
- [ ] User authentication system (see KNOWN-LIMITATIONS.md #13)

---

## Troubleshooting

### Services Won't Start

**Check logs**:
```bash
sudo journalctl -u chatapp-backend -n 50
sudo journalctl -u chatapp-frontend -n 50
```

**Common issues**:
- Port already in use (check with `sudo lsof -i :3001`)
- Missing dependencies (`npm install` in service directory)
- Environment variable errors (check `.env` file)
- Permission issues (check file ownership)

### Nginx 502 Bad Gateway

**Causes**:
- Backend service not running
- Wrong port in nginx config
- Firewall blocking internal connections

**Debug**:
```bash
sudo systemctl status chatapp-backend
curl http://localhost:3001/health
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Application Slow or Unresponsive

**Check resources**:
```bash
htop  # CPU and memory usage
df -h  # Disk space
free -h  # Memory
```

**Check logs for errors**:
```bash
sudo journalctl -u chatapp-backend -n 100
pm2 logs --lines 100
```

---

## Performance Optimization

### Nginx Caching

Add to nginx config for static assets:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Gzip Compression

Already included in nginx config above. Verify:

```bash
curl -H "Accept-Encoding: gzip" -I https://your-domain.com
# Should see: Content-Encoding: gzip
```

### Load Balancing (Future)

For high-traffic scenarios:
- Run multiple backend instances
- Use nginx as load balancer
- Implement session affinity if needed

---

## Production Checklist

Before going live:

**Infrastructure**:
- [ ] Server provisioned with adequate resources
- [ ] Domain name configured and DNS pointing to server
- [ ] SSL certificate installed and auto-renewal working
- [ ] Firewall configured and tested
- [ ] Backups automated

**Application**:
- [ ] All tests passing (`npm test` in server and client)
- [ ] Environment variables configured correctly
- [ ] Services start automatically on boot
- [ ] Health check endpoint responding
- [ ] Error handling tested (LMStudio down, network errors)

**Security**:
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers configured in nginx
- [ ] Authentication implemented (if multi-user)
- [ ] Rate limiting configured
- [ ] Known limitations reviewed ([KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md))

**Monitoring**:
- [ ] Uptime monitoring configured
- [ ] Log rotation configured
- [ ] Alerts set up for downtime
- [ ] Performance baseline established

**Documentation**:
- [ ] Deployment documented
- [ ] Runbook created for common issues
- [ ] Team trained on monitoring and troubleshooting

---

## Additional Resources

- [SETUP.md](SETUP.md) - Local development setup
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md) - Security and feature limitations
- [API.md](API.md) - API documentation
- [TESTING.md](TESTING.md) - Testing guide

---

**Last Updated**: 2025-11-04
**Deployment Version**: 1.0.0 (MVP)
**Status**: Production-ready for internal/demo use. See KNOWN-LIMITATIONS.md for public deployment considerations.
