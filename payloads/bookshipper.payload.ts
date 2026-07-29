import type { CountryConfig, ScenarioData } from '../configs/types.js';

type DeliveryCfg = NonNullable<CountryConfig['bookShipper']>;

export interface AssignDriverRequest {
    driverId: number;
    driverName: string;
    so: string;
    trackingNumber: string;
}

export class DeliveryPayloadBuilder {

    constructor(private readonly delivery: DeliveryCfg, private readonly data: ScenarioData) { }

    private customerInfo() {
        const d = this.data;
        return {
            address: d.customerShippingAddress,
            businessName: d.businessName,
            // API pick-ticket parse code dạng number — businessCode trong ScenarioData là string
            code: Number(d.businessCode),
            deliveryMode: 'NORMAL',
            district: d.customerDistrictName,
            districtCode: d.customerDistrictCode,
            name: d.customerName,
            province: d.customerProvinceName,
            provinceCode: d.customerProvinceCode,
            ward: d.customerWardName,
            wardCode: d.customerWardCode
        };
    }


    /**
     * 1. Get Delivery Info
     */
    getDeliveryInfoParams(so: string) {
        return {
            q: JSON.stringify({
                statuses: ['WAIT_TO_PACK', 'PACKING', 'DONE'],
                so,
                warehouseCode: this.delivery.warehouseCode,
            }),
        };
    }

    /**
     * 2. Select Delivery
     */
    selectDeliveryParams(carrierCode: string = this.delivery.carrierCode) {
        return {
            q: JSON.stringify({
                carrierCode,
            }),
        };
    }

    /**
     * 3. Update Delivery
     */
    updateDeliveryBody(ticketId: number) {
        return {
            ticketId,
            warehouseCode: this.delivery.warehouseCode,
            customer: this.customerInfo()

        };
    }

    /**
     * 4. Get Delivery Order
     */
    getDeliveryOrderParams(ticketId: number) {
        return {
            q: JSON.stringify({
                routeCodes: [],
                referenceId: ticketId,
            }),
            offset: '0',
            callMore: 'false',
            getTotal: 'false',
        };
    }

    /**
     * 5. Create Delivery
     */
    createDeliveryBody(
        so: string,
        deliveryBasketCode: string,
        donePackTime: number,
    ) {
        if (this.delivery.minimalFlow) {
            return {
                so: `${so}`,
                carrierId: this.delivery.carrierId,
                numPackage: 1,
                weight: this.data.deliveryWeight,
                warehouseCode: this.delivery.warehouseCode,
            };
        }

        return {
            weight: this.data.deliveryWeight,
            carrierId: this.delivery.carrierId,
            carrierName: this.delivery.carrierName,
            numPackage: 1,
            so: `${so}-F`,
            parentReferenceCode: so,
            type: '',
            donePackTime,
            mergeStatus: null,
            baskets: [
                { code: deliveryBasketCode },
            ],
            warehouseCode: this.delivery.warehouseCode,
        };
    }

    /**
     * 6. Get Delivery After Create
     */
    getDeliveryAfterCreateParams(so: string) {
        if (this.delivery.minimalFlow) {
            return {
                q: JSON.stringify({
                referenceCode: `${so}`,
            }),
            offset: '0',
            limit: '100',
            getTotal: 'false',
            };
        }
        return {
            q: JSON.stringify({
                referenceCode: `${so}-F`,
            }),
            offset: '0',
            limit: '100',
            getTotal: 'false',
        };
    }

    /**
     * 7. Get Transport Info
     */
    getTransportInfoParams(so: string) {
        return {
            q: JSON.stringify({
                status: 'STORING',
                hubCode: this.delivery.hubCode,
                listReferenceCode: [`${so}-F`],
            }),
        };
    }

    /**
     * 8. Assign Driver
     */
    assignDriverBody(data: AssignDriverRequest) {
        if (this.delivery.minimalFlow) {
            return {
                driverId: data.driverId,
                listReferenceCode: [`${data.so}`],
                hubCode: this.delivery.hubCode,
                listTrackingCode: [data.trackingNumber],
            };
        }

        return {
            driverName: data.driverName,
            driverId: data.driverId,
            listReferenceCode: [`${data.so}-F`],
            hubCode: this.delivery.hubCode,
            listTrackingCode: [data.trackingNumber],
        };
    }

    /**
     * 9. Get Delivery Status
     */
    getDeliveryStatusParams(so: string) {
        return {
            q: JSON.stringify({
                status: 'WAIT_TO_DELIVERY',
                hubCode: this.delivery.hubCode,
                listReferenceCode: [`${so}-F`],
            }),
        };
    }
}