import { createClient } from "../clients/apiClient";
import config from "../configs";
import { APIResponse, request } from '@playwright/test';
import { extractSkuCodes } from "../utils/sku.util";

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

    async getWarehouseCode(): Promise<string> {
        const wareHouseCode = config.location;
        return wareHouseCode;
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
            basicToken,
            "basic"
        );

        const wareHouseCode = await this.getWarehouseCode();
        const url = "/warehouse/core/v1/sale-orders";

        let jsonData: any;
        let firstOrder: any;
        let get_sku_codes: any[] = [];

        for (let i = 1; i <= 6; i++) {
            const response = await client.get(url, {
                params: {
                    saleOrderCode: so,
                    warehouseCode: wareHouseCode
                }
            });

            const status = response.status();

            const text = await response.text();

            if (status !== 200) {
                console.log("❌ API returned error");
                console.log(text);
                await new Promise(r => setTimeout(r, 3000));
                continue;
            }

            // Ensure JSON response
            if (!text.startsWith("{")) {
                console.log("\n❌ Response is NOT JSON");
                console.log(text.substring(0, 300));
                throw new Error("Get Order SKU returned HTML instead of JSON");
            }

            jsonData = JSON.parse(text);

            // Same as JMeter vars.put("get_sku_codes")
            get_sku_codes = extractSkuCodes(jsonData);

            firstOrder = jsonData?.data?.[0];

            const ready =
                firstOrder?.pickTicketInfos?.length > 0 &&
                firstOrder?.orderLines?.length > 0 &&
                firstOrder?.orderLines?.some((line: any) => line.pickItems?.length > 0);

            if (ready) {
                break;
            }

            console.log("⏳ Waiting 3s after Get Order SKU...");
            await new Promise(r => setTimeout(r, 3000));
        }

        if (!firstOrder?.pickTicketInfos?.length) {

            console.log("\n❌ Pick Ticket not ready");
            console.log(JSON.stringify(jsonData, null, 2));

            throw new Error("Pick ticket not ready");
        }

        const skuList: any[] = [];

        for (const line of firstOrder.orderLines ?? []) {
            for (const item of line.pickItems ?? []) {
                skuList.push({
                    sku: item.sku,
                    quantity: item.quantity,
                    saleOrderCode: line.saleOrderCode
                });
            }
        }
        return {
            ticketId: firstOrder.pickTicketInfos[0].pickTicketId,
            so: firstOrder.orderLines[0].saleOrderCode,
            sku: skuList[0]?.sku,
            quantity: skuList[0]?.quantity,
            skuList,
            get_sku_codes
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
        const wareHouseCode = await this.getWarehouseCode();
        const response = await client.post(
            "/backend/warehouse/picking/v1/pick-ticket/active/check",
            {
                data: {
                    ticketIdList: [Number(ticketId)],
                    warehouseCode: wareHouseCode
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

        console.log("Waiting 8s before Active Pick Ticket...");
        await new Promise(r => setTimeout(r, 8000));

        const client = await createClient(
            config.hostOrder,
            basicToken,
            "basic"
        );
        const wareHouseCode = await this.getWarehouseCode();

        const url =
            "/warehouse/picking/v1/pick-ticket/active";

        const warehouseCode = await this.getWarehouseCode();

        const body = {
            ticketId: Number(ticketId),
            isManualActive: true,
            warehouseCode: wareHouseCode
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
        response: APIResponse;
        zone: string;
        locationCode: string;
    }> {

        const endpoint = "/backend/warehouse/picking/v1/pick-ticket-item";

        const headers = {
            Authorization: `Basic ${basicToken}`,
            Referer: 'https://internal.v2-stg.thuocsi.vn/wms/',
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
            'Content-Type': 'text/plain;charset=UTF-8'
        };
        const wareHouseCode = await this.getWarehouseCode();
        const params = {
            saleOrderCode: so,
            warehouseCode: wareHouseCode
        };

        const client = await createClient(
            config.hostInternal,
            basicToken,
            "basic"
        );


        let response!: APIResponse;

        for (let i = 1; i <= 5; i++) {

            console.log(`Get Zone and Location Attempt ${i}...`);

            response = await client.get(endpoint, {
                params,
                headers
            });

            const json = await response.json();

            const locationDetails = json?.data?.[0]?.locationDetails;

            console.log("ReserveStatus:"+ json?.data?.[0]?.reserveStatus);

            if (locationDetails?.length) {

                const zone = locationDetails[0]?.zone;
                const locationCode = locationDetails[0]?.locationCode;

                console.log("✅ Zone:"+ zone);
                console.log("✅ Location:"+ locationCode);

                return {
                    response,
                    zone,
                    locationCode,
                };
            }

            // wait 3 seconds before next attempt
            await new Promise(r => setTimeout(r, 3000));
        }

        throw new Error(
            `Timeout: locationDetails not generated for SO ${so}`
        );

    }
    /**
    * Check in Pick
    * POST /warehouse/core/v1/staff-zone-session/check
    */
    async checkInPick(
        basicToken: string,
        zone: string,
    ): Promise<APIResponse> {

        const endpoint = '/warehouse/core/v1/staff-zone-session/check';


        const client = await createClient(
            config.hostOrder,
            basicToken,
            'basic'
        );
        const wareHouseCode = await this.getWarehouseCode();

        const body = {
            zoneCode: zone,
            status: 'CHECK_IN_ZONE',
            jobType: 'PICK',
            wareHouseCode: wareHouseCode
        };

        console.log('===== CHECK IN PICK =====');

        const response = await client.post(endpoint, {
            data: body
        });

        console.log('Status:'+ response.status());
        return response;
    }
    /**
    * Assign Pick Staff (Retry Max 3)
    * PUT /warehouse/picking/v1/pick-ticket/assign-manual
    */
    async assignPickStaff(
        basicToken: string,
        ticketId: string,
        so: string
    ): Promise<string> {

        const endpoint = '/warehouse/picking/v1/pick-ticket/assign-manual';

        const client = await createClient(
            config.hostOrder,
            basicToken,
            'basic'
        );
        const wareHouseCode = await this.getWarehouseCode();

        const body = {
            ticketId,
            wareHouseCode,
            so,
            employee: 'seller.core',
            employeeId: 100000039
        };

        console.log('===== ASSIGN PICK STAFF =====');

        for (let retry = 1; retry <= 3; retry++) {

            console.log(`🔁 Attempt #${retry}`);

            const response = await client.put(endpoint, {
                data: body
            });

            const statusCode = response.status();
            console.log('Status:'+ statusCode);

            if (statusCode === 200) {

                const json = await response.json();
                const subTicketId = json?.data?.[0]?.ticketId;

                if (!subTicketId) {
                    throw new Error('subTicketId not found in response');
                }

                console.log('✅ Assign Pick Staff Success');
                return subTicketId;
            }

            if (retry === 3) {
                throw new Error(
                    `Assign Pick Staff failed after 3 attempts. Last status: ${statusCode}`
                );
            }

            // Wait 2 seconds before retry
            await new Promise(res => setTimeout(res, 2000));
        }

        throw new Error('Unexpected error in assignPickStaff');
    }

    /**
    * Get OTL (First Available)
    * GET /warehouse/inventory/v1/location
    */
    async getOTL(basicToken: string) {

        const client = await createClient(
            config.hostOrder,
            basicToken,
            'basic'
        );

        const wareHouseCode = await this.getWarehouseCode();

        const response = await client.get(`/warehouse/inventory/v1/location`, {
            params: {
                q: JSON.stringify({
                    warehouseCode: wareHouseCode,
                    type: "OTL",
                    isUsed: false
                })
            }
        });

        const body = await response.json();

        const firstOTL = body?.data?.[0]?.code;

        if (!firstOTL) {
            throw new Error("❌ OTL list is EMPTY");
        }

        console.log("✅ First OTL:"+ firstOTL);

        return { firstOTL, response };
    }
    /**
    * Use Basket
    * POST /warehouse/picking/v1/sub-pick-ticket/basket/use
    */
    async useBasket(
        basicToken: string,
        subTicketId: number,
        otlCode: string
    ) {

        const client = await createClient(
            config.hostOrder,
            basicToken,
            'basic'
        );

        const wareHouseCode = await this.getWarehouseCode();

        const response = await client.post(
            `/warehouse/picking/v1/sub-pick-ticket/basket/use`,
            {
                data: {
                    basketCode: otlCode,
                    ticketId: subTicketId,
                    warehouseCode: wareHouseCode
                }
            }
        );
        return response;
    }
    /**
    * Check Pick Items
    * Loop through SKU list and call Pick API
    */
    async checkPickItems(
        basicToken: string,
        subTicketId: string,
        locationCode: string,
        so: string
    ) {

        console.log("\n======= START CHECK PICK ITEMS =======");

        const client = await createClient(
            config.hostOrder,
            basicToken,
            "basic"
        );

        // Get SKU list from order
        const orderInfo = await this.getOrderSku(basicToken, so);
        const skuList = orderInfo.skuList;

        const warehouseCode = await this.getWarehouseCode();

        let lastResponse: APIResponse | null = null;

        for (let index = 0; index < skuList.length; index++) {

            const currentItem = skuList[index];

            const sku = currentItem.sku;
            const quantity = currentItem.quantity ?? 0;

            const payload = {
                warehouseCode: warehouseCode,
                name: "",
                ticketId: Number(subTicketId),
                sku: sku,
                pickedQuantity: quantity,
                location: locationCode
            };

            const url = "/warehouse/picking/v1/sub-pick-ticket-item/pick";

            let response: APIResponse | null = null;

            for (let attempt = 1; attempt <= 3; attempt++) {

                console.log(`Attempt ${attempt}`);

                response = await client.post(url, {
                    data: payload
                });

                console.log("Status:"+ response.status());

                const responseText = await response.text();

                if (response.status() === 200) {
                    console.log("✅ Pick item success");
                    break;
                }

                if (attempt < 3) {
                    console.log("Retry after 2s...");
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            if (!response) {
                throw new Error("No response returned from API");
            }

            lastResponse = response;

            // Stop loop if failed
            if (response.status() !== 200) {
                console.log("❌ Pick item failed → stop loop");
                return { response };
            }
        }

        console.log("\n======= CHECK PICK ITEMS DONE =======");

        return { response: lastResponse };
    }

    /**
    * Complete Pick
    * PUT /warehouse/picking/v1/sub-pick-ticket/complete
    */

    async completePick(
        basicToken: string,
        subTicketId: number,
    ): Promise<APIResponse> {

        const client = await createClient(
            config.hostOrder,
            basicToken,
            "basic"
        );

        const url = `/warehouse/picking/v1/sub-pick-ticket/complete`;
        const wareHouseCode = await this.getWarehouseCode();
        const payload = {
            warehouseCode: wareHouseCode,
            ticketId: subTicketId
        };
        for (let attempt = 1; attempt <= 3; attempt++) {

            try {

                const response = await client.put(url, {
                    data: payload
                });

                console.log(
                    `Complete Pick response attempt ${attempt}:`,
                    response.status()
                );

                return response;

            } catch (error) {

                console.log(`❌ Complete Pick retry ${attempt} failed`);

                if (attempt === 3) {
                    throw error;
                }

                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        throw new Error("Complete Pick failed after 3 attempts");
    }

    /**
    * Complete Pick for SO
    * PUT /warehouse/picking/v1/pick-ticket/pick-quantity
    */
    async completePickForSO(
        basicToken: string,
        so: string,
    ): Promise<APIResponse> {

        const client = await createClient(
            config.hostOrder,
            basicToken,
            "basic"
        );
        const orderInfo = await this.getOrderSku(basicToken, so);
        const ticketId = orderInfo.ticketId;

        const url = `/warehouse/picking/v1/pick-ticket/pick-quantity`;
        const wareHouseCode = await this.getWarehouseCode();
        const payload = {
            warehouseCode: wareHouseCode,
            so: so,
            ticketId: ticketId
        };

        for (let attempt = 1; attempt <= 3; attempt++) {

            try {

                const response = await client.put(url, {
                    data: payload
                });

                console.log(
                    `Complete Pick SO attempt ${attempt}:`,
                    response.status()
                );

                return response;

            } catch (error) {

                console.log(`❌ Complete Pick SO retry ${attempt} failed`);

                if (attempt === 3) {
                    throw error;
                }

                await new Promise(r => setTimeout(r, 2000));
            }
        }

        throw new Error("Complete Pick SO failed after 3 attempts");
    }

    /**
  * Step: Checkout Pick
  * POST /warehouse/core/v1/staff-zone-session/check
  */
    async checkoutPick(
        basicToken: string,
        zone: string,
    ): Promise<APIResponse> {

        const client = await createClient(
            config.hostOrder,
            basicToken,
            "basic"
        );

        const url = `/warehouse/core/v1/staff-zone-session/check`;
        const wareHouseCode = await this.getWarehouseCode();
        const payload = {
            zoneCode: zone,
            status: "CHECK_OUT_ZONE",
            jobType: "PICK",
            warehouseCode: wareHouseCode
        };

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {

                const response = await client.post(url, {
                    data: payload
                });

                console.log(
                    `Checkout Pick response attempt ${attempt}:`,
                    response.status()
                );

                return response;

            } catch (error) {

                console.log(`Checkout Pick failed attempt ${attempt}`);

                if (attempt === 3) {
                    throw error;
                }

                console.log("Retrying checkout pick in 2s...");
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        throw new Error("Checkout Pick failed after retries");
    }
}

