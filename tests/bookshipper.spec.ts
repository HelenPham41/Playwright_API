import { test, expect } from '../fixtures/flow.fixture.js';
import { clearRequestLog, requestLog } from '../clients/apiClient.js';
import { RESPONSE_CODE } from '../constants/status-code.js';

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

    testInfo.annotations.push({
        type: 'trackingNumber',
        description: bookResult.trackingNumber,
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
    expect(bookResult.createDeliveryStatus).toBe(RESPONSE_CODE.OK);
    expect(bookResult.trackingNumber).toBeTruthy();
    expect(bookResult.createDeliveryMessage).toBe(
        `Book vận chuyển thành công cho đơn hàng : ${bookResult.so}-F`,
    );

    expect(bookResult.assignDriverStatus).toBe(RESPONSE_CODE.OK);
    expect(bookResult.assignDriverMessage).toBe('Gán tài xế thành công');

    expect(bookResult.transportActionName).toBe(
        'Đã nhập kho Hub VSIP II - BÌNH DƯƠNG',
    );
    expect(bookResult.transportType).toBe('TRANSPORTING');
    expect(bookResult.transportStatus).toBe('WAIT_TO_DELIVERY');
    expect(bookResult.transportProductivityAction).toBe('ASSIGN_DELIVERY');
    expect(bookResult.transportTrackingCode).toBeTruthy();
});