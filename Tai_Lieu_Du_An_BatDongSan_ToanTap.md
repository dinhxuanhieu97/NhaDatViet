# TÀI LIỆU ĐẶC TẢ VÀ TRIỂN KHAI DỰ ÁN CỔNG THÔNG TIN BẤT ĐỘNG SẢN

Tài liệu này bao gồm toàn bộ 4 mục cốt lõi của dự án: Kiến trúc hệ thống, Phân hệ chức năng, Danh sách Tech Task và Hướng dẫn triển khai.

---

## 1. Đề xuất Công nghệ & Kiến trúc Hệ thống

Để xây dựng một trang web bất động sản chịu tải tốt, tối ưu cực kỳ mạnh mẽ cho **SEO** (yếu tố sống còn của ngành BĐS) và dễ dàng bảo trì, mô hình **Decoupled Architecture (Headless)** được áp dụng:

*   **Frontend (User Facing):** **Next.js 14+ (App Router) + TypeScript + Tailwind CSS**
    *   *Lý do:* Hỗ trợ Server-Side Rendering (SSR) và Incremental Static Regeneration (ISR) giúp các trang chi tiết dự án/tin đăng index Google cực nhanh. Tối ưu Core Web Vitals tốt hơn hẳn React thuần (SPA).
*   **Backend API (Core Services):** **Laravel 11 (PHP 8.3) + Laravel Sanctum**
    *   *Lý do:* Cung cấp hệ sinh thái phong phú, xử lý nghiệp vụ nhanh, quản lý phân quyền (RBAC) mạnh mẽ với `spatie/laravel-permission`, tối ưu xử lý queue/job cho việc upload/nén ảnh hàng loạt.
*   **Database:** **PostgreSQL 16 hoặc MySQL 8.0**
    *   *Lý do:* Hỗ trợ tốt các kiểu dữ liệu phức tạp, Full-Text Search cho việc tìm kiếm từ khóa BĐS, và khả năng đánh index không gian địa lý (Spatial Indexing) cho tính năng tìm kiếm theo bản đồ/khu vực.
*   **Caching & Queue:** **Redis**

---

## 2. Phân hệ Chức năng (Modules)

Hệ thống được chia thành 4 phân hệ chính:

| Phân hệ | Chức năng chính | Mô tả chi tiết |
| :--- | :--- | :--- |
| **1. Public Frontend** | Trang chủ, Tìm kiếm nâng cao, Chi tiết tin đăng, Trang dự án | Bộ lọc đa tiêu chí (vùng miền, giá, diện tích, hướng, dự án), bản đồ vệ tinh, chia sẻ tin, liên hệ môi giới. |
| **2. User Account & Dashboard** | Đăng ký/Đăng nhập, Quản lý tin đăng, Ví tiền/Nạp tiền, Đổi mật khẩu | User tự đăng ký tài khoản, phân loại gói tin (Tin thường, Tin VIP 1/2/3), nạp tiền thanh toán đẩy tin. |
| **3. Post Management (CMS User)**| Tạo/Sửa/Xóa tin đăng (Đất, Nhà, Chung cư, Dự án), Quản lý ảnh | Form đa bước (Step-by-step) nhập thông tin BĐS, upload nhiều ảnh kèm watermark tự động, chọn tọa độ bản đồ. |
| **4. Admin / Moderator** | Duyệt tin, Quản lý user, Cấu hình danh mục, Báo cáo thống kê | Kiểm duyệt nội dung trước khi lên sóng, quản lý giao dịch nạp tiền, phân quyền nhân sự kiểm duyệt. |

---

## 3. Tech Task Breakdown (Bảng Phân rã Công việc)

### Epic 1: Khởi tạo hệ thống & Thiết lập cơ sở dữ liệu
*   **TASK-101:** Khởi tạo repository, cấu hình Docker & Docker Compose (Nginx, PHP 8.3, PostgreSQL, Redis).
*   **TASK-102:** Thiết kế Database Schema (Migrations) cho Users, Roles, Permissions, Categories, Properties, Images, Transactions, Projects.
*   **TASK-103:** Cấu hình Authentication trên Laravel sử dụng Laravel Sanctum kèm cơ chế Refresh Token và RBAC.

### Epic 2: Phát triển Backend API
*   **TASK-201:** Xây dựng API Đăng ký, Đăng nhập, Quên mật khẩu, Xác thực Email/OTP.
*   **TASK-202:** Xây dựng CRUD API cho Danh mục (Loại BĐS) và Địa hành chính (Tỉnh/Thành, Quận/Huyện, Phường/Xã).
*   **TASK-203:** Xây dựng API Quản lý Tin đăng (Tạo, Sửa, Xóa, Đổi trạng thái, Đẩy tin) kèm middleware bảo mật.
*   **TASK-204:** Xây dựng hệ thống Upload ảnh tối ưu hóa (Resize tự động, nén WebP, chèn Watermark qua Queue Job).
*   **TASK-205:** Xây dựng API Tìm kiếm & Bộ lọc nâng cao (Full-Text Search, bán kính tọa độ).

### Epic 3: Phát triển Frontend (Next.js App Router)
*   **TASK-301:** Thiết lập Next.js project, Tailwind CSS, Axios/TanStack Query, Zustand (State Management).
*   **TASK-302:** Xây dựng Trang chủ (Home) với Thanh tìm kiếm nhanh, Dự án nổi bật, Tin đăng mới nhất.
*   **TASK-303:** Xây dựng Trang Danh sách & Tìm kiếm (Listing Page) kết hợp bộ lọc động trên URL Search Params.
*   **TASK-304:** Xây dựng Trang Chi tiết Bất động sản với Gallery ảnh/video, bản đồ vị trí và form liên hệ.
*   **TASK-305:** Xây dựng Trang Quản lý cá nhân (User Dashboard) và Form đăng tin nhiều bước (Multi-step form) có validate bằng Zod.

### Epic 4: Kiểm thử, Tối ưu & Triển khai
*   **TASK-401:** Tối ưu SEO On-page trên Next.js (Dynamic Metadata, Open Graph tags, Sitemap.xml tự động).
*   **TASK-402:** Viết Unit Test/Feature Test cho các API cốt lõi.
*   **TASK-403:** Thiết lập CI/CD pipeline tự động deploy.

---

## 4. Tài liệu Triển khai Chi tiết

### 4.1. Yêu cầu máy chủ (Prerequisites)
* Ubuntu 22.04 LTS.
* Node.js >= 18.x, PHP >= 8.2, Composer 2.x.
* PostgreSQL / MySQL, Redis Server, Nginx, PM2, Supervisor.

### 4.2. Triển khai Backend (Laravel)
```bash
# Clone & Install
cd /var/www/
git clone <repository_backend_url> backend-bds
cd backend-bds
composer install --optimize-autoloader --no-dev

# Cấu hình Môi trường & Database
cp .env.example .env
php artisan key:generate
# (Chỉnh sửa file .env kết nối database, redis)

# Chạy Migration & Queue Storage
php artisan migrate --force
php artisan storage:link
```
**Cấu hình Supervisor (Xử lý ảnh ngầm):**
Tạo file `/etc/supervisor/conf.d/laravel-worker.conf`:
```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/backend-bds/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/backend-bds/worker.log
```
Chạy Supervisor: `sudo supervisorctl update && sudo supervisorctl start laravel-worker:*`

### 4.3. Triển khai Frontend (Next.js)
```bash
cd /var/www/
git clone <repository_frontend_url> frontend-bds
cd frontend-bds
npm install

# Cấu hình .env.local
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1

npm run build
pm2 start npm --name "frontend-bds" -- run start
pm2 save
pm2 startup
```

### 4.4. Cấu hình Nginx (Reverse Proxy)
**Backend (api.yourdomain.com):**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/backend-bds/public;
    index index.php;

    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

**Frontend (yourdomain.com):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
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
