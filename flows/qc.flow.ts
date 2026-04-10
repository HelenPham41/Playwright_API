import type { APIRequestContext } from '@playwright/test';
import { QcService } from "../services/qc.service.js";
import { handleApiResponse } from '../utils/api-helper.js';
import { teardownQC } from '../utils/teardown.js';
import { OrderService } from '../services/order.service.js';
import { PickService } from '../services/pick.service.js';



export class QcFlow {

    private qcService = new QcService();
    private orderService: OrderService;
    private pickService: PickService;


     constructor(private request: APIRequestContext) {
        this.orderService = new OrderService(request);
        this.pickService = new PickService(request); 
    }


    async run(
        basicToken: string,
        pickResult: {
            so: string
            ticketId: string
            orderId?: string   // ✅ optional (better)
        }
    ) {

        console.log("\n==============================");
        console.log("========== QC FLOW ==========");
        console.log("==============================");

        const { so, ticketId, orderId = "" } = pickResult;

        let location = "";
        let zoneCode = "";
        let orderCode = so; // ✅ fallback

        try {
            location = await this.qcService.getLocation();
            zoneCode = await this.qcService.getZoneCode();

            console.log("SO from PickFlow:" + so);
            console.log("Location:" + location);
            console.log("Zone Code:" + zoneCode);

       
                const orderInfo = await this.pickService.getOrderInfo(basicToken, orderId);
                orderCode = orderInfo.orderCode;
  

            /**
             * Step 1 - Check In QC Zone
             */
            const checkIn = await this.qcService.checkInQcZone(location, zoneCode);
            console.log("Status:" + checkIn.status());
            await handleApiResponse(checkIn, [200]);

            /**
             * Step 2 - Pick Ticket
             */
            const ticket = await this.qcService.pickTicket(so, location);
            await handleApiResponse(ticket.response, [200]);

            /**
             * Step 3 - Scan QR
             */
            const result = await this.qcService.processSkuQrLoop(
                basicToken,
                so,
                ticketId,
                location,
            );

            console.log(`
                Total SKU: ${result.total}
                Scanned: ${result.scanned}
                Skipped: ${result.skipped}
            `);

            /**
             * Step 4 - Done QC
             */
            const qcResult = await this.qcService.doneQcMoveToPack(
                basicToken,
                ticketId,
                so,
                location
            );
            await handleApiResponse(qcResult, [200]);

            /**
             * Step 5 - Checkout QC
             */
            const checkout = await this.qcService.checkoutQc(
                basicToken,
                location,
                zoneCode
            );
            await handleApiResponse(checkout, [200]);

            console.log("======= QC FLOW DONE ========");

        } catch (error: any) {

            console.error("❌ QC flow failed:", error?.message);

            // ✅ teardown ALWAYS safe now
            await teardownQC(
                this.orderService,
                this.qcService,
                basicToken,
                orderId,
                ticketId,
                orderCode,
                location,
                zoneCode
            );

            throw error;
        }
    }
}