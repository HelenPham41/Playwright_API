import { test, expect } from '../fixtures/flow.fixture.js';
import { clearRequestLog } from '../clients/apiClient.js';

// Test thăm dò cho TH — chỉ chứa các bước TH hiện có config.
// Chạy: npx playwright test tests/completeflow_TH.spec.ts --project=TH
// Chạy xong bước nào OK thì bổ sung config (th.ts) + step tiếp theo vào đây.

test('Flow - Place Order → Pick → QC → Pack (COD)', async ({
    orderFlow_COD,
    pickFlow,
    qcFlow,
    packFlow,
}, testInfo) => {

    clearRequestLog();

    //──────────────────────────────────────────────
    // Step 1 - Place Order
    //──────────────────────────────────────────────
    const { orderId } = await test.step(
        'Place Order',
        () => orderFlow_COD.placeOrder(),
    );

    testInfo.annotations.push({
        type: 'orderId',
        description: orderId,
    });

    expect(orderId).toBeTruthy();

    //──────────────────────────────────────────────
    // Step 2 - Pick
    //──────────────────────────────────────────────
    const pickResult = await test.step(
        'Pick Order',
        () => pickFlow.pickOrder(orderId),
    );

    testInfo.annotations.push({
        type: 'so',
        description: pickResult.so,
    });

    expect(pickResult.so).toBeTruthy();

    //──────────────────────────────────────────────
    // Step 3 - QC
    //──────────────────────────────────────────────
    const qcResult = await test.step(
        'QC Order',
        () =>
            qcFlow.qcOrder({
                ...pickResult,
                orderId,
            }),
    );

    expect(qcResult.scanned).toBeGreaterThan(0);

    //──────────────────────────────────────────────
    // Step 4 - Pack
    //──────────────────────────────────────────────
    const packResult = await test.step(
        'Pack Order',
        () =>
            packFlow.packOrder({
                so: pickResult.so,
                ticketId: pickResult.ticketId,
                orderId,
                orderCode: pickResult.orderCode,
            }),
    );

    testInfo.annotations.push({
        type: 'bin',
        description: packResult.bin ?? 'N/A',
    });
});
