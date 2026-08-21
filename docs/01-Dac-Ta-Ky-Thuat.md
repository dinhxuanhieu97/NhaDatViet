# TÀI LIỆU ĐẶC TẢ KỸ THUẬT — CỔNG THÔNG TIN BẤT ĐỘNG SẢN

> **Mã dự án:** BDS-PORTAL
> **Phiên bản:** 1.0
> **Ngày:** 14/08/2026
> **Kiến trúc đã chốt:** Headless — Laravel API (`bds-api/`) + Next.js (`bds-web/`)
> **Quy ước đặt tên:** mọi thư mục, component, hook, kiểu dữ liệu và hằng số đều mang tiền tố `Bds`/`bds-`/`BDS_` (chi tiết ở `README.md` §1)
> **Tham chiếu nghiệp vụ:** batdongsan.com.vn

---

## MỤC LỤC

1. [Tổng quan & Phạm vi](#1-tổng-quan--phạm-vi)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Actor & Ma trận phân quyền (RBAC)](#3-actor--ma-trận-phân-quyền-rbac)
4. [Mô hình dữ liệu (ERD)](#4-mô-hình-dữ-liệu-erd)
5. [Quy tắc nghiệp vụ](#5-quy-tắc-nghiệp-vụ)
6. [Đặc tả API v1](#6-đặc-tả-api-v1)
7. [Đặc tả Frontend](#7-đặc-tả-frontend)
8. [SEO & Hiệu năng](#8-seo--hiệu-năng)
9. [Bảo mật](#9-bảo-mật)
10. [Phi chức năng & Tiêu chí nghiệm thu](#10-phi-chức-năng--tiêu-chí-nghiệm-thu)

---

## 1. TỔNG QUAN & PHẠM VI

### 1.1. Mục tiêu

Xây dựng cổng thông tin bất động sản cho phép người dùng tự đăng ký tài khoản, đăng tin rao bán/cho thuê 4 loại hình bất động sản (**Đất**, **Nhà**, **Chung cư**, **Dự án**), và người mua tìm kiếm theo nhiều tiêu chí bao gồm bản đồ.

### 1.2. Phạm vi MVP (Giai đoạn 1) — ĐÃ CHỐT

| # | Nhóm chức năng | Trạng thái |
| :-- | :--- | :--- |
| 1 | Đăng ký / Đăng nhập / Quên mật khẩu / Xác thực email | ✅ Trong MVP |
| 2 | Phân quyền RBAC (Admin, Moderator, Agent, Member) | ✅ Trong MVP |
| 3 | CRUD tin đăng 4 loại hình + upload ảnh | ✅ Trong MVP |
| 4 | Kiểm duyệt tin (duyệt / từ chối / gỡ) | ✅ Trong MVP |
| 5 | Tìm kiếm nâng cao đa tiêu chí + Full-text | ✅ Trong MVP |
| 6 | Bản đồ: chọn tọa độ khi đăng, tìm theo bán kính | ✅ Trong MVP |
| 7 | SEO on-page, sitemap, slug tiếng Việt, schema.org | ✅ Trong MVP |
| 8 | Docker, CI/CD, cache Redis | ✅ Trong MVP |

### 1.3. Ngoài phạm vi MVP (Giai đoạn 2+)

- Gói tin VIP 1/2/3, ví tiền, nạp tiền, cổng thanh toán (VNPay/MoMo)
- Chat trực tiếp môi giới ↔ khách
- App mobile
- Định giá tự động (AVM), dữ liệu lịch sử giá
- Elasticsearch (MVP dùng Full-Text Index của MySQL/PostgreSQL)

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1. Sơ đồ tổng thể

```
                        ┌──────────────────┐
        Người dùng ────▶│   Nginx (443)    │
                        └────────┬─────────┘
                    ┌────────────┴────────────┐
                    ▼                         ▼
        ┌───────────────────────┐  ┌──────────────────────┐
        │  Next.js 16 (SSR/ISR) │  │ Laravel 13 API       │
        │  yourdomain.com       │─▶│ api.yourdomain.com   │
        │  - App Router         │  │ - Sanctum (token)    │
        │  - Server Components  │  │ - spatie/permission  │
        └───────────────────────┘  └──────┬───────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
            ┌──────────────┐      ┌──────────────┐     ┌──────────────┐
            │ MySQL 8 /    │      │  Redis 7     │     │ Storage (S3  │
            │ PostgreSQL16 │      │ cache+queue  │     │ hoặc local)  │
            └──────────────┘      └──────┬───────┘     └──────────────┘
                                         │
                                  ┌──────▼────────┐
                                  │ Queue Worker  │
                                  │ resize/nén    │
                                  │ ảnh, gửi mail │
                                  └───────────────┘
```

### 2.2. Stack chi tiết

| Tầng | Công nghệ | Phiên bản | Lý do chọn |
| :--- | :--- | :--- | :--- |
| Frontend | Next.js (App Router) | 16.x | SSR/ISR → SEO tốt, Core Web Vitals cao |
| | TypeScript | 5.x | An toàn kiểu, dễ refactor |
| | Tailwind CSS | 4.x | Dựng UI nhanh, bundle nhỏ |
| | TanStack Query | 5.x | Cache/revalidate dữ liệu client |
| | Zod + React Hook Form | | Validate form đăng tin nhiều bước |
| | Leaflet + OpenStreetMap | | Bản đồ miễn phí, không cần API key |
| Backend | Laravel | 13.x (PHP 8.3+) | Ecosystem mạnh, queue/job sẵn |
| | Laravel Sanctum | 4.x | Token API đơn giản, phù hợp SPA/SSR |
| | spatie/laravel-permission | 6.x | RBAC chuẩn, hỗ trợ role + permission |
| | Intervention Image | 3.x | Resize, nén WebP, chèn watermark |
| Database | MySQL / PostgreSQL | 8.0 / 16 | Full-Text Index + index tọa độ |
| Cache/Queue | Redis | 7.x | Cache truy vấn tìm kiếm, hàng đợi ảnh |
| Hạ tầng | Docker Compose, Nginx, GitHub Actions | | Đồng nhất môi trường, CI/CD |

### 2.3. Cấu trúc thư mục dự án

```
BDS-Laravel-web/
├── bds-api/                    # Laravel 13 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/V1/
│   │   │   ├── Requests/
│   │   │   ├── Resources/
│   │   │   └── Middleware/
│   │   ├── Models/
│   │   ├── Policies/
│   │   ├── Services/
│   │   ├── Jobs/
│   │   └── Enums/
│   ├── database/migrations/
│   ├── database/seeders/
│   ├── routes/api.php
│   └── tests/Feature/
├── bds-web/                    # Next.js 16
│   ├── src/app/
│   ├── src/components/
│   ├── src/lib/
│   └── src/types/
├── docker/
├── docs/
└── .github/workflows/
```

---

## 3. ACTOR & MA TRẬN PHÂN QUYỀN (RBAC)

### 3.1. Danh sách vai trò

| Vai trò | Slug | Mô tả |
| :--- | :--- | :--- |
| Quản trị viên | `admin` | Toàn quyền hệ thống, quản lý user, cấu hình danh mục |
| Kiểm duyệt viên | `moderator` | Duyệt / từ chối / gỡ tin đăng, xem báo cáo vi phạm |
| Môi giới | `agent` | Đăng tin không giới hạn, có trang hồ sơ môi giới công khai |
| Thành viên | `member` | Đăng tin có hạn mức, lưu tin yêu thích |
| Khách | *(guest)* | Chỉ xem tin đã duyệt, tìm kiếm |

> **Quy tắc mặc định:** tài khoản đăng ký mới nhận vai trò `member`. Nâng lên `agent` do admin duyệt hoặc user tự đăng ký + xác thực số điện thoại/giấy phép.

### 3.2. Danh sách permission

```
# Tin đăng
property.viewAny          property.view
property.create           property.update.own      property.update.any
property.delete.own       property.delete.any
property.publish          property.moderate

# Người dùng
user.viewAny              user.view
user.create               user.update              user.delete
user.assignRole

# Danh mục & Địa giới
category.manage           location.manage

# Hệ thống
report.view               setting.manage
```

### 3.3. Ma trận phân quyền

| Permission | admin | moderator | agent | member | guest |
| :--- | :-: | :-: | :-: | :-: | :-: |
| `property.viewAny` (tin đã duyệt) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `property.viewAny` (mọi trạng thái) | ✅ | ✅ | ❌ | ❌ | ❌ |
| `property.create` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `property.update.own` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `property.update.any` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `property.delete.own` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `property.delete.any` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `property.moderate` (duyệt/từ chối) | ✅ | ✅ | ❌ | ❌ | ❌ |
| `user.viewAny` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `user.update` / `user.delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `user.assignRole` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `category.manage` / `location.manage` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `report.view` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `setting.manage` | ✅ | ❌ | ❌ | ❌ | ❌ |

### 3.4. Hạn mức đăng tin

| Vai trò | Tin đang hiển thị tối đa | Ảnh / tin |
| :--- | :-: | :-: |
| `member` | 5 | 10 |
| `agent` | Không giới hạn | 20 |
| `moderator` / `admin` | Không giới hạn | 20 |

Cấu hình trong `config/bds.php`, kiểm tra tại `PropertyPolicy::create()`.

---

## 4. MÔ HÌNH DỮ LIỆU (ERD)

### 4.1. Sơ đồ quan hệ

```
┌────────────────┐        ┌──────────────────┐        ┌────────────────┐
│ users          │        │ properties       │        │ categories     │
├────────────────┤        ├──────────────────┤        ├────────────────┤
│ id (PK)        │◀──────┤│ user_id (FK)     │├──────▶│ id (PK)        │
│ name           │   1:N  │ id (PK)          │  N:1   │ parent_id (FK) │
│ email (uniq)   │        │ category_id (FK) │        │ name           │
│ phone (uniq)   │        │ project_id (FK)  │        │ slug (uniq)    │
│ password       │        │ province_id (FK) │        │ type           │
│ avatar         │        │ district_id (FK) │        │ listing_type   │
│ email_verified │        │ ward_id (FK)     │        │ icon           │
│ status         │        │ title            │        │ sort_order     │
│ created_at     │        │ slug (uniq)      │        └────────────────┘
└───────┬────────┘        │ description      │
        │                 │ listing_type     │        ┌────────────────┐
        │ N:M             │ price            │        │ provinces      │
        ▼                 │ price_unit       │        ├────────────────┤
┌────────────────┐        │ area             │◀───────│ id (PK)        │
│ roles          │        │ bedrooms         │  N:1   │ name, slug     │
│ permissions    │        │ bathrooms        │        │ code           │
│ (spatie)       │        │ floors           │        └───────┬────────┘
└────────────────┘        │ direction        │                │ 1:N
                          │ legal_status     │                ▼
┌────────────────┐        │ furniture        │        ┌────────────────┐
│ property_images│        │ frontage         │        │ districts      │
├────────────────┤   1:N  │ road_width       │        ├────────────────┤
│ id (PK)        │◀───────│ address          │◀───────│ id (PK)        │
│ property_id(FK)│        │ latitude         │  N:1   │ province_id(FK)│
│ path           │        │ longitude        │        │ name, slug     │
│ path_webp      │        │ status           │        └───────┬────────┘
│ is_primary     │        │ rejection_reason │                │ 1:N
│ sort_order     │        │ published_at     │                ▼
└────────────────┘        │ expired_at       │        ┌────────────────┐
                          │ views_count      │        │ wards          │
┌────────────────┐        │ contact_name     │        ├────────────────┤
│ projects       │        │ contact_phone    │◀───────│ id (PK)        │
├────────────────┤   1:N  │ contact_email    │  N:1   │ district_id(FK)│
│ id (PK)        │◀───────│ moderated_by (FK)│        │ name, slug     │
│ name, slug     │        │ moderated_at     │        └────────────────┘
│ developer      │        │ created_at       │
│ province_id    │        │ updated_at       │        ┌────────────────┐
│ district_id    │        │ deleted_at       │        │ favorites      │
│ address        │        └────────┬─────────┘        ├────────────────┤
│ latitude       │                 │ 1:N              │ user_id (FK)   │
│ longitude      │                 └─────────────────▶│ property_id(FK)│
│ total_area     │                                    └────────────────┘
│ total_units    │        ┌──────────────────┐
│ status         │        │ property_contacts│        ┌────────────────┐
│ handover_at    │        ├──────────────────┤        │ property_reports│
└────────────────┘        │ property_id (FK) │        ├────────────────┤
                          │ name, phone      │        │ property_id(FK)│
                          │ message          │        │ reporter_id(FK)│
                          │ created_at       │        │ reason, status │
                          └──────────────────┘        └────────────────┘
```

### 4.2. Đặc tả bảng chính

#### `users`

| Cột | Kiểu | Ràng buộc | Ghi chú |
| :--- | :--- | :--- | :--- |
| id | bigint unsigned | PK, AI | |
| name | varchar(120) | NOT NULL | |
| email | varchar(150) | UNIQUE, NOT NULL | |
| phone | varchar(20) | UNIQUE, NULL | Định dạng VN |
| password | varchar(255) | NOT NULL | bcrypt |
| avatar | varchar(255) | NULL | |
| company | varchar(150) | NULL | Dành cho `agent` |
| email_verified_at | timestamp | NULL | |
| status | enum | `active`/`suspended`/`pending` | Mặc định `active` |
| remember_token, timestamps | | | |

**Index:** `email`, `phone`, `status`

#### `categories`

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | bigint unsigned PK | |
| parent_id | bigint unsigned NULL FK→categories | Cây 2 cấp |
| name | varchar(120) | VD: "Bán căn hộ chung cư" |
| slug | varchar(150) UNIQUE | |
| type | enum(`land`,`house`,`apartment`,`project`) | 4 loại hình theo yêu cầu |
| listing_type | enum(`sale`,`rent`) | Bán / Cho thuê |
| icon | varchar(100) NULL | |
| sort_order | int default 0 | |
| is_active | boolean default true | |

**Dữ liệu seed mẫu:**

```
Bán (sale)
├── Bán căn hộ chung cư     → type=apartment
├── Bán nhà riêng           → type=house
├── Bán nhà mặt phố         → type=house
├── Bán đất nền dự án       → type=land
├── Bán đất                 → type=land
└── Dự án đang mở bán       → type=project
Cho thuê (rent)
├── Cho thuê căn hộ chung cư → type=apartment
├── Cho thuê nhà riêng       → type=house
├── Cho thuê văn phòng       → type=house
└── Cho thuê đất             → type=land
```

#### `properties`

| Cột | Kiểu | Ràng buộc | Ghi chú |
| :--- | :--- | :--- | :--- |
| id | bigint unsigned | PK | |
| user_id | bigint unsigned | FK→users, CASCADE | Người đăng |
| category_id | bigint unsigned | FK→categories, RESTRICT | |
| project_id | bigint unsigned | FK→projects, NULL | Nếu thuộc dự án |
| province_id / district_id / ward_id | bigint unsigned | FK, ward NULL | |
| title | varchar(200) | NOT NULL | |
| slug | varchar(255) | UNIQUE | Slug tiếng Việt + id hậu tố |
| description | text | | |
| listing_type | enum(`sale`,`rent`) | | Đồng bộ với category |
| price | decimal(15,2) | NULL | NULL = "Thỏa thuận" |
| price_unit | enum(`total`,`per_m2`,`per_month`) | | |
| area | decimal(10,2) | NOT NULL | m² |
| bedrooms / bathrooms / floors | tinyint unsigned | NULL | |
| direction | enum 8 hướng | NULL | Đông, Tây, Nam, Bắc, ĐN, TN, ĐB, TB |
| legal_status | enum(`red_book`,`pink_book`,`sale_contract`,`waiting`,`other`) | NULL | Sổ đỏ / sổ hồng / HĐMB |
| furniture | enum(`full`,`basic`,`none`) | NULL | |
| frontage / road_width | decimal(6,2) | NULL | Mặt tiền / đường vào (m) |
| address | varchar(255) | | Địa chỉ chi tiết |
| latitude / longitude | decimal(10,7)/(10,7) | NULL | |
| status | enum(`draft`,`pending`,`published`,`rejected`,`expired`,`hidden`) | default `pending` | |
| rejection_reason | varchar(500) | NULL | |
| published_at / expired_at | timestamp | NULL | |
| views_count | int unsigned default 0 | | |
| contact_name / contact_phone / contact_email | varchar | | Có thể khác chủ tài khoản |
| moderated_by | bigint unsigned FK→users NULL | | |
| moderated_at | timestamp NULL | | |
| timestamps, deleted_at | | | Soft delete |

**Index quan trọng:**

```sql
INDEX idx_search      (status, listing_type, category_id, province_id, district_id)
INDEX idx_price_area  (price, area)
INDEX idx_geo         (latitude, longitude)
INDEX idx_published   (status, published_at DESC)
FULLTEXT idx_ft       (title, description, address)   -- MySQL
-- PostgreSQL: GIN index trên to_tsvector('simple', title||' '||description)
```

#### `property_images`

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id, property_id (FK CASCADE) | | |
| path | varchar(255) | Ảnh gốc đã resize |
| path_webp | varchar(255) NULL | Bản WebP do Queue Job tạo |
| path_thumb | varchar(255) NULL | Thumbnail 400×300 |
| is_primary | boolean default false | Ảnh đại diện |
| sort_order | int default 0 | |

#### `projects`

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id, name, slug (UNIQUE) | | |
| developer | varchar(150) | Chủ đầu tư |
| province_id / district_id | FK | |
| address, latitude, longitude | | |
| description | text | |
| total_area | decimal(12,2) NULL | ha |
| total_units | int unsigned NULL | |
| price_from / price_to | decimal(15,2) NULL | |
| status | enum(`upcoming`,`selling`,`handed_over`) | |
| handover_at | date NULL | |
| thumbnail | varchar(255) NULL | |

#### `provinces` / `districts` / `wards`

Chuẩn theo danh mục hành chính Việt Nam (mã đơn vị hành chính của Tổng cục Thống kê).

| Cột | Kiểu |
| :--- | :--- |
| id, code (UNIQUE), name, slug, type | |
| province_id (ở districts) / district_id (ở wards) | FK |

---

## 5. QUY TẮC NGHIỆP VỤ

### 5.1. Vòng đời tin đăng

```
   [Tạo mới]
       │
       ├──(lưu nháp)──▶ draft ──(gửi duyệt)──┐
       │                                     ▼
       └──(gửi duyệt)──────────────────▶ pending
                                             │
                        ┌────────────────────┼────────────────────┐
                        │ moderator duyệt    │ moderator từ chối  │
                        ▼                    │                    ▼
                   published                 │               rejected
                        │                    │                    │
        ┌───────────────┼──────────┐         │        (user sửa)  │
        │ hết hạn       │ user ẩn  │         └────────────────────┘
        ▼               ▼          │
    expired          hidden ───────┘
```

**Quy tắc chuyển trạng thái:**

| Từ | Đến | Ai được phép | Điều kiện |
| :--- | :--- | :--- | :--- |
| — | `draft` | Chủ tin | |
| `draft`/`rejected` | `pending` | Chủ tin | Đủ trường bắt buộc + ≥1 ảnh |
| `pending` | `published` | moderator, admin | Set `published_at=now()`, `expired_at=now()+30 ngày` |
| `pending` | `rejected` | moderator, admin | Bắt buộc nhập `rejection_reason` |
| `published` | `hidden` | Chủ tin, admin | |
| `published` | `expired` | Hệ thống (cron hằng ngày) | `expired_at < now()` |
| `published` | `pending` | Chủ tin (khi sửa nội dung trọng yếu) | Sửa giá/diện tích/địa chỉ → duyệt lại |

**Trường bắt buộc để gửi duyệt:** `title`, `description` (≥50 ký tự), `category_id`, `listing_type`, `area`, `province_id`, `district_id`, `address`, `contact_phone`, ≥1 ảnh.

### 5.2. Quy tắc theo loại hình

| Loại hình | Trường bắt buộc thêm | Trường ẩn |
| :--- | :--- | :--- |
| **Đất** (`land`) | `frontage`, `road_width`, `legal_status` | `bedrooms`, `bathrooms`, `floors`, `furniture` |
| **Nhà** (`house`) | `bedrooms`, `bathrooms`, `floors`, `legal_status` | — |
| **Chung cư** (`apartment`) | `bedrooms`, `bathrooms`, `furniture`, `project_id` | `frontage`, `road_width` |
| **Dự án** (`project`) | `project_id` | `bedrooms`, `bathrooms` |

Validate động phía backend (`StorePropertyRequest::rules()` đọc `category.type`) và phía frontend (Zod discriminated union).

### 5.3. Sinh slug

```
slug = Str::slug( unaccent(title) ) . '-' . id
VD: "Bán nhà mặt phố Nguyễn Trãi 80m²" → "ban-nha-mat-pho-nguyen-trai-80m2-1234"
```

Slug sinh sau khi có `id` (observer `Property::created`), đảm bảo không trùng và ổn định với SEO.

### 5.4. Chống spam & lạm dụng

- Rate limit: `10 tin / user / ngày`, `60 request/phút` cho API công khai.
- Kiểm tra trùng: cùng user + cùng `address` + chênh giá <5% trong 7 ngày → cảnh báo.
- Tin bị report ≥3 lần → tự động chuyển `hidden` + thông báo moderator.
- Số điện thoại trong `description` bị lọc và thay bằng ô "Hiện số".

### 5.5. Xử lý ảnh (Queue Job)

```
Upload → validate (jpg/png/webp, ≤5MB, ≤20 ảnh)
       → lưu bản gốc tạm
       → dispatch ProcessPropertyImage
            ├── resize max 1600×1200 (giữ tỷ lệ)
            ├── chèn watermark góc phải dưới (opacity 40%)
            ├── xuất WebP quality 82
            ├── xuất thumbnail 400×300
            └── xóa file tạm, cập nhật property_images
```

---

## 6. ĐẶC TẢ API V1

**Base URL:** `https://api.yourdomain.com/api/v1`
**Xác thực:** `Authorization: Bearer <sanctum_token>`
**Định dạng lỗi chuẩn:**

```json
{
  "message": "Dữ liệu không hợp lệ.",
  "errors": { "email": ["Email đã được sử dụng."] }
}
```

### 6.1. Auth

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| POST | `/auth/register` | guest | Đăng ký. Body: `name, email, phone, password, password_confirmation` |
| POST | `/auth/login` | guest | Đăng nhập → trả `token` + `user` |
| POST | `/auth/logout` | auth | Thu hồi token hiện tại |
| GET | `/auth/me` | auth | Thông tin user + roles + permissions |
| PUT | `/auth/profile` | auth | Cập nhật hồ sơ. Body: `name?, phone?, company?, avatar?, social_tiktok?, social_youtube?, social_instagram?` — 3 field `social_*` là kênh mạng xã hội cấp hồ sơ (áp dụng mọi tin của người này, khác `contact_zalo`/`contact_facebook` trên từng tin, xem §4.31 CLAUDE.md), nullable + phải là URL hợp lệ nếu có, gửi `''` để xóa link (tự đổi thành `null`) |
| PUT | `/auth/password` | auth | Đổi mật khẩu. Body: `current_password, password, password_confirmation, keep_current_session?` — `keep_current_session=true` chỉ đăng xuất thiết bị khác, giữ phiên hiện tại; mặc định (`false`/không gửi) đăng xuất toàn bộ kể cả phiên đang dùng. Response kèm `logged_out: boolean` |
| POST | `/auth/forgot-password` | guest | Gửi mail reset |
| POST | `/auth/reset-password` | guest | Đặt lại mật khẩu bằng token |
| POST | `/auth/email/verify/{id}/{hash}` | auth | Xác thực email |
| GET | `/auth/social/{provider}/redirect` | guest | `provider` = `google`\|`facebook`. Điều hướng cả trang (không phải fetch) sang trang đăng nhập của provider |
| GET | `/auth/social/{provider}/callback` | guest | Provider gọi lại sau khi người dùng đồng ý; tìm/tạo user rồi redirect trình duyệt về `{BDS_WEB_ORIGIN}/dang-nhap/mang-xa-hoi?token=...` (hoặc `?error=...`) |

**Ví dụ `POST /auth/login` → 200:**

```json
{
  "token": "12|Xy8s...",
  "user": {
    "id": 5, "name": "Nguyễn Văn A", "email": "a@example.com",
    "roles": ["member"],
    "permissions": ["property.create", "property.update.own", "..."]
  }
}
```

### 6.2. Danh mục & Địa giới hành chính

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| GET | `/categories` | public | Cây danh mục. Query: `listing_type`, `type` |
| GET | `/provinces` | public | Danh sách tỉnh/thành |
| GET | `/provinces/{id}/districts` | public | Quận/huyện theo tỉnh |
| GET | `/districts/{id}/wards` | public | Phường/xã theo quận |
| POST/PUT/DELETE | `/admin/categories/{id?}` | `category.manage` | CRUD danh mục |

### 6.3. Tin đăng (public)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/properties` | Danh sách tin đã duyệt + bộ lọc. Cache theo bộ filter+trang, TTL 120s, tự invalidate ngay khi có tin đổi trạng thái (`App\Support\PropertyListingCache`, xem CLAUDE.md §4.25) |
| GET | `/properties/{slug}` | Chi tiết tin (tăng `views_count`, chống đếm trùng theo user/IP qua cache — `App\Support\PropertyViewCounter`, xem CLAUDE.md §4.26); `contact_phone` bị che (`maskPhone()`) trừ chủ tin/kiểm duyệt viên. `contact_zalo`/`contact_facebook` không bị che (kênh công khai người đăng chủ động cung cấp). `user.social_tiktok`/`social_youtube`/`social_instagram` — kênh mạng xã hội cấp hồ sơ người đăng, `null` nếu chưa điền (xem §4.31 CLAUDE.md) |
| GET | `/properties/{slug}/similar` | Tối đa 8 tin cùng khu vực + loại hình, dùng cho khối "Bất động sản tương tự" ở trang chi tiết |
| GET | `/properties/{slug}/reveal-phone` | Trả số điện thoại thật (không che), throttle `20/60s`. Chỉ gọi khi người dùng chủ động bấm gọi/Zalo — không nhúng sẵn số thật vào response chi tiết để hạn chế bot quét |
| POST | `/properties/{id}/contact` | Gửi liên hệ cho người đăng |
| POST | `/properties/{id}/report` | Báo cáo tin vi phạm |

**Tham số lọc `GET /properties`:**

| Param | Kiểu | Ví dụ |
| :--- | :--- | :--- |
| `q` | string | `nhà mặt phố` (full-text) |
| `listing_type` | `sale`\|`rent` | `sale` |
| `category_id` | int | `3` |
| `type` | `land`\|`house`\|`apartment`\|`project` | `apartment` |
| `province_id`, `district_id`, `ward_id` | int | `1` |
| `price_min`, `price_max` | number | `1000000000` |
| `area_min`, `area_max` | number | `50` |
| `bedrooms` | int | `2` (≥2) |
| `direction` | string | `dong-nam` |
| `legal_status` | string | `red_book` |
| `project_id` | int | `7` |
| `lat`, `lng`, `radius` | float, km | `21.02,105.85,5` |
| `sort` | `newest`\|`price_asc`\|`price_desc`\|`area_desc`\|`relevance` | `newest` |
| `per_page` | int (max 50) | `20` |

**Response 200:**

```json
{
  "data": [{
    "id": 1234,
    "title": "Bán nhà mặt phố Nguyễn Trãi 80m²",
    "slug": "ban-nha-mat-pho-nguyen-trai-80m2-1234",
    "listing_type": "sale",
    "price": 8500000000,
    "price_text": "8,5 tỷ",
    "area": 80,
    "price_per_m2_text": "106,25 tr/m²",
    "bedrooms": 4, "bathrooms": 3,
    "address": "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    "latitude": 21.0021, "longitude": 105.8000,
    "primary_image": "https://.../thumb/abc.webp",
    "category": { "id": 3, "name": "Bán nhà mặt phố", "type": "house" },
    "published_at": "2026-08-10T08:00:00Z",
    "user": { "id": 5, "name": "Nguyễn Văn A", "phone": "09xxxxx678" }
  }],
  "links": { "first": "...", "next": "..." },
  "meta": { "current_page": 1, "last_page": 12, "per_page": 20, "total": 235 }
}
```

### 6.4. Tin đăng (người dùng đã đăng nhập)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| GET | `/my/properties` | auth | Tin của tôi, lọc theo `status` |
| POST | `/my/properties` | `property.create` | Tạo tin (mặc định `pending`, hoặc `draft`) |
| GET | `/my/properties/{id}` | chủ tin | Chi tiết để sửa |
| PUT | `/my/properties/{id}` | `property.update.own` | Cập nhật |
| DELETE | `/my/properties/{id}` | `property.delete.own` | Xóa mềm |
| POST | `/my/properties/{id}/images` | chủ tin | Upload ảnh (multipart, tối đa 20) |
| DELETE | `/my/properties/{id}/images/{imageId}` | chủ tin | Xóa ảnh |
| PUT | `/my/properties/{id}/images/order` | chủ tin | Sắp xếp / đặt ảnh đại diện |
| POST | `/my/properties/{id}/submit` | chủ tin | Gửi duyệt (`draft`→`pending`) |
| POST | `/my/properties/{id}/toggle-visibility` | chủ tin | `published` ↔ `hidden` |
| GET | `/my/favorites` | auth | Tin đã lưu |
| POST/DELETE | `/my/favorites/{propertyId}` | auth | Lưu / bỏ lưu |

### 6.5. Kiểm duyệt & Quản trị

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| GET | `/admin/properties` | `property.moderate` | Mọi tin, lọc theo `status` |
| POST | `/admin/properties/{id}/approve` | `property.moderate` | Duyệt tin |
| POST | `/admin/properties/{id}/reject` | `property.moderate` | Từ chối, body: `reason` |
| DELETE | `/admin/properties/{id}` | `property.delete.any` | Gỡ tin |
| GET | `/admin/users` | `user.viewAny` | Danh sách user |
| PUT | `/admin/users/{id}` | `user.update` | Cập nhật (kể cả `status`) |
| POST | `/admin/users/{id}/roles` | `user.assignRole` | Gán vai trò |
| GET | `/admin/stats` | `report.view` | Thống kê tổng quan |
| GET | `/admin/reports` | `report.view` | Danh sách tin bị báo cáo |

### 6.6. Mã lỗi

| HTTP | Ý nghĩa |
| :-: | :--- |
| 200 / 201 | Thành công |
| 204 | Xóa thành công |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không đủ quyền |
| 404 | Không tìm thấy |
| 422 | Dữ liệu không hợp lệ |
| 429 | Vượt rate limit |

---

## 7. ĐẶC TẢ FRONTEND

### 7.1. Sơ đồ trang (Route map)

| Route | Render | Mô tả |
| :--- | :--- | :--- |
| `/` | ISR 300s | Trang chủ: search box, danh mục, tin nổi bật, dự án |
| `/nha-dat-ban` | SSR | Listing bán + bộ lọc trên URL |
| `/nha-dat-cho-thue` | SSR | Listing cho thuê |
| `/{category-slug}` | SSR | Listing theo danh mục |
| `/{category-slug}/{province-slug}` | SSR | Listing theo danh mục + tỉnh (SEO local) |
| `/bat-dong-san/{slug}` | ISR 60s | Chi tiết tin |
| `/du-an` , `/du-an/{slug}` | ISR | Danh sách / chi tiết dự án |
| `/tim-kiem-ban-do` | CSR | Tìm kiếm dạng bản đồ |
| `/dang-nhap`, `/dang-ky`, `/quen-mat-khau` | CSR | Auth |
| `/quan-ly` | CSR (protected) | Dashboard: tổng quan |
| `/quan-ly/tin-dang` | CSR | Danh sách tin của tôi |
| `/quan-ly/tin-dang/tao` | CSR | Form đăng tin nhiều bước |
| `/quan-ly/tin-dang/{id}/sua` | CSR | Sửa tin |
| `/quan-ly/yeu-thich` | CSR | Tin đã lưu |
| `/quan-ly/ho-so` | CSR | Hồ sơ cá nhân |
| `/quan-tri/**` | CSR (role admin/moderator) | Duyệt tin, quản lý user, danh mục |

### 7.2. Form đăng tin nhiều bước

```
Bước 1: Loại hình & Nhu cầu
  → Nhu cầu (Bán / Cho thuê) → Loại BĐS (Đất/Nhà/Chung cư/Dự án) → Danh mục con

Bước 2: Địa chỉ & Bản đồ
  → Tỉnh/Thành → Quận/Huyện → Phường/Xã → Địa chỉ chi tiết
  → Ghim vị trí trên bản đồ (Leaflet, tự geocode từ địa chỉ)

Bước 3: Thông tin bất động sản  (trường hiển thị động theo loại hình)
  → Diện tích, Giá, Đơn vị giá, Phòng ngủ, WC, Số tầng,
    Hướng, Pháp lý, Nội thất, Mặt tiền, Đường vào

Bước 4: Tiêu đề & Mô tả
  → Tiêu đề (30–200 ký tự), Mô tả (≥50 ký tự), gợi ý mẫu mô tả

Bước 5: Hình ảnh
  → Kéo thả tối đa 20 ảnh, chọn ảnh đại diện, sắp xếp thứ tự

Bước 6: Thông tin liên hệ & Xem trước
  → Tên, SĐT, Email liên hệ → Preview → [Lưu nháp] / [Gửi duyệt]
```

Trạng thái form lưu vào `localStorage` theo `draftKey` để không mất dữ liệu khi reload. Validate từng bước bằng Zod trước khi cho sang bước kế.

### 7.3. Component chính

```
components/
├── layout/          Header, Footer, MobileNav, UserMenu
├── search/          SearchBar, FilterPanel, PriceRangeSlider,
│                    AreaRangeSlider, LocationSelect, SortSelect
├── property/        PropertyCard, PropertyGrid, PropertyGallery,
│                    PropertyDetail, PropertyMeta, ContactBox, ShareButtons
├── map/             MapView, MapMarker, LocationPicker, RadiusCircle
├── form/            PropertyWizard, Step1..Step6, ImageUploader, RichEditor
├── dashboard/       StatsCard, PropertyTable, StatusBadge
└── ui/              Button, Input, Select, Modal, Toast, Pagination, Skeleton
```

---

## 8. SEO & HIỆU NĂNG

### 8.1. SEO on-page

| Hạng mục | Triển khai |
| :--- | :--- |
| Title / Description động | `generateMetadata()` từng route |
| URL thân thiện | Slug tiếng Việt không dấu, không tham số ID lộ liễu |
| Open Graph / Twitter Card | Ảnh đại diện tin, giá, diện tích |
| Structured Data | JSON-LD `RealEstateListing`, `Product` + `Offer`, `BreadcrumbList`, `Organization` |
| Sitemap | `sitemap.xml` chia nhóm (`/sitemap-properties-1.xml`, `-projects`, `-categories`), tự sinh bằng `next-sitemap` hoặc route handler |
| robots.txt | Chặn `/quan-ly`, `/quan-tri`, `/api` |
| Canonical | Mọi trang listing có canonical loại bỏ tham số phân trang thừa |
| Breadcrumb | Trang chi tiết: Trang chủ → Danh mục → Tỉnh → Quận → Tin |
| Nội dung trùng | Trang lọc quá sâu (≥3 filter) → `noindex, follow` |
| Ảnh | `next/image`, `alt` sinh từ tiêu đề + địa chỉ, lazy load, WebP |

**Mẫu JSON-LD trang chi tiết:**

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "Bán nhà mặt phố Nguyễn Trãi 80m²",
  "url": "https://yourdomain.com/bat-dong-san/ban-nha-mat-pho-nguyen-trai-80m2-1234",
  "datePosted": "2026-08-10",
  "image": ["https://.../abc.webp"],
  "offers": { "@type": "Offer", "price": 8500000000, "priceCurrency": "VND" },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Nguyễn Trãi",
    "addressLocality": "Thanh Xuân",
    "addressRegion": "Hà Nội",
    "addressCountry": "VN"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 21.0021, "longitude": 105.8 },
  "floorSize": { "@type": "QuantitativeValue", "value": 80, "unitCode": "MTK" },
  "numberOfRooms": 4
}
```

### 8.2. Hiệu năng

| Hạng mục | Giải pháp | Mục tiêu |
| :--- | :--- | :--- |
| Trang chủ / danh mục | ISR 300s + Redis cache API 60s | TTFB < 300ms |
| Chi tiết tin | ISR 60s, revalidate on-demand khi tin đổi | LCP < 2.0s |
| Truy vấn listing | Index composite + `select` cột cần thiết, tránh N+1 (`with()`) | < 100ms |
| Đếm lượt xem | Ghi vào Redis, flush xuống DB mỗi 5 phút | Không khóa bảng |
| Ảnh | WebP + thumbnail, CDN, `loading="lazy"` | CLS < 0.1 |
| Danh mục / địa giới | Cache Redis vĩnh viễn, xóa khi admin sửa | — |
| Tìm kiếm bản đồ | Giới hạn bounding box, trả tối đa 300 marker | < 500ms |

**Mục tiêu Core Web Vitals:** LCP < 2.5s, INP < 200ms, CLS < 0.1 (mobile, P75).

---

## 9. BẢO MẬT

| Rủi ro | Biện pháp |
| :--- | :--- |
| Truy cập trái phép tài nguyên | Laravel Policy trên mọi action (`PropertyPolicy`), không tin `user_id` từ client |
| Leo thang đặc quyền | Permission kiểm tra ở middleware + policy, role gán chỉ bởi `admin` |
| SQL Injection | Eloquent / query builder có binding, không nối chuỗi |
| XSS | Frontend escape mặc định; mô tả người dùng lọc bằng HTML Purifier trước khi lưu |
| CSRF | API dùng Bearer token (stateless); cookie session chỉ dùng cho web route |
| Brute-force login | `throttle:5,1` trên `/auth/login`, khóa tạm 15 phút sau 10 lần sai |
| Upload độc hại | Validate MIME thật (không tin extension), lưu ngoài webroot, đổi tên ngẫu nhiên, không cho `.php` |
| Lộ thông tin cá nhân | SĐT che một phần (`09xxxxx678`) cho guest, hiện đầy đủ khi bấm "Hiện số" (có rate limit) |
| Rate limit API | 60 req/phút cho public, 120 cho auth |
| Header bảo mật | HSTS, X-Frame-Options, X-Content-Type-Options, CSP |
| Secrets | `.env` không commit, dùng GitHub Secrets cho CI |
| HTTPS | Bắt buộc, Let's Encrypt tự gia hạn |

---

## 10. PHI CHỨC NĂNG & TIÊU CHÍ NGHIỆM THU

### 10.1. Yêu cầu phi chức năng

| Hạng mục | Yêu cầu |
| :--- | :--- |
| Khả dụng | ≥ 99.5% / tháng |
| Tải đồng thời | 500 CCU không suy giảm > 20% thời gian phản hồi |
| Dung lượng | 100.000 tin đăng, 2 triệu ảnh trong 12 tháng đầu |
| Sao lưu | DB backup hằng ngày, giữ 30 ngày; ảnh sync sang object storage |
| Trình duyệt | Chrome/Edge/Safari/Firefox 2 phiên bản gần nhất; iOS Safari 15+ |
| Responsive | 360px → 1920px |
| Ngôn ngữ | Tiếng Việt (chuẩn bị i18n cho tiếng Anh giai đoạn 2) |
| Log | Laravel log + request-id, giữ 14 ngày |

### 10.2. Definition of Done (áp dụng cho mọi task)

- [ ] Code chạy được, không lỗi lint (`pint` cho PHP, `eslint` cho TS)
- [ ] Có Feature Test cho mọi endpoint mới; `php artisan test` xanh 100%
- [ ] `npm run build` frontend không lỗi type
- [ ] Đã thử thủ công luồng người dùng liên quan
- [ ] Cập nhật tài liệu API nếu endpoint thay đổi
- [ ] Commit message rõ ràng, đã push

### 10.3. Tiêu chí nghiệm thu MVP

| # | Kịch bản | Kỳ vọng |
| :-: | :--- | :--- |
| 1 | Khách đăng ký tài khoản mới | Nhận vai trò `member`, đăng nhập được |
| 2 | Member đăng 1 tin bán nhà kèm 5 ảnh | Tin ở trạng thái `pending`, ảnh có WebP + watermark |
| 3 | Member sửa tin của người khác | HTTP 403 |
| 4 | Moderator duyệt tin | Tin `published`, hiện ở trang chủ và tìm kiếm |
| 5 | Moderator từ chối không nhập lý do | HTTP 422 |
| 6 | Khách tìm "chung cư Quận 12 TP.HCM, 2 phòng ngủ, 2–3 tỷ" | Kết quả đúng bộ lọc, phân trang chính xác |
| 7 | Khách tìm trong bán kính 5km quanh một điểm (Quận 12) | Chỉ trả tin trong bán kính |
| 8 | Member vượt hạn mức 5 tin | HTTP 403 kèm thông báo nâng cấp `agent` |
| 9 | Trang chi tiết tin | Có JSON-LD, canonical, OG image; Lighthouse SEO ≥ 95 |
| 10 | Tin quá hạn 30 ngày | Cron chuyển sang `expired`, biến mất khỏi listing |

---

*Hết tài liệu đặc tả kỹ thuật.*
