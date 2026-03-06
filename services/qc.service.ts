import { createClient } from "../clients/apiClient";
import config from "../configs";
import { APIResponse, request } from '@playwright/test';

export class QcService {

    async getZoneCode(): Promise<string> {
        const zoneCode = config.zoneCode;
        return zoneCode;
    }
    async getLocation(): Promise<string> {
        const location = config.location;
        return location;
    }

    /**
     * Check in QC Zone
     * POST /backend/warehouse/core/v1/staff-zone-session/check
     */
    async checkInQcZone(
        location: string,
        zoneCode: string
    ) {

        const client = await createClient(
            config.hostWeb,
            config.basicToken,
            'basic'
        );

        const url = `/backend/warehouse/core/v1/staff-zone-session/check`;

        const body = {
            status: "CHECK_IN_ZONE",
            jobType: "QC",
            warehouseCode: location,
            zoneCode: zoneCode
        };

        console.log(`\n[QC] Check In QC Zone`);
        // console.log(`URL: ${config.hostWarehouse}${url}`);
        // console.log(`BODY:`, body);

        const response = await client.post(url, {
            data: body
        });

        const responseBody = await response.json();

        // console.log(`RESPONSE:`, responseBody);

        return response;
    }
    
    /**
    * Pick Ticket
    * GET /backend/warehouse/picking/v1/pick-ticket
     */
    async pickTicket(
        so: string,
        location: string
    ) {

        const client = await createClient(
            config.hostInternal,
            config.basicToken,
            'basic'
        );

        const url = `/backend/warehouse/picking/v1/pick-ticket`;

        const query = {
            statuses: [
                "WAIT_QC_CONFIRM",
                "QC_PROCESSING",
                "WAIT_TO_PACK"
            ],
            so: so,
            warehouseCode: location
        };

        console.log(`\n[QC] Pick Ticket`);
        // console.log(`URL: ${config.hostWarehouse}${url}`);
        // console.log(`QUERY:`, query);

        const response = await client.get(url, {
            params: {
                q: JSON.stringify(query)
            }
        });

        const responseBody = await response.json();

        // console.log(`RESPONSE:`, responseBody);

        return {
            response,
            data: responseBody
        };
    }

    /**
    * Process SKU QR Loop
    * GET QR code info and then call Scan QR API in loop with retry mechanism
    */
    async processSkuQrLoop(
        basicToken: string,
        so: string,
        ticketId: string,
        location: string,
        skuList: any[]
    ) {

        const internalClient = await createClient(
            config.hostInternal,
            basicToken,
            "basic"
        );

        const webClient = await createClient(
            config.hostWeb,
            basicToken,
            "basic"
        );

        let maxFail = 2;
        let failCount = 0;

        let scanned = 0;
        let skipped = 0;

        for (let index = 0; index < skuList.length; index++) {

            const item = skuList[index];

            console.log(`\n▶ Processing SKU ${index + 1}/${skuList.length}`);

            /**
             * Generate QR
             */
            const sellerLength = item.sellerCodeLength || 0;
            const random = Math.floor(Math.random() * 10);

            let qr;

            if (sellerLength < 10) {
                qr =
                    `P07${item.product_id}S0${sellerLength}${item.seller}` +
                    `L01AE06010130V018R06PO8998U21T101770212989C01AI01${random}`;
            } else {
                qr =
                    `P07${item.product_id}S${sellerLength}${item.seller}` +
                    `L01AE06010130V018R06PO8998U21T101770212989C01AI01${random}`;
            }

            console.log(`Generated QR: ${qr}`);

            /**
             * GET QR CODE API
             */
            let qrResponse;

            try {

                qrResponse = await internalClient.get(
                    `/backend/operation/qr/v1/qrcode`,
                    {
                        params: {
                            code: qr,
                            warehouseCode: location
                        }
                    }
                );

            } catch (error: any) {

                console.error("❌ Get QR request failed");

                skipped++;
                continue;
            }

            /**
             * Check response status
             */
            if (!qrResponse || qrResponse.status() !== 200) {

                console.log("⏭ Skip Scan because GET QR status != 200");

                skipped++;
                continue;
            }

            /**
             * IMPORTANT
             * Playwright APIResponse must use json()
             */
            const qrJson = await qrResponse.json();

            const qrData = qrJson?.data?.[0];

            if (!qrData) {

                console.log("⏭ Skip Scan because QR data empty");

                skipped++;
                continue;
            }

            /**
             * Build scan request body
             */
            const scanBody = {
                ticketId: ticketId,
                so: so,
                scannedQuantity: item.reservedQuantity,
                isCheckUniqueId: true,

                qr: {
                    uniqueId: qrData.uniqueId,
                    version_no: qrData.versionNo,
                    status: qrData.status,
                    lot: qrData.lot,
                    poCode: qrData.receiptCode,
                    index: qrData.index,
                    prdId: qrData.productId,
                    seller_code: qrData.sellerCode,
                    last_updated_time: qrData.lastUpdatedTime,
                    ex_date: qrData.expiredDate,
                    logs: null,
                    created_time: qrData.createdTime,
                    generated_time: qrData.generatedTime,
                    machine_code: qrData.machineCode,
                    sku: qrData.sku,
                    vat: qrData.vat
                },

                lot: qrData.lot,
                ex_date: qrData.expiredDate,
                sku: qrData.sku,
                isExpired: false,
                warehouseCode: location
            };

            /**
             * SCAN QR API
             */
            try {

                await webClient.put(
                    `/backend/warehouse/picking/v1/scan-ticket-item/scan`,
                    { data: scanBody }
                );

                console.log(`✅ Scan success SKU ${index + 1}`);

                scanned++;
                failCount = 0;

            } catch (err) {

                failCount++;

                console.error(`❌ Scan failed (${failCount}/${maxFail})`);

                if (failCount >= maxFail) {
                    console.error("🛑 Max scan failures reached");
                    break;
                }

                index--; // retry same SKU
            }

            /**
             * Same as JMeter Constant Timer
             */
            await new Promise(r => setTimeout(r, 2000));
        }

        return {
            total: skuList.length,
            scanned,
            skipped
        };
    }

    /**
    * Done QC -> Move to Pack
    * Same as JMeter "Done QC, move to Pack"
    */
    async doneQcMoveToPack(
        basicToken: string,
        ticketId: string,
        so: string,
        location: string
    ) {

        const client = await createClient(
            config.hostInternal,
            basicToken,
            "basic"
        );

        const url = `/backend/warehouse/picking/v1/pick-ticket/v2/update`;

        console.log("\n📦 Move QC -> PACK");
        console.log("URL:", config.hostInternal + url);

        const body = {
            status: "WAIT_TO_PACK",
            ticketId: ticketId,
            so: so,
            warehouseCode: location
        };

        try {

            const response = await client.put(url, {
                data: body
            });

            const qcStatus =
                response.status() === 200
                    ? "Completed"
                    : "Failed";

            console.log("QC Status:", qcStatus);

            return {
                status: qcStatus,
                httpStatus: response.status
            };

        } catch (error: any) {

            console.error("❌ Move QC -> Pack failed");

            return {
                status: "Failed",
                httpStatus: error.response?.status
            };
        }
    }

    /**
    * Checkout QC Zone
    * Same as JMeter "Checkout QC"
    */
    async checkoutQc(
        basicToken: string,
        location: string,
        zoneCode: string
    ) {

        const client = await createClient(
            config.hostInternal,
            basicToken,
            "basic"
        );

        const url = `/backend/warehouse/core/v1/staff-zone-session/check`;

        console.log("\n🚪 Checkout QC Zone");
        console.log("URL:", config.hostInternal + url);

        const body = {
            status: "CHECK_OUT_ZONE",
            jobType: "QC",
            warehouseCode: location,
            zoneCode: zoneCode
        };

        const response = await client.post(url, {
            data: body
        });

        return response;
    }

}