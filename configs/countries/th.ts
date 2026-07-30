import type { CountryConfig } from '../types.js';

export const TH_CONFIG: CountryConfig = {
  countryCode: 'TH',

  hosts: {
    order: process.env.BASE_URL || 'https://stg.th.buymed.tech',
    internal: process.env.INTERNAL_URL || 'https://internal.stg.th.buymed.tech',
    web: process.env.WEB_URL || 'https://stg.th.buymed.tech',
    sso_App: process.env.DELIVERY_URL || 'https://api.iam.stg.buymed.tech',
    app: process.env.APP_URL || 'https://api.stg.th.buymed.tech',
  },

  auth: {
    username: process.env.API_USERNAME || '0559958786',
    password: process.env.API_PASSWORD || 'A12345678a',
    basicToken: process.env.BASIC_TOKEN || 'UEFSVE5FUi92Mi5jdXN0b21lci5jdXN0b21lcjpWNHRqTDI5UVQ0',
    loginEndpoint: '/backend/marketplace/customer/v1/authentication',
  },

  endpoints: {
    checkCart: '/backend/marketplace/order/v2/cart/select',
    getCartInfo: '/backend/marketplace/order/v2/cart/v2',
    removeCart: '/backend/marketplace/order/v2/cart/remove',
    addCart: '/backend/marketplace/order/v2/cart/add',
    updateCart: '/backend/marketplace/order/v2/cart',
    checkout: '/backend/marketplace/order/v2/cart/checkout',
    cancelOrder: '/backend/marketplace/order/v2/order/status',
  },

  pick: {
    warehouseCode: process.env.LOCATION || 'BK',
    employee: 'Customer Group - Customer Service',
    employeeId: 2,
    checkPickTicketBy: 'so',
    minimalFlow: true,

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
      completePick: '/backend/warehouse/picking/v1/sub-pick-ticket/status',
      completePickSO: '/backend/warehouse/picking/v1/pick-ticket/pick-quantity',
      addNoteForOrder: '/backend/warehouse/core/v1/note',
      getCurrentTicket: '/backend/warehouse/picking/v1/sub-pick-ticket/get-current',
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

  delivery: {
    warehouseCode: process.env.LOCATION || 'BK',
    carrierCode: process.env.Carrier_CODE || 'BK',
    hubCode: process.env.HUB_CODE || 'HUB_SPRAKAN',
    carrierId: 3,
    carrierName: 'Internal Carrier Thai',
    clientId: process.env.DELIVERY_CLIENT_ID || 'Q7y2uHM5LHN1f1pw8itwL8PmXDcudh36adyDgMDpVcr5NQrN',
    clientSecret: process.env.DELIVERY_CLIENT_SECRET || 'SkUQv69eJE9Y11tldGh2LJ2fu6Tt79MCgmBqq8YF9NexZya5',
    driverPwd: process.env.DRIVER_PWD || 'Lam123456',
    id: 3321,
    latitude: 37.785834,
    longitude: -122.406417,
    minimalFlow: true,

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
    warehouseCode: process.env.LOCATION || 'BK',
    hubCode: process.env.HUB_CODE || 'HUB_SPRAKAN',
    reconcileType: 'RIDER_HUB',
    minimalFlow: true,

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

  reconcileAccounting: {
    warehouseCode: process.env.LOCATION || 'BK',
    hubCode: process.env.HUB_CODE || 'HUB_SPRAKAN',
    reconcileAccountingType: 'HUB_COMP',
    minimalFlow: true,

    endpoints: {
      getReconcileSessionAccounting:
        '/accounting/core/v1/reconcile-session',

      getReconcileOrdersAccounting:
        '/accounting/core/v1/reconcile-session/order',

      selectReconcileOrdersAccounting:
        '/accounting/core/v1/reconcile-session/orders',

      confirmReconcileAccounting:
        '/accounting/core/v1/reconcile-session',

      approveReconcileAccounting:
        '/backend/accounting/core/v1/reconcile-session/approve',

      getCompletedOrderAccounting:
        '/backend/marketplace/order/v2/order/list',

      getAndUpdateBillInfo:
        '/backend/accounting/core/v1/bill',

    },
  },

  internalTransfer: {
    warehouseCode: process.env.LOCATION || 'BK',
    endpoints: {
      getInternalTransferList:
        '/backend/warehouse/inventory/v1/transfer',
    },
  },
};
