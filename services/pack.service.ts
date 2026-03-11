import { APIRequestContext, APIResponse } from "@playwright/test";
import { createClient } from "../clients/apiClient";
import config from "../configs";

export class PackService {


    async getLocation(): Promise<string> {
        const location = config.location;
        return location;
    }

    /**
    * PACK-01 - Check in Pack Zone (Retry max 3 times)
    */
    async packCheckin(location: string): Promise<APIResponse> {
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
            warehouseCode: location
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
    async packPacking(ticketId: string, location: string) {
        const client = await createClient(
            config.hostOrder,
            config.basicToken,
            'basic'
        );


        const url = `/warehouse/picking/v1/pick-ticket/v2/update`;

        const body = {
            ticketId,
            status: "PACKING",
            warehouseCode: location
        };

        const response = await client.put(url, { data: body });
        return response;
    }

    /**
    * PACK-03
    * Get available BIN
    */
    async getBin(location: string) {
        const client = await createClient(
            config.hostOrder,
            config.basicToken,
            'basic'
        );
        const query = {
            warehouseCode: location,
            type: "BIN",
            isUsed: false
        };

        const url =
            `/warehouse/inventory/v1/location?q=${encodeURIComponent(
                JSON.stringify(query)
            )}`;
        const response = await client.get(url);

        const body = await response.json();

        if (!body || !body.data || body.data.length === 0) {
            console.warn("⚠ No BIN found in response");
            return { response, bin: null };
        }

        const bin = body.data[0].name;

        console.log("✓ BIN extracted:"+ bin);

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
        location: string,
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
            warehouseCode: location,
            ticketId: ticketId,
            basketType: "DELIVERY",
            basketCode: bin
        };

        const response = await client.post(url, {
            data: body
        });

        return response;
    }
    /**
    * PACK-05
    * Update Ticket (WAIT_TO_DELIVERY)
    */
    async updateTicket(
        ticketId: string,
        so: string,
        location: string
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
            warehouseCode: location
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
        location: string
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
            warehouseCode: location
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
    async packCheckout(location: string) {

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
            warehouseCode: location
        };

        const response = await client.post(url, {
            data: body
        });

        return response;
    }
}