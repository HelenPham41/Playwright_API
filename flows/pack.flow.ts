import { expect, request } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import config from "../configs/index.js";
import { PackService } from "../services/pack.service.js";
import { OrderService } from "../services/order.service.js";
import { PickService } from "../services/pick.service.js";
import { teardownOrder } from "../utils/teardown.js";
import { handleApiResponse } from '../utils/api-helper.js';

export class PackFlow {

    private packService = new PackService();

    async run(
        request: APIRequestContext,
        basicToken: string,
        input: {
            so: string;
            ticketId: string;
            orderId: string;
        }
    ) {

        console.log("\n==============================");
        console.log("========== PACK FLOW =========");
        console.log("==============================");

        const location = await config.location;
        const { so, ticketId, orderId } = input;

        console.log("SO:", so);
        console.log("TicketId:", ticketId);

        const packService = new PackService();
        const pickService = new PickService(request);
        const orderService = new OrderService(request);

        const orderInfo = await pickService.getOrderInfo(basicToken, orderId);
        const orderCode = orderInfo.orderCode;

        /**
         * PACK-01 Checkin pack zone
         */
        const packCheckinResponse =
            await this.packService.packCheckin();

        await handleApiResponse(packCheckinResponse, [200]);

        console.log("Pack Checkin PASS:", packCheckinResponse.status());


        /**
         * PACK-02 Update ticket status to PACKING
         */
        const packPackingResponse =
            await this.packService.packPacking(ticketId);

        await handleApiResponse(packPackingResponse, [200]);

        console.log("Pack Packing PASS:", packPackingResponse.status());


        /**
         * PACK-03 Get BIN
         */
        const getBinResult =
            await this.packService.getBin();

        await handleApiResponse(getBinResult.response, [200]);

        const bin = getBinResult.bin;

        console.log("BIN:", bin);


        /**
         * PACK-04 Add Basket
         */
        const addBasketResponse =
            await this.packService.addBasket(ticketId, bin);

        // ✅ ALWAYS extract status first
        const status = addBasketResponse.status();

        if (status !== 200) {

            let mainError: any;

            // ✅ Pass FULL response (NOT status)
            try {
                await handleApiResponse(addBasketResponse, [200]);
            } catch (err) {
                mainError = err;
            }

            // Run teardown safely (never override main error)
            try {
                await teardownOrder(
                    orderService,
                    this.packService,
                    basicToken,
                    orderId,
                    location,
                    orderCode
                );
            } catch (teardownError) {
                console.error("⚠️ Teardown failed:", teardownError);
            }

            // ✅ Correct status usage
            throw mainError || new Error(
                `PACK-04 failed | Status: ${status}`
            );
        }


        /**
         * PACK-05 Update Ticket
         */
        const updateTicketResponse =
            await this.packService.updateTicket(
                ticketId,
                so,
            );

        await handleApiResponse(updateTicketResponse, [200]);

        console.log("Update Ticket PASS:", updateTicketResponse.status());


        /**
         * PACK-06 Pack Complete
         */
        const packCompleteResponse =
            await this.packService.packComplete(
                ticketId,
            );

        await handleApiResponse(packCompleteResponse, [200, 403]);

        console.log("Pack Complete PASS:", packCompleteResponse.status());


        /**
         * PACK-07 Pack Checkout
         */
        const packCheckoutResponse =
            await this.packService.packCheckout();

        await handleApiResponse(packCheckoutResponse, [200]);

        console.log("Pack Checkout PASS:", packCheckoutResponse.status());

    }
}