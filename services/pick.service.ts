import { createClient } from "../clients/apiClient";
import config from "../configs";
import { APIResponse } from '@playwright/test';

export class PickService {

    async getOrderInfo(
        basicToken: string,
        orderId: string
    ) {

        const client = await createClient(
            config.hostInternal,
            basicToken,
            'basic'
        );

        const params = {
            q: JSON.stringify({
                orderId: orderId
            })
        };
        const response = await client.get(
            `/backend/marketplace/order/v2/order/list`,
            { params }
        );

        const body = await response.json();
        const price = body?.data?.[0]?.totalPrice;

        return {
            response,
            price
        };

    }
    /**
    * Confirm Order
    * PUT /marketplace/order/v2/order/note-plf
    */
    async confirmOrder(
        orderId: string,
        price: number
    ) {

        const client = await createClient(
            config.hostOrder,
            config.basicToken,
            'basic'
        );

        const body = {
            BankCode: "333",
            BankAccountNumber: "0314758651",
            Remark: `NHAN TU 104866682689 TRACE 237883 ND QR - ${orderId} - Nguyen Huu Tho - MD`,
            Amount: price,
            BankChannel: "OCB",
            BankingTransactionCode: "Ma transaction"
        };

        const response = await client.put(
            "/marketplace/order/v2/order/note-plf",
            {
                data: body
            }
        );

        return response;
    }
    /**
    * Get SO
    * GET /backend/marketplace/order/v2/order/list
    */
    async getSO(
        basicToken: string,
        orderId: string
    ) {

        const client = await createClient(
            config.hostInternal,
            basicToken,
            "basic"
        );

        let so: string | undefined;

        for (let i = 1; i <= 6; i++) {

            const params = {
                q: JSON.stringify({
                    orderId: orderId
                })
            };

            const response = await client.get(
                "/backend/marketplace/order/v2/order/list",
                { params }
            );

            console.log("Get SO Status: " + response.status());

            const json = await response.json();

            so = json?.data?.[0]?.saleOrderCode;

            if (so) {

                console.log("SO ready on attempt " + i);
                return so;
            }

            console.log("SO not ready → wait 3s");

            await new Promise(r =>
                setTimeout(r, 3000)
            );
        }

        throw new Error(
            "SO not found after retry for orderId: " + orderId
        );
    }
    /**
    * Get Order SKU
    * GET /warehouse/core/v1/sale-orders
    */
    async getOrderSku(
        basicToken: string,
        so: string
    ) {


        const client = await createClient(
            config.hostOrder,
            basicToken,   // ✅ use passed token
            'basic'
        );

        let jsonData: any;
        let firstOrder: any;

        // Retry until ticket + sku exist
        for (let i = 1; i <= 6; i++) {

            const response = await client.get(
                "/warehouse/core/v1/sale-orders",
                {
                    params: {
                        saleOrderCode: so,
                        wareHouseCode: config.location
                    }
                }
            );

            console.log("Status: " + response.status());

            const text = await response.text();

            // Detect HTML response
            if (!text.startsWith("{")) {

                console.log("\n❌ Response is NOT JSON");
                console.log(text.substring(0, 300));

                throw new Error("Get Order SKU returned HTML instead of JSON");
            }

            jsonData = JSON.parse(text);

            firstOrder = jsonData?.data?.[0];

            const ready =
                firstOrder?.pickTicketInfos?.length > 0 &&
                firstOrder?.orderLines?.length > 0 &&
                firstOrder?.orderLines?.[0]?.pickItems?.length > 0;

            if (ready) {
                console.log("Order SKU ready on attempt " + i);
                break;
            }

            console.log("Waiting 3s after Get Order SKU...");
            await new Promise(r => setTimeout(r, 3000));
        }

        if (!firstOrder?.pickTicketInfos?.length) {

            console.log("\n❌ Pick Ticket not ready");
            console.log(JSON.stringify(jsonData, null, 2));

            throw new Error("Pick ticket not ready");
        }

        return {

            ticketId:
                firstOrder.pickTicketInfos[0].pickTicketId,

            so:
                firstOrder.orderLines[0].saleOrderCode,

            sku:
                firstOrder.orderLines[0].pickItems[0].sku,

            quantity:
                firstOrder.orderLines[0].pickItems[0].quantity,

            skuList:
                firstOrder.orderLines[0].pickItems
        };
    }
    /**
    * Check Pick Ticket
    * POST /backend/warehouse/picking/v1/pick-ticket/active/check
    */
    async checkPickTicket(
        basicToken: string,
        ticketId: string,
    ) {

        const client = await createClient(
            config.hostInternal,
            basicToken,
            "basic"
        );
        const response = await client.post(
            "/backend/warehouse/picking/v1/pick-ticket/active/check",
            {
                data: {
                    ticketIdList: [Number(ticketId)],
                    warehouseCode: config.location
                }
            }
        );
        return response;
    }


    /**
 * Active Pick Ticket
 * PUT /warehouse/picking/v1/pick-ticket/active
 */
    async activePickTicket(
        basicToken: string,
        ticketId: string,
    ) {

        console.log("Waiting 6s before Active Pick Ticket...");
        await new Promise(r => setTimeout(r, 6000));

        const client = await createClient(
            config.hostOrder,
            basicToken,
            "basic"
        );

        const url =
            "/warehouse/picking/v1/pick-ticket/active";

        const body = {
            ticketId: Number(ticketId),
            isManualActive: true,
            warehouseCode: config.location
        };

        const response = await client.put(url, {
            data: body
        });

        const json = await response.json();

        console.log("Message: " + json.message);

        console.log("=======================================\n");

        return response;
    }
    /**
    * Get Zone and Location
    * GET /backend/warehouse/picking/v1/pick-ticket-item
    */
    async getZoneAndLocation(
        basicToken: string,
        so: string
    ): Promise<{
        response: APIResponse,
        zone: string,
        locationCode: string
    }> {

        const client = await createClient(
            config.hostInternal,
            basicToken,
            "basic"
        );

        let response!: APIResponse;
        let json: any;

        for (let i = 1; i <= 3; i++) {

            console.log(`Get Zone and Location Attempt ${i}...`);

            response = await client.get(
                "/backend/warehouse/picking/v1/pick-ticket-item",
                {
                    params: {
                        saleOrderCode: so,
                        warehouseCode: config.location
                    }
                }
            );

            console.log("Status:", response.status());
            console.log("Body:", await response.text());

            if (response.status() === 200) {
                json = await response.json();
                break;
            }

            await new Promise(r => setTimeout(r, 3000));
        }

        const zone =
            json?.data?.[0]?.locationDetails?.[0]?.zone;

        const locationCode =
            json?.data?.[0]?.locationDetails?.[0]?.locationCode;

        return {
            response,
            zone,
            locationCode
        };
    }
}
