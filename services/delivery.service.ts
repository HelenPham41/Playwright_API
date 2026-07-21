import type { APIResponse } from '@playwright/test';
import { createClient, requestLog, DEFAULT_USER_AGENT as DELIVERY_USER_AGENT } from '../clients/apiClient.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';
import {
    DeliveryPayloadBuilder,
    type UpdateDeliveryRequest,
    type UploadImageData,
    type UploadSignatureData,
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
     * Login App
     */
    async loginApp(accessToken: string, username: string, password: string): Promise<any> {

        const client = await createClient(
            this.delivery.appUrl,
            accessToken,
            'bearer',
            DELIVERY_USER_AGENT,
        );

        const body = this.payload.loginAppBody(username, password);

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
     * Auth
     */
    async auth(accessToken: string): Promise<any> {

        const client = await createClient(
            this.delivery.appUrl,
            accessToken,
            'bearer',
            DELIVERY_USER_AGENT,
        );

        const body = this.payload.authBody();

        const response = await client.post(
            this.delivery.endpoints.auth,
            {
                data: body,
            },
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'auth');

        const data = await response.json();

        requestLog.push({
            step: 'auth',
            method: 'POST',
            url: response.url(),
            requestBody: body,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * Login Rider
     */
    async loginRider(ssoToken: string, code: string): Promise<any> {

        const client = await createClient(
            this.delivery.appUrl,
            ssoToken,
            'bearer',
            DELIVERY_USER_AGENT,
        );

        const body = this.payload.loginRiderBody(code);

        const response = await client.post(
            this.delivery.endpoints.loginRider,
            {
                data: body,
            },
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'loginRider');

        const data = await response.json();

        requestLog.push({
            step: 'loginRider',
            method: 'POST',
            url: response.url(),
            requestBody: body,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }

    /**
     * Accept Delivery
     */
    async acceptDelivery(
        riderToken: string,
        trackingNumber: string,
        so: string,
    ): Promise<APIResponse> {

        const client = await createClient(
            this.cfg.hosts.order,
            riderToken,
            'bearer',
            DELIVERY_USER_AGENT,
        );

        const body = this.payload.acceptDeliveryBody(trackingNumber, so);

        const response = await client.put(
            this.delivery.endpoints.acceptDelivery,
            {
                data: body,
            },
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'acceptDelivery');

        requestLog.push({
            step: 'acceptDelivery',
            method: 'PUT',
            url: response.url(),
            requestBody: body,
            responseStatus: response.status(),
            responseBody: await response.json().catch(() => null),
        });

        return response;
    }

    /**
     * Confirm Current Address
     */
    async confirmCurrentAddress(
        riderToken: string,
        data: UpdateDeliveryRequest,
        so: string,
    ): Promise<APIResponse> {

        const client = await createClient(
            this.cfg.hosts.order,
            riderToken,
            'bearer',
            DELIVERY_USER_AGENT,
        );

        const body = this.payload.confirmCurrentAddress(data, so);

        const response = await client.put(
            this.delivery.endpoints.confirmCurrentAddress,
            {
                data: body,
            },
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'confirmCurrentAddress');

        requestLog.push({
            step: 'confirmCurrentAddress',
            method: 'PUT',
            url: response.url(),
            requestBody: body,
            responseStatus: response.status(),
            responseBody: await response.json().catch(() => null),
        });

        return response;
    }

    /**
     * Get Upload Image Token
     */
    async getUploadImageToken(
        riderToken: string,
    ): Promise<any> {

        const client = await createClient(
            this.cfg.hosts.order,
            riderToken,
            'bearer',
            DELIVERY_USER_AGENT,
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
        data: UploadImageData,
    ): Promise<any> {

        const client = await createClient(
            this.cfg.hosts.order,
            riderToken,
            'bearer',
            DELIVERY_USER_AGENT,
        );

        const body = this.payload.uploadImageBody(data, accessToken);

        const requestHeaders = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${riderToken}`,
            'User-Agent': DELIVERY_USER_AGENT,
        };

        const response = await client.post(
            this.delivery.endpoints.uploadImage,
            {
                data: body,
            },
        );

        await assertStatus(
            response,
            [HTTP_STATUS.OK],
            'uploadImage',
        );

        const responseBody = await response.json();

        requestLog.push({
            step: 'uploadImage',
            method: 'POST',
            url: response.url(),
            requestHeaders,
            requestBody: body,
            responseStatus: response.status(),
            responseBody,
        });

        return responseBody;
    }

    /**
     * Get Upload Signature Token
     */
    async getUploadSignatureToken(
        riderToken: string,
    ): Promise<any> {

        const client = await createClient(
            this.cfg.hosts.order,
            riderToken,
            'bearer',
            DELIVERY_USER_AGENT,
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
        data: UploadSignatureData,
    ): Promise<any> {

        const client = await createClient(
            this.cfg.hosts.order,
            riderToken,
            'bearer',
            DELIVERY_USER_AGENT,
        );

        const body = this.payload.uploadSignatureBody(data, accessToken);

        const response = await client.post(
            this.delivery.endpoints.uploadSignature,
            {
                data: body,
            },
        );

        await assertStatus(
            response,
            [HTTP_STATUS.OK],
            'uploadSignature',
        );

        const responseBody = await response.json();

        requestLog.push({
            step: 'uploadSignature',
            method: 'POST',
            url: response.url(),
            requestBody: body,
            responseStatus: response.status(),
            responseBody,
        });

        return responseBody;
    }

    /**
     * Complete Delivery
     */
    async completeDelivery(
        riderToken: string,
        so: string,
        trackingNumber: string,
        uploadImageUrl: string,
        uploadSignatureUrl: string,
        signerName: string,
    ): Promise<APIResponse> {

        const client = await createClient(
            this.cfg.hosts.order,
            riderToken,
            'bearer',
            DELIVERY_USER_AGENT,
        );

        const body = this.payload.completeDeliveryBody(
            so,
            this.delivery.hubCode,
            trackingNumber,
            uploadImageUrl,
            uploadSignatureUrl,
            signerName,
        );

        const requestHeaders = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${riderToken}`,
            'User-Agent': DELIVERY_USER_AGENT,
        };

        const response = await client.put(
            this.delivery.endpoints.completeDelivery,
            {
                data: body,
            },
        );

        await assertStatus(response, [HTTP_STATUS.OK], 'completeDelivery');

        const responseBody = await response.json().catch(() => null);

        requestLog.push({
            step: 'completeDelivery',
            method: 'PUT',
            url: response.url(),
            requestBody: body,
            responseStatus: response.status(),
            responseBody,
        });

        return response;
    }

    /**
     * Get Delivery Status  (max 3 retries — STG occasionally slow/unresponsive)
     */
    async getDeliveryStatus(
        basicToken: string,
        shippingOrderCode: string,
    ): Promise<any> {

        const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic', DELIVERY_USER_AGENT);
        const params = this.payload.deliveryStatusParams(shippingOrderCode);

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`getDeliveryStatus | attempt ${attempt}`);
                const response = await client.get(
                    this.delivery.endpoints.getDeliveryStatus,
                    { params },
                );

                console.log('getDeliveryStatus | status:', response.status());
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
            } catch (error) {
                console.log(`getDeliveryStatus | attempt ${attempt} failed:`, error);
                if (attempt === 3) throw error;
                await new Promise(r => setTimeout(r, 3000));
            }
        }

        throw new Error('getDeliveryStatus failed after retries');
    }

    /**
     * Get Internal Transfer List
     */
    async getInternalTransferList(
        basicToken: string,
        so: string,
        warehouseCode: string,
    ): Promise<any> {

        const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic', DELIVERY_USER_AGENT);

        const response = await client.get(
            this.cfg.internalTransfer?.endpoints.getInternalTransferList ?? '',
            {
                params: this.payload.internalTransferListParams(
                    so,
                    warehouseCode,
                ),
            },
        );

        await assertStatus(
            response,
            [HTTP_STATUS.OK],
            'getInternalTransferList',
        );

        const data = await response.json();

        requestLog.push({
            step: 'getInternalTransferList',
            method: 'GET',
            url: response.url(),
            requestBody: null,
            responseStatus: response.status(),
            responseBody: data,
        });

        return data;
    }
}