import type { APIResponse } from '@playwright/test';
import { createClient, requestLog } from '../clients/apiClient.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';
import {
    DeliveryPayloadBuilder,
} from '../payloads/delivery.payload.js';

export class DeliveryService {

    private readonly cfg: CountryConfig;
    private readonly payload: DeliveryPayloadBuilder;

    constructor(countryConfig?: CountryConfig) {
        this.cfg = countryConfig ?? getCountryConfig();
        this.payload = new DeliveryPayloadBuilder(this.delivery);
    }

    private get delivery() {
        if (!this.cfg.delivery) throw new Error(`Delivery config not defined for country: ${this.cfg.countryCode}`);
        return this.cfg.delivery;
    }

    /**
     * Rider Login
     */
    async login(accessToken: string, username: string, password: string): Promise<any> {

        const client = await createClient(
            this.delivery.appUrl,
            accessToken,
            'bearer',
        );

        const body = this.payload.loginBody(username, password);

        const response = await client.post(
            this.delivery.endpoints.loginApp,
            {
                data: body,
            },
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'login');

        const data = await response.json();

        requestLog.push({
            step: 'login',
            method: 'POST',
            url: response.url(),
            requestBody: body,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * Get Upload Image Token
     */
    async getUploadImageToken(
        riderToken: string,
    ): Promise<any> {

        const client = await createClient(
            this.delivery.appUrl,
            riderToken,
            'bearer',
        );

        const response = await client.get(
            this.delivery.endpoints.getUploadImageToken,
        );

        await assertStatus(
            response,
            [HTTP_STATUS.OK],
            'getUploadImageToken',
        );

        const data = await response.json();

        requestLog.push({
            step: 'getUploadImageToken',
            method: 'GET',
            url: response.url(),
            requestBody: null,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * Upload Image
     */
    async uploadImage(
        riderToken: string,
        accessToken: string,
        body: any,
    ): Promise<any> {

        const client = await createClient(
            this.delivery.appUrl,
            riderToken,
            'bearer',
        );

        const response = await client.post(
            this.delivery.endpoints.uploadImage,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: body,
            },
        );

        await assertStatus(
            response,
            [HTTP_STATUS.OK],
            'uploadImage',
        );

        const data = await response.json();

        requestLog.push({
            step: 'uploadImage',
            method: 'POST',
            url: response.url(),
            requestBody: body,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * Get Upload Signature Token
     */
    async getUploadSignatureToken(
        riderToken: string,
    ): Promise<any> {

        const client = await createClient(
            this.delivery.appUrl,
            riderToken,
            'bearer',
        );

        const response = await client.get(
            this.delivery.endpoints.getUploadSignatureToken,
        );
        await assertStatus(
            response,
            [HTTP_STATUS.OK],
            'getUploadSignatureToken',
        );

        const data = await response.json();

        requestLog.push({
            step: 'getUploadSignatureToken',
            method: 'GET',
            url: response.url(),
            requestBody: null,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * Upload Signature
     */
    async uploadSignature(
        riderToken: string,
        accessToken: string,
        body: any,
    ): Promise<any> {

        const client = await createClient(
            this.delivery.appUrl,
            riderToken,
            'bearer',
        );

        const response = await client.post(
            this.delivery.endpoints.uploadSignature,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: body,
            },
        );

        await assertStatus(
            response,
            [HTTP_STATUS.OK],
            'uploadSignature',
        );

        const data = await response.json();

        requestLog.push({
            step: 'uploadSignature',
            method: 'POST',
            url: response.url(),
            requestBody: body,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * Update Delivery
     */
    async updateDelivery(
        riderToken: string,
        body: any,
    ): Promise<APIResponse> {

        const client = await createClient(
            this.delivery.appUrl,
            riderToken,
            'bearer',
        );

        const response = await client.put(
            this.delivery.endpoints.updateDelivery,
            {
                data: body,
            },
        );

        await assertStatus(
            response,
            [HTTP_STATUS.OK],
            'updateDelivery',
        );

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
     * Get Delivery Status
     */
    async getDeliveryStatus(
        riderToken: string,
        shippingOrderCode: string,
    ): Promise<any> {

        const client = await createClient(
            this.delivery.appUrl,
            riderToken,
            'bearer',
        );

        const response = await client.get(
            this.delivery.endpoints.getDeliveryStatus,
            {
                params: this.payload.deliveryStatusParams(
                    shippingOrderCode,
                ),
            },
        );

        await assertStatus(
            response,
            [HTTP_STATUS.OK],
            'getDeliveryStatus',
        );

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