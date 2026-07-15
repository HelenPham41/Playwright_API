import { BookShipperService } from '../services/bookshipper.service.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { getScenarioData } from '../test-data/scenario.data.factory.js';
import { ApiError } from '../errors/api.error.js';

export interface BookShipperInput {
  so: string;
  ticketId: number | string;
  deliveryBasketCode: string;
}

export interface BookShipperResult {
  driverId: string | number;
  driverName: string;
  so: string;
  deliveryCode: string;
  shippingOrderCode: string;
}

export class BookShipperFlow {

  private readonly bookShipperService: BookShipperService;
  private readonly cfg: CountryConfig;

  constructor(countryConfig?: CountryConfig) {
    this.cfg = countryConfig ?? getCountryConfig();
    this.bookShipperService = new BookShipperService(this.cfg, getScenarioData());
  }

  async bookShipper(input: BookShipperInput): Promise<BookShipperResult> {

    const basicToken = this.cfg.auth.basicToken;
    const country = process.env.COUNTRY ?? 'UNKNOWN';

    console.log(`===== BOOK SHIPPER FLOW ${country} START =====`);

    const {
      so,
      ticketId,
      deliveryBasketCode,
    } = input;

    // ensure ticketId is a string when passed to services expecting string
    const ticketIdStr = String(ticketId);

    try {

      //────────────────────────────────────────────
      // Step 1 - Get Delivery Info
      //────────────────────────────────────────────
      await this.bookShipperService.getDeliveryInfo(
        basicToken,
        so,
      );

      console.log('Step 1 | Get Delivery Info      : OK');

      //────────────────────────────────────────────
      // Step 2 - Select Carrier
      //────────────────────────────────────────────
      const carrier =
        await this.bookShipperService.selectDelivery(
          basicToken,
        );

      console.log('Step 2 | Select Delivery        : OK');

      // TODO: Update according to your actual response
      const driverId =
        carrier?.data?.driverId ?? 0;

      const driverName =
        carrier?.data?.driverName ?? '';

        //────────────────────────────────────────────
      // Step 3 - Update Delivery
      //────────────────────────────────────────────
      await this.bookShipperService.updateDelivery(
        basicToken,
        ticketIdStr,
      );

      console.log('Step 3 | Update Delivery        : OK');


      //────────────────────────────────────────────
      // Step 4 - Get Delivery Order
      //────────────────────────────────────────────
      const deliveryOrder =
        await this.bookShipperService.getDeliveryOrder(
          basicToken,
          ticketIdStr,
        );

      console.log('Step 4 | Get Delivery Order     : OK');

      // TODO: Update according to your API response
      const deliveryCode =
        deliveryOrder?.data?.deliveryCode ??
        deliveryOrder?.data?.[0]?.deliveryCode;

      //────────────────────────────────────────────
      // Step 4 - Update Delivery
      //────────────────────────────────────────────
      await this.bookShipperService.updateDelivery(
        basicToken,
        deliveryCode,
      );

      console.log('Step 4 | Update Delivery        : OK');

      //────────────────────────────────────────────
      // Step 5 - Create Delivery
      //────────────────────────────────────────────
      await this.bookShipperService.createDelivery(
        basicToken,
        `${so}-F`,
        deliveryBasketCode,
      );

      console.log('Step 5 | Create Delivery        : OK');

      //────────────────────────────────────────────
      // Step 6 - Get Delivery After Create
      //────────────────────────────────────────────
      const afterCreate =
        await this.bookShipperService.getDeliveryAfterCreate(
          basicToken,
          so,
        );

      console.log('Step 6 | Delivery After Create  : OK');

      // TODO: Update according to your API response
      const shippingOrderCode =
        afterCreate?.data?.shippingOrderCode ??
        afterCreate?.data?.[0]?.shippingOrderCode ??
        `${so}-F`;

      //────────────────────────────────────────────
      // Step 7 - Get Transport Info
      //────────────────────────────────────────────
      await this.bookShipperService.getTransportInfo(
        basicToken,
        so,
      );

      console.log('Step 7 | Get Transport Info     : OK');

      //────────────────────────────────────────────
      // Step 8 - Assign Driver
      //────────────────────────────────────────────
      await this.bookShipperService.assignDriver(
        basicToken,
        {
          driverId,
          driverName,
          deliveryCode,
          shippingOrderCode,
        },
      );

      console.log('Step 8 | Assign Driver          : OK');

      //────────────────────────────────────────────
      // Step 9 - Get Delivery Status
      //────────────────────────────────────────────
      await this.bookShipperService.getDeliveryStatus(
        basicToken,
      );

      console.log('Step 9 | Get Delivery Status    : OK');

      console.log(`===== BOOK SHIPPER FLOW ${country} END =====`);

      return {
        driverId,
        driverName,
        so,
        deliveryCode,
        shippingOrderCode,
      };

    } catch (error) {

      if (error instanceof ApiError) {
        console.error(`BookShipper flow failed at: ${error.message}`);
      }

      throw error;
    }
  }
}