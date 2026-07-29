import type { APIResponse } from '@playwright/test';
import { createClient, DEFAULT_USER_AGENT, requestLog } from '../clients/apiClient.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';
import { ReconcileAccountingPayloadBuilder } from '../payloads/reconcileaccounting.payload.js';

export class ReconcileAccountingService {

  private readonly cfg: CountryConfig;
  private readonly payload: ReconcileAccountingPayloadBuilder;

  constructor(countryConfig?: CountryConfig) {
    this.cfg = countryConfig ?? getCountryConfig();
    this.payload = new ReconcileAccountingPayloadBuilder(
      this.reconcileAccounting,
    );
  }

  private get reconcileAccounting() {
    if (!this.cfg.reconcileAccounting) {
      throw new Error(
        `ReconcileAccounting config not defined for country: ${this.cfg.countryCode}`,
      );
    }

    return this.cfg.reconcileAccounting;
  }

  /**
   * 1. Get Reconcile Session
   */
  async getReconcileSessionAccounting(
    riderToken: string,
  ): Promise<any> {

    const client = await createClient(
      this.cfg.hosts.app ?? this.cfg.hosts.order,
      riderToken,
      'bearer',
      DEFAULT_USER_AGENT,
    );

    const params = this.payload.getReconcileSessionParams();

    const response = await client.get(
      this.reconcileAccounting.endpoints.getReconcileSessionAccounting,
      {
        params,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'getReconcileSessionAccounting',
    );

    const data = await response.json();

    requestLog.push({
      step: 'getReconcileSessionAccounting',
      method: 'GET',
      url: response.url(),
      requestBody: params,
      responseStatus: response.status(),
      responseBody: data,
    });

    return data;
  }

  /**
   * 2. Get Reconcile Orders
   */
  async getReconcileOrdersAccounting(
    riderToken: string,
    reconcileAccountingCode: string,
    totalOrder = 10,
  ): Promise<any> {

    const client = await createClient(
      this.cfg.hosts.app ?? this.cfg.hosts.order,
      riderToken,
      'bearer',
      DEFAULT_USER_AGENT,
    );

    const params = this.payload.getReconcileOrdersParams(
      reconcileAccountingCode,
      totalOrder,
    );

    const response = await client.get(
      this.reconcileAccounting.endpoints.getReconcileOrdersAccounting,
      {
        params,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'getReconcileOrdersAccounting',
    );

    const data = await response.json();

    requestLog.push({
      step: 'getReconcileOrdersAccounting',
      method: 'GET',
      url: response.url(),
      requestBody: params,
      responseStatus: response.status(),
      responseBody: data,
    });

    return data;
  }

  /**
   * 3. Select Reconcile Orders  (max 3 retries)
   */
  async selectReconcileOrdersAccounting(
    riderToken: string,
    lineID: number,
    so: string,
    trackingCode: string,
  ): Promise<APIResponse> {

    const client = await createClient(
      this.cfg.hosts.app ?? this.cfg.hosts.order,
      riderToken,
      'bearer',
      DEFAULT_USER_AGENT,
    );

    const body = this.payload.selectReconcileOrdersBody(
      lineID,
      so,
      trackingCode,
    );

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await client.put(
          this.reconcileAccounting.endpoints.selectReconcileOrdersAccounting,
          {
            data: body,
          },
        );

        console.log(`selectReconcileOrdersAccounting | attempt ${attempt} status:`, response.status());

        await assertStatus(
          response,
          [HTTP_STATUS.OK],
          'selectReconcileOrdersAccounting',
        );

        requestLog.push({
          step: 'selectReconcileOrdersAccounting',
          method: 'PUT',
          url: response.url(),
          requestBody: body,
          responseStatus: response.status(),
          responseBody: await response.json().catch(() => null),
        });

        return response;
      } catch (error) {
        console.log(`selectReconcileOrdersAccounting | attempt ${attempt} failed`);
        if (attempt === 3) throw error;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    throw new Error('selectReconcileOrdersAccounting failed after 3 attempts');
  }

  /**
   * 4. Confirm Reconcile
   */
  async confirmReconcileAccounting(
    riderToken: string,
    reconcileDoisoatKetoanCode: string,
  ): Promise<any> {

    const client = await createClient(
      this.cfg.hosts.app ?? this.cfg.hosts.order,
      riderToken,
      'bearer',
      DEFAULT_USER_AGENT,
    );

    const body = this.payload.confirmReconcileBody(
      reconcileDoisoatKetoanCode,
    );

    const response = await client.put(
      this.reconcileAccounting.endpoints.confirmReconcileAccounting,
      {
        data: body,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'confirmReconcileAccounting',
    );

    const responseBody = await response.json().catch(() => null);

    requestLog.push({
      step: 'confirmReconcileAccounting',
      method: 'PUT',
      url: response.url(),
      requestBody: body,
      responseStatus: response.status(),
      responseBody,
    });

    return responseBody;
  }

  /**
   * 5. Approve Reconcile
   */
  async approveReconcileAccounting(
    basicToken: string,
    reconcileShortCode: string,
    bankAmount: number,
  ): Promise<APIResponse> {

    const client = await createClient(
      this.cfg.hosts.internal,
      basicToken,
      'basic',
    );

    const body = this.payload.approveReconcileBody(
      reconcileShortCode,
      bankAmount,
    );

    const response = await client.put(
      this.reconcileAccounting.endpoints.approveReconcileAccounting,
      {
        data: body,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'approveReconcileAccounting',
    );

    requestLog.push({
      step: 'approveReconcileAccounting',
      method: 'PUT',
      url: response.url(),
      requestBody: body,
      responseStatus: response.status(),
      responseBody: await response.json().catch(() => null),
    });

    return response;
  }

  /**
   * 6. Get Completed Order
   */
  async getCompletedOrderAccounting(
    basicToken: string,
    orderId: number | string,
  ): Promise<any> {

    const client = await createClient(
      this.cfg.hosts.internal,
      basicToken,
      'basic',
    );

    const params = this.payload.getCompletedOrderParams(
      orderId,
    );

    const response = await client.get(
      this.reconcileAccounting.endpoints.getCompletedOrderAccounting,
      {
        params,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'getCompletedOrderAccounting',
    );

    const data = await response.json();

    requestLog.push({
      step: 'getCompletedOrderAccounting',
      method: 'GET',
      url: response.url(),
      requestBody: params,
      responseStatus: response.status(),
      responseBody: data,
    });

    return data;
  }

  /**
   * 7. Get Bill Info
   */
  async getBillInfoAccounting(
    basicToken: string,
    orderId: number | string,
  ): Promise<any> {

    const client = await createClient(
      this.cfg.hosts.internal,
      basicToken,
      'basic',
    );

    const params = this.payload.getBillInfoParams(orderId);

    const response = await client.get(
      this.reconcileAccounting.endpoints.getAndUpdateBillInfo,
      {
        params,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'getBillInfoAccounting',
    );

    const data = await response.json();

    requestLog.push({
      step: 'getBillInfoAccounting',
      method: 'GET',
      url: response.url(),
      requestBody: params,
      responseStatus: response.status(),
      responseBody: data,
    });

    return data;
  }

  /**
   * 8. Update Bill To Complete Order
   */
  async updateBillToCompleteOrder(
    basicToken: string,
    billCode: string,
  ): Promise<APIResponse> {

    const client = await createClient(
      this.cfg.hosts.internal,
      basicToken,
      'basic',
    );

    const body = this.payload.updateBillToCompleteOrderBody(billCode);

    const response = await client.put(
      this.reconcileAccounting.endpoints.getAndUpdateBillInfo,
      {
        data: body,
      },
    );

    await assertStatus(
      response,
      [HTTP_STATUS.OK],
      'updateBillToCompleteOrder',
    );

    requestLog.push({
      step: 'updateBillToCompleteOrder',
      method: 'PUT',
      url: response.url(),
      requestBody: body,
      responseStatus: response.status(),
      responseBody: await response.json().catch(() => null),
    });

    return response;
  }
}