import { expect, APIRequestContext, request } from "@playwright/test";
import config from "../configs";
import { PackService } from "../services/pack.service";
import { OrderService } from "../services/order.service";
import { PickService } from "../services/pick.service";
import { teardownOrder } from "../utils/teardown";
import { handleApiResponse } from '../utils/api-helper';

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

        const orderInfo = await pickService.getOrderInfo(basicToken, Number(orderId));
        const orderCode = orderInfo.orderCode;

        /**
         * PACK-01 Checkin pack zone
         */
        const packCheckinResponse =
            await this.packService.packCheckin(location);

        await handleApiResponse(packCheckinResponse, [200]);

        console.log("Pack Checkin PASS:", packCheckinResponse.status());


        /**
         * PACK-02 Update ticket status to PACKING
         */
        const packPackingResponse =
            await this.packService.packPacking(ticketId, location);

        await handleApiResponse(packPackingResponse, [200]);

        console.log("Pack Packing PASS:", packPackingResponse.status());


        /**
         * PACK-03 Get BIN
         */
        const getBinResult =
            await this.packService.getBin(location);

        await handleApiResponse(getBinResult.response, [200]);

        const bin = getBinResult.bin;

        console.log("BIN:", bin);


        /**
         * PACK-04 Add Basket
         */
        const addBasketResponse =
            await this.packService.addBasket(
                location,
                ticketId,
                bin
            );

        if (addBasketResponse.status !== 200) {

            console.log("PACK-04 FAILED + Status:", addBasketResponse.status);

            // 🔴 Run teardown
            await teardownOrder(
                orderService,
                this.packService,
                basicToken,
                orderId,
                ticketId,
                orderCode
            );

            throw new Error(
                `PACK-04 Add Basket failed | Status: ${addBasketResponse.status} | URL: ${addBasketResponse.url}`
            );
        }

        console.log("Add Basket PASS:", addBasketResponse.status);


        /**
         * PACK-05 Update Ticket
         */
        const updateTicketResponse =
            await this.packService.updateTicket(
                ticketId,
                so,
                location
            );

        await handleApiResponse(updateTicketResponse, [200]);

        console.log("Update Ticket PASS:", updateTicketResponse.status());


        /**
         * PACK-06 Pack Complete
         */
        const packCompleteResponse =
            await this.packService.packComplete(
                ticketId,
                location
            );

        await handleApiResponse(packCompleteResponse, [200, 403]);

        console.log("Pack Complete PASS:", packCompleteResponse.status());


        /**
         * PACK-07 Pack Checkout
         */
        const packCheckoutResponse =
            await this.packService.packCheckout(location);

        await handleApiResponse(packCheckoutResponse, [200]);

        console.log("Pack Checkout PASS:", packCheckoutResponse.status());

    }
}