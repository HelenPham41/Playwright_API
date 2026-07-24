# Automation QC — Playwright API Test Framework

Framework test API tự động cho luồng nghiệp vụ order → warehouse (pick/qc/pack) → shipper → delivery → reconcile, hỗ trợ nhiều country (VN, TH, KH) qua cùng một bộ code.

> Chi tiết kiến trúc, quy tắc code, và các lưu ý nghiệp vụ (business logic, exception cases, bug đã fix...) nằm trong [CLAUDE.md](./CLAUDE.md) — đây là tài liệu tham chiếu đầy đủ nhất, nên đọc khi cần hiểu sâu hoặc sửa code. README này chỉ tóm tắt để onboard nhanh.

## Cài đặt

```bash
npm install
npx playwright install   # nếu chưa có browser/driver cần thiết
```

## Chạy test

```bash
# Chạy toàn bộ spec, tất cả country (VN, TH, KH)
npx playwright test

# Chạy 1 spec cho 1 country cụ thể
npx playwright test tests/placeOrder.spec.ts --project=VN
npx playwright test tests/completeflow_COD.spec.ts --project=VN

# Mở lại report HTML tuỳ chỉnh gần nhất
npm run report:open
```

**Biến môi trường thường dùng:**

| Biến | Mục đích | Default |
|---|---|---|
| `COUNTRY` | Chọn country config (`VN`/`TH`/`KH`) | lấy từ `--project`, fallback `VN` |
| `RUN_TIMES` | Số lần lặp mỗi test (`repeatEach`) | `1` |
| `MAX_REPORTS` | Số file report HTML tối đa giữ lại trong `reports/` (rotate) | `10` |
| `OPEN_REPORT` | `false` để không tự mở report sau khi chạy xong | mở tự động |
| `LOCATION`, `ZONE_CODE` | Override warehouse/zone code cho pick/pack (VN) | xem `configs/countries/vn.ts` |
| `API_USERNAME`, `API_PASSWORD` | Override credential login (khi cần test account khác) | xem từng file `configs/countries/*.ts` |

## Luồng nghiệp vụ (tổng quan)

```
PlaceOrder → Pick → QC → Pack → Book Shipper → Delivery → Reconcile Shipper → Reconcile Accounting
```

Mỗi bước là 1 flow độc lập (`flows/*.flow.ts`), nhận output của bước trước làm input — không có bước nào hard-code ID, tất cả đều chain runtime qua flow trước đó. Xem chi tiết từng bước (API endpoint, input/output, exception case) trong CLAUDE.md → mục **"Luồng nghiệp vụ đơn hàng"**.

Test file tương ứng trong `tests/`:

| Spec | Phạm vi |
|---|---|
| `placeOrder.spec.ts` | Chỉ đặt hàng (8 bước) |
| `pick.spec.ts` | PlaceOrder → Pick |
| `qc.spec.ts` | PlaceOrder → Pick → QC |
| `pack.spec.ts` | PlaceOrder → Pick → QC → Pack |
| `bookshipper.spec.ts` | ... → Pack → Book Shipper (chỉ VN có config) |
| `delivery.spec.ts` | ... → Book Shipper → Delivery |
| `reconcileshipper.spec.ts` | ... → Delivery → Reconcile Shipper |
| `completeflow_COD.spec.ts` | Full chain, thanh toán COD, đến Reconcile Accounting |
| `completeflow_bankTransfer.spec.ts` | Full chain, thanh toán chuyển khoản, đến Reconcile Accounting |

## Kiến trúc code (layer)

```
tests/       → chỉ chứa expect(). Không biết HTTP, không biết config.
fixtures/    → resolve CountryConfig, tạo Flow, inject vào test qua { orderFlow, pickFlow, ... }
flows/       → gom các bước nghiệp vụ, log từng step, KHÔNG có expect()
services/    → mỗi method = 1 HTTP call, throw ApiError nếu status ngoài expected
payloads/    → build request body/params/headers từ config/test-data, tách khỏi HTTP logic
clients/     → createClient(baseURL, token, authType) → APIRequestContext
```

Country được switch qua 2 factory song song, cùng đọc `process.env.COUNTRY`:

- `configs/country.factory.ts` → `getCountryConfig()` — hosts, auth, endpoints
- `test-data/scenario.data.factory.ts` → `getScenarioData()` — SKU, customer, invoice, payment

Mỗi country có file config + test-data riêng, **không import chéo** (`configs/countries/vn.ts` + `test-data/vn.scenario.data.ts`, tương tự cho `th`/`kh`).

Xem đầy đủ cấu trúc thư mục, quy tắc bắt buộc (không hard-code, không cross-import service, log style...), và checklist thêm country/flow mới trong CLAUDE.md.

## Report

Ngoài report HTML gốc của Playwright (`playwright-report/`), project có report tổng hợp tuỳ chỉnh: `reporters/html-summary.reporter.ts` → xuất file vào `reports/<timestamp>-<country>.html`, gồm summary pass/fail, môi trường chạy, và chi tiết từng test (test steps + lỗi assertion/API nếu fail).
