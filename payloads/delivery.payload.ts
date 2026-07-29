import type { CountryConfig } from '../configs/types.js';

type DeliveryCfg = NonNullable<CountryConfig['delivery']>;

export interface DeliveryOrderRequest {
    ticketId: number;
    warehouseCode?: string;
}

export interface UploadImageData {
    dataImage: string;
    fileName: string;
    refType: string;
}

export interface UploadSignatureData {
    dataSignature: string;
    fileName: string;
    refType: string;
}

export interface AssignTripRequest {
    hubCode: string;
    riderId: number;
    riderName: string;
    referenceCode: string;
    trackingNumber: string;
}

export interface UpdateDeliveryRequest {
    ticketId: number;
    so: string;
    trackingNumber: string;

    customer: {
        address: string;
        businessName: string;
        code: number;
        deliveryMode: string;
        district: string;
        districtCode: string;
        name: string;
        province: string;
        provinceCode: string;
        ward: string;
        wardCode: string;
    };
}

export class DeliveryPayloadBuilder {

    constructor(private readonly delivery: DeliveryCfg) { }

    /**
     * Login App
     */
    loginAppBody(username: string, password: string) {
        return {
            username,
            password,
        };
    }

    /**
     * Auth
     */
    authBody() {
        return {
            clientId: this.delivery.clientId,
            redirectUri: process.env.INTERNAL_URL,
            responseType: 'code id_token',
        };
    }

    /**
     * Login Rider
     */
    loginRiderBody(code: string) {
        return {
            grantType: 'authorization_code',
            clientId: this.delivery.clientId,
            clientSecret: this.delivery.clientSecret,
            code,
        };
    }

    /**
     * Accept Delivery
     */
    acceptDeliveryBody(trackingNumber: string, so: string) {
        return {
            hubCode: this.delivery.hubCode,
            referenceCode: this.delivery.minimalFlow ? so : `${so}-F`,
            trackingcode: trackingNumber,
            status: 'DELIVERING',
        };
    }

    /**
     * Comfirm Current Address
     */
    confirmCurrentAddress(data: UpdateDeliveryRequest, so: string) {
        return {
            nearestOrder: this.delivery.minimalFlow ? so : `${so}-F`,
            wardCode: data.customer.ward,
            latitude: this.delivery.latitude,
            longitude: this.delivery.longitude,
            customerAddress: data.customer.address,
            id: this.delivery.id,
            verified: true,
        };
    }

    /**
     * Upload Image
     */
    uploadImageBody(
        data: UploadImageData,
        tokenImage: string
    ) {
        return {
            data: data.dataImage,
            fileName: data.fileName,
            refType: data.refType,
            token: tokenImage
        };
    }

    /**
     * Upload Signature
     */
    uploadSignatureBody(data: UploadSignatureData, tokenSignature: string) {
        return {
            data: data.dataSignature,
            fileName: data.fileName,
            refType: data.refType,
            token: tokenSignature,
        };
    }

    /**
     * Complete Delivery
     */
    completeDeliveryBody(
        so: string,
        hubCode: string,
        trackingNumber: string,
        uploadImageUrl: string,
        uploadSignatureUrl: string,
        signerName: string,
    ) {
        return {
            referenceCode: this.delivery.minimalFlow ? so : `${so}-F`,
            hubCode,
            trackingCode: trackingNumber,
            status: 'DELIVERED',
            extraInfo: {
                pod: [uploadImageUrl],
                signature: [
                    {
                        signatureImage: uploadSignatureUrl,
                        signerName,
                        type: ''
                    }
                ]
            }
        }
    }

    /**
    * Get Delivery Status
    */
    deliveryStatusParams(so: string) {
        return {
            q: JSON.stringify({
                status: 'DELIVERED',
                hubCode: this.delivery.hubCode,
                listReferenceCode: [this.delivery.minimalFlow ? so : `${so}-F`]
            }),
        };
    }

    /**
     * Get Internal Transfer List   
     */
    internalTransferListParams(so: string, warehouseCode: string) {
        return {
            q: JSON.stringify({
                reference: so,
                warehouseCode: warehouseCode,
            }),
            offset: 0,
            limit: 20,
            getTotal: true,
            warehouseCode: warehouseCode,
        };
    }
}
