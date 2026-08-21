# KẾ HOẠCH TRIỂN KHAI DỰ ÁN — CỔNG THÔNG TIN BẤT ĐỘNG SẢN

> **Phiên bản:** 1.0 · **Ngày:** 14/08/2026
> **Phạm vi:** MVP đã chốt — Auth + RBAC + Đăng tin + Duyệt tin · Tìm kiếm nâng cao + Bản đồ · SEO + Hiệu năng + CI/CD

---

## 1. TỔNG QUAN KẾ HOẠCH

| Chỉ số | Giá trị |
| :--- | :--- |
| Tổng thời lượng | **10 tuần** (5 sprint × 2 tuần) |
| Tổng effort ước tính | **≈ 268 man-hours** |
| Quy mô nhóm đề xuất | 1 Backend, 1 Frontend, 0.5 QA, 0.5 DevOps |
| Nếu 1 fullstack làm | ≈ 16–18 tuần |
| Ngày bắt đầu dự kiến | 17/08/2026 |
| Ngày go-live dự kiến | 26/10/2026 |

### Lộ trình tổng quát

```
Tuần  1   2   3   4   5   6   7   8   9  10
      ├───┴───┤                                Sprint 1 — Nền tảng & Auth
              ├───┴───┤                        Sprint 2 — Tin đăng & Ảnh
                      ├───┴───┤                Sprint 3 — Tìm kiếm & Bản đồ
                              ├───┴───┤        Sprint 4 — Kiểm duyệt & Admin
                                      ├───┴───┤ Sprint 5 — SEO, Tối ưu, Go-live
```

---

## 2. PHÂN RÃ CÔNG VIỆC (WBS)

### EPIC 1 — Nền tảng hệ thống  ·  *34h*

| Mã | Công việc | Ước lượng | Phụ thuộc | Vai trò |
| :--- | :--- | :-: | :--- | :--- |
| BE-101 | Khởi tạo repo, Laravel 13, chuẩn code (Pint, PHPStan), cấu trúc thư mục | 4h | — | BE |
| BE-102 | Docker Compose: nginx, php-fpm 8.3, mysql 8, redis 7, mailpit | 6h | BE-101 | DevOps |
| BE-103 | Thiết kế & viết toàn bộ migrations (12 bảng) | 8h | BE-101 | BE |
| BE-104 | Models + relationships + Enums + casts | 5h | BE-103 | BE |
| BE-105 | Seeder: roles, permissions, categories, provinces/districts/wards | 6h | BE-104 | BE |
| BE-106 | Cấu hình Sanctum, CORS, rate limit, chuẩn response JSON | 3h | BE-101 | BE |
| FE-101 | Khởi tạo Next.js 16 + TS + Tailwind + TanStack Query + Zod | 2h | — | FE |

### EPIC 2 — Xác thực & Phân quyền  ·  *38h*

| Mã | Công việc | Ước lượng | Phụ thuộc | Vai trò |
| :--- | :--- | :-: | :--- | :--- |
| BE-201 | API đăng ký / đăng nhập / đăng xuất / me | 6h | BE-106 | BE |
| BE-202 | Quên mật khẩu + reset qua email | 4h | BE-201 | BE |
| BE-203 | Xác thực email (signed URL), gửi qua Queue | 4h | BE-201 | BE |
| BE-204 | Cài spatie/laravel-permission, seed 4 role + 18 permission | 4h | BE-105 | BE |
| BE-205 | Policies: PropertyPolicy, UserPolicy; middleware `permission:` | 6h | BE-204 | BE |
| BE-206 | Feature test toàn bộ luồng auth + phân quyền | 6h | BE-205 | BE/QA |
| FE-201 | Trang đăng nhập / đăng ký / quên mật khẩu | 5h | FE-101 | FE |
| FE-202 | Auth context, lưu token, route guard theo role | 3h | FE-201 | FE |

### EPIC 3 — Tin đăng & Hình ảnh  ·  *62h*

| Mã | Công việc | Ước lượng | Phụ thuộc | Vai trò |
| :--- | :--- | :-: | :--- | :--- |
| BE-301 | API danh mục + địa giới hành chính (có cache Redis) | 5h | BE-105 | BE |
| BE-302 | CRUD tin đăng: Controller + FormRequest validate động theo loại hình | 12h | BE-205 | BE |
| BE-303 | PropertyResource, slug observer, hạn mức đăng tin | 5h | BE-302 | BE |
| BE-304 | Upload ảnh: validate, lưu, sắp xếp, đặt ảnh đại diện | 6h | BE-302 | BE |
| BE-305 | Queue Job xử lý ảnh (resize, WebP, watermark, thumbnail) | 8h | BE-304 | BE |
| BE-306 | API tin yêu thích, gửi liên hệ, báo cáo vi phạm | 5h | BE-302 | BE |
| BE-307 | Feature test tin đăng + phân quyền own/any | 6h | BE-306 | BE/QA |
| FE-301 | Dashboard người dùng: danh sách tin, lọc theo trạng thái | 6h | FE-202 | FE |
| FE-302 | Form đăng tin 6 bước + Zod + lưu nháp localStorage | 12h | FE-301 | FE |
| FE-303 | Uploader ảnh kéo-thả, sắp xếp, chọn ảnh đại diện | 6h | FE-302 | FE |

> *Ghi chú: tổng vượt 62h do FE và BE chạy song song — 62h là thời lượng theo luồng găng.*

### EPIC 4 — Tìm kiếm & Bản đồ  ·  *44h*

| Mã | Công việc | Ước lượng | Phụ thuộc | Vai trò |
| :--- | :--- | :-: | :--- | :--- |
| BE-401 | API listing công khai + bộ lọc đa tiêu chí | 8h | BE-303 | BE |
| BE-402 | Full-Text Search (MySQL FULLTEXT / PG tsvector) + sort relevance | 6h | BE-401 | BE |
| BE-403 | Lọc theo bán kính tọa độ (Haversine + bounding box) | 5h | BE-401 | BE |
| BE-404 | Cache Redis kết quả listing, invalidate khi tin đổi trạng thái | 4h | BE-401 | BE |
| BE-405 | API chi tiết tin theo slug + đếm view qua Redis | 3h | BE-401 | BE |
| FE-401 | Trang listing: grid/list, phân trang, đồng bộ filter ↔ URL params | 8h | FE-202 | FE |
| FE-402 | Panel bộ lọc: khoảng giá, diện tích, phòng ngủ, hướng, pháp lý | 6h | FE-401 | FE |
| FE-403 | Trang chi tiết BĐS: gallery, thông số, bản đồ, form liên hệ | 8h | FE-401 | FE |
| FE-404 | Trang tìm kiếm bản đồ (Leaflet) + marker cluster + vẽ bán kính | 8h | FE-403 | FE |
| FE-405 | Trang chủ: search box, danh mục, tin nổi bật, dự án | 6h | FE-401 | FE |

### EPIC 5 — Kiểm duyệt & Quản trị  ·  *36h*

| Mã | Công việc | Ước lượng | Phụ thuộc | Vai trò |
| :--- | :--- | :-: | :--- | :--- |
| BE-501 | API kiểm duyệt: danh sách chờ duyệt, approve, reject kèm lý do | 6h | BE-307 | BE |
| BE-502 | Thông báo email/in-app khi tin được duyệt hoặc bị từ chối | 4h | BE-501 | BE |
| BE-503 | API quản lý user: danh sách, khóa/mở, gán vai trò | 5h | BE-205 | BE |
| BE-504 | API quản lý danh mục + địa giới (CRUD) | 4h | BE-301 | BE |
| BE-505 | API thống kê tổng quan + danh sách tin bị báo cáo | 4h | BE-501 | BE |
| BE-506 | Cron: hết hạn tin, tự ẩn tin bị report ≥3 | 3h | BE-501 | BE |
| FE-501 | Trang quản trị: hàng đợi duyệt tin, xem nhanh, duyệt/từ chối | 8h | FE-403 | FE |
| FE-502 | Trang quản lý user + gán vai trò | 5h | FE-501 | FE |
| FE-503 | Trang quản lý danh mục + dashboard thống kê | 5h | FE-501 | FE |

### EPIC 6 — SEO, Hiệu năng, Triển khai  ·  *54h*

| Mã | Công việc | Ước lượng | Phụ thuộc | Vai trò |
| :--- | :--- | :-: | :--- | :--- |
| FE-601 | `generateMetadata` động mọi route + Open Graph | 5h | FE-405 | FE |
| FE-602 | JSON-LD: RealEstateListing, BreadcrumbList, Organization | 4h | FE-601 | FE |
| FE-603 | `sitemap.xml` phân mảnh + `robots.txt` + canonical + noindex filter sâu | 5h | FE-601 | FE |
| FE-604 | Tối ưu ảnh (`next/image`), lazy load, đo Lighthouse ≥ 90 | 5h | FE-603 | FE |
| BE-601 | Tối ưu index DB, phân tích slow query, loại N+1 | 6h | BE-404 | BE |
| BE-602 | Cấu hình Horizon/Supervisor, health check endpoint | 4h | BE-305 | DevOps |
| DO-601 | GitHub Actions: lint + test backend, build frontend | 6h | BE-307 | DevOps |
| DO-602 | Pipeline deploy staging (SSH + zero-downtime) | 6h | DO-601 | DevOps |
| DO-603 | Nginx production, SSL Let's Encrypt, HSTS + security headers | 4h | DO-602 | DevOps |
| DO-604 | Backup DB hằng ngày, log rotation, giám sát uptime | 4h | DO-603 | DevOps |
| QA-601 | Kiểm thử toàn hệ thống theo 10 kịch bản nghiệm thu | 5h | tất cả | QA |

---

## 3. KẾ HOẠCH SPRINT

### Sprint 1 — Nền tảng & Xác thực (Tuần 1–2)

**Mục tiêu:** Chạy được `docker compose up`, đăng ký/đăng nhập hoạt động, phân quyền có hiệu lực.

- BE-101 → BE-106, BE-201 → BE-206
- FE-101, FE-201, FE-202

**Sản phẩm bàn giao:**
- Môi trường Docker chạy được bằng 1 lệnh
- API auth đầy đủ + test xanh
- 4 role, 18 permission đã seed
- Màn hình đăng nhập/đăng ký hoạt động thật

**Demo:** Đăng ký tài khoản → đăng nhập → gọi `/auth/me` thấy đúng role.

---

### Sprint 2 — Tin đăng & Hình ảnh (Tuần 3–4)

**Mục tiêu:** Người dùng đăng được tin 4 loại hình kèm ảnh.

- BE-301 → BE-307
- FE-301 → FE-303

**Sản phẩm bàn giao:**
- API CRUD tin đăng + validate động theo loại hình
- Queue xử lý ảnh (WebP + watermark) chạy thật
- Form đăng tin 6 bước hoàn chỉnh

**Demo:** Đăng tin bán chung cư 5 ảnh → thấy tin ở `pending`, ảnh đã nén WebP có watermark.

**Rủi ro:** Validate động theo loại hình dễ phình logic → tách `PropertyRuleResolver` service ngay từ đầu.

---

### Sprint 3 — Tìm kiếm & Bản đồ (Tuần 5–6)

**Mục tiêu:** Trang công khai hoàn chỉnh, tìm kiếm nhanh và chính xác.

- BE-401 → BE-405
- FE-401 → FE-405

**Sản phẩm bàn giao:**
- Listing + bộ lọc đa tiêu chí, đồng bộ URL
- Full-text search tiếng Việt
- Tìm kiếm bản đồ theo bán kính
- Trang chủ + trang chi tiết

**Demo:** Tìm "chung cư Hà Nội 2PN 2–3 tỷ" ra kết quả đúng < 300ms; kéo bản đồ thấy marker cập nhật.

**Rủi ro:** Full-text tiếng Việt có dấu cho kết quả kém → chuẩn hóa lưu thêm cột `search_text` không dấu, đánh index trên cột đó.

---

### Sprint 4 — Kiểm duyệt & Quản trị (Tuần 7–8)

**Mục tiêu:** Vòng đời tin đăng khép kín, admin vận hành được.

- BE-501 → BE-506
- FE-501 → FE-503

**Sản phẩm bàn giao:**
- Hàng đợi duyệt tin cho moderator
- Quản lý user + gán vai trò
- Quản lý danh mục, thống kê
- Cron hết hạn tin

**Demo:** Moderator duyệt tin → tin lên trang chủ ngay; từ chối không lý do → báo lỗi.

---

### Sprint 5 — SEO, Tối ưu & Go-live (Tuần 9–10)

**Mục tiêu:** Đạt tiêu chí nghiệm thu, lên production.

- FE-601 → FE-604, BE-601, BE-602
- DO-601 → DO-604, QA-601

**Sản phẩm bàn giao:**
- Lighthouse SEO ≥ 95, Performance ≥ 90 (mobile)
- CI/CD tự động deploy staging
- Production có SSL, backup, giám sát
- Biên bản nghiệm thu 10 kịch bản

**Demo:** Push code → CI chạy test → deploy staging tự động; kiểm tra sitemap và rich result.

---

## 4. NHÂN SỰ & PHÂN CÔNG

| Vai trò | FTE | Sprint tham gia | Trách nhiệm chính |
| :--- | :-: | :--- | :--- |
| Backend Developer | 1.0 | 1–5 | API, DB, queue, policy, test |
| Frontend Developer | 1.0 | 1–5 | Next.js, UI/UX, SEO on-page |
| DevOps | 0.5 | 1, 5 | Docker, CI/CD, production |
| QA | 0.5 | 2–5 | Test case, regression, nghiệm thu |
| Product Owner | 0.2 | 1–5 | Chốt yêu cầu, nghiệm thu sprint |

**Nhịp làm việc:** Daily standup 15 phút · Sprint planning đầu sprint (2h) · Review + retro cuối sprint (2h).

---

## 5. QUẢN LÝ RỦI RO

| # | Rủi ro | Xác suất | Tác động | Biện pháp |
| :-: | :--- | :-: | :-: | :--- |
| R1 | Full-text search tiếng Việt cho kết quả kém | Cao | Cao | Cột `search_text` chuẩn hóa không dấu + index; dự phòng chuyển Meilisearch (+16h) |
| R2 | Xử lý ảnh làm nghẽn queue khi tải cao | Trung bình | Cao | Nhiều worker, giới hạn 20 ảnh/tin, chuyển sang object storage + CDN |
| R3 | Dữ liệu địa giới hành chính thay đổi (sáp nhập tỉnh/xã) | Cao | Trung bình | Lưu `code` chuẩn Tổng cục Thống kê, có script import lại; giữ mapping cũ→mới |
| R4 | Spam tin đăng, tin ảo | Cao | Cao | Duyệt thủ công MVP, rate limit, phát hiện trùng, report từ người dùng |
| R5 | SEO không lên hạng do nội dung mỏng | Trung bình | Cao | Landing theo danh mục × khu vực, nội dung mô tả khu vực, internal link |
| R6 | Chi phí hạ tầng vượt dự toán khi nhiều ảnh | Trung bình | Trung bình | Nén WebP, giới hạn kích thước, lifecycle policy xóa ảnh tin đã xóa >90 ngày |
| R7 | Phạm vi phình (đòi thêm VIP/thanh toán sớm) | Cao | Cao | Đã tách rõ Giai đoạn 2; mọi yêu cầu mới vào backlog, không chèn giữa sprint |
| R8 | Thiếu nhân sự do 1 người làm fullstack | Trung bình | Cao | Nếu 1 người: kéo dài lên 16–18 tuần, ưu tiên Epic 1→3 trước |

---

## 6. GIAI ĐOẠN 2 (SAU MVP)

| Ưu tiên | Hạng mục | Ước lượng |
| :-: | :--- | :-: |
| P1 | Gói tin VIP 1/2/3 + ví tiền + VNPay/MoMo | 60h |
| P1 | Trang hồ sơ môi giới công khai + đánh giá | 24h |
| P2 | Chat trực tiếp môi giới ↔ khách (WebSocket) | 40h |
| P2 | Elasticsearch/Meilisearch thay full-text DB | 24h |
| P2 | Lưu tìm kiếm + email thông báo tin mới khớp | 20h |
| P3 | So sánh bất động sản, tính lãi vay | 16h |
| P3 | App mobile (React Native) | 200h+ |
| P3 | Định giá tự động (AVM) từ dữ liệu lịch sử | 120h+ |

---

## 7. CHI PHÍ HẠ TẦNG DỰ KIẾN (THÁNG)

| Hạng mục | Cấu hình | Chi phí ước tính |
| :--- | :--- | :--- |
| VPS ứng dụng | 4 vCPU / 8GB RAM / 160GB SSD | 40–60 USD |
| Database (nếu tách) | 2 vCPU / 4GB | 25–40 USD |
| Object storage + CDN | 200GB + 1TB traffic | 15–30 USD |
| Email transactional | 10.000 mail/tháng | 0–15 USD |
| Domain + SSL | Let's Encrypt miễn phí | ~1 USD |
| Giám sát / backup | | 0–10 USD |
| **Tổng** | | **≈ 80–155 USD/tháng** |

> Giai đoạn đầu (<10.000 tin) có thể gộp tất cả trên 1 VPS 8GB: ≈ 45 USD/tháng.

---

*Hết kế hoạch triển khai.*
