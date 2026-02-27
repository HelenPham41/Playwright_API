import { expect } from '@playwright/test';
import { PickService } from "../services/pick.service";

export class PickFlow {

    private pickService = new PickService();

    async run(
        basicToken: string,
        orderId: string
    ) {

        console.log("\n==============================");
        console.log("========= PICK FLOW =========");
        console.log("==============================");


        /**
         * Step 1 - Get Order Info
         */
        console.log("\nStep 1: Get Order Info");

        const orderInfo = await this.pickService.getOrderInfo(
            basicToken,
            orderId
        );

        console.log("OrderId: " + orderId);
        console.log("Price: " + orderInfo.price);


        /**
         * Step 2 - Confirm Order
         */
        console.log("\nStep 2: Confirm Order");

        const confirmResult = await this.pickService.confirmOrder(
            orderId,
            orderInfo.price
        );

        console.log(
            "Confirm Order Status: " +
            confirmResult.status()
        );

        expect([200])
            .toContain(confirmResult.status());


        /**
         * Step 3 - Wait before Get SO
         */
        console.log("\nWaiting 5s before Get SO...");
        await new Promise(r => setTimeout(r, 5000));


        /**
         * Step 4 - Get SO
         */
        console.log("\nStep 4: Get SO");

        const so = await this.pickService.getSO(
            basicToken,
            orderId
        );

        console.log("SO: " + so);

        expect(so)
            .toBeTruthy();


        /**
         * Step 5 - Get Order SKU
         */
        console.log("\nStep 5: Get Order SKU");

        const skuInfo = await this.pickService.getOrderSku(
            basicToken,
            so
        );

        console.log("TicketId: " + skuInfo.ticketId);
        console.log("SKU: " + skuInfo.sku);
        console.log("Quantity: " + skuInfo.quantity);
        console.log("SKU Count: " + skuInfo.skuList.length);

        expect(skuInfo.ticketId)
            .toBeTruthy();

        expect(skuInfo.sku)
            .toBeTruthy();

        expect(skuInfo.quantity)
            .toBeGreaterThan(0);


        /**
         * Step 6 - Check Pick Ticket
         */
        console.log("\nStep 6: Check Pick Ticket");

        const checkTicketResult =
            await this.pickService.checkPickTicket(
                basicToken,
                skuInfo.ticketId,
            );

        console.log(
            "Check Pick Ticket Status: " +
            checkTicketResult.status()
        );

        expect([200])
            .toContain(checkTicketResult.status());


        /**
         * Step 7 - Active Pick Ticket
         */
        console.log("\nStep 7: Active Pick Ticket");

        const activeTicketResult =
            await this.pickService.activePickTicket(
                basicToken,
                skuInfo.ticketId,
            );

        console.log(
            "Active Pick Ticket: " +
            skuInfo.ticketId +
            " - Status " +
            activeTicketResult.status()
        );

        expect([200])
            .toContain(activeTicketResult.status());

        /**
        * Step 8 - Get Zone and Location
        */
        console.log("\nStep 8: Get Zone and Location");

        const zoneAndLocationResponse =
            await this.pickService.getZoneAndLocation(
                basicToken,
                so
            );

        // ✅ Log Status
        console.log(
            "Get Zone and Location Status:",
            zoneAndLocationResponse.response.status()
        );

        // ✅ Check Status Code
        expect([200])
            .toContain(
                zoneAndLocationResponse.response.status()
            );

        const zone =
            zoneAndLocationResponse.zone;

        const locationCode =
            zoneAndLocationResponse.locationCode;

        console.log("Zone:", zone);
        console.log("Location:", locationCode);

        // ✅ Validate Data
        expect(zone).toBeTruthy();
        expect(locationCode).toBeTruthy();

        console.log("\n========= PICK FLOW DONE =========\n");


        return {
            orderInfo,
            confirmResult,
            so,
            skuInfo
        };

    }

}