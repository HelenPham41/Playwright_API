import type { CountryConfig, ScenarioData } from '../configs/types.js';

type DeliveryCfg = NonNullable<CountryConfig['bookShipper']>;

export interface AssignDriverRequest {
    driverId: number;
    driverName: string;
    deliveryCode: string;
    shippingOrderCode: string;
}

export class DeliveryPayloadBuilder {

    constructor(private readonly delivery: DeliveryCfg, private readonly data: ScenarioData) { }

    private customerInfo() {
        const d = this.data;
        return {
            address: d.customerShippingAddress,
            businessName: d.businessName,
            code: d.businessCode,
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
    selectDeliveryParams(carrierCode: string = this.delivery.hubCode) {
        return {
            q: JSON.stringify({
                carrierCode,
            }),
        };
    }

    /**
     * 3. Update Delivery
     */
    updateDeliveryBody(ticketId: string | number) {
        return {
            ticketId,
            warehouseCode: this.delivery.warehouseCode,
            customer: this.customerInfo()

        };
    }

    /**
     * 4. Get Delivery Order
     */
    getDeliveryOrderParams(ticketId: string | number) {
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
        shippingOrderCode: string,
        deliveryBasketCode: string,
    ) {
        return {
            warehouseCode: this.delivery.warehouseCode,
            shippingOrderCode,
            deliveryBasketCode,
        };
    }

    /**
     * 6. Get Delivery After Create
     */
    getDeliveryAfterCreateParams(so: string) {
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
        return {
            warehouseCode: this.delivery.warehouseCode,
            driverId: data.driverId,
            driverName: data.driverName,
            deliveryCode: data.deliveryCode,
            shippingOrderCode: data.shippingOrderCode,
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