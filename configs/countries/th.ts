import type { CountryConfig } from '../types.js';

export const TH_CONFIG: CountryConfig = {
  countryCode: 'TH',

  hosts: {
    order:    process.env.BASE_URL     || 'https://internal.stg.th.buymed.tech',
    internal: process.env.INTERNAL_URL || 'https://internal.stg.th.buymed.tech',
    web:      process.env.WEB_URL      || 'https://stg.th.buymed.tech',
  },

  auth: {
    username:      process.env.API_USERNAME || '0559958786',
    password:      process.env.API_PASSWORD || 'A12345678a',
    basicToken:    process.env.BASIC_TOKEN  || 'UEFSVE5FUi92Mi5jdXN0b21lci5jdXN0b21lcjpWNHRqTDI5UVQ0',
    loginEndpoint: '/backend/marketplace/customer/v1/authentication',
  },

  endpoints: {
    checkCart:   '/backend/marketplace/order/v2/cart/select',                       
    getCartInfo: '/backend/marketplace/order/v2/cart/v2',
    removeCart:  '/backend/marketplace/order/v2/cart/remove',                      
    addCart:     '/backend/marketplace/order/v2/cart/add',                          
    updateCart:  '/backend/marketplace/order/v2/cart',                              
    checkout:    '/backend/marketplace/order/v2/cart/checkout',                     
    cancelOrder: '/backend/marketplace/order/v2/order/status',                      
  },

  pick: {
    warehouseCode: process.env.LOCATION || 'BK',
    employee: 'Customer Group - Customer Service',
    employeeId: 2,
    checkPickTicketBy: 'so',

    confirmPayment: {
      bankCode: '333',
      bankAccountNumber: '0314758651',
      bankChannel: 'OCB',
      bankingTransactionCode: 'Ma transaction',
      remarkTemplate: 'NHAN TU 104866682689 TRACE 237883 ND QR - {orderId} - Nguyen Huu Tho - MD',
    },

    endpoints: {
      orderList: '/backend/marketplace/order/v2/order/list',
      confirmOrder: '/backend/marketplace/order/v2/order/status',
      saleOrders: '/backend/warehouse/core/v1/sale-orders',
      subPickTicket: '/backend/warehouse/picking/v1/sub-pick-ticket',
      checkPickTicket: '/backend/warehouse/picking/v1/pick-ticket/active/check',
      activePickTicket: '/backend/warehouse/picking/v1/pick-ticket/active',
      pickTicketItem: '/backend/warehouse/picking/v1/pick-ticket-item',
      staffZoneSession: '/backend/warehouse/core/v1/staff-zone-session/check',
      assignPickStaff: '/backend/warehouse/picking/v1/sub-pick-ticket/assign-manual',
      location: '/backend/warehouse/inventory/v1/location',
      useBasket: '/backend/warehouse/picking/v1/sub-pick-ticket/basket/use',
      pickItem: '/backend/warehouse/picking/v1/sub-pick-ticket-item/pick',
      completePick: '/backend/warehouse/picking/v1/sub-pick-ticket/complete',
      completePickSO: '/backend/warehouse/picking/v1/pick-ticket/pick-quantity',
    },
  },

  qc: {
    warehouseCode: process.env.LOCATION || 'BK',
    zoneCode: 'QC-01',
    host: 'internal',
    scanQrFieldStyle: 'mongo',
    generateQrLocally: true,
    endpoints: {
      staffZoneSession: '/backend/warehouse/core/v1/staff-zone-session/check',
      pickTicket: '/backend/warehouse/picking/v1/pick-ticket',
      getQrCode: '/backend/operation/qr/v1/qrcode',
      scanTicketItem: '/backend/warehouse/picking/v1/scan-ticket-item/scan',
      doneQc: '/backend/warehouse/picking/v1/scan-ticket-item/arrange',
      moveToPack: '/backend/warehouse/picking/v1/pick-ticket/status',
    },
  },

  pack: {
    warehouseCode: process.env.LOCATION || 'BK',
    zoneCode: 'PACK-01',
    skipBinStep: true,
    endpoints: {
      staffZoneSession: '/backend/warehouse/core/v1/staff-zone-session/check',
      updateTicket: '/backend/warehouse/picking/v1/pick-ticket/v2/update',
      getBin: '/backend/warehouse/inventory/v1/location',
      addBasket: '/backend/warehouse/picking/v1/basket/use',
    },
  },

   bookShipper: {
    warehouseCode: process.env.LOCATION || 'BK',
    carrierCode: process.env.Carrier_CODE || 'BK',
    hubCode: process.env.HUB_CODE || 'HUB_SPRAKAN',
    carrierId: 3,
    carrierName: 'Internal Carrier Thai',
    minimalFlow: true,

    endpoints: {
      getDeliveryInfo: '/backend/warehouse/picking/v1/pick-ticket',

      selectDelivery: '/backend/delivery/transporting/v1/carrier',

      updateDelivery: '/backend/warehouse/picking/v1/pick-ticket',

      getDeliveryOrder: '/backend/warehouse/core/v1/delivery-order',

      createDelivery: '/backend/delivery/transporting/v1/shipping-service',

      getDeliveryAfterCreate: '/backend/delivery/transporting/v1/shipping-order/list',

      getTransportInfo: '/backend/delivery/transporting/v1/hub-order',

      assignDriver: '/backend/delivery/transporting/v1/hub-order/assign',

      getDeliveryStatus: '/backend/delivery/transporting/v1/hub-order'
    },
  },
};
