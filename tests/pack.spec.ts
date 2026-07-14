import { test, expect } from '../fixtures/flow.fixture.js';
import { clearRequestLog, requestLog } from '../clients/apiClient.js';

/**
 * E2E Full Flow: PlaceOrder → Pick → QC → Pack
 *
 * Luồng nghiệp vụ hoàn chỉnh từ đặt hàng đến đóng gói.
 * Mỗi step nhận output của step trước — KHÔNG chạy độc lập được.
 *
 * Fixture inject (từ fixtures/flow.fixture.ts):
 *   orderFlow, pickFlow, qcFlow, packFlow — mỗi flow đã được khởi tạo
 *   với CountryConfig đúng theo --project=VN/TH/KH.
 *
 * Report (reporters/html-summary.reporter.ts):
 *   testInfo.annotations → truyền business data (orderId, SO, BIN, SKU)
 *   và HTTP log sang custom reporter để render trong reports/*.html.
 */

test('Pack Order', async ({ orderFlow, pickFlow, qcFlow, packFlow }, testInfo) => {

  // Xóa HTTP log trước mỗi run — cần thiết khi repeatEach > 1 để tránh log bị cộng dồn
  clearRequestLog();

  // ── Step 1: Place Order ──────────────────────────────────────────────────
  // Login → AddCart → Checkout → trả về orderId
  const { orderId } = await test.step('Place Order', () => orderFlow.placeOrder());
  testInfo.annotations.push({ type: 'orderId', description: orderId });

  // ── Step 2: Pick ─────────────────────────────────────────────────────────
  // Xác nhận đơn → lấy SO → check-in zone → pick từng SKU → checkout
  const pickResult = await test.step('Pick Order', () => pickFlow.pickOrder(orderId));
  testInfo.annotations.push({ type: 'so',  description: pickResult.so });
  testInfo.annotations.push({ type: 'sku', description: pickResult.get_sku_codes.map((s: any) => s.sku).join(', ') });

  // ── Step 3: QC ───────────────────────────────────────────────────────────
  // Check-in QC zone → scan QR từng SKU → move to Pack → checkout
  // pickResult spread vào để QC flow có đủ: so, ticketId, orderCode, get_sku_codes
  await test.step('QC Order', () => qcFlow.qcOrder({ ...pickResult, orderId }));

  // ── Step 4: Pack ─────────────────────────────────────────────────────────
  // Check-in Pack → gán BIN → đóng gói → checkout
  const result = await test.step('Pack Order', () => packFlow.packOrder({
    so:        pickResult.so,
    ticketId:  pickResult.ticketId,
    orderId,
    orderCode: pickResult.orderCode,
  }));
  testInfo.annotations.push({ type: 'bin', description: result.bin ?? 'N/A' });

  // Đẩy toàn bộ HTTP log vào annotation — reporter render thành bảng API Detail
  testInfo.annotations.push({ type: 'httpLog', description: JSON.stringify(requestLog) });

  // ── Assertions ───────────────────────────────────────────────────────────
  expect(result.so,  'SO should be returned').toBeTruthy();
  expect(result.bin, 'BIN should be assigned').toBeTruthy();
});