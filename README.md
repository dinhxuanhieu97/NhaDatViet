# BDS — Cổng thông tin Bất động sản

Hệ thống mua bán / cho thuê bất động sản theo kiến trúc **Headless**: API Laravel + giao diện Next.js.

| Thành phần | Thư mục | Công nghệ | Cổng (dev) |
| :--- | :--- | :--- | :-- |
| API | `bds-api/` | Laravel 13, PHP 8.3, Sanctum, spatie/laravel-permission | 8000 |
| Web | `bds-web/` | Next.js 16 (App Router), TypeScript, Tailwind 4, TanStack Query | 3000 |
| CSDL | — | MySQL 8 (dev/prod) · SQLite in-memory (test) | 3306 |
| Cache/Queue | — | Redis 7 | 6379 |
| Mail dev | — | Mailpit | 8025 |

---

## 1. Quy ước đặt tên

Toàn bộ mã nguồn dùng tiền tố **`Bds` / `bds-`** để mọi định danh gắn với dự án, tránh tên chung chung khó truy vết khi review:

| Loại | Quy ước | Ví dụ |
| :--- | :--- | :--- |
| Thư mục gốc | `bds-<vai-trò>` | `bds-api`, `bds-web` |
| Thư mục component | `bds-<miền>` | `bds-property/`, `bds-post-wizard/`, `bds-map/` |
| Component React | `Bds<Tên>` | `BdsPropertyCard`, `BdsPostWizard`, `BdsFilterPanel` |
| Hook | `useBds<Tên>` | `useBdsAuth`, `useBdsProvinces`, `useBdsMapMarkers` |
| Kiểu dữ liệu | `Bds<Tên>` | `BdsProperty`, `BdsUser`, `BdsPaginated<T>` |
| Module lib | `bds-<chức-năng>.ts` | `bds-api-client.ts`, `bds-server-api.ts`, `bds-format.ts` |
| Hằng số | `BDS_<TÊN>` | `BDS_API_URL`, `BDS_WIZARD_STEPS` |
| Biến môi trường web | `NEXT_PUBLIC_BDS_*` | `NEXT_PUBLIC_BDS_API_URL` |
| Config Laravel | `config/bds.php` | `config('bds.post_limits')` |
| Artisan command | `bds:<hành-động>` | `php artisan bds:expire-properties` |
| Query key | `['bds', '<miền>', …]` | `['bds', 'my-properties', status]` |

---

## 2. Chạy nhanh bằng Docker

```bash
docker compose up -d --build

# Lần đầu: khởi tạo ứng dụng
docker compose exec bds-api-php composer install
docker compose exec bds-api-php cp .env.example .env
docker compose exec bds-api-php php artisan key:generate
docker compose exec bds-api-php php artisan migrate --seed
docker compose exec bds-api-php php artisan storage:link
```

- Web: <http://localhost:3000>
- API: <http://localhost:8000/api/v1/properties>
- Mailpit: <http://localhost:8025>

## 3. Chạy thủ công (không Docker)

### bds-api

```bash
cd bds-api
composer install
cp .env.example .env
php artisan key:generate

# Dev nhanh với SQLite
touch database/database.sqlite
# .env: DB_CONNECTION=sqlite

php artisan migrate --seed
php artisan storage:link
php artisan serve --port=8000

# Cửa sổ khác — xử lý ảnh và email nền
php artisan queue:work
```

### bds-web

```bash
cd bds-web
npm install
cp .env.example .env.local     # chỉnh NEXT_PUBLIC_BDS_API_URL nếu cần
npm run dev                    # http://localhost:3000
```

---

## 4. Tài khoản mẫu (sau khi seed)

| Email | Mật khẩu | Vai trò | Quyền chính |
| :--- | :--- | :--- | :--- |
| `admin@bds.local` | `password` | admin | Toàn quyền |
| `moderator@bds.local` | `password` | moderator | Duyệt / từ chối tin |
| `agent@bds.local` | `password` | agent | Đăng tin không giới hạn |
| `member@bds.local` | `password` | member | Đăng tối đa 5 tin |

Seed tạo sẵn **46 tin đăng** và **4 dự án** có thật, toàn bộ nằm trong khu vực Quận 12, TP.HCM với toạ độ trong khung địa lý thực tế nên tìm theo bán kính cho kết quả hợp lý.

---

## 5. Kiểm thử & chất lượng

```bash
# bds-api
cd bds-api
php artisan test            # 92 test, 269 assertion
./vendor/bin/pint --test    # code style

# bds-web
cd bds-web
npx tsc --noEmit
npx eslint src --max-warnings=0
npm run build
```

CI (`.github/workflows/bds-ci.yml`) chạy toàn bộ các lệnh trên, kèm bước migrate thật trên MySQL 8 để phát hiện sớm schema không tương thích.

---

## 6. Cấu trúc thư mục

```
BDS-Laravel-web/
├── bds-api/                        # Laravel API
│   ├── app/
│   │   ├── Enums/                  # PropertyStatus, PropertyType, ListingType, UserRole
│   │   ├── Http/Controllers/Api/V1/
│   │   │   └── Admin/              # Kiểm duyệt, quản lý user, thống kê
│   │   ├── Http/Requests/          # StorePropertyRequest, SearchPropertyRequest…
│   │   ├── Http/Resources/         # PropertyResource, UserResource…
│   │   ├── Jobs/                   # ProcessPropertyImage
│   │   ├── Models/                 # Property, Category, Province…
│   │   ├── Policies/               # PropertyPolicy, UserPolicy
│   │   ├── Services/               # PropertyRuleResolver, PropertySearchService
│   │   └── Support/                # VietnameseText (bỏ dấu, slug)
│   ├── config/bds.php              # Hạn mức tin/ảnh, xử lý ảnh, bản đồ
│   ├── database/migrations|seeders|factories/
│   └── tests/Feature|Unit/
│
├── bds-web/                        # Next.js
│   ├── src/app/                    # Route theo tiếng Việt: /nha-dat-ban, /quan-ly…
│   ├── src/components/
│   │   ├── bds-auth/  bds-dashboard/  bds-layout/
│   │   ├── bds-map/   bds-post-wizard/
│   │   └── bds-property/  bds-search/
│   ├── src/lib/                    # bds-api-client, bds-server-api, bds-queries…
│   └── src/types/bds.ts
│
├── docker/                         # Dockerfile PHP, cấu hình Nginx
├── docs/                           # Đặc tả kỹ thuật, kế hoạch triển khai
└── .github/workflows/bds-ci.yml
```

---

## 7. Tài liệu

| Tệp | Nội dung |
| :--- | :--- |
| `docs/01-Dac-Ta-Ky-Thuat.md` | Kiến trúc, ERD, ma trận phân quyền, đặc tả API, quy tắc nghiệp vụ, SEO, bảo mật, tiêu chí nghiệm thu |
| `docs/02-Ke-Hoach-Trien-Khai.md` | WBS, ước lượng effort, 5 sprint, phân công, rủi ro, chi phí hạ tầng |
| `docs/03-Trien-Khai-Production.md` | Hướng dẫn deploy production, Nginx, SSL, Supervisor, backup |

---

## 8. Điểm cần lưu ý khi phát triển tiếp

- **Địa giới hành chính**: từ 01/7/2025 Việt Nam **bỏ cấp quận/huyện** (Nghị quyết 1685/NQ-UBTVQH15). Bảng `districts` được giữ lại làm **cấp khu vực tìm kiếm** (tên quận cũ), đánh dấu bằng cột `districts.is_legacy` — địa chỉ pháp lý của tin đăng là *phường + tỉnh/thành*. Hiện chỉ seed TP.HCM — khu vực **Quận 12** với đủ **5 phường mới** (Đông Hưng Thuận, Trung Mỹ Tây, Tân Thới Hiệp, Thới An, An Phú Đông). Gò Vấp (6 phường), Bình Thạnh (5), Thủ Đức (13) đã đối chiếu xong nghị quyết và để sẵn ở `TODO` trong `LocationSeeder` — bổ sung sau. Cố ý **không** seed tỉnh/thành khác vì dữ liệu quận/huyện cũ đã bị bãi bỏ; `LocationDataTest` sẽ đỏ nếu ai đó thêm lại.
- **Tìm kiếm**: MVP dùng cột `search_text` (đã bỏ dấu) + `LIKE`, kèm FULLTEXT index trên MySQL. Khi vượt ~100.000 tin, chuyển sang Meilisearch/Elasticsearch — điểm thay đổi gói gọn trong `PropertySearchService`.
- **Watermark**: đã bật. File mặc định `bds-api/resources/images/bds-watermark.png`, chèn góc phải dưới, tự co giãn bằng 22% bề rộng ảnh, bỏ qua ảnh hẹp dưới 600px (thumbnail). Đổi logo thì thay file đó hoặc trỏ `config('bds.image.watermark_path')` sang file khác. Lưu ý: tham số `watermark_opacity` là **float 0–1** theo API Intervention Image v4, không phải phần trăm.
- **Gói tin VIP / thanh toán**: nằm ngoài phạm vi MVP, xem lộ trình Giai đoạn 2 ở `docs/02-Ke-Hoach-Trien-Khai.md`.
# NhaDatViet
