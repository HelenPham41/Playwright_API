import { test, expect } from '../fixtures/flow.fixture.js';
import { clearRequestLog, requestLog } from '../clients/apiClient.js';

test('Book Shipper Flow', async ({
    orderFlow,
    pickFlow,
    qcFlow,
    packFlow,
    bookShipperFlow,
}, testInfo) => {

    clearRequestLog();

    //──────────────────────────────────────────────
    // Step 1 - Place Order
    //──────────────────────────────────────────────
    const { orderId } = await test.step(
        'Place Order',
        () => orderFlow.placeOrder(),
    );

    testInfo.annotations.push({
        type: 'orderId',
        description: orderId,
    });

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

    //──────────────────────────────────────────────
    // Step 3 - QC
    //──────────────────────────────────────────────
    await test.step(
        'QC Order',
        () =>
            qcFlow.qcOrder({
                ...pickResult,
                orderId,
            }),
    );

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

    //──────────────────────────────────────────────
    // Step 5 - Book Shipper
    //──────────────────────────────────────────────
    const bookResult = await test.step(
        'Book Shipper',
        () =>
            bookShipperFlow.bookShipper({
                so: pickResult.so,
                ticketId: pickResult.ticketId,
                deliveryBasketCode: ''
            }),
    );

    testInfo.annotations.push({
        type: 'deliveryCode',
        description: bookResult.deliveryCode,
    });

    testInfo.annotations.push({
        type: 'shippingOrderCode',
        description: bookResult.shippingOrderCode,
    });

    testInfo.annotations.push({
        type: 'driverId',
        description: String(bookResult.driverId),
    });

    testInfo.annotations.push({
        type: 'driverName',
        description: bookResult.driverName,
    });

    //──────────────────────────────────────────────
    // HTTP Log
    //──────────────────────────────────────────────
    testInfo.annotations.push({
        type: 'httpLog',
        description: JSON.stringify(requestLog),
    });

    //──────────────────────────────────────────────
    // Assertions
    //──────────────────────────────────────────────
    expect(bookResult.so).toBeTruthy();
    expect(bookResult.deliveryCode).toBeTruthy();
    expect(bookResult.shippingOrderCode).toBeTruthy();
    expect(bookResult.driverId).toBeGreaterThan(0);
    expect(bookResult.driverName).toBeTruthy();
});