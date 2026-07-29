import type { APIResponse } from '@playwright/test';
import { createClient, DEFAULT_USER_AGENT, requestLog } from '../clients/apiClient.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';
import { ReconcileShipperPayloadBuilder } from '../payloads/reconcileshipper.payload.js';

export class ReconcileShipperService {

  private readonly cfg: CountryConfig;
  private readonly payload: ReconcileShipperPayloadBuilder;

  constructor(countryConfig?: CountryConfig) {
    this.cfg = countryConfig ?? getCountryConfig();
    this.payload = new ReconcileShipperPayloadBuilder(this.reconcile);
  }

  private get reconcile() {
    if (!this.cfg.reconcileShipper) {
      throw new Error(
        `ReconcileShipper config not defined for country: ${this.cfg.countryCode}`,
      );
    }

    return this.cfg.reconcileShipper;
  }

  /**
   * 1. Get Payment Session
   */
  async getPaymentSession(
    riderToken: string,
  ): Promise<any> {

     const client = await createClient(
           this.cfg.hosts.app ?? this.cfg.hosts.order,
            riderToken,
            'bearer',
            DEFAULT_USER_AGENT,
        );

    const params = this.payload.getPaymentSessionParams();

    const response = await client.get(
      this.reconcile.endpoints.getPaymentSession,
      {
        params,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'getPaymentSession',
    );

    const data = await response.json();

    requestLog.push({
      step: 'getPaymentSession',
      method: 'GET',
      url: response.url(),
      requestBody: params,
      responseStatus: response.status(),
      responseBody: data,
    });

    return data;
  }

  /**
   * 2. Get Payment Line
   */
  async getPaymentLine(
    riderToken: string,
    paymentCode: string,
    orderId: number | string,
  ): Promise<any> {

    const client = await createClient(
      this.cfg.hosts.app ?? this.cfg.hosts.order,
      riderToken,
      'bearer',
      DEFAULT_USER_AGENT,
    );

    const params = this.payload.getPaymentLineParams(
      paymentCode,
      orderId,
    );

    const response = await client.get(
      this.reconcile.endpoints.getPaymentLine,
      {
        params,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'getPaymentLine',
    );

    const data = await response.json();

    requestLog.push({
      step: 'getPaymentLine',
      method: 'GET',
      url: response.url(),
      requestBody: params,
      responseStatus: response.status(),
      responseBody: data,
    });

    return data;
  }

  /**
   * 3. Check Reconcile Order
   */
  async checkReconcileOrder(
    riderToken: string,
    lineID: number,
    trackingCode: string,
    so: string,
  ): Promise<APIResponse> {

    const client = await createClient(
      this.cfg.hosts.app ?? this.cfg.hosts.order,
      riderToken,
      'bearer',
      DEFAULT_USER_AGENT,
    );

    const body = this.payload.checkReconcileOrderBody(
      lineID,
      trackingCode,
      so,
    );

    const response = await client.put(
      this.reconcile.endpoints.checkReconcileOrder,
      {
        data: body,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'checkReconcileOrder',
    );

    requestLog.push({
      step: 'checkReconcileOrder',
      method: 'PUT',
      url: response.url(),
      requestBody: body,
      responseStatus: response.status(),
      responseBody: await response.json().catch(() => null),
    });

    return response;
  }

  /**
   * 4. Confirm Payment
   */
  async confirmPayment(
    riderToken: string,
    reconcileCode: string,
  ): Promise<any> {

    const client = await createClient(
      this.cfg.hosts.app ?? this.cfg.hosts.order,
      riderToken,
      'bearer',
      DEFAULT_USER_AGENT,
    );

    const body = this.payload.confirmPaymentBody(
      reconcileCode,
    );

    const response = await client.put(
      this.reconcile.endpoints.confirmPayment,
      {
        data: body,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'confirmPayment',
    );

    const responseBody = await response.json().catch(() => null);

    requestLog.push({
      step: 'confirmPayment',
      method: 'PUT',
      url: response.url(),
      requestBody: body,
      responseStatus: response.status(),
      responseBody,
    });

    return responseBody;
  }

  /**
   * 5. Get Reconcile Activity
   */
  async getReconcileActivity(
    basicToken: string,
    paymentCode: string,
  ): Promise<any> {

    const client = await createClient(
      this.cfg.hosts.internal,
      basicToken,
      'basic',
    );

    const params = this.payload.getReconcileActivityParams(
      paymentCode,
    );

    const response = await client.get(
      this.reconcile.endpoints.getReconcileActivity,
      {
        params,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'getReconcileActivity',
    );

    const data = await response.json();

    requestLog.push({
      step: 'getReconcileActivity',
      method: 'GET',
      url: response.url(),
      requestBody: params,
      responseStatus: response.status(),
      responseBody: data,
    });

    return data;
  }

  /**
   * 6. Approve Reconcile
   */
  async approveReconcile(
    basicToken: string,
    paymentCode: string,
  ): Promise<any> {

    const client = await createClient(
      this.cfg.hosts.internal,
      basicToken,
      'basic',
    );

    const body = this.payload.approveReconcileBody(
      paymentCode,
    );

    const response = await client.put(
      this.reconcile.endpoints.approveReconcile,
      {
        data: body,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'approveReconcile',
    );

    const responseBody = await response.json().catch(() => null);

    requestLog.push({
      step: 'approveReconcile',
      method: 'PUT',
      url: response.url(),
      requestBody: body,
      responseStatus: response.status(),
      responseBody,
    });

    return responseBody;
  }
}