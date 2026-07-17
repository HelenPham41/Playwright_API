import { test, expect } from '../fixtures/flow.fixture.js';
import { clearRequestLog, requestLog } from '../clients/apiClient.js';
import { RESPONSE_CODE } from '../constants/status-code.js';
import { getScenarioData } from '../test-data/scenario.data.factory.js';

test('Reconcile Shipper Flow', async ({
    orderFlow,
    pickFlow,
    qcFlow,
    packFlow,
    bookShipperFlow,
    deliveryFlow,
    reconcileShipperFlow,
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
        type: 'trackingNumber',
        description: bookResult.trackingNumber,
    });

    //──────────────────────────────────────────────
    // Step 6 - Delivery
    //──────────────────────────────────────────────
    const scenarioData = getScenarioData();

    const deliveryResult = await test.step(
        'Delivery',
        () =>
            deliveryFlow.delivery({
                ticketId: Number(pickResult.ticketId),
                so: bookResult.so,
                deliveryCode: bookResult.deliveryCode,
                shippingOrderCode: bookResult.shippingOrderCode,
                trackingNumber: bookResult.trackingNumber,
                driverId: Number(bookResult.driverId),
                driverName: bookResult.driverName,
                customer: {
                    address: scenarioData.customerShippingAddress,
                    businessName: scenarioData.businessName,
                    code: Number(scenarioData.businessCode),
                    deliveryMode: scenarioData.deliveryMethod,
                    district: scenarioData.customerDistrictName,
                    districtCode: scenarioData.customerDistrictCode,
                    name: scenarioData.customerName,
                    province: scenarioData.customerProvinceName,
                    provinceCode: scenarioData.customerProvinceCode,
                    ward: scenarioData.customerWardName,
                    wardCode: scenarioData.customerWardCode,
                },
                image: {
                    dataImage: scenarioData.dataImage ?? '',
                    fileName: scenarioData.fileName ?? '',
                    refType: scenarioData.refType ?? '',
                },
                signature: {
                    dataSignature: scenarioData.dataSignature ?? '',
                    fileName: scenarioData.fileName ?? '',
                    refType: scenarioData.refType ?? '',
                },
            }),
    );

    testInfo.annotations.push({
        type: 'deliveryStatus',
        description: deliveryResult.deliveryStatus,
    });

    //──────────────────────────────────────────────
    // Step 7 - Reconcile Shipper
    //──────────────────────────────────────────────
    const reconcileResult = await test.step(
        'Reconcile Shipper',
        () =>
            reconcileShipperFlow.reconcileShipper({
                so: bookResult.so,
                orderId,
                trackingCode: bookResult.trackingNumber,
                riderToken: deliveryResult.riderToken,
            }),
    );

    testInfo.annotations.push({
        type: 'paymentCode',
        description: reconcileResult.paymentCode,
    });

    testInfo.annotations.push({
        type: 'reconcileStatus',
        description: reconcileResult.reconcileStatus,
    });

    //Book Shipper Assertions
    expect(bookResult.assignDriverMessage).toBe('Gán tài xế thành công');

    expect(bookResult.transportActionName).toBe(
        'Đã nhập kho Hub VSIP II - BÌNH DƯƠNG',
    );
    expect(bookResult.transportType).toBe('TRANSPORTING');
    expect(bookResult.transportStatus).toBe('WAIT_TO_DELIVERY');
    expect(bookResult.transportProductivityAction).toBe('ASSIGN_DELIVERY');
    expect(bookResult.transportTrackingCode).toBeTruthy();

    expect(deliveryResult.referenceCode).toBe(`${bookResult.so}-F`);
    expect(deliveryResult.deliveryStatus).toBe('DELIVERED');

    //──────────────────────────────────────────────
    // Delivery Assertions
    //──────────────────────────────────────────────
    expect(deliveryResult.referenceCode).toBe(`${bookResult.so}-F`);
    expect(deliveryResult.deliveryStatus).toBe('DELIVERED');

    //──────────────────────────────────────────────
    // Reconcile Shipper Assertions
    //──────────────────────────────────────────────
    expect(reconcileResult.paymentCode).toBeTruthy();

    expect(reconcileResult.confirmPaymentStatus).toBe(RESPONSE_CODE.OK);

    expect(reconcileResult.confirmPaymentMessage).toBeTruthy();

    expect(reconcileResult.activityPrimaryKey).toBe(reconcileResult.paymentCode);

    expect(reconcileResult.activityStatus).toBe('WAIT_TO_APPROVE');

    expect(reconcileResult.approveStatus).toBe(RESPONSE_CODE.OK);

    expect(reconcileResult.reconcileStatus).toBe('DONE');

    expect(reconcileResult.approveCode).toBe(reconcileResult.paymentCode);
});