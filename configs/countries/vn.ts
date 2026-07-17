import type { CountryConfig } from '../types.js';

export const VN_CONFIG: CountryConfig = {
  countryCode: 'VN',

  hosts: {
    order: process.env.BASE_URL || 'https://api.v2-stg.thuocsi.vn',
    internal: process.env.INTERNAL_URL || 'https://internal.v2-stg.thuocsi.vn',
    web: process.env.WEB_URL || 'https://web.v2-stg.thuocsi.vn',
  },

  auth: {
    username: process.env.API_USERNAME || '0559948786',
    password: process.env.API_PASSWORD || 'Hanh12345$$',
    basicToken: process.env.BASIC_TOKEN || 'UEFSVE5FUi9zZWxsZXIuY29yZTpJT2tuTWdaaU1Ka2JSUEU=',
    loginEndpoint: '/marketplace/customer/v1/authentication',
  },

  endpoints: {
    checkCart: '/backend/marketplace/order/v2/cart/select',
    getCartInfo: '/backend/marketplace/frontend-apis/v2/screen/cart/info',
    getCartInfoParams: {
      queryOption: 'price,consumedMaxQuantity,sellerInfo,isGetSKUReplace,cartPage',
      getVoucherAuto: 'true',
      redeemCodeRemovedStr: '',
      onSort: 'false',
    },
    removeCart: '/backend/marketplace/order/v2/cart/remove',
    addCart: '/backend/marketplace/order/v2/cart/add',
    updateCart: '/backend/marketplace/order/v2/cart',
    checkout: '/backend/marketplace/order/v2/cart/checkout',
    cancelOrder: '/backend/marketplace/order/v2/order/status',
  },

  pack: {
    warehouseCode: process.env.LOCATION || 'BD',
    zoneCode: 'PACK-RFID-01',
    endpoints: {
      staffZoneSession: '/warehouse/core/v1/staff-zone-session/check',
      updateTicket: '/warehouse/picking/v1/pick-ticket/v2/update',
      getBin: '/warehouse/inventory/v1/location',
      addBasket: '/warehouse/picking/v1/basket/use',
    },
  },

  qc: {
    warehouseCode: process.env.LOCATION || 'BD',
    zoneCode: process.env.ZONE_CODE || 'QC-01',
    endpoints: {
      staffZoneSession: '/backend/warehouse/core/v1/staff-zone-session/check',
      pickTicket: '/backend/warehouse/picking/v1/pick-ticket',
      getQrCode: '/backend/operation/qr/v1/qrcode',
      scanTicketItem: '/backend/warehouse/picking/v1/scan-ticket-item/scan',
      doneQcMoveToPack: '/backend/warehouse/picking/v1/pick-ticket/v2/update',
    },
  },

  pick: {
    warehouseCode: process.env.LOCATION || 'BD',
    employee: 'seller.core',
    employeeId: 100000039,

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
      saleOrders: '/warehouse/core/v1/sale-orders',
      checkPickTicket: '/backend/warehouse/picking/v1/pick-ticket/active/check',
      activePickTicket: '/warehouse/picking/v1/pick-ticket/active',
      pickTicketItem: '/backend/warehouse/picking/v1/pick-ticket-item',
      staffZoneSession: '/warehouse/core/v1/staff-zone-session/check',
      assignPickStaff: '/warehouse/picking/v1/pick-ticket/assign-manual',
      location: '/warehouse/inventory/v1/location',
      useBasket: '/warehouse/picking/v1/sub-pick-ticket/basket/use',
      pickItem: '/warehouse/picking/v1/sub-pick-ticket-item/pick',
      completePick: '/warehouse/picking/v1/sub-pick-ticket/complete',
      completePickSO: '/warehouse/picking/v1/pick-ticket/pick-quantity',
    },
  },

  bookShipper: {
    warehouseCode: process.env.LOCATION || 'BD',
    carrierCode: process.env.Carrier_CODE || 'NVCTHCM',
    hubCode: process.env.HUB_CODE || 'HUBBD',
    carrierId: 160,
    carrierName: 'NV Công Ty - HCM',

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

  delivery: {
    warehouseCode: process.env.LOCATION || 'BD',
    carrierCode: process.env.Carrier_CODE || 'NVCTHCM',
    hubCode: process.env.HUB_CODE || 'HUBBD',
    carrierId: 160,
    carrierName: 'NV Công Ty - HCM',
    appUrl: process.env.DELIVERY_URL || 'https://api.iam.stg.buymed.tech',
    clientId: process.env.DELIVERY_CLIENT_ID || '9f352AFrUDIRS8W4jlYBWKDrJ61p4wE8qtL4mp7DAH4vEjji',
    clientSecret: process.env.DELIVERY_CLIENT_SECRET || 'uztmAFaKXifzhjtw2PUyMlcZcfleS2h9uhBy7eBXNtxWJDYj',
    driverPwd: process.env.DRIVER_PWD || 'Lam123456',
    id: 3321,
    latitude: 37.785834,
    longitude: -122.406417,

    endpoints: {
      loginApp: '/iam/core/v1/sso/login',

      auth: '/iam/core/v1/oauth/authorize',

      loginRider: '/iam/core/v1/oauth/token',

      acceptDelivery:
        '/delivery/transporting/v1/hub-order/status',

      confirmCurrentAddress:
        '/delivery/transporting/v1/shipping-address',

      getUploadImageToken:
        '/core/file-manager/v1/access-token/gen',

      uploadImage:
        '/core/file-manager/v1/upload/image',

      getUploadSignatureToken:
        '/core/file-manager/v1/access-token/gen',

      uploadSignature:
        '/core/file-manager/v1/upload/image',

      completeDelivery:
        '/delivery/transporting/v1/hub-order/status',

      getDeliveryStatus:
        '/backend/delivery/transporting/v1/hub-order',
    }
  },

  reconcileShipper: {
    warehouseCode: process.env.LOCATION || 'BD',
    hubCode: process.env.HUB_CODE || 'HUBBD',
    reconcileType: 'RIDER_HUB',

    endpoints: {
      getPaymentSession:
        '/accounting/core/v1/reconcile-session/my',

      getPaymentLine:
        '/accounting/core/v1/reconcile-session/order',

      checkReconcileOrder:
        '/accounting/core/v1/reconcile-session/orders',

      confirmPayment:
        '/accounting/core/v1/reconcile-session',

      getReconcileActivity:
        '/backend/core/activity/v1/activity/list',

      approveReconcile:
        '/backend/accounting/core/v1/reconcile-session',
    },
  },
};
