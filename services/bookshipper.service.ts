import type { APIResponse } from '@playwright/test';
import { createClient, requestLog } from '../clients/apiClient.js';
import type { CountryConfig, ScenarioData } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';
import {
    DeliveryPayloadBuilder,
    type AssignDriverRequest,
} from '../payloads/bookshipper.payload.js';

export class BookShipperService {

    private readonly cfg: CountryConfig;
    private readonly payload: DeliveryPayloadBuilder;

    constructor(countryConfig?: CountryConfig, scenarioData?: ScenarioData) {
        this.cfg = countryConfig ?? getCountryConfig();

        if (!scenarioData) {
            throw new Error('ScenarioData is required to build BookShipper payloads');
        }

        this.payload = new DeliveryPayloadBuilder(this.bookShipper, scenarioData);
    }

    private get bookShipper() {
        if (!this.cfg.bookShipper) {
            throw new Error(`BookShipper config not defined for country: ${this.cfg.countryCode}`);
        }
        return this.cfg.bookShipper;
    }

    /**
     * 1. Get Delivery Info
     */
    async getDeliveryInfo(basicToken: string, so: string): Promise<any> {
        const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
        const params = this.payload.getDeliveryInfoParams(so);

        const response = await client.get(
            this.bookShipper.endpoints.getDeliveryInfo,
            {
                params,
            }
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'getDeliveryInfo');

        const data = await response.json();

        requestLog.push({
            step: 'getDeliveryInfo',
            method: 'GET',
            url: response.url(),
            requestBody: params,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * 2. Select Delivery
     */
    async selectDelivery(basicToken: string, carrierCode?: string): Promise<any> {
        const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
        const params = this.payload.selectDeliveryParams(carrierCode);

        const response = await client.get(
            this.bookShipper.endpoints.selectDelivery,
            {
                params,
            }
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'selectDelivery');

        const data = await response.json();

        requestLog.push({
            step: 'selectDelivery',
            method: 'GET',
            url: response.url(),
            requestBody: params,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * 3. Update Delivery
     */
    async updateDelivery(
        basicToken: string,
        ticketId: string,
    ): Promise<APIResponse> {

        const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');

        const body = this.payload.updateDeliveryBody(ticketId);

        const response = await client.put(
            this.bookShipper.endpoints.updateDelivery,
            { data: body }
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'updateDelivery');

        requestLog.push({
            step: 'updateDelivery',
            method: 'PUT',
            url: response.url(),
            requestBody: body,
            responseStatus: response.status(),
            responseBody: await response.json().catch(() => null),
        });

        return response;
    }

    /**
     * 4. Get Delivery Order
     */
    async getDeliveryOrder(basicToken: string, ticketId: string): Promise<any> {

        const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');

        const response = await client.get(
            this.bookShipper.endpoints.getDeliveryOrder,
            {
                params: this.payload.getDeliveryOrderParams(ticketId),
            }
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'getDeliveryOrder');

        const data = await response.json();

        requestLog.push({
            step: 'getDeliveryOrder',
            method: 'GET',
            url: response.url(),
            requestBody: undefined,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * 5. Create Delivery
     */
    async createDelivery(
        basicToken: string,
        shippingOrderCode: string,
        basketCode: string,
    ): Promise<any> {

        const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');

        const body = this.payload.createDeliveryBody(
            shippingOrderCode,
            basketCode,
        );

        const response = await client.post(
            this.bookShipper.endpoints.createDelivery,
            {
                data: body,
            }
        );

        await assertStatus(response, [HTTP_STATUS.OK, HTTP_STATUS.CREATED], 'createDelivery');

        const data = await response.json();

        requestLog.push({
            step: 'createDelivery',
            method: 'POST',
            url: response.url(),
            requestBody: body,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * 6. Get Delivery After Create
     */
    async getDeliveryAfterCreate(basicToken: string, so: string): Promise<any> {

        const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
        const params = this.payload.getDeliveryAfterCreateParams(so);

        const response = await client.get(
            this.bookShipper.endpoints.getDeliveryAfterCreate,
            { params }
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'getDeliveryAfterCreate');

        const data = await response.json();

        requestLog.push({
            step: 'getDeliveryAfterCreate',
            method: 'GET',
            url: response.url(),
            requestBody: params,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * 7. Get Transport Info
     */
    async getTransportInfo(basicToken: string, so: string): Promise<any> {

        const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
        const params = this.payload.getTransportInfoParams(so);

        const response = await client.get(
            this.bookShipper.endpoints.getTransportInfo,
            { params }
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'getTransportInfo');

        const data = await response.json();

        requestLog.push({
            step: 'getTransportInfo',
            method: 'GET',
            url: response.url(),
            requestBody: params,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * 8. Assign Driver
     */
    async assignDriver(
        basicToken: string,
        data: AssignDriverRequest,
    ): Promise<APIResponse> {

        const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');

        const body = this.payload.assignDriverBody(data);

        const response = await client.post(
            this.bookShipper.endpoints.assignDriver,
            {
                data: body,
            }
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'assignDriver');

        requestLog.push({
            step: 'assignDriver',
            method: 'POST',
            url: response.url(),
            requestBody: body,
            responseStatus: response.status(),
            responseBody: await response.json().catch(() => null),
        });

        return response;
    }

    /**
     * 9. Get Delivery Status
     */
    async getDeliveryStatus(basicToken: string): Promise<any> {

        const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');

        const response = await client.get(
            this.bookShipper.endpoints.getDeliveryStatus
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'getDeliveryStatus');

        const data = await response.json();

        requestLog.push({
            step: 'getDeliveryStatus',
            method: 'GET',
            url: response.url(),
            requestBody: null,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }
}