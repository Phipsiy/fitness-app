# Deployment Guide

## Prerequisites

- Node.js 18+ and npm installed on the server
- A Linux server (Ubuntu 20.04+ recommended)

---

## Option 1: `npm run preview` (Quick)

1. Clone or copy the project to your server.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the production bundle:
   ```bash
   npm run build
   ```
4. Run the preview server (binds to port 4173 by default):
   ```bash
   npm run preview -- --host 0.0.0.0 --port 4173
   ```
5. Open `http://<your-server-ip>:4173` in your browser.

To keep it running after logout, use `pm2` or `screen`:
```bash
npx pm2 start "npm run preview -- --host 0.0.0.0" --name fitness-app
```

---

## Option 2: nginx (Production)

### 1. Build

```bash
npm install
npm run build
# Output is in the `dist/` folder
```

### 2. Copy dist to server

```bash
scp -r dist/ user@your-server:/var/www/fitness-app
```

### 3. Install nginx

```bash
sudo apt update && sudo apt install -y nginx
```

### 4. Create nginx config

```nginx
# /etc/nginx/sites-available/fitness-app
server {
    listen 80;
    server_name your-domain.com;   # or _ for any domain

    root /var/www/fitness-app;
    index index.html;

    # Handle React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|svg|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

### 5. Enable and start

```bash
sudo ln -s /etc/nginx/sites-available/fitness-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. HTTPS with Certbot (optional but recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment

No environment variables are required. All data is stored in the browser's `localStorage`.
