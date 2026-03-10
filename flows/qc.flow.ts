import { expect } from '@playwright/test';
import { QcService } from "../services/qc.service";

export class QcFlow {

    private qcService = new QcService();

    async run(
        basicToken: string,
        pickResult: {
            so: string
            ticketId: string
        }
    ) {

        console.log("\n==============================");
        console.log("========== QC FLOW ==========");
        console.log("==============================");

        // Get values from PickFlow result
        const { so, ticketId} = pickResult;

        const location = await this.qcService.getLocation();
        const zoneCode = await this.qcService.getZoneCode();

        console.log("SO from PickFlow:", so);
        console.log("Location:", location);
        console.log("Zone Code:", zoneCode);;

        /**
         * Step 1 - Check In QC Zone
         */
        console.log("\nStep 1: Check In QC Zone");

        const checkIn = await this.qcService.checkInQcZone(
            location,
            zoneCode
        );

        console.log("Status:", checkIn.status());

        expect([200]).toContain(checkIn.status());

        console.log("Step 1: Check In QC Zone success");

        /**
         * Step 2 - Pick Ticket
         */
        console.log("\nStep 2: Pick Ticket");

        const ticket = await this.qcService.pickTicket(
            so,
            location
        );

        expect([200])
            .toContain(ticket.response.status());
        console.log("\nStep 2: Pick Ticket success");


        /**
        * Step 3 - Get QR and Scan QR Loop
        */
        console.log("\nStep 3: Get QR and Scan QR Loop");

        const result = await this.qcService.processSkuQrLoop(
            basicToken,
            so,
            ticketId,
            location,
        );

        console.log(`
                    Step 3: Get QR and Scan QR Loop
                    Total SKU: ${result.total}
                    Scanned: ${result.scanned}
                    Skipped: ${result.skipped}
                    `);
        /**
        * Step 4 - Done QC move to Pack
        */
        console.log("\nStep 4: Done QC -> Move to Pack");

        const qcResult = await this.qcService.doneQcMoveToPack(
            basicToken,
            ticketId,
            so,
            location
        );
        /**
        * Step 5 - Checkout QC
        */
        console.log("\nStep 5: Checkout QC");

        const checkout = await this.qcService.checkoutQc(
            basicToken,
            location,
            zoneCode
        );

        expect([200])
            .toContain(checkout.status());

        console.log("\nStep 5: Checkout QC success");

        console.log("\n==============================");
        console.log("======= QC FLOW DONE ========");
        console.log("==============================");

    }

}