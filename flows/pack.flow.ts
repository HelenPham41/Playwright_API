import { PackService } from '../services/pack.service.js';
import { OrderService } from '../services/order.service.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { ApiError } from '../errors/api.error.js';

export interface PackInput {
  so: string;
  ticketId: string;
  orderId: string;
  orderCode: string | undefined;
}

export interface PackResult {
  so: string;
  bin: string | null;
}

export class PackFlow {

  private readonly packService:  PackService;
  private readonly orderService: OrderService;
  private readonly cfg:          CountryConfig;

  constructor(countryConfig?: CountryConfig) {
    this.cfg          = countryConfig ?? getCountryConfig();
    this.packService  = new PackService(this.cfg);
    this.orderService = new OrderService(this.cfg);
  }

  async packOrder(input: PackInput): Promise<PackResult> {
    const basicToken = this.cfg.auth.basicToken;
    const country    = process.env.COUNTRY ?? 'UNKNOWN';
    console.log(`===== PACK FLOW ${country} START =====`);

    const { so, ticketId, orderId, orderCode } = input;
    let checkedIn = false;

    try {
      // Step 1 — Check In Pack Zone
      await this.packService.packCheckin(basicToken);
      checkedIn = true;
      console.log('Step 1 | Check In Pack     : OK');

      // Step 2 — Update Ticket → PACKING
      await this.packService.packPacking(basicToken, ticketId);
      console.log('Step 2 | Pack Packing      : OK');

      // Step 3 — Get BIN
      const { bin } = await this.packService.getBin(basicToken);
      if (!bin) throw new Error('No BIN available');
      console.log(`Step 3 | Get BIN           : bin=${bin}`);

      // Step 4 — Add Basket
      await this.packService.addBasket(basicToken, ticketId, bin);
      console.log('Step 4 | Add Basket        : OK');

      // Step 5 — Update Ticket → WAIT_TO_DELIVERY
      await this.packService.updateTicket(basicToken, ticketId, so);
      console.log('Step 5 | Update Ticket     : OK');

      // Step 6 — Pack Complete
      await this.packService.packComplete(basicToken, ticketId);
      console.log('Step 6 | Pack Complete     : OK');

      // Step 7 — Checkout Pack
      await this.packService.packCheckout(basicToken);
      checkedIn = false;
      console.log('Step 7 | Checkout Pack     : OK');

      console.log(`===== PACK FLOW ${country} END =====`);
      return { so, bin };

    } catch (error) {
      if (error instanceof ApiError) console.error(`Pack flow failed at: ${error.message}`);

      if (orderCode) {
        try {
          await this.orderService.cancelOrder(basicToken, orderId, orderCode);
          console.log(`Pack flow cleanup: cancelled order ${orderId}`);
          await new Promise(r => setTimeout(r, 3000)); // chờ cancel được xử lý xong trước khi checkout zone
        } catch {}
      }
      if (checkedIn) {
        try {
          await this.packService.packCheckout(basicToken);
          await new Promise(r => setTimeout(r, 3000)); // chờ checkout được xử lý xong trước khi kết thúc cleanup
        } catch {}
      }

      throw error;
    }
  }
}
