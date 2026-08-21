# Khởi chạy dự án trên máy bạn (macOS)

Mình không tự chạy được project trực tiếp trên máy bạn — cầu nối `remote-devices` chỉ có quyền
đọc/ghi file, không có mạng để tải package (composer/npm) hay pull image Docker. Bạn cần mở
**Terminal thật** trên máy (không phải qua Cowork) và chạy các lệnh dưới đây. Toàn bộ code mới
nhất (đã sửa 3 lỗi: `/du-an` 500, ảnh không hiện, cache tỉnh/thành hỏng) đã được đồng bộ vào
`~/Downloads/BDS-Laravel-web`.

## 0. Kiểm tra công cụ cần có

```bash
php -v && composer -V && node -v && npm -v
```

Thiếu cái nào thì cài qua Homebrew:

```bash
brew install php composer node
```

## 1. Chạy Backend (Laravel API — cổng 8000)

```bash
cd ~/Downloads/BDS-Laravel-web/bds-api
composer install
touch database/database.sqlite
php artisan migrate:fresh --seed
php artisan storage:link      # BẮT BUỘC — thiếu bước này thì mọi ảnh upload/thumbnail 404
php artisan serve --port=8000
```

Để cửa sổ Terminal này chạy (không đóng). Test nhanh ở tab khác:
`curl http://127.0.0.1:8000/api/v1/properties` phải trả JSON.

### 1b. Xử lý ảnh nền — mở **thêm một Terminal tab/cửa sổ mới**

```bash
cd ~/Downloads/BDS-Laravel-web/bds-api
php artisan queue:work
```

Ảnh upload (resize/nén WebP/watermark) chạy qua hàng đợi (`QUEUE_CONNECTION=database`) —
**không có lệnh này thì ảnh đứng mãi ở trạng thái "Đang tối ưu…"** và không hiển thị được, kể
cả khi đã có `storage:link`. Để cửa sổ này chạy song song, không đóng.

## 2. Chạy Frontend (Next.js — cổng 3000), mở **Terminal tab/cửa sổ mới**

```bash
cd ~/Downloads/BDS-Laravel-web/bds-web
npm install
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

## 3. Tài khoản demo (sau khi seed)

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| Admin | admin@bds.local | password |
| Kiểm duyệt | moderator@bds.local | password |
| Môi giới (agent) | agent@bds.local | password |
| Thành viên (member) | member@bds.local | password |

## 4. Nếu muốn mình lái Chrome cho bạn xem trực tiếp

Sau khi bước 1–2 chạy xong trên máy bạn (server ở `localhost`, không phải trong sandbox của
mình), báo lại — lúc đó Chrome trên máy bạn kết nối được tới `localhost:3000`, mình dùng
claude-in-chrome điều khiển được thật.

## Việc khác cần làm sau (không chặn việc chạy demo)

- `docker-compose.yml` ở thư mục gốc dùng để triển khai production đầy đủ (MySQL, Redis,
  Nginx, queue worker) — xem `docs/03-Trien-Khai-Production.md`. Không cần cho chạy thử local.
- Bộ ảnh demo (13 ảnh chụp từ sandbox) đã gửi ở tin nhắn trước — dùng để xem trước khi cần
  chờ máy bạn cài xong.
