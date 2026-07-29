import { BookShipperService } from '../services/bookshipper.service.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { getScenarioData } from '../test-data/scenario.data.factory.js';
import { ApiError } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';

export interface BookShipperInput {
  so: string;
  ticketId: number | string;
}

export interface BookShipperResult {
  driverId: string | number;
  driverName: string;
  so: string;
  deliveryCode: string;
  shippingOrderCode: string;
  trackingNumber: string;
  createDeliveryStatus: string;
  createDeliveryMessage: string;
  assignDriverStatus: string;
  assignDriverMessage: string;
  transportActionName: string;
  transportType: string;
  transportStatus: string;
  transportProductivityAction: string;
  transportTrackingCode: string;
}

export class BookShipperFlow {

  private static readonly WAIT_3S = 3000;
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
    } = input;

    const ticketIdNum = Number(ticketId);
    const scenarioData = getScenarioData();

    try {

      if (this.cfg.bookShipper?.minimalFlow) {
        const result = await this.bookShipperMinimal(basicToken, so, scenarioData);
        console.log(`===== BOOK SHIPPER FLOW ${country} END =====`);
        return result;
      }

      //────────────────────────────────────────────
      // Step 1 - Get Delivery Info
      //────────────────────────────────────────────
      const deliveryInfo =
        await this.bookShipperService.getDeliveryInfo(
          basicToken,
          so,
        );

      console.log('Step 1 | Get Delivery Info      : OK');

      const ticketData = deliveryInfo?.data?.[0];

      const deliveryBasket = ticketData?.baskets?.find(
        (item: any) => item.type === 'DELIVERY',
      );

      const basketCode = deliveryBasket?.codes?.[0] ?? '';
      const donePackTime = ticketData?.endTime ?? 0;

      //────────────────────────────────────────────
      // Step 2 - Select Delivery
      //────────────────────────────────────────────
      await this.bookShipperService.selectDelivery(
        basicToken,
      );

      console.log('Step 2 | Select Delivery        : OK');

      const driverId = scenarioData.driverId ?? 0;
      const driverName = scenarioData.driverName ?? '';

        //────────────────────────────────────────────
      // Step 3 - Update Delivery
      //────────────────────────────────────────────
      await this.bookShipperService.updateDelivery(
        basicToken,
        ticketIdNum,
      );

      console.log('Step 3 | Update Delivery        : OK');


      //────────────────────────────────────────────
      // Step 4 - Get Delivery Order
      //────────────────────────────────────────────
      const deliveryOrder =
        await this.bookShipperService.getDeliveryOrder(
          basicToken,
          ticketIdNum,
        );

      console.log('Step 4 | Get Delivery Order     : OK');

      const deliveryCode = deliveryOrder?.data?.[0]?.deliveryOrderCode;

      //────────────────────────────────────────────
      // Step 5 - Create Delivery
      //────────────────────────────────────────────
      const createDeliveryResult =
        await this.bookShipperService.createDelivery(
          basicToken,
          so,
          basketCode,
          donePackTime,
        );

      console.log('Step 5 | Create Delivery        : OK');

      const createDeliveryStatus = createDeliveryResult?.status;
      const createDeliveryMessage = createDeliveryResult?.message ?? '';
      const trackingNumber =
        createDeliveryResult?.data?.[0]?.tracking_number ?? '';

      //────────────────────────────────────────────
      // Step 6 - Get Delivery After Create
      //────────────────────────────────────────────
      const afterCreate =
        await this.bookShipperService.getDeliveryAfterCreate(
          basicToken,
          so,
        );

      console.log('Step 6 | Delivery After Create  : OK');

      const shippingOrderCode =
        afterCreate?.data?.[0]?.referenceCode ?? `${so}-F`;

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
      const assignDriverResult =
        await this.bookShipperService.assignDriver(
          basicToken,
          {
            driverId,
            driverName,
            so,
            trackingNumber,
          },
        );

      console.log('Step 8 | Assign Driver          : OK');

      const assignDriverStatus = assignDriverResult?.status;
      const assignDriverMessage = assignDriverResult?.message ?? '';

      //────────────────────────────────────────────
      // Step 9 - Get Delivery Status
      //────────────────────────────────────────────
      const deliveryStatus =
        await this.bookShipperService.getDeliveryStatus(
          basicToken,
          so,
        );

      console.log('Step 9 | Get Delivery Status    : OK');

      const transportOrder = deliveryStatus?.data?.[0];
      const transportActionName = transportOrder?.actionName ?? '';
      const transportType = transportOrder?.type ?? '';
      const transportStatus = transportOrder?.status ?? '';
      const transportProductivityAction = transportOrder?.productivityAction ?? '';
      const transportTrackingCode = transportOrder?.trackingCode ?? '';

      console.log(`===== BOOK SHIPPER FLOW ${country} END =====`);

      return {
        driverId,
        driverName,
        so,
        deliveryCode,
        shippingOrderCode,
        trackingNumber,
        createDeliveryStatus,
        createDeliveryMessage,
        assignDriverStatus,
        assignDriverMessage,
        transportActionName,
        transportType,
        transportStatus,
        transportProductivityAction,
        transportTrackingCode,
      };

    } catch (error) {

      if (error instanceof ApiError) {
        console.error(`BookShipper flow failed at: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * TH: chỉ dùng 3 endpoint (khong can ticket/basket/carrier lookup truoc).
   */
  private async bookShipperMinimal(
    basicToken: string,
    so: string,
    scenarioData: ReturnType<typeof getScenarioData>,
  ): Promise<BookShipperResult> {

    const driverId = scenarioData.driverId ?? 0;
    const driverName = scenarioData.driverName ?? '';

    //────────────────────────────────────────────
    // Step 1 - Create Delivery
    //────────────────────────────────────────────
    console.log('Wait 3s before create delivery...');
    await new Promise(r => setTimeout(r, BookShipperFlow.WAIT_3S));

    const createDeliveryResult =
      await this.bookShipperService.createDelivery(
        basicToken,
        so,
        '',
        0,
      );

    console.log('Step 1 | Create Delivery        : OK');

    const createDeliveryStatus = createDeliveryResult?.status;
    const createDeliveryMessage = createDeliveryResult?.message ?? '';
    const trackingNumber =
      createDeliveryResult?.data?.[0]?.tracking_number ?? '';

    //────────────────────────────────────────────
    // Step 2 - Assign Driver
    //────────────────────────────────────────────
    const assignDriverResult =
      await this.bookShipperService.assignDriver(
        basicToken,
        {
          driverId,
          driverName,
          so,
          trackingNumber,
        },
      );

    console.log('Step 2 | Assign Driver          : OK');

    const assignDriverStatus = assignDriverResult?.status;
    const assignDriverMessage = assignDriverResult?.message ?? '';

    //────────────────────────────────────────────
    // Step 3 - Get Delivery After Create
    //────────────────────────────────────────────
    const afterCreate =
      await this.bookShipperService.getDeliveryAfterCreate(
        basicToken,
        so,
      );

    console.log('Step 3 | Delivery After Create  : OK');

    const shippingOrder = afterCreate?.data?.[0];

    if (!shippingOrder) {
      throw new ApiError('getDeliveryAfterCreate', HTTP_STATUS.OK, this.cfg.bookShipper?.endpoints.getDeliveryAfterCreate ?? '', 'Missing shipping order');
    }

    if (shippingOrder.status !== 'READY_TO_PICK') {
      throw new ApiError('getDeliveryAfterCreate', HTTP_STATUS.OK, this.cfg.bookShipper?.endpoints.getDeliveryAfterCreate ?? '', `Invalid shipping order status: ${shippingOrder.status}`);
    }

    if (shippingOrder.trackingCode !== trackingNumber) {
      throw new ApiError('getDeliveryAfterCreate', HTTP_STATUS.OK, this.cfg.bookShipper?.endpoints.getDeliveryAfterCreate ?? '', `Tracking code mismatch: expected ${trackingNumber}, got ${shippingOrder.trackingCode}`);
    }

    console.log('Delivery After Create | status:', shippingOrder.status, '| trackingCode:', shippingOrder.trackingCode);

    const shippingOrderCode = shippingOrder.referenceCode ?? `${so}-F`;

    // TH khong co hub-order (getDeliveryStatus) — chi map duoc status/trackingCode tu shipping-order
    const transportActionName = '';
    const transportType = '';
    const transportStatus = shippingOrder.status ?? '';
    const transportProductivityAction = '';
    const transportTrackingCode = shippingOrder.trackingCode ?? '';

    return {
      driverId,
      driverName,
      so,
      deliveryCode: '',
      shippingOrderCode,
      trackingNumber,
      createDeliveryStatus,
      createDeliveryMessage,
      assignDriverStatus,
      assignDriverMessage,
      transportActionName,
      transportType,
      transportStatus,
      transportProductivityAction,
      transportTrackingCode,
    };
  }
}