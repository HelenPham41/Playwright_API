import type { CountryConfig } from '../types.js';

export const VN_CONFIG: CountryConfig = {
  countryCode: 'VN',

  hosts: {
    order:    process.env.BASE_URL      || 'https://api.v2-stg.thuocsi.vn',
    internal: process.env.INTERNAL_URL  || 'https://internal.v2-stg.thuocsi.vn',
    web:      process.env.WEB_URL       || 'https://web.v2-stg.thuocsi.vn',
  },

  auth: {
    username:      process.env.API_USERNAME || '0559948786',
    password:      process.env.API_PASSWORD || 'Hanh12345$$',
    basicToken:    process.env.BASIC_TOKEN  || 'UEFSVE5FUi9zZWxsZXIuY29yZTpJT2tuTWdaaU1Ka2JSUEU=',
    loginEndpoint: '/marketplace/customer/v1/authentication',
  },

  endpoints: {
    checkCart:   '/backend/marketplace/order/v2/cart/select',
    getCartInfo: '/backend/marketplace/frontend-apis/v2/screen/cart/info',
    getCartInfoParams: {
      queryOption:          'price,consumedMaxQuantity,sellerInfo,isGetSKUReplace,cartPage',
      getVoucherAuto:       'true',
      redeemCodeRemovedStr: '',
      onSort:               'false',
    },
    removeCart:  '/backend/marketplace/order/v2/cart/remove',
    addCart:     '/backend/marketplace/order/v2/cart/add',
    updateCart:  '/backend/marketplace/order/v2/cart',
    checkout:    '/backend/marketplace/order/v2/cart/checkout',
    cancelOrder: '/backend/marketplace/order/v2/order/status',
  },

  pack: {
    warehouseCode: process.env.LOCATION  || 'BD',
    zoneCode:      'PACK-RFID-01',
    endpoints: {
      staffZoneSession: '/warehouse/core/v1/staff-zone-session/check',
      updateTicket:     '/warehouse/picking/v1/pick-ticket/v2/update',
      getBin:           '/warehouse/inventory/v1/location',
      addBasket:        '/warehouse/picking/v1/basket/use',
    },
  },

  qc: {
    warehouseCode: process.env.LOCATION  || 'BD',
    zoneCode:      process.env.ZONE_CODE || 'QC-01',
    endpoints: {
      staffZoneSession: '/backend/warehouse/core/v1/staff-zone-session/check',
      pickTicket:       '/backend/warehouse/picking/v1/pick-ticket',
      getQrCode:        '/backend/operation/qr/v1/qrcode',
      scanTicketItem:   '/backend/warehouse/picking/v1/scan-ticket-item/scan',
      doneQcMoveToPack: '/backend/warehouse/picking/v1/pick-ticket/v2/update',
    },
  },

  pick: {
    warehouseCode: process.env.LOCATION || 'BD',
    employee:      'seller.core',
    employeeId:    100000039,

    confirmPayment: {
      bankCode:              '333',
      bankAccountNumber:     '0314758651',
      bankChannel:           'OCB',
      bankingTransactionCode:'Ma transaction',
      remarkTemplate:        'NHAN TU 104866682689 TRACE 237883 ND QR - {orderId} - Nguyen Huu Tho - MD',
    },

    endpoints: {
      orderList:        '/backend/marketplace/order/v2/order/list',
      confirmOrder:     '/backend/marketplace/order/v2/order/status',
      saleOrders:       '/warehouse/core/v1/sale-orders',
      checkPickTicket:  '/backend/warehouse/picking/v1/pick-ticket/active/check',
      activePickTicket: '/warehouse/picking/v1/pick-ticket/active',
      pickTicketItem:   '/backend/warehouse/picking/v1/pick-ticket-item',
      staffZoneSession: '/warehouse/core/v1/staff-zone-session/check',
      assignPickStaff:  '/warehouse/picking/v1/pick-ticket/assign-manual',
      location:         '/warehouse/inventory/v1/location',
      useBasket:        '/warehouse/picking/v1/sub-pick-ticket/basket/use',
      pickItem:         '/warehouse/picking/v1/sub-pick-ticket-item/pick',
      completePick:     '/warehouse/picking/v1/sub-pick-ticket/complete',
      completePickSO:   '/warehouse/picking/v1/pick-ticket/pick-quantity',
    },
  },

};
