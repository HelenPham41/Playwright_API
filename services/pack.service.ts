import type { APIRequestContext, APIResponse } from "@playwright/test";
import { createClient } from "../clients/apiClient.js";
import config from "../configs/index.js";
import { time } from "node:console";

export class PackService {

    async getLocation(): Promise<string> {
        const location = config.location;
        return location;
    }

    /**
    * PACK-01 - Check in Pack Zone (Retry max 3 times)
    */
    async packCheckin(): Promise<APIResponse> {
        const client = await createClient(
            config.hostOrder,
            config.basicToken,
            'basic'
        );


        const url = `/warehouse/core/v1/staff-zone-session/check`;

        const body = {
            zoneCode: "PACK-RFID-01",
            status: "CHECK_IN_ZONE",
            jobType: "PACK",
            warehouseCode: await config.location
        };

        const maxRetry = 3;
        let retryCount = 0;

        while (retryCount < maxRetry) {
            try {

                const response = await client.post(url, { data: body });
                return response;

            } catch (error) {

                retryCount++;

                console.log(
                    `❌ Pack Checkin failed. Retry ${retryCount}/${maxRetry}`
                );

                if (retryCount >= maxRetry) {
                    console.error("🚨 Max retries reached");
                    throw error;
                }
            }
        }

        // 👇 Needed for TypeScript safety
        throw new Error("Pack checkin failed after retries");
    }

    /**
     * PACK-02 - Update ticket status to PACKING
     */
    async packPacking(ticketId: string) {
        const client = await createClient(
            config.hostOrder,
            config.basicToken,
            'basic'
        );


        const url = `/warehouse/picking/v1/pick-ticket/v2/update`;

        const body = {
            ticketId,
            status: "PACKING",
            warehouseCode: await config.location
        };

        const response = await client.put(url, { data: body });
        return response;
    }

    /**
    * PACK-03
    * Get available BIN
    */
    async getBin() {
        const client = await createClient(
            config.hostOrder,
            config.basicToken,
            'basic'
        );
        const query = {
            warehouseCode: await config.location,
            type: "BIN",
            isUsed: false
        };

        const url =
            `/warehouse/inventory/v1/location?q=${encodeURIComponent(
                JSON.stringify(query)
            )}`;
        const response = await client.get(url, { timeout: 3000 });

        const body = await response.json();

        if (!body || !body.data || body.data.length === 0) {
            console.warn("⚠ No BIN found in response");
            return { response, bin: null };
        }

        const bin = body.data[0].name;

        console.log("✓ BIN extracted:" + bin);

        return {
            response,
            bin
        };
    }
    /**
    * PACK-04
    * Add Basket
    */
    async addBasket(
        ticketId: string,
        bin: string
    ) {

        const client = await createClient(
            config.hostOrder,
            config.basicToken,
            'basic'
        );

        const url = `/warehouse/picking/v1/basket/use`;

        const body = {
            warehouseCode: await config.location,
            ticketId: ticketId,
            basketType: "DELIVERY",
            basketCode: bin
        };

        try {

            const response = await client.post(url, {
                data: body,
                timeout: 7000
            });

            return {
                status: response.status(),
                url: config.hostOrder + url,
                response
            };

        } catch (error: any) {

            return {
                status: error.response?.status() || 500,
                url: config.hostOrder + url,
                error: true
            };

        }
    }
    /**
    * PACK-05
    * Update Ticket (WAIT_TO_DELIVERY)
    */
    async updateTicket(
        ticketId: string,
        so: string,
    ) {

        const client = await createClient(
            config.hostOrder,
            config.basicToken,
            'basic'
        );

        const url =
            `/warehouse/picking/v1/pick-ticket/v2/update`;

        const body = {
            status: "WAIT_TO_DELIVERY",
            ticketId: ticketId,
            so: so,
            packageNum: 1,
            packageImages: [],
            warehouseCode: await config.location
        };

        const response = await client.put(url, {
            data: body
        });

        return response;
    }
    /**
    * PACK-06
    * Pack Complete
    */
    async packComplete(
        ticketId: string,
    ) {

        const url =
            "/warehouse/picking/v1/pick-ticket/v2/update";

        const client = await createClient(
            config.hostOrder,
            config.basicToken,
            'basic'
        );


        const body = {
            ticketId: ticketId,
            status: "WAIT_TO_DELIVERY",
            warehouseCode: await config.location
        };

        const response = await client.put(url, {
            data: body
        });

        return response;
    }
    /**
     * PACK-07
     * Pack Checkout
     */
    async packCheckout() {

        const client = await createClient(
            config.hostOrder,
            config.basicToken,
            'basic'
        );

        const url =
            "/warehouse/core/v1/staff-zone-session/check";

        const body = {
            zoneCode: "PACK-RFID-01",
            status: "CHECK_OUT_ZONE",
            jobType: "PACK",
            warehouseCode: await config.location
        };

        const response = await client.post(url, {
            data: body,
            timeout: 3000
        });
        console.log("==== REQUEST ====");
        console.log("URL:", url);
        console.log("METHOD: POST");
        console.log("HEADERS:", {
            Authorization: `Basic ${config.basicToken}`,
            "Content-Type": "application/json"
        });
        console.log("BODY:", JSON.stringify(body, null, 2));
        console.log("=================");
        console.log("BODY:", JSON.stringify(body, null, 2));
        console.log("=================");

        return response;
    }
}