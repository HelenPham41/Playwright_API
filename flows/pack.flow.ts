import { expect } from "@playwright/test";
import config from "../configs";
import { PackService } from "../services/pack.service";

export class PackFlow {

    private packService = new PackService();

    async run(
        basicToken: string,
        pickResult: {
            so: string;
            ticketId: string;
        }
    ) {

        console.log("\n==============================");
        console.log("========== PACK FLOW =========");
        console.log("==============================");

        const location = await config.location;

        // Get values from PickFlow result
        const { so, ticketId } = pickResult;

        console.log("SO:"+ so);
        console.log("TicketId:"+ ticketId);

        /**
         * PACK-01
         * Checkin pack zone
         */
        const packCheckinResponse =
            await this.packService.packCheckin(location);

        expect([200]).toContain(packCheckinResponse.status());

        console.log(
            "Pack Checkin PASS:"+
            packCheckinResponse.status()
        );

        console.log("Step 1: Check In Pack Zone success");


        /**
         * PACK-02
         * Update ticket status to PACKING
         */
        const packPackingResponse =
            await this.packService.packPacking(
                ticketId,
                location
            );

        expect([200]).toContain(packPackingResponse.status());

        console.log(
            "Pack Packing PASS:"+
            packPackingResponse.status()
        );

        console.log("Step 2: Update ticket status to PACKING success");


        /**
        * PACK-03
        * Get BIN
        */
        const getBinResult =
            await this.packService.getBin(location);

        expect([200]).toContain(
            getBinResult.response.status()
        );

        console.log(
            "Get BIN PASS:"+
            getBinResult.response.status()
        );

        const bin = getBinResult.bin;

        console.log("BIN:"+ bin);
        console.log("Step 3: Get BIN success");


        /**
        * PACK-04
        * Add Basket
        */
        const addBasketResponse =
            await this.packService.addBasket(
                location,
                ticketId,
                bin
            );

        expect([200]).toContain(
            addBasketResponse.status()
        );

        console.log(
            "Add Basket PASS:"+ addBasketResponse.status()
        );

        console.log("Step 4: Add Basket success");


        /**
        * PACK-05
        * Update Ticket
        */
        const updateTicketResponse =
            await this.packService.updateTicket(
                ticketId,
                so,
                location
            );

        expect([200]).toContain(
            updateTicketResponse.status()
        );

        console.log(
            "Update Ticket PASS:"+ updateTicketResponse.status()
        );

        console.log("Step 5: Update Ticket success");


        /**
        * PACK-06
        * Pack Complete
        */
        const packCompleteResponse =
            await this.packService.packComplete(
                ticketId,
                location
            );

        expect([200, 403]).toContain(
            packCompleteResponse.status()
        );

        console.log(
            "Pack Complete PASS:"+ packCompleteResponse.status()
        );

        console.log("Step 6: Pack Complete success");


        /**
        * PACK-07
        * Pack Checkout
        */
        const packCheckoutResponse =
            await this.packService.packCheckout(location);

        expect([200]).toContain(
            packCheckoutResponse.status()
        );

        console.log(
            "Pack Checkout PASS:"+ packCheckoutResponse.status()
        );

        console.log("Step 7: Pack Checkout success");
    }
}