# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Chỉ thị cho Claude

- **Không đọc file không cần thiết:**
  - *Đầu conversation*: không Read file để "nắm context" — CLAUDE.md đã đủ kiến trúc.
  - *Trong conversation*: file đã **Read, Write, hoặc Edit** rồi thì không Read lại — nội dung đã có trong context bất kể thao tác nào đã thực hiện trên file đó.
  - *Trước khi implement*: không Read lại file để "nhớ lại nội dung" — nếu đã thao tác với file trong session, nội dung mới nhất đã biết. Chỉ Read khi file **chưa từng được đụng đến** trong session hiện tại.
  - *Sau khi Edit/Write*: không Read lại để verify — nội dung mới đã biết từ thao tác edit, và latest code phải được giữ trong context cho các bước tiếp theo.
- **Không chạy** `npx tsc --noEmit` trừ khi user yêu cầu tường minh. Sau khi sửa code, chạy thẳng playwright test — TypeScript errors sẽ bắt được qua test failure.
- **Không đề xuất solution có overhead mà không có lợi ích thực tế** — trước khi đề xuất bất kỳ cơ chế/pattern nào, phải tự kiểm tra: nó giải quyết được vấn đề gì cụ thể, và có thực sự tốt hơn cách hiện tại không. Nếu không chắc, nói thẳng thay vì wrap complexity vô nghĩa.
- **Khi đề xuất solution**, phân tích rõ điểm mạnh và điểm yếu của từng phương án. Nếu chỉ có một phương án khả thi, nói thẳng thay vì tạo false choice.
- **Tự động cập nhật CLAUDE.md** sau bất kỳ thay đổi nào ảnh hưởng đến cấu trúc dự án: thêm/xóa/đổi tên file hoặc thư mục, thêm country mới, thêm service/flow/layer mới, thay đổi quy ước đặt tên, hoặc bất kỳ architectural decision nào chưa được ghi lại.
- **Luôn trả lời và giải thích bằng tiếng Việt** — bao gồm phân tích lỗi, đề xuất giải pháp, giải thích code, và mọi giao tiếp với user. Chỉ dùng tiếng Anh cho tên biến, tên hàm, và code snippet.

---

## Kiến trúc tổng quan

### Cấu trúc thư mục

```
Playwright_API/
├── configs/
│   ├── types.ts                    # Interface CountryConfig
│   ├── country.factory.ts          # getCountryConfig() — switch theo COUNTRY env
│   ├── countries/
│   │   ├── vn.ts                   # Cấu hình VN: hosts, auth, endpoints
│   │   └── th.ts                   # Cấu hình TH: hosts, auth, endpoints
│   └── stg.env.ts                  # Legacy — chỉ dùng cho pick/qc/pack chưa refactor
│
├── test-data/
│   ├── scenario.data.factory.ts       # getScenarioData() — switch theo COUNTRY env
│   ├── vn.scenario.data.ts            # Test data VN: SKU, customer, invoice, payment
│   └── th.scenario.data.ts            # Test data TH: SKU, customer, invoice, payment
│
├── flows/
│   ├── order.flow.ts               # Orchestrate toàn bộ order steps
│   ├── pick.flow.ts                # Picking workflow (chưa refactor)
│   ├── pack.flow.ts                # Packing workflow (chưa refactor)
│   └── qc.flow.ts                  # QC workflow (chưa refactor)
│
├── services/
│   ├── auth.service.ts             # Login, refresh token
│   ├── order.service.ts            # addCart, updateCart, checkout, ...
│   ├── pick.service.ts
│   ├── pack.service.ts
│   └── qc.service.ts
│
├── payloads/
│   ├── order.payload.ts            # OrderPayloadBuilder — build request body từ ScenarioData
│   └── pick.payload.ts             # PickPayloadBuilder — build body/params/headers từ CountryConfig.pick
│
├── clients/
│   └── apiClient.ts                # createClient(baseURL, token, authType)
│
├── fixtures/
│   └── flow.fixture.ts             # Resolve country, tạo flows, inject { orderFlow, pickFlow, ... }
│
├── tests/
│   ├── placeOrder.spec.ts          # Chạy với --project=VN/TH/KH — country-agnostic
│   ├── fullFlow.spec.ts
│   └── multiOrder.spec.ts
│
├── errors/
│   └── api.error.ts                # ApiError, assertStatus()
│
├── constants/
│   └── status-code.ts              # HTTP_STATUS, RESPONSE_CODE, ERROR_MSG
│
└── utils/
    ├── api-helper.ts
    ├── assertions.ts
    ├── fullflow-summary.ts
    ├── session.ts
    ├── sku.util.ts
    └── teardown.ts
```

### Phân layer (trên → dưới)

```
tests/       → chỉ chứa expect(). Không biết HTTP, không biết config.
fixtures/    → resolve CountryConfig, tạo Flow, inject vào test qua { orderFlow }
flows/       → gom các bước nghiệp vụ, log từng step, KHÔNG có expect()
services/    → mỗi method = 1 HTTP call, throw ApiError nếu status ngoài expected
payloads/    → build request body từ ScenarioData, tách khỏi HTTP logic
clients/     → createClient(baseURL, token, authType) → trả APIRequestContext
```

**Luồng dữ liệu:**

```
fixture
  └── getCountryConfig()      → CountryConfig (hosts, auth, endpoints)
  └── getScenarioData()          → ScenarioData  (SKU, customer, invoice, payment)
        │
        ▼
  OrderFlow(config, data)
        │
        ▼
  OrderService
        └── OrderPayloadBuilder(data)
              └── addCartBody(), updateCartBody(), checkoutBody()
```

**Quy tắc cứng:**
- `expect()` chỉ sống trong `tests/`. Flows và services không được import `expect`.
- `ApiError` được throw từ service, catch-and-rethrow trong flow.
- Flow không bao giờ import từ `@playwright/test` ngoại trừ types.
- Mọi giá trị config (URL, token, endpoint path) đều đến từ `CountryConfig` — không hard code trong service hay flow.

### Cơ chế chọn country

Country được resolve tại runtime theo thứ tự ưu tiên:
1. `process.env.COUNTRY` — CI hoặc set thủ công
2. `testInfo.project.name` — từ `--project=VN` hoặc `--project=TH`
3. `'VN'` — fallback mặc định

Được xử lý trong `fixtures/flow.fixture.ts`, ghi vào `process.env.COUNTRY` trước khi gọi factory.

Hai factory song song, cùng đọc `process.env.COUNTRY`:

| Factory | Trả về | Chứa |
|---------|--------|------|
| `configs/country.factory.ts` → `getCountryConfig()` | `CountryConfig` | hosts, auth, endpoints |
| `test-data/scenario.data.factory.ts` → `getScenarioData()` | `ScenarioData` | SKU, customer, invoice, payment |

File config và test-data đi theo cặp theo từng country (đặt thẳng trong `test-data/`, không có subfolder):
- `configs/countries/vn.ts` + `test-data/vn.scenario.data.ts`
- `configs/countries/th.ts` + `test-data/th.scenario.data.ts`
- `configs/countries/kh.ts` + `test-data/kh.scenario.data.ts`

### Quy ước test file

Spec file đặt thẳng trong `tests/`, không phân subfolder theo country. Country được chọn qua `--project`:

```
npx playwright test tests/placeOrder.spec.ts --project=VN
npx playwright test tests/placeOrder.spec.ts --project=TH
npx playwright test tests/placeOrder.spec.ts          # chạy tất cả project
```

Import trong spec file dùng prefix `../` (một cấp) để trỏ về root project.

### Payload builder

Service không tự build request body/params/headers inline. Mọi construction đều delegate sang PayloadBuilder (trong `payloads/`):

| Service | Builder | Khởi tạo từ |
|---|---|---|
| `OrderService` | `OrderPayloadBuilder` | `ScenarioData` (SKU, customer, invoice...) |
| `PickService` | `PickPayloadBuilder` | `CountryConfig.pick` (warehouseCode, employee, payment...) |

```
OrderService constructor
  └── new OrderPayloadBuilder(getScenarioData())
        └── addCartBody(), updateCartBody(), checkoutBody()

PickService constructor
  └── new PickPayloadBuilder(this.cfg.pick)
        └── confirmOrderBody(), checkInPickBody(), pickItemBody()...
```

### Error handling

`errors/api.error.ts` export:
- `ApiError` — mang theo `step`, `status`, `url`, `body`
- `assertStatus(response, [HTTP_STATUS.OK, ...], 'stepName')` — gọi sau mỗi HTTP call trong service

`constants/status-code.ts` export `HTTP_STATUS`, `RESPONSE_CODE`, `ERROR_MSG` — dùng thay cho raw number hoặc string trong services.

---

## Quy tắc bắt buộc

### 1. Test data độc lập theo từng country

Mỗi country có file test data riêng, **không được dùng chung hay import chéo**:

```
test-data/
  vn.scenario.data.ts   ← chỉ dùng cho VN
  th.scenario.data.ts   ← chỉ dùng cho TH
  kh.scenario.data.ts   ← chỉ dùng cho KH (khi có)
```

- Mỗi file implement cùng interface `ScenarioData` nhưng **không kế thừa hay extend lẫn nhau**.
- Nếu hai country có SKU/customer giống nhau, vẫn phải khai báo riêng — không share object.
- `scenario.data.factory.ts` là điểm duy nhất switch giữa các file; ngoài factory ra không được import trực tiếp file data của country khác.

### 2. Service không import service khác

Service chỉ được import từ: `clients/`, `configs/`, `errors/`, `constants/`, `utils/`, `payloads/`. **Không được import service khác** (`OrderService`, `PackService`, `PickService`...).

Cross-service orchestration (ví dụ: PACK conflict teardown trong checkInPick) thuộc về **flow layer**, không phải service.

```typescript
// SAI — trong pick.service.ts
import { PackService } from './pack.service.js';   // ❌ cross-service import

// ĐÚNG — logic teardown nằm trong pick.flow.ts
import { PackService } from '../services/pack.service.js';  // ✓ flow có thể import nhiều services
```

Hệ quả: mỗi service độc lập, import chain từ spec đến service không bao giờ kéo theo dependency của service khác. Đây là lý do `placeOrder.spec.ts` chạy được mà không cần `stg.env.ts` — toàn bộ chain dùng `CountryConfig`.

### 3. Log style — không dùng emoji

Console log trong service và flow chỉ dùng text thuần. Format chuẩn: `'methodName | mô tả: value'`.

```typescript
// ĐÚNG
console.log('checkInPick | status:', response.status());
console.warn('getOrderInfo | no data for orderId:', orderId);
console.log('getSO | not ready, wait 3s');

// SAI
console.log('✅ Check In OK');
console.warn('⚠️ No order data');
console.log('🔁 Retry...');
```

### 3. Request body/params/headers phải ở trong PayloadBuilder

Service không được build object body/params/headers inline. Mọi construction phải nằm trong PayloadBuilder tương ứng (trong `payloads/`).

```typescript
// ĐÚNG
const response = await client.post(endpoint, { data: this.payload.checkInPickBody(zone) });

// SAI
const response = await client.post(endpoint, {
  data: { zoneCode: zone, status: 'CHECK_IN_ZONE', jobType: 'PICK', wareHouseCode: this.warehouseCode }
});
```

**Lưu ý casing đặc biệt:** Một số API yêu cầu `wareHouseCode` (capital H) thay vì `warehouseCode`. Sự khác biệt này phải được ghi chú và giữ nguyên trong PayloadBuilder — không được "normalize" tùy tiện.

### 5. Spec phụ thuộc nhau phải chain qua flow — không hard code orderId

Spec của các bước sau (pick, pack, qc) phải lấy dữ liệu đầu vào bằng cách chạy bước trước qua flow, không hard code orderId hay bất kỳ runtime ID nào.

```typescript
// ĐÚNG — pick.spec.ts lấy orderId từ placeOrder
test('Pick Order', async ({ orderFlow, pickFlow }) => {
  const { orderId } = await orderFlow.placeOrder();   // ← chain từ bước trước
  const result      = await pickFlow.pickOrder(orderId);
});

// SAI
test('Pick Order', async ({ pickFlow }) => {
  const result = await pickFlow.pickOrder('1587488'); // ❌ hard code orderId
});
```

Lợi ích: test luôn dùng đơn hàng mới, tránh conflict với đơn cũ đã ở trạng thái khác.

### 6. Flow được inject qua fixture — không tạo instance trong spec

Spec file chỉ nhận flow qua fixture, không tự khởi tạo flow hay config.

```typescript
// ĐÚNG
test('Pick Order', async ({ orderFlow, pickFlow }) => { ... });

// SAI
test('Pick Order', async ({ request }) => {
  const cfg = getCountryConfig();           // ❌ config logic trong spec
  const pickFlow = new PickFlow(request);   // ❌ flow instance trong spec
});
```

Khi thêm flow mới (qc, pack): thêm fixture tương ứng vào `fixtures/flow.fixture.ts`, không tạo instance trực tiếp trong spec.

### 6. Không hard code

Cấm đặt giá trị cụ thể trực tiếp trong service, flow, hoặc fixture. Mọi giá trị phải đến từ nguồn có thể cấu hình:

| Loại giá trị | Nguồn đúng | Ví dụ sai |
|---|---|---|
| Base URL, host | `CountryConfig.hosts` | `'https://api-vn.buymed.com'` |
| Endpoint path | `CountryConfig.endpoints` | `'/api/v1/cart/add'` |
| Token, credentials | `CountryConfig.auth` hoặc env var | `'Bearer abc123'` |
| SKU, product ID | `ScenarioData` | `'SKU-001'` |
| Customer info | `ScenarioData` | `{ phone: '0901234567' }` |
| HTTP status code | `HTTP_STATUS` từ `constants/` | `200`, `400` |
| Error message | `ERROR_MSG` từ `constants/` | `'Invalid token'` |
| Response code | `RESPONSE_CODE` từ `constants/` | `'SUCCESS'` |

**Ngoại lệ hợp lệ:** Giá trị kỹ thuật không thay đổi theo country như timeout (ms), retry count, log format.

---

## Template refactor service/flow mới

Áp dụng khi refactor pack (và các flow kho vận sau này). Mỗi mục là checklist — tick từng bước theo thứ tự.

### 1. CountryConfig — thêm section mới

Trong `configs/types.ts`, thêm optional section (luôn optional vì không phải country nào cũng có):
```typescript
pack?: {
  warehouseCode: string;
  zoneCode:      string;
  endpoints: {
    // liệt kê từng endpoint dùng trong PackService
  };
};
```

Trong `configs/countries/vn.ts`, implement giá trị thực:
```typescript
pack: {
  warehouseCode: process.env.LOCATION  || 'BD',
  zoneCode:      process.env.ZONE_CODE || '...',
  endpoints: { ... },
},
```

---

### 2. PayloadBuilder — `payloads/pack.payload.ts`

```typescript
type PackCfg = NonNullable<CountryConfig['pack']>;

export class PackPayloadBuilder {
  constructor(private readonly pack: PackCfg) {}

  // Mỗi method = 1 body / params / headers
  // Ghi chú casing đặc biệt nếu có (wareHouseCode vs warehouseCode)
}
```

---

### 3. Service — `services/pack.service.ts`

Checklist bắt buộc:
- [ ] Constructor: `(_request: APIRequestContext, countryConfig?: CountryConfig)`
- [ ] `private readonly cfg: CountryConfig` + `private readonly payload: PackPayloadBuilder`
- [ ] `private get pack()` getter với guard: `if (!this.cfg.pack) throw new Error(...)`
- [ ] Khởi tạo: `this.cfg = countryConfig ?? getCountryConfig(); this.payload = new PackPayloadBuilder(this.pack);`
- [ ] Mỗi method nhận `basicToken: string` làm param đầu tiên
- [ ] Mọi body/params/headers → delegate sang `this.payload.*`
- [ ] Dùng `assertStatus()` sau mỗi HTTP call
- [ ] **Không import service khác** (`PickService`, `OrderService`...)
- [ ] Log format: `'methodName | mô tả: value'` — không emoji
- [ ] Dùng `HTTP_STATUS` constants, không dùng raw number

---

### 4. Flow — `flows/pack.flow.ts`

Checklist bắt buộc:
- [ ] Constructor: `(request: APIRequestContext, countryConfig?: CountryConfig)`
- [ ] Properties: `private readonly packService: PackService`, `private readonly orderService: OrderService`, `private readonly cfg: CountryConfig`
- [ ] `const basicToken = this.cfg.auth.basicToken` — lấy nội bộ, **không nhận qua param**
- [ ] Method name tường minh: `packOrder(input: PackInput)` thay vì `run()`
- [ ] Export interface: `PackInput` (data nhận từ QcResult), `PackResult`
- [ ] Log: `===== PACK FLOW ${country} START/END =====` và `Step N  | Description     : value`
- [ ] **Không có `expect()`** — chỉ sống trong `tests/`
- [ ] `catch` block:
  - Log `ApiError` message
  - Auto-checkout zone nếu đã check-in (`let checkedIn = false`)
  - Auto `cancelOrder` nếu có orderCode
  - `throw error` để test vẫn fail

---

### 5. Fixture + Spec

Trong `fixtures/flow.fixture.ts`:
```typescript
packFlow: async ({ request }, use, testInfo) => {
  const country = process.env.COUNTRY || testInfo.project.name || 'VN';
  process.env.COUNTRY = country;
  await use(new PackFlow(request, getCountryConfig()));
},
```

Trong `tests/pack.spec.ts`:
```typescript
test('Pack Order', async ({ orderFlow, pickFlow, qcFlow, packFlow }) => {
  const { orderId }  = await orderFlow.placeOrder();
  const pickResult   = await pickFlow.pickOrder(orderId);
  const qcResult     = await qcFlow.qcOrder({ ...pickResult, orderId });
  const result       = await packFlow.packOrder({ ...qcResult, orderId, orderCode: pickResult.orderCode });

  expect(result.xxx).toBeTruthy();
});
```

---

### 6. Cập nhật CLAUDE.md

Sau khi hoàn thành refactor:
- [ ] Cập nhật directory tree (thêm `pack.payload.ts`, `pack.service.ts`, `pack.flow.ts`)
- [ ] Cập nhật "Khu vực chưa hoàn thiện" (xóa mục pack khi đã xong)
- [ ] Thêm vào "Luồng nghiệp vụ đơn hàng" — bảng bước của Pack flow
- [ ] Thêm API Business Logic nếu có message-based branching

---

## Thêm country mới

**Order flow (bắt buộc):**
1. `configs/countries/kh.ts` — implement `CountryConfig` (hosts, auth, endpoints). Bỏ qua `getCartInfoParams` nếu endpoint không cần query params.
2. `test-data/kh.scenario.data.ts` — implement `ScenarioData` độc lập, không import từ vn hay th. Đặt thẳng trong `test-data/`, **không tạo subfolder**.
3. Đăng ký trong cả hai factory: `configs/country.factory.ts` và `test-data/scenario.data.factory.ts`.
4. Uncomment KH project trong `playwright.config.ts`.
5. Nếu flow KH khác VN/TH (ít/nhiều bước): thêm method riêng trong `OrderFlow` và dispatch trong `placeOrder()`. Không cần tạo spec file mới.

**Kho vận (nếu KH có pick/qc/pack):**
6. Thêm `pick?`, `qc?`, `pack?` sections vào `configs/countries/kh.ts` với endpoint và config tương ứng.
7. Service/flow/payload đã country-agnostic — không cần tạo file mới, chỉ cần config đúng là chạy được.

---

## Khu vực chưa hoàn thiện

- `OrderFlow.placeOrder()` hiện dùng chung cho VN, TH và KH (cùng 7 bước). Nếu KH cần flow khác về sau, thêm dispatch logic trong `placeOrder()`.
- `configs/countries/th.ts` — `auth.basicToken` và một số endpoint còn TODO chưa confirm; chưa có section `pick`/`qc`/`pack` nên warehouse flow (pick/qc/pack) chưa chạy được cho TH.
- `test-data/th.scenario.data.ts` — `checkoutPaymentCode`/`checkoutPaymentCardList` còn để trống, cần bổ sung khi có dữ liệu thật.
- `configs/countries/kh.ts` — `auth.username`/`auth.password` đang fallback đúng y hệt giá trị của TH (copy-paste sót) → login KH hiện fail "Wrong password" vì tài khoản đó không hợp lệ cho môi trường KH. Cần credential thật cho KH (qua env `API_USERNAME`/`API_PASSWORD` hoặc sửa fallback). `basicToken` và các endpoint cũng còn TODO chưa confirm; chưa có section `pick`/`qc`/`pack`.
- `test-data/kh.scenario.data.ts` — `customerRegionCode` để trống (chưa có giá trị thật, xem TODO trong file); `checkoutPaymentCode`/`checkoutPaymentCardList` cũng còn để trống.
- `clients/apiClient.ts` — mỗi lần gọi `createClient()` đều tạo `APIRequestContext` mới qua `request.newContext()` và không bao giờ `dispose()`, kể cả trong các polling loop (`getSO`, `getOrderSku`, `getZoneAndLocation` trong `pick.service.ts`). Không gây lỗi với test run ngắn nhưng là resource leak cần lưu ý nếu tăng quy mô.
- `services/pack.service.ts` `packComplete()` chấp nhận cả `HTTP_STATUS.FORBIDDEN` (403) như status hợp lệ — cần confirm lại đây có phải là idempotency workaround chủ đích hay không trước khi coi là chuẩn.
- `bookShipper` (BookShipperFlow/Service) hiện chỉ có config cho VN (`configs/countries/vn.ts` — `carrierId: 160`, `carrierName: 'NV Công Ty - HCM'`, gắn với hub `NVCTHCM`). TH/KH chưa có section `bookShipper` nên flow book shipper chưa chạy được cho 2 country này. `ScenarioData.deliveryWeight` (dùng cho field `weight` trong `createDelivery` body) hiện dùng chung giá trị test `0.254` cho cả 3 country — TH/KH cần xác nhận giá trị thật.
- `flows/bookshipper.flow.ts` Step 2 (`selectDelivery`) đang lấy `driverId`/`driverName` từ response bằng field đoán (`carrier?.data?.driverId`) — TODO trong code, chưa confirm response thật của endpoint `/backend/delivery/transporting/v1/carrier` có trả về đúng field này không.

> Đã xử lý gần đây: KH đã được đăng ký đầy đủ trong cả `country.factory.ts` và `scenario.data.factory.ts`, project `KH` đã uncomment trong `playwright.config.ts` — `npx playwright test tests/placeOrder.spec.ts --project=KH` chạy được tới tận API thật (dừng ở bước login do credential sai, không phải lỗi code/data).

> Đã xử lý (không còn là "chưa hoàn thiện" nữa): `pack.flow.ts`/`pack.service.ts` đã refactor xong sang `CountryConfig`; `configs/stg.env.ts` và `core/apiRequest.ts` đã bị xóa khỏi repo; QC flow đã có teardown tự động (catch block trong `qc.flow.ts` gọi `checkoutQc()` + `cancelOrder()`); `checkInPick` trong `pick.flow.ts` giờ tự xử lý conflict cho cả session QC và PACK (gọi `qcService.checkoutQc()`/`packService.packCheckout()`, tự cancel đơn cũ nếu bị block bởi phiếu SOBD dang dở, rồi retry).

---

## Luồng nghiệp vụ đơn hàng

### Vòng đời đơn hàng (Order Lifecycle)

Một đơn hàng đi qua các bước theo thứ tự sau — mỗi bước là một flow độc lập, chain kết quả cho bước tiếp theo:

```
PlaceOrder → Pick → QC → Pack → (Hoàn thành)
```

#### 1. PlaceOrder (7 bước — `order.flow.ts`)

Khách hàng đặt hàng. Hệ thống tạo đơn hàng và trả về `orderId`.

| Bước | API | Mục đích |
|---|---|---|
| Login | `POST /authentication` | Lấy bearer token |
| Check Cart | `PUT /cart/select` | Đánh dấu giỏ hàng |
| Get Cart Info | `GET /cart/info` | Lấy `cartNo` và danh sách SKU |
| Remove Cart | `PUT /cart/remove` | Xóa hàng cũ (nếu có) |
| Add Cart | `POST /cart/add` | Thêm sản phẩm vào giỏ |
| Update Cart | `PUT /cart` | Cập nhật thanh toán, giao hàng, hoá đơn |
| Checkout | `PUT /cart/checkout` | Xác nhận đặt hàng → nhận `orderId` |

**Output:** `{ orderId, cartNo, tokenWeb }`

---

#### 2. Pick (16 bước — `pick.flow.ts`)

Sau khi đặt hàng, đơn rớt xuống kho. Nhân viên kho đi lấy hàng (pick) theo phiếu.

| Bước | API | Mục đích |
|---|---|---|
| Get Order Info | `GET /order/list` | Lấy `price` và `orderCode` từ `orderId` |
| Confirm Order | `PUT /order/note-plf` | Xác nhận thanh toán — đơn mới được duyệt |
| Wait 5s | — | Chờ hệ thống tạo SO |
| Get SO | `GET /order/list` (poll) | Lấy `saleOrderCode` (SOBD...) — retry tối đa 10 lần |
| Get Order SKU | `GET /sale-orders` (poll) | Lấy `ticketId`, danh sách SKU cần pick — retry tối đa 6 lần |
| Check Pick Ticket | `POST /pick-ticket/active/check` | Kiểm tra phiếu pick hợp lệ |
| Active Pick Ticket | `PUT /pick-ticket/active` | Kích hoạt phiếu — chờ 8s trước khi gọi |
| Get Zone & Location | `GET /pick-ticket-item` (poll) | Lấy `zone` và `locationCode` — retry tối đa 5 lần |
| Check In Pick | `POST /staff-zone-session/check` | Check-in vào zone PICK |
| Assign Pick Staff | `PUT /pick-ticket/assign-manual` | Gán nhân viên vào phiếu → nhận `subTicketId` |
| Get OTL | `GET /location` | Lấy mã rổ (OTL) còn trống |
| Use Basket | `POST /basket/use` | Gắn rổ vào phiếu pick |
| Check Pick Items | `POST /scan-ticket-item` (loop SKU) | Scan từng SKU xác nhận đã lấy |
| Complete Pick | `PUT /sub-pick-ticket/complete` | Hoàn thành phiếu pick con |
| Complete Pick SO | `PUT /pick-ticket/pick-quantity` | Hoàn thành phiếu pick tổng |
| Checkout Pick | `POST /staff-zone-session/check` | Check-out khỏi zone PICK |

**Output:** `{ so, orderCode, zone, subTicketId, otlCode, ticketId, get_sku_codes }`

---

#### 3. QC — Quality Control (5 bước — `qc.flow.ts`)

Nhân viên QC kiểm tra hàng đã pick: đúng SKU, đúng số lượng, đúng lô/hạn dùng. Sau đó chuyển sang Pack.

| Bước | API | Mục đích |
|---|---|---|
| Check In QC Zone | `POST /staff-zone-session/check` | Check-in vào zone QC |
| Pick Ticket | `GET /pick-ticket` | Lấy thông tin phiếu QC theo SO |
| Scan QR Loop | `GET /qrcode` + `PUT /scan-ticket-item/scan` (loop SKU) | Sinh QR → lấy metadata → scan từng sản phẩm |
| Done QC → Pack | `PUT /pick-ticket/v2/update` | Đánh dấu QC xong, chuyển trạng thái sang WAIT_TO_PACK |
| Checkout QC | `POST /staff-zone-session/check` | Check-out khỏi zone QC |

**Output:** `{ so, scanned, skipped }`

**Lưu ý Scan QR Loop:** QR code được sinh theo công thức từ metadata SKU (productId, seller, sellerCodeLength). Sau đó gọi API lấy QR data, rồi dùng data đó build body scan. Xem chi tiết trong `QcPayloadBuilder.generateQrCode()` và `QcPayloadBuilder.scanQrBody()`.

---

### Exception cases đã xác nhận

#### Kẹt zone session (xảy ra ở Pick Step 9 — checkInPick)

Nguyên nhân: test run trước fail giữa chừng, nhân viên vẫn còn đang check-in ở một zone khác (PACK hoặc QC).

```
checkInPick → 400
  ├── "công việc PACK" → gọi packService.packCheckout() → retry
  └── "công việc QC"  → gọi qcService.checkoutQc() → retry
```

#### Kẹt phiếu dang dở (xảy ra khi checkoutQc bị block)

Nguyên nhân: QC flow fail sau `checkInQcZone` nhưng trước `checkoutQc`. Phiếu SOBD vẫn còn trạng thái processing, server không cho checkout.

```
checkoutQc → 400
  └── "Nhân viên còn phiếu SOBD..." → PHẢI cancel/complete đơn hàng đó trên STG
```

**Cách xử lý hiện tại:** Thủ công trên STG — tìm đơn hàng theo SOBD code → cancel.
**Lý do cần cancel cả đơn (không chỉ phiếu):** Server ràng buộc phiếu QC với trạng thái đơn hàng. Chỉ cancel phiếu không đủ — phải cancel đơn để giải phóng lock.

---

## API Business Logic

Ghi lại logic nghiệp vụ không hiển nhiên — những nơi mà **nội dung response body** (không phải HTTP status) quyết định flow tiếp theo.

### `checkInPick` — xử lý zone session conflict

**Endpoint:** `POST /warehouse/core/v1/staff-zone-session/check` với `status: 'CHECK_IN_ZONE'`

HTTP status không đủ để phân biệt lỗi — phải đọc `message` trong body:

| HTTP | `message` chứa | Ý nghĩa | Xử lý |
|---|---|---|---|
| 200 | — | Check-in thành công | Tiếp tục flow |
| 400 | `'công việc PACK'` | Nhân viên đang trong PACK session | Gọi `packService.packCheckout()` → retry checkIn |
| 400 | `'công việc QC'` | Nhân viên đang trong QC session | Gọi `qcService.checkoutQc()` → retry checkIn |
| 400 | khác | Lỗi business thật | Throw `ApiError` |

Logic xử lý nằm ở **flow layer** (`pick.flow.ts`), không phải service. `PickService.checkInPick()` chỉ thực hiện HTTP call đơn thuần và trả về response thô.

**Khi `packCheckout()` trả về message chứa SOBD code (phiếu PACK dang dở):**

Nhân viên còn đơn PACK chưa hoàn thành. Response chứa SOBD code (ví dụ: `SOBD123456`). Xử lý bằng chung một helper với nhánh QC (`PickFlow.checkoutZoneWithRetry()` trong `pick.flow.ts`):

1. Extract SOBD code từ error message bằng regex `/SOBD\d+/`
2. Convert `SOBD123456` → `orderIdOld = '123456'`
3. Gọi `pickService.getOrderInfo(basicToken, orderIdOld)` để lấy `orderCode`
4. Gọi `orderService.cancelOrder(basicToken, orderIdOld, orderCode)` → cancel đơn bị kẹt
5. Retry `packCheckout` → 200 OK
6. Retry `checkInPick` → tiếp tục flow bình thường

---

### `checkoutQc` — xử lý phiếu QC chưa hoàn thành

**Endpoint:** `POST /backend/warehouse/core/v1/staff-zone-session/check` với `status: 'CHECK_OUT_ZONE'`

| HTTP | `message` chứa | Ý nghĩa | Xử lý |
|---|---|---|---|
| 200 | — | Checkout thành công | Tiếp tục flow |
| 400 | `'Nhân viên còn phiếu SOBD...'` | Còn phiếu QC chưa hoàn thành | Phải hoàn thành/cancel phiếu đó trước |
| 400 | khác | Lỗi business thật | Throw `ApiError` |

**Khi `checkoutQc` trả về `'Nhân viên còn phiếu SOBD...'` trong lúc conflict resolution (Step 9):**

Phiếu QC cũ của đơn trước còn dang dở. Flow tự động xử lý:
1. Extract SOBD code từ error message bằng regex `/SOBD\d+/`
2. Convert `SOBD123456` → `orderIdOld = '123456'`
3. Gọi `pickService.getOrderInfo(basicToken, orderIdOld)` để lấy `orderCode`
4. Gọi `orderService.cancelOrder(basicToken, orderIdOld, orderCode)` → cancel đơn bị kẹt
5. Retry `checkoutQc` → 200 OK
6. Retry `checkInPick` → tiếp tục flow bình thường

**Khi QC flow fail giữa chừng (bất kỳ bước nào sau checkInQcZone):**

`qc.flow.ts` catch block tự động cleanup để lần chạy sau không bị block:
1. `checkoutQc()` — thoát khỏi QC zone (nếu đã check-in)
2. `cancelOrder()` — cancel đơn hàng hiện tại (dùng `orderId` và `orderCode` từ `QcInput`)

> Cleanup được swallow lỗi (try/catch bên trong) — mục tiêu chỉ là giải phóng môi trường, không làm mất đi original error.
