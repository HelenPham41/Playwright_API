import { expect } from '@playwright/test';
import { PickService } from "../services/pick.service";

export class PickFlow {

    private pickService = new PickService();
    private otlCode!: string;

    async run(
        basicToken: string,
        orderId: string
    ) {

        console.log("\n==============================");
        console.log("========= PICK FLOW =========");
        console.log("==============================");

        const warehouseCode = await this.pickService.getWarehouseCode();
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
        expect([200])
            .toContain(orderInfo.response.status());

        console.log("\nStep 1: Get Order Info success");

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

        const locationItemCode =
            zoneAndLocationResponse.locationCode;

        console.log("Zone:", zone);
        console.log("Location Item Code:", locationItemCode);

        // ✅ Validate Data
        expect(zone).toBeTruthy();
        expect(locationItemCode).toBeTruthy();

        /**
        * Step 9: Check in Pick
        */
        console.log('Step 9: Check in Pick');

        const checkInPickResponse =
            await this.pickService.checkInPick(
                basicToken,
                zone,
            );
        // wait 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
        // ✅ Check Status Code
        expect([200])
            .toContain(checkInPickResponse.status());

        console.log('✅ Check in Pick Success');

        /**
        * Step 10: Assign Pick Staff
        */
        const subTicketId =
            await this.pickService.assignPickStaff(
                basicToken,
                skuInfo.ticketId,
                so
            );

        expect(subTicketId).toBeTruthy();

        console.log('subTicketId:', subTicketId);
        /**
        * Step 11: Get OTL
        * GET /warehouse/inventory/v1/location
        */
        const result = await this.pickService.getOTL(basicToken);

        const otlCode = result.firstOTL;

        console.log("Step 11 - OTL Code:", otlCode);

        // ✅ Check Status Code
        expect([200]).toContain(result.response.status());

        /**
        * Step 12: Use Basket
        * POST /warehouse/picking/v1/sub-pick-ticket/basket/use
        */
        const useBasketResponse = await this.pickService.useBasket(
            basicToken,
            Number(subTicketId),
            otlCode
        );

        expect(useBasketResponse.status()).toBe(200);

        console.log("Step 12 - Use Basket success");

        /**
        * Step 13: Check Pick Items
        */
        const checkPickItemsResult = await this.pickService.checkPickItems(
            basicToken,
            subTicketId,
            locationItemCode,
            so
        );

        // validate response
        if (!checkPickItemsResult.response) {
            throw new Error("Check Pick Items response is null");
        }

        expect([200]).toContain(checkPickItemsResult.response.status());

        console.log("Step 13 - Check Pick Items done");

        /**
        * Step 14: Complete Pick
        */

        const completePickResult = await this.pickService.completePick(
            basicToken,
            Number(subTicketId),
        );

        expect([200]).toContain(completePickResult.status());

        console.log("Step 14 - Complete Pick success");

        /**
        * Step 15: Complete Pick for SO
        */

        const completePickSOResult = await this.pickService.completePickForSO(
            basicToken,
            so,
        );

        expect([200]).toContain(completePickSOResult.status());

        console.log("Step 15 - Complete Pick for SO success");

        /**
        * Step 16: Checkout Pick
        */

        const checkoutPickResult = await this.pickService.checkoutPick(
            basicToken,
            zone,
        );

        expect([200]).toContain(checkoutPickResult.status());

        console.log("Step 16 - Checkout Pick success");
        console.log("\n========= PICK FLOW DONE =========\n");

        return {
            orderInfo,
            confirmResult,
            so,
            skuInfo,
            zone,
            subTicketId,
            otlCode
        };
    }
}