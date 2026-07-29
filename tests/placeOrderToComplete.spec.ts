import { test, expect } from '../fixtures/flow.fixture.js';
import { clearRequestLog } from '../clients/apiClient.js';
import { getScenarioData } from '../test-data/scenario.data.factory.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { RESPONSE_CODE, HTTP_STATUS } from '../constants/status-code.js';

// Test thăm dò cho TH — chỉ chứa các bước TH hiện có config.
// Chạy: npx playwright test tests/placeOrderToComplete.spec.ts --project=TH
// Chạy xong bước nào OK thì bổ sung config (th.ts) + step tiếp theo vào đây.

test('Flow - Place Order → Pick → QC → Pack → Book Shipper → Delivery → Reconcile Shipper → Reconcile Accounting (COD)', async ({
    orderFlow_COD,
    pickFlow,
    qcFlow,
    packFlow,
    bookShipperFlow,
    deliveryFlow,
    reconcileShipperFlow,
    reconcileAccountingFlow_COD,
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

    expect(bookResult.trackingNumber).toBeTruthy();

    //──────────────────────────────────────────────
    // Step 6 - Delivery
    //──────────────────────────────────────────────
    const scenarioData = getScenarioData();
    const cfg = getCountryConfig();
    const expectedReferenceCode = cfg.delivery?.minimalFlow
        ? bookResult.so
        : `${bookResult.so}-F`;

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

    testInfo.annotations.push({
        type: 'referenceCode',
        description: deliveryResult.referenceCode,
    });

    expect(deliveryResult.referenceCode).toBe(expectedReferenceCode);

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

    expect(reconcileResult.paymentCode).toBeTruthy();
    expect(reconcileResult.confirmPaymentStatus).toBe(RESPONSE_CODE.OK);
    expect(reconcileResult.reconcileStatus).toBe('DONE');

    //──────────────────────────────────────────────
    // Step 8 - Reconcile Accounting
    //──────────────────────────────────────────────
    const reconcileAccountingResult = await test.step(
        'Reconcile Accounting',
        () =>
            reconcileAccountingFlow_COD.reconcileAccounting({
                orderId: Number(orderId),
                so: bookResult.so,
                trackingCode: bookResult.trackingNumber,
                riderToken: deliveryResult.riderToken,
            }),
    );

    testInfo.annotations.push({
        type: 'reconcileAccountingCode',
        description: reconcileAccountingResult.reconcileCode,
    });

    testInfo.annotations.push({
        type: 'reconcileAccountingStatus',
        description: reconcileAccountingResult.reconcileStatus,
    });

    expect(reconcileAccountingResult.reconcileCode).toBeTruthy();
    expect(reconcileAccountingResult.confirmStatus).toBe(HTTP_STATUS.OK);
    expect(reconcileAccountingResult.approveStatus).toBe(HTTP_STATUS.OK);
    expect(reconcileAccountingResult.reconcileStatus).toBe('DONE');
    expect(reconcileAccountingResult.completedSaleOrderCode).toBe(bookResult.so);
    expect(reconcileAccountingResult.completedStatus).toBe('COMPLETED');
});
