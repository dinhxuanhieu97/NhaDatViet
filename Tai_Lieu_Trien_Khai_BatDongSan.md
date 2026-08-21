# TÀI LIỆU TRIỂN KHAI HỆ THỐNG CỔNG THÔNG TIN BẤT ĐỘNG SẢN

## 1. Thông tin chung
- **Kiến trúc:** Headless (Decoupled)
- **Backend API:** Laravel 11.x (PHP 8.3)
- **Frontend:** Next.js 14+ (App Router, React 18)
- **Cơ sở dữ liệu:** PostgreSQL 16 hoặc MySQL 8.0
- **Web Server:** Nginx

## 2. Yêu cầu máy chủ (Prerequisites)
* Ubuntu 22.04 LTS trở lên.
* RAM tối thiểu: 4GB (Khuyến nghị 8GB cho production).
* Node.js >= 18.x (Quản lý qua nvm).
* PHP >= 8.2 (Cài đặt các extension: bcmath, ctype, fileinfo, json, mbstring, openssl, pdo, tokenizer, xml, curl).
* Composer 2.x.
* Cơ sở dữ liệu: PostgreSQL / MySQL.
* Redis Server (dùng cho Queue Job xử lý ảnh, cache).
* PM2 (Quản lý process Next.js) và Supervisor (Quản lý queue Laravel).

## 3. Các bước triển khai Backend (Laravel)

### Bước 1: Clone mã nguồn
```bash
cd /var/www/
git clone <repository_backend_url> backend-bds
cd backend-bds
```

### Bước 2: Cài đặt Dependencies
```bash
composer install --optimize-autoloader --no-dev
```

### Bước 3: Cấu hình môi trường (.env)
```bash
cp .env.example .env
php artisan key:generate
```
*Cập nhật file `.env`:*
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=pgsql # hoặc mysql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=bds_db
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
```

### Bước 4: Chạy Migration và Link Storage
```bash
php artisan migrate --force
php artisan storage:link
```

### Bước 5: Cấu hình Supervisor cho Queue (Xử lý upload ảnh)
Tạo file `/etc/supervisor/conf.d/laravel-worker.conf`:
```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/backend-bds/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/backend-bds/worker.log
stopwaitsecs=3600
```
Khởi động supervisor: 
```bash
sudo supervisorctl reread 
sudo supervisorctl update 
sudo supervisorctl start laravel-worker:*
```

## 4. Các bước triển khai Frontend (Next.js)

### Bước 1: Clone và Cài đặt
```bash
cd /var/www/
git clone <repository_frontend_url> frontend-bds
cd frontend-bds
npm install # hoặc yarn install
```

### Bước 2: Cấu hình môi trường (.env.local)
Tạo file `.env.local` ở thư mục gốc Next.js:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_IMAGE_URL=https://api.yourdomain.com/storage
```

### Bước 3: Build Project
```bash
npm run build
```

### Bước 4: Chạy production với PM2
```bash
npm install -g pm2
pm2 start npm --name "frontend-bds" -- run start
pm2 save
pm2 startup
```

## 5. Cấu hình Nginx (Reverse Proxy)

### Cấu hình Backend (api.yourdomain.com)
Tạo file `/etc/nginx/sites-available/api.yourdomain.com`:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/backend-bds/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock; # Chú ý version PHP
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### Cấu hình Frontend (yourdomain.com)
Tạo file `/etc/nginx/sites-available/yourdomain.com`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*Kích hoạt Nginx config và restart:*
```bash
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Bảo trì & Cập nhật hệ thống (CI/CD cơ bản)
Để cập nhật hệ thống sau này mà không gián đoạn (Zero-downtime cơ bản):

**Đối với Backend:**
```bash
cd /var/www/backend-bds
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize:clear
sudo supervisorctl restart laravel-worker:*
```

**Đối với Frontend:**
```bash
cd /var/www/frontend-bds
git pull origin main
npm install
npm run build
pm2 restart frontend-bds
```
