import { test, expect } from '../fixtures/flow.fixture.js';
import { clearRequestLog } from '../clients/apiClient.js';

// Test thăm dò cho TH — chỉ chứa các bước TH hiện có config.
// Chạy: npx playwright test tests/completeflow_TH.spec.ts --project=TH
// Chạy xong bước nào OK thì bổ sung config (th.ts) + step tiếp theo vào đây.

test('Complete Order Flow TH ', async ({
    orderFlow_COD,
    pickFlow,
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
});
