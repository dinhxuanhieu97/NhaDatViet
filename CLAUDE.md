# CLAUDE.md — Hướng dẫn làm việc trên dự án BDS

Cổng thông tin bất động sản, kiến trúc headless: **`bds-api/`** (Laravel 13 API) + **`bds-web/`** (Next.js 16).
Ngôn ngữ giao tiếp và comment trong code: **tiếng Việt**.

---

## 1. Quy ước đặt tên — BẮT BUỘC tuân thủ

Mọi định danh phải gắn với mã dự án `Bds` / `bds-` / `BDS_`. Không dùng tên chung chung (`Header`, `api`, `Property`, `SITE_URL`) vì khó truy vết khi review.

| Loại | Quy ước | Ví dụ trong repo |
| :--- | :--- | :--- |
| Thư mục component | `bds-<miền>/` | `bds-property/`, `bds-post-wizard/`, `bds-map/` |
| Component React | `Bds<Tên>` | `BdsPropertyCard`, `BdsFilterPanel`, `BdsPostWizard` |
| Hook | `useBds<Tên>` | `useBdsAuth`, `useBdsProvinces`, `useBdsMapMarkers` |
| Kiểu TS | `Bds<Tên>` | `BdsProperty`, `BdsUser`, `BdsPaginated<T>` |
| Module lib | `bds-<chức-năng>.ts` | `bds-api-client.ts`, `bds-server-api.ts`, `bds-queries.ts` |
| Hằng số | `BDS_<TÊN>` | `BDS_API_URL`, `BDS_WIZARD_STEPS`, `BDS_DEFAULT_CENTER` |
| Env của web | `NEXT_PUBLIC_BDS_*` | `NEXT_PUBLIC_BDS_API_URL` |
| Query key | `['bds', '<miền>', …]` | `['bds', 'my-properties', status]` |
| Artisan command | `bds:<hành-động>` | `bds:expire-properties` |

Phía Laravel giữ tên nghiệp vụ chuẩn (`Property`, `Category`, `PropertyPolicy`) vì đã đủ cụ thể; chỉ config và command mang tiền tố `bds`.

---

## 2. Lệnh hay dùng

```bash
# Backend
cd bds-api
php artisan test                    # 127 test (tăng dần) — phải xanh 100% trước khi commit
php artisan test --filter=<TênTest>
./vendor/bin/pint                   # tự sửa code style
php artisan migrate:fresh --seed    # reset DB kèm dữ liệu demo
php artisan serve --port=8000

# Frontend
cd bds-web
npx tsc --noEmit                    # phải sạch
npx eslint src --max-warnings=0     # phải 0 lỗi
npm run build                       # 23 route
npm run dev
```

Dev nhanh dùng SQLite (`DB_CONNECTION=sqlite` + `touch database/database.sqlite`). Test luôn chạy SQLite in-memory. Production dùng MySQL 8.

---

## 3. Định nghĩa "xong" (Definition of Done)

Không đánh dấu hoàn thành nếu chưa qua đủ:

- [ ] `php artisan test` xanh 100% (127 test — số này tăng dần, luôn lấy số thật lúc chạy, đừng hard-code theo trí nhớ)
- [ ] `./vendor/bin/pint --test` sạch
- [ ] `npx tsc --noEmit` và `npx eslint src --max-warnings=0` sạch
- [ ] `npm run build` pass
- [ ] Chạm luồng người dùng → chạy thử thật bằng `curl` hoặc trình duyệt, không chỉ dựa vào test
- [ ] Thay đổi endpoint → cập nhật `docs/01-Dac-Ta-Ky-Thuat.md` §6

### 3.1. Một việc một lúc — không làm song song nhiều task

Khi có nhiều task/bug trong hàng đợi (vd. cả một EPIC nhiều mã công việc), **chỉ làm một mã tại một thời điểm**: chọn task → code → test đầy đủ theo checklist trên → xác nhận "xong" thật sự → mới bắt đầu task tiếp theo. Không mở song song nhiều task rồi quay qua quay lại — dễ bỏ sót bước test của task trước, và khi có lỗi giữa chừng sẽ không biết task nào gây ra.

Ngoại lệ hợp lý: sửa cùng lúc nhiều điểm **trong một task duy nhất** (vd. một tính năng cần sửa cả backend lẫn frontend) không tính là "nhiều task song song" — đó vẫn là một đơn vị công việc, chỉ trải trên nhiều file.

### 3.2. Không bỏ qua bug/task khi chưa test "hoàn thành" thật sự

Phát hiện bug hoặc gap trong lúc làm việc khác (audit, code review, chạy test) **không được lờ đi hoặc ghi chú "để sau" rồi tiếp tục task chính** nếu bug đó nằm trong phạm vi đang làm. Nếu bug nằm ngoài phạm vi task hiện tại: ghi lại rõ ràng (vào CLAUDE.md hoặc báo cho người dùng), không tự ý sửa xen vào giữa chừng (vi phạm §3.1), nhưng cũng không được im lặng bỏ qua — phải nói ra để người dùng quyết định thứ tự ưu tiên.

Một task chỉ được coi là "hoàn thành" khi đã qua **toàn bộ** checklist Definition of Done ở trên — không chỉ code chạy được hoặc test tự viết pass. Tự viết test rồi tự cho pass không thay thế được bước "chạy thử thật bằng trình duyệt/curl" — test có thể tự nó thiếu case, còn hành vi thật trên trình duyệt mới là bằng chứng cuối cùng.

---

## 4. Những chỗ dễ sai — đọc trước khi sửa

### 4.1. Validate động theo loại hình BĐS
Trường bắt buộc khác nhau giữa Đất / Nhà / Chung cư / Dự án. Nguồn sự thật là `PropertyType::requiredFields()` và `hiddenFields()` trong `bds-api/app/Enums/PropertyType.php`.

Ba nơi phải sửa **đồng thời** khi đổi quy tắc:
1. `app/Enums/PropertyType.php` — khai báo gốc
2. `app/Services/PropertyRuleResolver.php` — sinh rule cho FormRequest
3. `bds-web/src/lib/bds-schemas.ts` → `step3SchemaFor()` — Zod phía client

Trên `PUT`, mọi rule đều phải có `sometimes` (partial update). Đã từng lỗi vì viết `'sometimes|required'` thành một phần tử mảng — phải tách thành `['sometimes', 'required', …]`.

### 4.2. Slug và tìm kiếm tiếng Việt
- Slug sinh ở `PropertyObserver::created()` (cần `id`), lúc `creating` đặt giá trị tạm `tmp-<uuid>` để thỏa ràng buộc UNIQUE.
- Tìm kiếm khớp trên cột `properties.search_text` (đã bỏ dấu, chuẩn hóa qua `App\Support\VietnameseText::normalize()`), không phải trên `title`/`description`. Sửa cách chuẩn hóa thì phải backfill lại cột này.
- `m²` được map thành `m2` để truy vấn "80m2" khớp tin ghi "80m²".

### 4.3. Route model binding
Route `/my/properties/{property:id}` **bắt buộc** có `:id` vì `Property::getRouteKeyName()` trả `slug`. Quên `:id` sẽ ra 404 thay vì 403 — che mất lỗi phân quyền.

### 4.4. Phân quyền — bài học đã có
Hai lỗ hổng từng tồn tại, đừng lặp lại:
- **Đừng trả tin theo `id` mà không lọc trạng thái.** `FavoriteController` từng cho lưu tin `pending`/`draft` của người khác rồi đọc nội dung qua `/my/favorites`. Mọi endpoint nhận `id` từ client phải kiểm `status === Published` hoặc quyền sở hữu.
- **Hành động cộng dồn phải chống trùng.** Báo cáo tin từng cho một người tự gửi đủ ngưỡng để ẩn tin đối thủ. Nay chặn theo `reporter_id`, khách vãng lai chặn theo `ip_address`.

`Gate::before` trong `AppServiceProvider` cho `admin` toàn quyền — khi viết Policy mới, nhớ điều này để không test nhầm.

### 4.5. Intervention Image v4.2
API đã đổi so với tài liệu cũ trên mạng:
- `ImageManager::read()` → `decodePath()`
- `$image->toWebp()` → `$image->encode(new WebpEncoder(quality: 82))`
- `place()` → `insert(image:, x:, y:, alignment:, transparency:)`

### 4.6. Địa giới hành chính — đã bỏ cấp quận/huyện
Từ 01/7/2025 (Nghị quyết 1685/NQ-UBTVQH15) Việt Nam bỏ cấp quận/huyện; TP.HCM còn 168 phường/xã trực thuộc thành phố.

Trong dự án này bảng `districts` **không còn là đơn vị hành chính** — nó là **cấp khu vực tìm kiếm** mang tên quận cũ, vì người mua bán BĐS vẫn tra theo "nhà Gò Vấp", "căn hộ Thủ Đức". Cột `districts.is_legacy = true` đánh dấu điều này. Địa chỉ pháp lý đầy đủ = *phường mới + tỉnh/thành*, không kèm tên quận.

Nhãn hiển thị đã đổi thành "Khu vực" (không dùng "Quận / Huyện"). Nếu sau này chuyển hẳn sang 2 cấp, điểm sửa gọn trong `LocationSeeder`, `LocationController` và 2 component chọn địa chỉ.

Hiện chỉ seed TP.HCM — khu vực **Quận 12** (5 phường). Gò Vấp / Bình Thạnh / Thủ Đức để `TODO` trong `LocationSeeder`, danh sách phường đã đối chiếu nghị quyết và còn nguyên trong commit `a5cbbf6` nếu cần lấy lại.

**Đừng seed lại Hà Nội / Đà Nẵng / Khánh Hòa bằng tên quận cũ** — dữ liệu đó đã bị bãi bỏ, trộn với dữ liệu thật sẽ khiến người dùng chọn nhầm đơn vị không tồn tại. `LocationDataTest` chặn việc này (`test_chi_seed_tphcm_khong_lan_du_lieu_dia_gioi_cu`).

Khi bổ sung khu vực mới, sửa 3 chỗ cùng lúc: `LocationSeeder::HCMC_AREAS`, `ProjectSeeder::DATA` và `LocationDataTest::EXPECTED_WARD_COUNTS`.

Toạ độ mặc định của bản đồ (`BDS_DEFAULT_CENTER`, `BDS_PICKER_FALLBACK`) đã trỏ về TP.HCM — nếu mở rộng sang tỉnh khác nhớ cập nhật cả `BDS_PROVINCE_CENTERS`.

### 4.7. Watermark ảnh
Đã bật, file ở `resources/images/bds-watermark.png` (nằm trong `resources/` để git theo dõi được — `storage/app/` bị Laravel gitignore). Job tự co giãn watermark bằng 22% bề rộng ảnh và bỏ qua ảnh hẹp dưới 600px nên thumbnail luôn sạch.

`watermark_opacity` trong `config/bds.php` là **float 0–1** (1.0 = đục hoàn toàn). Truyền số ngoài khoảng này, Intervention Image sẽ ném `InvalidArgumentException`. Phương thức đúng là `insert(image:, x:, y:, alignment:, transparency:)` — `place()` không tồn tại ở v4.2.

### 4.8. Truy vấn theo bán kính
`Property::scopeWithinRadius()` dùng bounding box + Haversine. SQLite không có `LEAST()` nên code chọn `MIN()` theo driver — giữ nhánh này khi sửa.

### 4.9. React 19 / Next 16 lint nghiêm ngặt
- **Không** `useEffect` + `setState` để fetch dữ liệu → dùng hook trong `bds-web/src/lib/bds-queries.ts` (TanStack Query). ESLint sẽ báo lỗi `react-hooks/set-state-in-effect`.
- **Không** gán `ref.current` trong thân render → đặt trong `useEffect`.
- **Không** `window.location.href` để điều hướng nội bộ → `useRouter().push()`.
- Leaflet đụng `window` → luôn nạp qua `next/dynamic` với `ssr: false`.

### 4.10. Biến môi trường của bds-web
`NEXT_PUBLIC_*` được nhúng vào bundle lúc build. Đổi giá trị **bắt buộc build lại**, restart PM2 không đủ.

### 4.11. `output: 'standalone'` — đừng chạy `next start`
`next.config.ts` bật standalone để image Docker gọn. Hệ quả: `next start` / `npm run start` **không hoạt động** (Next báo `"next start" does not work with "output: standalone"`).

Production chạy bằng `node .next/standalone/server.js`, và sau mỗi lần build phải copy asset tĩnh vào bundle:
```bash
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```
Quên bước này thì trang vẫn trả 200 nhưng mất sạch CSS/JS — lỗi im lặng. Dev vẫn dùng `npm run dev` bình thường.

### 4.12. Mọi endpoint phân trang phải bọc qua Resource — đừng trả paginator thô
`ProjectController` từng `return Project::paginate(...)` thẳng ra ngoài — cấu trúc phẳng của Laravel paginator (`total` ở cấp 1, không có `meta`) khác với `PropertyResource` (bọc `{data, links, meta}`). Frontend đọc chung một hàm `fetchBdsPropertyPage` cho mọi listing nên khi gặp shape khác, `page.meta.total` là `undefined` và cả trang `/du-an` đổ HTTP 500. Đã có `ProjectResource` + test chặn hồi quy (`tests/Feature/ApiResponseShapeTest.php`) — thêm listing mới thì bắt buộc bọc qua Resource và thêm case vào test đó.

### 4.13. CORS: `localhost` và `127.0.0.1` là hai origin khác nhau
`BDS_WEB_ORIGIN` trong `config/cors.php` khớp chính xác chuỗi origin. Trình duyệt coi `http://localhost:3000` và `http://127.0.0.1:3000` là **hai origin khác nhau** dù cùng trỏ về loopback — fetch kèm token từ origin không khớp sẽ bị CORS chặn âm thầm (không phải lỗi 401/403 rõ ràng, mà network error). Dev local nhớ truy cập và cấu hình `BDS_WEB_ORIGIN` cùng một dạng (khuyến nghị `localhost`, không dùng `127.0.0.1`) xuyên suốt.

### 4.14. `dangerouslyAllowLocalIP` được đóng cứng lúc build, không đọc lại lúc chạy
Next 16 standalone server **không** re-evaluate biến môi trường phụ thuộc trong `next.config.ts` lúc khởi động — giá trị `images.dangerouslyAllowLocalIP` bị đóng cứng vào `.next/required-server-files.json` ngay tại thời điểm `npm run build`. Set `BDS_ALLOW_LOCAL_IMAGES=true` lúc `node .next/standalone/server.js` khởi động **không có tác dụng gì** nếu lúc build biến đó chưa được set — phải build lại: `BDS_ALLOW_LOCAL_IMAGES=true npm run build`. Dev thường (`npm run dev`) không bị ảnh hưởng vì Next dev server đọc `next.config.ts` mỗi lần request.

### 4.15. `Cache::remember()` với Collection Eloquent — đừng cache object thô
`LocationController` và `CategoryController` từng cache thẳng `Collection` các model (`Cache::remember($key, $ttl, fn () => Model::get())`). Sau một lần `migrate:fresh --seed`, cache DB cũ (`unserialize()`) gãy với lỗi *"tried to call a method on an incomplete object"* — kéo theo `/categories` và `/provinces` trả 500, và vì `BdsFilterPanel` gọi `.map()` trên kết quả, cả trang `/nha-dat-ban` và `/tim-kiem-ban-do` crash renderer ngay ở client (Chromium hiện "This page couldn't load", không phải lỗi React catchable). Đã sửa: chỉ cache **mảng thuần đã `->toArray()` hoặc đã qua Resource `->resolve()`**, không bao giờ cache instance Model/Collection trực tiếp; đồng thời bọc `try/catch` quanh `Cache::get()` để tự phục hồi nếu cache cũ (từ code trước) vẫn hỏng kiểu khác. Gặp cache lạ, `php artisan cache:clear` trước khi tìm nguyên nhân sâu hơn.

### 4.16. Setup local thiếu `storage:link` hoặc `queue:work` → ảnh vỡ / kẹt "Đang tối ưu…"
Hai lệnh này **bắt buộc** cho dev local, không chỉ là tuỳ chọn — README đã ghi đúng nhưng rất dễ bị bỏ sót khi hướng dẫn nhanh qua loa:
- Thiếu `php artisan storage:link`: `public/storage` không trỏ tới `storage/app/public`, mọi URL ảnh (`/storage/properties/...`) trả 404 — ảnh vỡ (icon lỗi + alt text) kể cả với ảnh gốc chưa qua xử lý.
- Thiếu `php artisan queue:work` chạy nền (một cửa sổ Terminal riêng): `ProcessPropertyImage` dùng `QUEUE_CONNECTION=database`, job chỉ nằm chờ trong bảng `jobs` chứ không tự chạy. `is_processed` kẹt mãi ở `false`, badge "Đang tối ưu…" không bao giờ biến mất dù `storage:link` đã đúng.

Khởi động `queue:work` sau khi đã có job kẹt sẵn trong bảng vẫn xử lý được — worker rút hết hàng đợi tồn đọng khi start, không cần xoá/upload lại ảnh.

### 4.17. `next dev` tự sinh `AGENTS.md` + `CLAUDE.md` (stub) trong `bds-web/`
Next 16.3+ có tính năng `agentRules` (mặc định bật) — mỗi lần `npm run dev` khởi động, Next tự ghi `bds-web/AGENTS.md` (nội dung hướng dẫn AI đọc `node_modules/next/dist/docs/` trước khi code) và `bds-web/CLAUDE.md` (chỉ chứa `@AGENTS.md`, cú pháp import trỏ sang file kia). Hai file này **khác** với `CLAUDE.md` thật ở gốc repo (file bạn đang đọc) và dễ gây nhầm lẫn nếu vô tình commit hoặc đọc nhầm. Đã tắt bằng `agentRules: false` trong `bds-web/next.config.ts`; nếu thấy hai file này xuất hiện lại (untracked, `git status` báo `??`), có thể xoá thẳng.

### 4.18. `required_unless:save_as_draft,1` không hoạt động với boolean JSON thật
`Illuminate\Validation\Concerns\ValidatesAttributes::validateRequiredUnless()` chuyển sang so sánh **strict** (`===`) khi giá trị field được so sánh là boolean/null: `in_array($other, $values, is_bool($other) || is_null($other))`. Tham số rule luôn là chuỗi (`'1'`), nên nếu `save_as_draft` còn là boolean JSON thật (`true`/`false`, không phải chuỗi `'1'`/`'0'`) thì `required_unless:save_as_draft,1` **không bao giờ khớp** — hậu quả: "Lưu nháp" luôn đòi đủ trường bắt buộc theo loại hình (`bedrooms`, `legal_status`, …) và cả `contact_name`/`contact_phone`, y hệt gửi duyệt, vô hiệu hóa hoàn toàn ý nghĩa của lưu nháp một phần. Bug này tồn tại từ đầu, không có test nào bắt được vì `validPropertyPayload()` trong test luôn gửi đủ trường.

Đã sửa bằng cách chuẩn hóa `save_as_draft` thành chuỗi `'1'`/`'0'` trong `prepareForValidation()` của `StorePropertyRequest`/`UpdatePropertyRequest` trước khi validate. Đồng thời `contact_name`/`contact_phone` trước đây bắt buộc tuyệt đối (không đi qua `required_unless`) — đã đổi sang cùng cơ chế bypass-khi-nháp, và cột DB tương ứng đã được nới `nullable` (migration `2026_08_16_161200_make_property_contact_fields_nullable`) vì tin nháp có thể chưa có thông tin liên hệ. Test hồi quy: `PropertyManagementTest::test_luu_nhap_khong_can_du_truong_bat_buoc_theo_loai_hinh_va_lien_he`.

Bug này từng chặn đứng chính bước "Tải ảnh" (bước 5) của wizard đăng tin: bước đó tự lưu nháp ngầm (`onEnsureProperty`) để có `id` gắn ảnh vào, nhưng lúc đó bước "Liên hệ" (bước 6, sau bước ảnh) chưa được điền — mọi lần upload ảnh đầu tiên của một tin hoàn toàn mới đều lỗi.

### 4.19. `MyPropertyController::update()` (PUT) không tự chuyển trạng thái nháp → chờ duyệt
`update()` chỉ đổi `status` ở nhánh "sửa tin đã duyệt → cần duyệt lại" (`Published` + đổi trường trọng yếu → `Pending`). Nó **không** đọc `$request->isDraft()` để chuyển `Draft`/`Rejected` → `Pending` khi người dùng thật sự gửi duyệt qua PUT. Có sẵn endpoint riêng `POST /my/properties/{id}/submit` làm đúng việc này (kèm kiểm tra tối thiểu 1 ảnh) — nhưng trước đây `BdsPostWizard::onSubmitForReview()` chỉ gọi `saveProperty(false)` (tức PUT) rồi điều hướng thẳng sang `?status=pending`, không hề gọi `/submit`.

Hậu quả thực tế: bất kỳ tin nào đã có `id` từ trước khi bấm "Gửi duyệt" (tức đã đi qua bước tải ảnh, hoặc đang sửa tin nháp/bị từ chối có sẵn) bấm "Gửi duyệt" bao nhiêu lần cũng chỉ cập nhật nội dung, tin **kẹt vĩnh viễn ở trạng thái nháp**, không bao giờ vào hàng chờ duyệt của kiểm duyệt viên — dù giao diện báo "Đã gửi tin chờ kiểm duyệt" và điều hướng như thể thành công. Chỉ tin tạo mới hoàn toàn không qua bước ảnh (POST thẳng với `save_as_draft:false`) mới thực sự vào `Pending` ngay từ đầu.

Đã sửa ở `onSubmitForReview()`: nếu tin đã tồn tại (`id`) **trước** lần lưu cuối cùng, gọi thêm `POST /my/properties/{id}/submit` sau khi PUT xong, và hiện lỗi qua banner thay vì điều hướng đi nếu `/submit` thất bại (ví dụ chưa có ảnh). Đừng "sửa" bằng cách thêm state chuyển đổi vào `update()` — endpoint `/submit` đã cố tình tách riêng để kiểm tra điều kiện ảnh, giữ nguyên ranh giới đó.

### 4.20. Nút "Bấm để hiện số" từng chỉ hiện lại đúng số đã bị che — không thật sự lấy số thật
`BdsContactBox` bản cũ có state `phoneRevealed` chỉ đổi cách hiển thị cục bộ, trong khi giá trị `property.contact_phone` mà client nhận được **đã bị `PropertyResource` che sẵn** (`maskPhone()`) với người xem không phải chủ tin/kiểm duyệt viên — bấm nút chỉ hiện lại y hệt chuỗi che `091xxxx678`, không bao giờ ra số thật. Đây là bug có sẵn từ trước, không phải do thay đổi nào trong đợt Zalo/Facebook này.

Đã sửa bằng endpoint mới `GET /properties/{slug}/reveal-phone` (throttle `20,60`, chỉ trả số cho tin `published`) — chỉ gọi khi người dùng thật sự bấm nút gọi/Zalo (`BdsContactBox::ensureRealPhone()`), không nhúng số thật sẵn vào payload chi tiết tin để hạn chế bot quét số hàng loạt từ trang danh sách. Nút gọi là thẻ `<a href="tel:...">` thật (không phải `<button>`), chia **2 bước bấm riêng biệt** (không gọi ngay ở lượt bấm đầu, tránh gọi nhầm khi người dùng chỉ định xem số): lượt 1 hiện `"090xxxx003 · Bấm để hiện số"`, bấm vào chỉ gọi API lấy số thật rồi đổi nhãn thành `"0900000003 · Bấm để gọi"` (chưa gọi); lượt 2 mới thật sự mở `tel:` vì lúc này `href` đã là số thật, không cần `preventDefault()` nữa. Zalo dùng `https://zalo.me/{chỉ giữ số}` — ưu tiên `contact_zalo` nếu người đăng có cung cấp riêng, không thì dùng lại số điện thoại thật (cũng phải reveal trước, dùng chung `ensureRealPhone()` nên không gọi lại API nếu đã reveal qua nút gọi). Facebook không cần reveal vì `contact_facebook` là link công khai người đăng chủ động chọn hiển thị, không bị che ở `PropertyResource`. Test hồi quy: `PropertySearchTest::test_bam_hien_so_tra_ve_so_that_khong_bi_che`, `test_khong_hien_so_cho_tin_chua_duyet`, `test_tra_ve_zalo_va_facebook_khong_bi_che`.

### 4.21. Đăng nhập mạng xã hội (Google/Facebook) — cách lấy Client ID/Secret
Backend dùng `laravel/socialite` ở chế độ **stateless** (phù hợp SPA tách rời — không dùng session Laravel để giữ state OAuth). Luồng: `bds-web` điều hướng cả trang (thẻ `<a>`, không phải fetch) sang `GET {BDS_API_URL}/auth/social/{provider}/redirect` → Laravel redirect tiếp sang Google/Facebook → người dùng đồng ý → Google/Facebook gọi lại `GET {BDS_API_URL}/auth/social/{provider}/callback` → `SocialAuthController` tìm/tạo `User` (khớp theo `google_id`/`facebook_id`, nếu chưa có thì khớp theo email rồi gắn id mạng xã hội vào tài khoản sẵn có) → redirect trình duyệt về `{BDS_WEB_ORIGIN}/dang-nhap/mang-xa-hoi?token=...` (hoặc `?error=...` nếu lỗi) → trang `bds-web` đó lưu token vào `localStorage` và chuyển sang `/quan-ly`.

Thiếu Client ID/Secret thì nút vẫn hiện (không ẩn đi) nhưng bấm vào sẽ redirect thẳng ra lỗi 422 kèm thông báo tiếng Việt rõ ràng, không crash — vì `ensureSupportedAndConfigured()` kiểm tra `config('services.{provider}.client_id/secret')` trước khi gọi Socialite.

**Lấy Google Client ID/Secret:**
1. Vào [Google Cloud Console](https://console.cloud.google.com/) → tạo project mới (hoặc chọn project có sẵn).
2. "APIs & Services" → "OAuth consent screen" → chọn loại "External", điền tên ứng dụng, email liên hệ.
3. "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID" → loại **"Web application"**.
4. "Authorized redirect URIs" → thêm đúng giá trị `GOOGLE_REDIRECT_URI` trong `.env` (mặc định dev: `http://localhost:8000/api/v1/auth/social/google/callback`; production đổi domain tương ứng).
5. Copy "Client ID" và "Client secret" vào `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` trong `bds-api/.env`.

**Lấy Facebook Client ID/Secret:**
1. Vào [Meta for Developers](https://developers.facebook.com/) → "My Apps" → "Create App" → chọn loại "Consumer" hoặc "Business".
2. Thêm sản phẩm "Facebook Login" → "Settings" → "Valid OAuth Redirect URIs" → thêm đúng giá trị `FACEBOOK_REDIRECT_URI` (mặc định dev: `http://localhost:8000/api/v1/auth/social/facebook/callback`).
3. "Settings" → "Basic" → copy "App ID" và "App Secret" vào `FACEBOOK_CLIENT_ID`/`FACEBOOK_CLIENT_SECRET` trong `bds-api/.env`.
4. App ở chế độ "Development" chỉ đăng nhập được bằng tài khoản có vai trò Admin/Developer/Tester trong app — muốn cho người dùng thật đăng nhập phải bật "Live" (yêu cầu Meta duyệt qua App Review nếu xin quyền vượt quá `public_profile`/`email`).

Sau khi đổi `.env`, không cần build lại `bds-web` (các biến này chỉ nằm ở `bds-api`) — nhưng nếu chạy `bds-api` qua `php artisan serve` hoặc container, cần restart để nạp lại `.env`.

### 4.22. "Ghi nhớ đăng nhập" — hai cơ chế khác nhau tùy form
Không có khái niệm "remember me" chung cho toàn hệ thống — Sanctum token ở dự án này không tự hết hạn (`SANCTUM_EXPIRATION` không set = không bao giờ hết hạn), nên "ghi nhớ đăng nhập" được hiện thực bằng hai cơ chế riêng, tùy ngữ cảnh:

1. **Form đăng nhập/đăng ký** — chọn **nơi lưu token phía client**, không đụng gì tới backend. `setBdsToken(token, remember)` trong `bds-api-client.ts`: `remember = true` (mặc định, tick sẵn) → `localStorage` (tồn tại xuyên phiên, hành vi gốc từ trước); `remember = false` → `sessionStorage` (mất khi đóng tab/trình duyệt). `getBdsToken()` đọc cả hai nơi vì không biết trước nơi nào có giá trị. Áp dụng ở `BdsLoginForm`/`BdsRegisterForm` qua checkbox `remember` trong `loginSchema`/`registerSchema` — cố tình dùng `.optional()` thay vì `.default(true)` vì `zodResolver` yêu cầu type input/output của schema khớp nhau, `.default()` làm input optional còn output required nên type-check thất bại; giá trị mặc định `true` đặt ở `defaultValues` của `useForm` thay vì trong schema.

2. **Form đổi mật khẩu trong hồ sơ** — hoàn toàn khác, xử lý ở **backend**. `AuthController::updatePassword()` vốn `$user->tokens()->delete()` xóa sạch token kể cả phiên đang dùng (bắt đăng nhập lại toàn bộ, kể cả thiết bị vừa đổi mật khẩu — không được thân thiện). Thêm tham số `keep_current_session`: nếu bật, chỉ xóa token của các thiết bị/phiên **khác**, giữ lại token hiện tại (`$user->tokens()->where('id', '!=', $currentTokenId)->delete()`) — vẫn đăng xuất nơi khác (mục tiêu bảo mật gốc của tính năng) nhưng không làm phiền phiên vừa đổi mật khẩu. `currentAccessToken()` trả `null` khi test dùng `actingAs()` (không qua token thật) — phải fallback về xóa hết trong trường hợp đó, nếu không sẽ vô tình không xóa gì (xem `test_doi_mat_khau_giu_phien_hien_tai_khi_chon_ghi_nho_dang_nhap`, dùng `withToken()` với token thật để kiểm tra đúng nhánh giữ phiên).

   Response trả thêm `logged_out: boolean`. Frontend (`quan-ly/ho-so/page.tsx`) gọi `refresh()` khi `logged_out = true` — đây cũng là chỗ sửa luôn một lỗ hổng UX có sẵn từ trước: form đổi mật khẩu cũ không hề tự làm mới trạng thái đăng nhập sau khi đổi, nên nếu chọn "không ghi nhớ" (hoặc trước đây luôn luôn), giao diện vẫn hiện như đang đăng nhập cho tới khi có request nào khác vô tình gọi lại `/auth/me` và tự phát hiện token đã bị thu hồi. Gọi `refresh()` khiến `/auth/me` chạy lại ngay, 401 tự dọn token (`bds-auth-context.tsx` đã có sẵn cơ chế này), và `BdsAuthGuard` tự `router.replace('/dang-nhap')` khi `user` thành `null` — không cần code điều hướng thủ công trong trang hồ sơ.

### 4.23. Validate số điện thoại theo đúng đầu số nhà mạng, không chỉ độ dài
Regex cũ `^0[0-9]{8,10}$` chỉ kiểm độ dài (9–11 số bắt đầu bằng 0) — cho lọt qua cả đầu số cố định (`02x`) lẫn đầu số di động **chưa từng được cấp phép** (vd `060x`, `095x`, `057x`), khiến người dùng gõ nhầm/gõ bừa vẫn qua được validate ở cả 2 phía.

Thay bằng `App\Support\VietnamesePhone::REGEX` (backend) và hằng số tương ứng trong `bds-web/src/lib/bds-schemas.ts` (frontend, phải sửa đồng bộ 2 nơi) — khớp chính xác 36 đầu số 3 chữ số đang được cấp phép cho 7 nhà mạng (Viettel, MobiFone, VinaPhone, Vietnamobile, Gmobile, iTel, Wintel/Reddi — MVNO của Mobicast, tiền thân là "Reddi"), gộp lại thành:

```
^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$
```

Áp dụng ở mọi nơi validate số điện thoại: đăng ký/cập nhật hồ sơ (`AuthController`), liên hệ tin đăng (`PropertyController::contact`), `contact_phone`/`contact_zalo` của tin đăng (`PropertyRuleResolver`). Danh sách đầu số có thể thay đổi nếu Bộ KH&CN cấp phát thêm — cần cập nhật cả `VietnamesePhone::REGEX` và `phoneRegex` ở `bds-schemas.ts` cùng lúc khi đó xảy ra.

### 4.24. Chống spam form công khai bằng honeypot + đo thời gian, không dùng captcha
Áp dụng cho 3 form không cần đăng nhập, dễ bị bot nhắm tới: đăng ký tài khoản, gửi liên hệ tin đăng, báo cáo tin vi phạm. Chọn honeypot + timing thay vì Cloudflare Turnstile/reCAPTCHA/hCaptcha vì không cần đăng ký tài khoản bên thứ 3, không thêm script ngoài, không có bước xác minh nào người dùng thật nhìn thấy — đánh đổi là chặn được bot đơn giản/script tự động chứ không chặn được bot cố tình giả lập hành vi người.

Cơ chế nằm ở `App\Support\SpamGuard::isSuspicious()` (backend) và `bds-web/src/lib/bds-anti-spam.ts` (`useBdsAntiSpam()`, frontend) — **2 lớp, cả 2 field phải khớp tên giữa `config('bds.anti_spam')` và hằng số phía frontend**:

1. **Honeypot** (`website`): field ẩn bằng CSS đưa ra ngoài màn hình (`BdsHoneypotField`, KHÔNG dùng `display:none`/`hidden` vì một số bot lọc theo 2 thuộc tính đó), đặt tên như field thật để bot tự động điền form dễ mắc bẫy hơn tên kiểu "honeypot" lộ liễu. Người dùng thật không thấy nên luôn để trống; có giá trị = chắc chắn bot.
2. **Đo thời gian điền** (`form_rendered_at`, ms epoch): `useBdsAntiSpam()` chụp `Date.now()` bằng `useRef` ngay lúc component mount — dùng `useRef` chứ không phải `useState` để mốc thời gian không đổi qua các lần re-render, và quan trọng hơn là **không đổi khi người dùng bấm gửi lại sau lỗi validate** (nếu tính lại từ lúc submit thì người bấm gửi lại nhanh sau khi sửa lỗi sẽ bị chặn nhầm). Backend so `now() - form_rendered_at` với `config('bds.anti_spam.min_fill_ms')` (mặc định 2000ms) — submit nhanh hơn ngưỡng này bị coi là bot vì người thật cần thời gian đọc + gõ. Thiếu hẳn field này (client không phải SPA thật, không chạy JS) cũng bị coi là đáng ngờ vì toàn bộ `bds-web` là React CSR, không có JS thì không load được form để mà submit.

**Cách phản hồi khi nghi bot khác nhau tùy endpoint** — cân nhắc có "tác dụng phụ" thật để giả vờ hay không:
- `contact()`, `report()`: **vờ thành công** (message y hệt case thật, HTTP 201) nhưng không ghi gì vào DB — không tiết lộ cho bot biết bị chặn nên nó không đổi chiến thuật, và bản thân 2 hành động này vốn "gửi rồi quên" nên giả vờ không gây tác dụng phụ nào lộ liễu phía người dùng thật (trường hợp cực hiếm người thật bị chặn nhầm thì cũng chỉ thấy y hệt thành công, không mất gì).
- `register()`: **không thể** giả vờ thành công vì đăng ký cần trả token thật để đăng nhập tiếp — trả lỗi validate chung chung ("Không tạo được tài khoản. Vui lòng thử lại.") thay vì nêu đích danh lý do (honeypot/quá nhanh) để không chỉ điểm cách né.

Ngưỡng `min_fill_ms` và tên 2 field nằm ở `config/bds.php` (`anti_spam`), không hard-code trong controller. Form "báo cáo tin vi phạm" hiện **chưa có UI ở frontend** (endpoint `POST /properties/{slug}/report` tồn tại nhưng chưa có nút/form nào gọi tới) — đã bảo vệ sẵn ở backend để khi làm UI sau này không cần nhớ quay lại thêm.

### 4.25. Cache `GET /properties` bằng "khóa theo phiên bản" — không dùng `Cache::tags()`
`App\Support\PropertyListingCache` cache toàn bộ response (`data`+`links`+`meta`, đã `->response($request)->getData(true)`) theo tổ hợp filter + trang + số item/trang, TTL `config('bds.cache.listing_ttl_seconds')` (mặc định 120s). Cùng nguyên tắc CLAUDE.md §4.15: chỉ cache mảng thuần, không cache Collection/Model Eloquent.

**Vì sao không dùng `Cache::tags()`:** driver cache khác nhau giữa môi trường — test dùng `array` (`phpunit.xml`), dev dùng `database` (`.env`), production dự kiến `redis` (`.env.example`). `array`/`database` không hỗ trợ tags. Giải pháp: mọi khóa cache gắn thêm số phiên bản hiện tại (`properties:listing:version`); khi tin đổi trạng thái, tăng phiên bản lên khiến **toàn bộ** khóa cũ (dù chưa hết TTL) bị bỏ qua ngay mà không cần biết chính xác khóa nào chứa tin đó.

**Bẫy đã gặp khi cài `Cache::increment()`:** `DatabaseStore::increment()` (đọc source `vendor/laravel/framework`) trả thẳng `false` nếu khóa **chưa tồn tại**, khác với `ArrayStore`/`RedisStore` tự khởi tạo từ 0. Nếu chỉ gọi `Cache::increment()` mà không đảm bảo khóa tồn tại trước, phiên bản sẽ đứng yên mãi ở trạng thái "chưa tồn tại" trên driver `database` — bug này **không bị test bắt được** vì bộ test dùng driver `array` (tự khởi tạo, che giấu lỗi). Đã sửa bằng `Cache::add($key, 0)` (put-if-absent) trước mỗi lần `increment()`. Đã tự tay verify qua `php artisan tinker` với `CACHE_STORE=database` thật (không chỉ dựa vào test) trước khi coi là xong — xem CLAUDE.md §3.2.

**Nơi trigger invalidate:** `PropertyObserver::updated()` khi `wasChanged('status')`, `created()` khi tin được tạo thẳng ở trạng thái Published (hiếm, chủ yếu factory test), `deleted()` khi xóa tin đang Published. **Không bắt được** mass update (`Property::query()->update()`, dùng ở cron `bds:expire-properties`) vì Eloquent không bắn event cho mass update — chấp nhận được vì `scopePublic()` đã tự loại tin hết hạn theo `expired_at` ở tầng query, TTL ngắn là lưới an toàn cho đúng khoảng trễ này.

**Bẫy khi viết test:** driver `array` sống suốt cả tiến trình PHP chạy test, không tự dọn giữa các test method như `RefreshDatabase` làm với DB — `TestCase::setUp()` đã thêm `Cache::flush()` đầu mỗi test để tránh cache "mồ côi" từ test trước (property id trùng nhưng nội dung khác do transaction rollback) làm sai lệch assertion của test sau.

### 4.26. Đếm `views_count` chống trùng qua cache — và bug `$request->user()` trên route công khai
`App\Support\PropertyViewCounter::shouldCount()` dùng `Cache::add()` (put-if-absent) làm cổng chống đếm trùng: một người xem (định danh theo user id nếu đã đăng nhập, theo IP nếu khách vãng lai) xem lại cùng tin trong `config('bds.view_dedupe_minutes')` phút (mặc định 30) chỉ tính 1 lượt. Cùng triết lý cache-qua-Cache-facade với `PropertyListingCache` (§4.25) — Redis ở production, không phụ thuộc cứng lúc test/dev.

**Bug nghiêm trọng phát hiện khi live-verify** (không phải lúc chạy `php artisan test`): `PropertyController::show()`/`contact()`/`report()` gọi `$request->user()` KHÔNG tham số. `$request->user()` phân giải qua guard **mặc định** (`config('auth.defaults.guard')` = `'web'`, session-based) trừ khi có middleware `auth:sanctum` chạy trước đó chuyển guard mặc định sang `'sanctum'` cho request đó (`Authenticate` middleware làm việc này). Ba route trên **công khai, không có `auth:sanctum`** — nên với client API thật gửi Bearer token, `$request->user()` luôn trả `null`, khiến:
- Chủ tin/kiểm duyệt viên dùng token thật không xem được tin nháp/chờ duyệt/bị từ chối của chính mình (báo 404 như khách vãng lai).
- `PropertyContact.user_id` luôn `null` dù người gửi liên hệ đã đăng nhập.
- Chống báo cáo trùng (§4.4) luôn dùng nhánh IP thay vì `reporter_id` cho người đã đăng nhập — yếu hơn thiết kế gốc.

**Vì sao `php artisan test` không bắt được:** mọi test dùng `actingAs($user, 'sanctum')`, mà `actingAs()` tự gọi `Auth::shouldUse('sanctum')` — tự chuyển guard mặc định, che mất đúng lỗ hổng mà client thật (dùng Bearer token qua `Authorization` header, không qua `actingAs`) gặp phải. Chỉ lộ ra khi tự tay gọi `curl`/Playwright với token thật (CLAUDE.md §3.2: **luôn** live-verify, không chỉ dựa vào test tự viết).

**Đã sửa:** gọi tường minh `$request->user('sanctum')` ở cả 3 nơi. Test hồi quy dùng `withToken($token)` (không phải `actingAs()`) để tái hiện đúng đường đi thật của client API — xem `test_chu_tin_dung_bearer_token_that_van_xem_duoc_tin_chua_duyet_cua_minh`, `test_gui_lien_he_bang_bearer_token_that_luu_dung_user_id`, `test_bao_cao_bang_bearer_token_that_ghi_dung_reporter_id` (`PropertySearchTest.php`). Bài học chung: **bất kỳ route công khai nào cần biết "người xem có đăng nhập không"** đều phải gọi `user('sanctum')`, và test cho hành vi đó phải dùng `withToken()` chứ không phải `actingAs()` — xem cách `AuthTest::test_doi_mat_khau_giu_phien_hien_tai_khi_chon_ghi_nho_dang_nhap` (§4.22) đã làm đúng điều tương tự trước đó.

### 4.27. Marker clustering ở trang tìm kiếm bản đồ — và tile OpenStreetMap không tải được trong sandbox
`BdsLeafletCanvas` dùng `leaflet.markercluster` (side-effect import gắn `L.markerClusterGroup()` vào namespace `leaflet` toàn cục, kiểu khai báo qua `@types/leaflet.markercluster`) thay cho `L.layerGroup()` thường — cần thiết vì API có thể trả tới `config('bds.map.max_markers')` (300) marker/lượt, dồn hết vào layer thường lúc zoom xa sẽ đè lên nhau. `disableClusteringAtZoom: 17` để lúc phóng to hẳn luôn thấy từng tin riêng lẻ dù đứng sát nhau. Đã tự tay verify bằng Playwright: cụm hiện đúng số lượng marker gộp, bấm vào cụm zoom+expand đúng vị trí — không chỉ dựa vào build pass.

**Lưu ý khi live-verify bản đồ trong sandbox này:** tile OpenStreetMap (`{s}.tile.openstreetmap.org`) không tải được (`ERR_CONNECTION_RESET` trong console) vì môi trường chỉ cho phép mạng ra ngoài theo allowlist, không có OSM trong đó — nền bản đồ sẽ xám trơn dù marker/cluster vẫn hiển thị và hoạt động đúng phía trên nền xám đó. Đây là giới hạn hạ tầng của sandbox phát triển, không phải lỗi code — đừng nhầm "tile không hiện" với "bản đồ hỏng" khi debug trong môi trường này; kiểm tra marker/cluster/click vẫn là cách xác nhận đúng.

### 4.28. `flex-1` trên phần tử bị `line-clamp` — lộ thêm dòng bên dưới dấu "…"
`BdsPropertyCard` (layout `list`) từng đặt `flex-1` trực tiếp lên `<p>` mô tả cùng `line-clamp-2`. Tailwind v4 hiện thực `line-clamp-N` bằng `display: flow-root; overflow: hidden; -webkit-line-clamp: N` (không phải `display: -webkit-box` cũ) — cách này chỉ cắt sạch đúng N dòng nếu chiều cao thật của box **khớp chính xác** N × line-height. `flex-1` (tức `flex: 1 1 0%`) khiến flexbox kéo giãn `<p>` để lấp khoảng trống dọc còn lại trong flex column (do card bên cạnh có ảnh cao hơn nội dung chữ), làm chiều cao box lớn hơn N dòng một khoảng lẻ (vd. 51px thay vì đúng 40px cho 2 dòng cao 20px/dòng). Biên `overflow: hidden` bám theo chiều cao **đã bị kéo giãn** đó chứ không bám theo N dòng, nên phần dòng kế tiếp (dòng thứ 3 trở đi) vẫn lộ ra bên dưới dấu "…" — nhìn như mô tả "bị cắt/hiển thị không đầy đủ", chữ dòng dưới đè sát lên dòng địa chỉ ngay bên dưới vì không có khoảng cách dành cho nó.

Phát hiện qua ảnh chụp màn hình người dùng gửi kèm báo lỗi, xác nhận bằng cách đọc `getComputedStyle` + `offsetHeight`/`scrollHeight` thật của phần tử trong trình duyệt (offsetHeight 51px ≠ 2 × 20px lý thuyết) — không đoán nguyên nhân suông. Đã sửa: bỏ `flex-1` khỏi chính đoạn `<p>` bị clamp (đổi `line-clamp-2` → `line-clamp-3` theo yêu cầu), bọc khối "địa chỉ + footer" bên dưới bằng `<div className="mt-auto">` để phần đó hấp thụ khoảng trống dọc còn lại thay vì đoạn mô tả — nhờ vậy `<p>` luôn có chiều cao đúng bằng bội số nguyên của line-height, cắt sạch không lộ dòng thừa. Đã verify bằng Playwright chạy trực tiếp trong sandbox (script gọi `page.evaluate` đọc `offsetHeight`/`scrollHeight` — bằng nhau và đúng 3×20=60px khi nội dung vừa đủ, và giữ nguyên 60px dù nội dung dài hơn nhiều lần khi test với text giả dài 300 ký tự) — không chỉ dựa vào nhìn ảnh chụp.

**Bài học chung:** không gắn `flex-1`/`flex-grow` trực tiếp lên phần tử đang dùng `line-clamp-N` của Tailwind — nếu cần phần tử khác trong flex column co giãn lấp chỗ trống, đặt `flex-1`/`mt-auto` lên phần tử **khác** (vd. wrapper bọc các phần tử phía sau đoạn bị clamp), không đặt lên chính đoạn bị clamp.

**Ghi chú công cụ:** trong sandbox này, bộ công cụ `mcp__claude-in-chrome__*` (Chrome tự động hoá) chạy trên một trình duyệt **tách biệt mạng** khỏi container chạy `bash`/dev server — điều hướng tới `localhost:3000` hoặc `127.0.0.1:3000` từ đó có thể trả về nội dung **cũ/cache**, không phản ánh đúng code vừa sửa, dù `curl` trực tiếp từ `bash` trong cùng container xác nhận server đã trả HTML mới. Khi live-verify UI mà nghi ngờ trình duyệt đang xem bản cache, xác nhận bằng cách chạy Playwright trực tiếp từ `bash` (Chromium tại `/opt/pw-browsers/chromium`, xem CLAUDE.md gốc hệ thống về biến `PLAYWRIGHT_BROWSERS_PATH`) — cùng network namespace với dev server nên luôn thấy đúng bản mới nhất.

### 4.29. Đồng bộ đăng nhập/đăng xuất giữa nhiều tab
Trước đây: đăng xuất ở tab A xóa đúng token khỏi `localStorage` (bản thân `localStorage` vốn dùng chung giữa các tab cùng origin, đồng bộ tức thời ở tầng trình duyệt) nhưng state `user` trong React Query của tab B **không tự biết** để cập nhật — vì `refetchOnWindowFocus: false` bị tắt toàn cục (`bds-providers.tsx`, cố tình tắt để tránh gọi lại API vô ích mỗi lần chuyển tab thường). Hậu quả: tab B vẫn hiện như đang đăng nhập cho tới khi người dùng tự F5, gây cảm giác "đăng xuất không có tác dụng".

**Đã sửa** ở `BdsAuthProvider` (`bds-auth-context.tsx`): thêm `useEffect` lắng nghe sự kiện `storage` của trình duyệt — theo chuẩn Web Storage API, sự kiện này **chỉ bắn ra ở các tab/document KHÁC** tab vừa ghi `localStorage`, nên không tự kích hoạt lại ở tab vừa gọi `login()`/`logout()`, chỉ đồng bộ các tab còn lại (không cần đoán, đây là hành vi chuẩn hóa của mọi trình duyệt). Chỉ lắng nghe theo `localStorage` (khớp `event.storageArea === window.localStorage`) — cố tình **không** đồng bộ `sessionStorage` (trường hợp "Ghi nhớ đăng nhập" = false, §4.22) vì đó vốn được thiết kế giới hạn theo từng tab/phiên riêng, không đồng bộ mới là đúng ý đồ ban đầu.

**Bẫy khi cài — `queryClient.clear()` phá luôn observer đang mount:** phản xạ đầu tiên là bắt chước đúng những gì `logout()` cục bộ làm (`queryClient.clear()` rồi mới refetch), nhưng đã tự tay verify bằng Playwright (2+ trang cùng `BrowserContext` để giả lập tab thật, dùng `window.addEventListener('storage', …)` gắn cờ debug quan sát trực tiếp) và phát hiện tổ hợp `queryClient.clear()` **ngay trước** `invalidateQueries({queryKey: BDS_CURRENT_USER_KEY})` khiến `useQuery` của current-user đang mount ở tab B **không tự refetch được nữa** — `clear()` gỡ đăng ký query khỏi cache đúng lúc observer vẫn đang theo dõi, `invalidateQueries` gọi ngay sau đó không còn gì để invalidate, UI kẹt ở trạng thái cũ dù `localStorage` đã đổi thật. Đây không phải bug tưởng tượng — verify bằng cách thêm `console.log` tạm vào handler, xác nhận sự kiện `storage` bắn đúng, điều kiện khớp đúng, nhưng UI vẫn không đổi cho tới khi bỏ `clear()`.

**Cách sửa đúng:** gọi thẳng `queryClient.invalidateQueries()` **không kèm filter** (invalidate toàn bộ query đang có trong cache, kể cả current-user) — nhẹ hơn `clear()` vì chỉ đánh dấu stale + trigger refetch cho query đang active, không gỡ đăng ký khỏi cache nên không phá observer. Giải quyết đúng cả 2 việc cùng lúc: buộc current-user refetch danh tính mới (logout → null, hoặc login/đổi tài khoản ở tab khác → danh tính mới), và mọi màn hình khác đang mở ở tab đó (tin đã lưu, tin của tôi, …) cũng tự làm mới theo tài khoản mới thay vì tiếp tục hiện dữ liệu của tài khoản cũ.

**Test (theo yêu cầu người dùng — thêm vào đây vì frontend chưa có bộ test E2E tự động, chỉ có `php artisan test` cho backend):** bất kỳ thay đổi nào đụng tới `bds-auth-context.tsx` hoặc các hàm token trong `bds-api-client.ts` (`setBdsToken`/`clearBdsToken`/`getBdsToken`) đều phải live-verify kịch bản đa tab trước khi coi là xong:
1. Mở **từ 2 tab trở lên** cùng trình duyệt, cùng origin, tab đầu chưa đăng nhập.
2. Đăng nhập ở tab 1 → xác nhận các tab còn lại **tự chuyển sang trạng thái đã đăng nhập ngay, không cần F5** (nút "Đăng nhập"/"Đăng ký" ở header biến mất, đổi thành avatar).
3. Đăng xuất ở tab 1 → xác nhận các tab còn lại **tự chuyển về trạng thái khách ngay, không cần F5**.
4. (Tùy chọn, kỹ hơn) Đăng nhập 2 tài khoản khác nhau lần lượt ở tab 1 → xác nhận tab khác luôn phản ánh đúng tài khoản **mới nhất** vừa đăng nhập, không kẹt ở tài khoản trước.

Không có công cụ Playwright/trình duyệt sẵn trong phiên làm việc thì tối thiểu phải test thủ công bằng 2 tab thật trước khi commit — test tự động (nếu viết) không thay thế được bước này vì bản chất bug nằm ở tương tác thật giữa nhiều tab trình duyệt, khó mô phỏng đầy đủ chỉ bằng unit test.

### 4.30. "… Xem thêm" dưới mô tả bị cắt — đo overflow thật, không đoán theo số ký tự
`BdsPropertyDescription` (dùng trong `BdsPropertyCard` layout `list`) hiện gợi ý "… Xem thêm" ngay dưới đoạn mô tả bị `line-clamp-3`, nhưng CHỈ khi nội dung thật sự bị cắt — xác định bằng cách so `scrollHeight` với `clientHeight` của chính `<p>` sau khi render (qua `ResizeObserver`, chạy lại mỗi khi kích thước phần tử đổi do resize/breakpoint), không đoán theo số ký tự. Lý do: cột mô tả đổi độ rộng rất nhiều theo breakpoint (ảnh bên trái chỉ có từ `sm:` trở lên, dưới đó card xếp dọc full-width) — cùng một mô tả 307 ký tự vừa khít 3 dòng ở màn hình rộng (1400px, không cắt) nhưng bị cắt rõ ở màn hình di động (375px). Một ngưỡng ký tự tĩnh sẽ luôn sai ở một trong hai trường hợp.

"Xem thêm" đặt làm khối **riêng** ngay sau `<p>` bị clamp, không lồng vào bên trong nó — nếu lồng bên trong, chính gợi ý này cũng bị cắt mất theo cùng cơ chế đã sửa ở §4.28 (biên `overflow:hidden` của `line-clamp` cắt bất cứ nội dung nào vượt điểm cắt, kể cả phần tử tự thêm vào cuối). Không bọc `<a>` riêng cho "Xem thêm" — cả card đã nằm trong một `<Link>` cha, lồng `<a>` trong `<a>` là HTML không hợp lệ; đây chỉ là gợi ý thị giác, bấm bất cứ đâu trên card đều điều hướng tới trang chi tiết.

**Bẫy khi tự verify:** không thể test bằng cách gán thẳng `p.textContent = '...'` qua DOM API rồi kiểm tra — React vẫn giữ cây fiber theo `text` prop gốc, lần re-render kế tiếp (chính do `setIsClamped` gây ra) sẽ tự "vá" lại `<p>` về đúng nội dung gốc, xóa mất chuỗi vừa gán tay, khiến test luôn thấy `hasReadMore: false` dù logic đúng. Phải test bằng dữ liệu thật đi qua đúng đường render của React (đổi kích thước viewport để buộc cùng một mô tả thật bị cắt, xem cách verify thực tế ở commit sửa tính năng này) chứ không phải mutate DOM tay đè lên phần tử do React quản lý.

### 4.31. Kênh mạng xã hội cấp HỒ SƠ (khác contact_zalo/contact_facebook cấp TỪNG TIN)
Thêm 3 field mới trên `users`: `social_tiktok`, `social_youtube`, `social_instagram` (migration `2026_08_19_171230_add_social_channels_to_users.php`) — quản lý ở trang **Hồ sơ cá nhân** (`/quan-ly/ho-so`, form "Kênh mạng xã hội" riêng, lưu qua `PUT /auth/profile`), áp dụng cho **mọi** tin đăng của người đó, hiện ra ở khối liên hệ (`BdsContactBox`) trên trang chi tiết tin qua `property.user.social_*`.

**Cố tình KHÔNG gộp chung với `contact_zalo`/`contact_facebook` trên `Property`** (`2026_08_16_163000_add_zalo_facebook_contact_to_properties.php`, §4.20-4.24 nhắc tới) — hai nhóm field này khác cấp độ và có lý do tồn tại riêng: `contact_zalo`/`contact_facebook` đặt Ở TỪNG TIN qua bước "Liên hệ" của wizard đăng tin, cho phép chủ tin đổi số Zalo/link Facebook khác nhau giữa các tin (vd. tin đăng hộ người khác). `social_tiktok`/`social_youtube`/`social_instagram` đặt Ở HỒ SƠ, dùng chung cho tất cả tin — đúng bản chất kênh thương hiệu cá nhân/công ty môi giới, không đổi theo từng tin. Yêu cầu người dùng cũng chỉ định rõ nơi quản lý là trang Hồ sơ, không phải wizard đăng tin — không tự ý mở rộng phạm vi sang sửa cả wizard.

**Ẩn hẳn khi trống, không hiện placeholder** — khác hành vi có sẵn của Facebook (hiện "Chưa có Facebook" dạng viền đứt khi trống). Đây là yêu cầu tường minh của người dùng cho 3 kênh mới: `{property.user?.social_tiktok && (...)}` chứ không phải ternary như Facebook. Lý do hợp lý: 3 kênh mới là phần bổ sung, nếu đều hiện placeholder trống sẽ làm khối liên hệ dài không cần thiết với hầu hết tin (đa số người dùng sẽ không điền đủ cả 3 khi mới ra mắt tính năng).

**Validate:** `nullable, url, max:255` ở cả 2 lớp (backend `AuthController::updateProfile()`, frontend `type="url"` trên input) — đã tự tay verify bằng `php artisan tinker` rằng tổ hợp `nullable`+`url` chấp nhận chuỗi rỗng `''` (không lỗi), và middleware mặc định `ConvertEmptyStringsToNull` tự đổi `''` thành `null` trước khi lưu — gửi `''` là cách "xóa" link đã lưu, kết quả trả về đúng là `null` chứ không phải chuỗi rỗng (test ban đầu viết sai kỳ vọng `''`, phải sửa lại thành `null` sau khi verify hành vi thật, không đoán).

**`type="url"` ở input chặn submit native trước khi tới server:** đã tự tay verify bằng Playwright — gán giá trị không hợp lệ ("khong-phai-url") qua `input.value` rồi bấm nút Lưu, `checkValidity()` trả `false` và trình duyệt tự chặn, KHÔNG có request nào gửi lên `/auth/profile`. Nghĩa là nhánh xử lý lỗi 422 từ server (`error.fieldError('social_tiktok')` ở trang hồ sơ) trong điều kiện dùng bình thường sẽ không bao giờ chạy tới — đây không phải code chết cần xóa, mà là lưới an toàn dự phòng cho các rule server có nhưng browser không tự kiểm được (vd. `max:255`), hoặc trường hợp JS bị tắt/form bị submit bằng cách khác ngoài click nút thường. Đừng xóa nhánh `fieldError` chỉ vì thấy nó "không bao giờ chạy" khi test thủ công qua UI.

**Live-verify đã làm:** đăng nhập thật → điền TikTok+YouTube, để trống Instagram ở trang hồ sơ → lưu → reload trang xác nhận giá trị lưu đúng từ server (không chỉ state cục bộ) → mở trang chi tiết một tin thật của đúng user đó → xác nhận TikTok/YouTube hiện đúng link, Instagram **không xuất hiện trong DOM** (không phải ẩn bằng CSS), Facebook vẫn giữ nguyên hành vi placeholder cũ không đổi.

---

## 5. Bố cục thư mục cần biết

```
bds-api/app/
├── Enums/            PropertyStatus, PropertyType, ListingType, UserRole
├── Http/Controllers/Api/V1/    (+ Admin/ cho kiểm duyệt, user, thống kê)
├── Http/Requests/    StorePropertyRequest, UpdatePropertyRequest, SearchPropertyRequest
├── Http/Resources/   PropertyResource (che SĐT với người ngoài), UserResource
├── Jobs/             ProcessPropertyImage — resize/WebP/watermark/thumbnail
├── Policies/         PropertyPolicy (hạn mức tin ở create()), UserPolicy
├── Services/         PropertyRuleResolver, PropertySearchService
└── Support/          VietnameseText — bỏ dấu, chuẩn hóa, sinh slug

bds-web/src/
├── app/              Route tiếng Việt: /nha-dat-ban, /bat-dong-san/[slug], /quan-ly, /quan-tri
├── components/       bds-auth, bds-dashboard, bds-layout, bds-map,
│                     bds-post-wizard, bds-property, bds-search
├── lib/              bds-api-client (client), bds-server-api (Server Component),
│                     bds-queries (TanStack), bds-schemas (Zod), bds-format, bds-config
└── types/bds.ts
```

`bds-api-client.ts` đọc `localStorage` → chỉ dùng phía client. Server Component phải dùng `bds-server-api.ts`.

---

## 6. Cấu hình nghiệp vụ

Hạn mức tin/ảnh, số ngày hiển thị, ngưỡng tự ẩn tin, tham số xử lý ảnh và bản đồ đều nằm ở **`bds-api/config/bds.php`**. Đừng hard-code các con số này trong controller.

Vòng đời tin đăng: `draft → pending → published → (expired | hidden)`, `pending → rejected → pending`. Sửa giá/diện tích/địa chỉ/tiêu đề của tin đã duyệt sẽ tự đưa về `pending` (xem `MyPropertyController::update`).

---

## 7. Tài khoản demo (sau `migrate:fresh --seed`)

`admin@bds.local` / `moderator@bds.local` / `agent@bds.local` / `member@bds.local` — mật khẩu đều là `password`.

Seeder tạo 45 tin trải đều 4 loại hình × 2 nhu cầu, cộng 1 tin cố định khớp kịch bản nghiệm thu "chung cư Hà Nội 2PN 2–3 tỷ" (`PropertyDemoSeeder::seedAcceptanceShowcase`). Đừng xóa tin này — kịch bản demo phụ thuộc vào nó.

---

## 8. Phạm vi

**Trong MVP:** auth, RBAC, đăng tin 4 loại hình, kiểm duyệt, tìm kiếm nâng cao + bản đồ, SEO, CI/CD.

**Ngoài MVP — đừng tự ý thêm:** gói tin VIP, ví tiền, cổng thanh toán (VNPay/MoMo), chat, app mobile, Elasticsearch. Lộ trình ở `docs/02-Ke-Hoach-Trien-Khai.md` §6.

Hai việc còn treo cần người dùng quyết:
- Địa giới hành chính mới seed 5 tỉnh mẫu; production cần import đủ 63 tỉnh theo mã Tổng cục Thống kê (cột `code` đã có sẵn).
- Watermark ảnh chưa bật — trỏ `config('bds.image.watermark_path')` tới file PNG nền trong suốt là chạy.

---

## 9. Tài liệu tham chiếu

| Tệp | Khi nào đọc |
| :--- | :--- |
| `README.md` | Cách chạy dự án, bảng quy ước đặt tên đầy đủ |
| `docs/01-Dac-Ta-Ky-Thuat.md` | ERD, ma trận phân quyền, đặc tả API, quy tắc nghiệp vụ, 10 kịch bản nghiệm thu |
| `docs/02-Ke-Hoach-Trien-Khai.md` | WBS, sprint, rủi ro, lộ trình Giai đoạn 2 |
| `docs/03-Trien-Khai-Production.md` | Deploy, Nginx, SSL, Supervisor, backup, checklist go-live |
