# HƯỚNG DẪN TRIỂN KHAI PRODUCTION — DỰ ÁN BDS

> Áp dụng cho hai thành phần: **bds-api** (Laravel) và **bds-web** (Next.js).
> Giả định domain: `yourdomain.com` (web) và `api.yourdomain.com` (API).

---

## 1. Yêu cầu máy chủ

| Hạng mục | Tối thiểu | Khuyến nghị |
| :--- | :--- | :--- |
| Hệ điều hành | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU / RAM | 2 vCPU / 4 GB | 4 vCPU / 8 GB |
| Ổ đĩa | 60 GB SSD | 160 GB SSD (ảnh tin đăng chiếm nhiều nhất) |
| PHP | 8.3 | 8.3 + OPcache |
| Node.js | 22.x | 22.x LTS (qua nvm) |
| CSDL | MySQL 8.0 | MySQL 8.0 hoặc PostgreSQL 16 |
| Khác | Nginx, Redis 7, Composer 2, Supervisor, Certbot | |

**Extension PHP bắt buộc:** `bcmath ctype curl exif fileinfo gd intl mbstring openssl pdo pdo_mysql redis tokenizer xml zip`

```bash
sudo apt update && sudo apt install -y \
  nginx redis-server supervisor certbot python3-certbot-nginx \
  php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl \
  php8.3-zip php8.3-gd php8.3-intl php8.3-bcmath php8.3-redis
```

---

## 2. Triển khai bds-api

### 2.1. Lấy mã nguồn và cài đặt

```bash
sudo mkdir -p /var/www && cd /var/www
sudo git clone <repo_url> bds
sudo chown -R $USER:www-data /var/www/bds

cd /var/www/bds/bds-api
composer install --no-dev --optimize-autoloader --no-interaction
```

### 2.2. Cấu hình `.env`

```bash
cp .env.example .env
php artisan key:generate
```

```env
APP_NAME="Nhà Đất Việt"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
BDS_WEB_ORIGIN=https://yourdomain.com

APP_LOCALE=vi
APP_FALLBACK_LOCALE=vi

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bds_db
DB_USERNAME=bds_user
DB_PASSWORD=<mật_khẩu_mạnh>

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_HOST=127.0.0.1

FILESYSTEM_DISK=public

MAIL_MAILER=smtp
MAIL_HOST=<smtp_host>
MAIL_PORT=587
MAIL_USERNAME=<user>
MAIL_PASSWORD=<pass>
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="no-reply@yourdomain.com"

LOG_CHANNEL=daily
LOG_LEVEL=warning
```

### 2.3. Khởi tạo dữ liệu và tối ưu

```bash
php artisan migrate --force
php artisan storage:link

# Chỉ chạy lần đầu — tạo vai trò, quyền, danh mục, địa giới
php artisan db:seed --class=RolePermissionSeeder --force
php artisan db:seed --class=CategorySeeder --force
php artisan db:seed --class=LocationSeeder --force

# Cache cấu hình cho production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### 2.4. Phân quyền thư mục

```bash
sudo chown -R www-data:www-data /var/www/bds/bds-api/storage \
                                 /var/www/bds/bds-api/bootstrap/cache
sudo chmod -R 775 /var/www/bds/bds-api/storage \
                  /var/www/bds/bds-api/bootstrap/cache
```

### 2.5. Supervisor — worker xử lý ảnh & email

Tạo `/etc/supervisor/conf.d/bds-api-queue.conf`:

```ini
[program:bds-api-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/bds/bds-api/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600 --timeout=120
directory=/var/www/bds/bds-api
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/log/bds/bds-api-queue.log
stopwaitsecs=3600
```

```bash
sudo mkdir -p /var/log/bds && sudo chown www-data:www-data /var/log/bds
sudo supervisorctl reread && sudo supervisorctl update
sudo supervisorctl start bds-api-queue:*
sudo supervisorctl status bds-api-queue:*
```

### 2.6. Cron — hết hạn tin đăng

```bash
sudo crontab -u www-data -e
```

```cron
* * * * * cd /var/www/bds/bds-api && php artisan schedule:run >> /dev/null 2>&1
```

Lịch đã khai báo trong `routes/console.php`:

| Lệnh | Thời điểm | Tác dụng |
| :--- | :--- | :--- |
| `bds:expire-properties` | 01:00 hằng ngày | Chuyển tin quá `expired_at` sang trạng thái `expired` |
| `sanctum:prune-expired` | hằng ngày | Dọn token API hết hạn |

---

## 3. Triển khai bds-web

```bash
cd /var/www/bds/bds-web

cat > .env.production <<'EOF'
NEXT_PUBLIC_BDS_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_BDS_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_BDS_IMAGE_HOST=api.yourdomain.com
EOF

npm ci
npm run build
```

`next.config.ts` bật `output: 'standalone'` để image Docker gọn. Hệ quả: **`next start` KHÔNG dùng được** — Next sẽ báo
`"next start" does not work with "output: standalone" configuration`.
Phải chạy `server.js` trong thư mục standalone, và copy sẵn `static/` + `public/` vào cạnh nó:

```bash
# Sau mỗi lần build: nạp asset tĩnh vào bundle standalone
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

sudo npm install -g pm2
pm2 start .next/standalone/server.js --name bds-web
pm2 save
pm2 startup   # chạy lệnh được in ra
```

> **Lưu ý 1:** biến `NEXT_PUBLIC_*` được nhúng vào bundle lúc build. Đổi giá trị bắt buộc phải `npm run build` lại, không chỉ restart PM2.
>
> **Lưu ý 2:** quên bước `cp -r .next/static ...` thì trang vẫn trả 200 nhưng mất toàn bộ CSS/JS — lỗi im lặng, rất dễ bỏ sót khi deploy.

---

## 4. Cấu hình Nginx

### 4.1. API — `/etc/nginx/sites-available/bds-api`

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/bds/bds-api/public;
    index index.php;

    charset utf-8;
    client_max_body_size 60M;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location /storage/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location ~ ^/index\.php(/|$) {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        fastcgi_read_timeout 120;
    }

    location ~ \.php$ { return 404; }
    location ~ /\.(?!well-known).* { deny all; }

    access_log /var/log/nginx/bds-api-access.log;
    error_log  /var/log/nginx/bds-api-error.log;
}
```

### 4.2. Web — `/etc/nginx/sites-available/bds-web`

```nginx
# Gộp www về non-www để tránh nội dung trùng lặp (ảnh hưởng SEO).
server {
    listen 80;
    server_name www.yourdomain.com;
    return 301 https://yourdomain.com$request_uri;
}

server {
    listen 80;
    server_name yourdomain.com;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml image/svg+xml;
    gzip_min_length 1024;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/bds-web-access.log;
    error_log  /var/log/nginx/bds-web-error.log;
}
```

### 4.3. Kích hoạt và cấp SSL

```bash
sudo ln -s /etc/nginx/sites-available/bds-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/bds-web /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
sudo systemctl status certbot.timer   # tự gia hạn
```

Sau khi có SSL, thêm HSTS vào cả hai server block:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 5. Quy trình cập nhật (zero-downtime cơ bản)

Tạo `/var/www/bds/deploy-bds.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /var/www/bds
git pull origin main

# --- bds-api ---
cd bds-api
php artisan down --retry=15
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
sudo supervisorctl restart bds-api-queue:*
php artisan up

# --- bds-web ---
cd ../bds-web
npm ci
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
pm2 restart bds-web

echo "Đã cập nhật BDS lúc $(date '+%d/%m/%Y %H:%M:%S')"
```

```bash
chmod +x /var/www/bds/deploy-bds.sh
```

---

## 6. Sao lưu

### 6.1. Cơ sở dữ liệu — `/usr/local/bin/bds-backup-db.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR=/var/backups/bds
DATE=$(date +%Y%m%d-%H%M)
mkdir -p "$BACKUP_DIR"

mysqldump --single-transaction --quick --routines \
  -u bds_user -p"$BDS_DB_PASSWORD" bds_db \
  | gzip > "$BACKUP_DIR/bds_db-$DATE.sql.gz"

# Giữ 30 ngày gần nhất
find "$BACKUP_DIR" -name 'bds_db-*.sql.gz' -mtime +30 -delete
```

```cron
0 2 * * * BDS_DB_PASSWORD='<pass>' /usr/local/bin/bds-backup-db.sh
```

### 6.2. Ảnh tin đăng

```cron
30 2 * * * rclone sync /var/www/bds/bds-api/storage/app/public remote:bds-storage
```

---

## 7. Giám sát & vận hành

| Hạng mục | Lệnh / Công cụ |
| :--- | :--- |
| Health check API | `curl -f https://api.yourdomain.com/up` |
| Trạng thái queue | `sudo supervisorctl status bds-api-queue:*` |
| Job thất bại | `php artisan queue:failed` · thử lại: `php artisan queue:retry all` |
| Log ứng dụng | `tail -f /var/www/bds/bds-api/storage/logs/laravel-*.log` |
| Log worker | `tail -f /var/log/bds/bds-api-queue.log` |
| Trạng thái web | `pm2 status` · `pm2 logs bds-web` |
| Uptime | UptimeRobot / Better Stack trỏ tới `/up` và trang chủ |

**Log rotation** — `/etc/logrotate.d/bds`:

```
/var/log/bds/*.log /var/www/bds/bds-api/storage/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    su www-data www-data
}
```

---

## 8. Danh sách kiểm tra trước khi go-live

- [ ] `APP_DEBUG=false`, `APP_ENV=production`
- [ ] `.env` không nằm trong git, quyền `600`
- [ ] Đã đổi mật khẩu 4 tài khoản seed mặc định (hoặc xóa nếu không dùng)
- [ ] `BDS_WEB_ORIGIN` khớp domain thật (CORS)
- [ ] HTTPS hoạt động, HTTP tự chuyển hướng sang HTTPS
- [ ] Header bảo mật: HSTS, X-Frame-Options, X-Content-Type-Options
- [ ] `php artisan config:cache route:cache view:cache` đã chạy
- [ ] Supervisor worker chạy, thử upload ảnh thấy bản WebP được sinh
- [ ] Cron `schedule:run` hoạt động (kiểm tra `php artisan schedule:list`)
- [ ] Backup DB chạy được, đã thử khôi phục ít nhất 1 lần
- [ ] `sitemap.xml` và `robots.txt` trả về đúng domain production
- [ ] Đã khai báo site trong Google Search Console và nộp sitemap
- [ ] Lighthouse mobile: SEO ≥ 95, Performance ≥ 90
- [ ] Đã chạy đủ 10 kịch bản nghiệm thu trong `docs/01-Dac-Ta-Ky-Thuat.md` §10.3
