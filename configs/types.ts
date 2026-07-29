export interface ScenarioData {
  // Product
  sku: string;
  productName: string;
  price: number;
  quantity: number;
  type: string;
  isDeal: boolean | null;
  cartNo?: string;
  page: string;
  sellerID: number;
  sellerCode: string;
  productId: number;
  eventSource: string;
  eventScreen: string;
  host?: string;
  recommendSKUs?: string;
  source: string;

  // Customer & Shipping
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerShippingAddress: string;
  customerDistrictCode: string;
  customerProvinceCode: string;
  customerWardCode: string;
  customerAddressCode: string;
  customerRegionCode: string;
  customerWardName: string;
  customerDistrictName: string;
  customerProvinceName: string;
  ordersCount: number;

  //business
  businessName: string;
  businessCode: string;


  // Payment (updateCart)
  paymentMethod: string;
  deliveryMethod: string;

  // Invoice (updateCart)
  invoiceCode: string;
  invoiceCompanyName: string;
  invoiceCompanyAddress: string;
  invoiceTaxCode: string;
  invoiceEmail: string;

  // Checkout payment
  checkoutPaymentCode: string;
  checkoutPaymentCardList: string;
  checkoutPaymentCustomerTags: string[];

  // UpdateCart extras (country-specific)
  invoiceRequest?: boolean;
  totalWard?: number;
  paymentMethods?: Record<string, unknown>[];
  deliveryMethods?: Record<string, unknown>[];

  // Delivery (bookShipper)
  deliveryWeight: number;
  driverId?: number;
  driverName?: string;
  driverPwd?: string;

  // Delivery image/signature upload (delivery flow)
  dataImage?: string;
  dataSignature?: string;
  fileName?: string;
  refType?: string;

  //Reconcile (reconcileShipper)
  reconcileType?: string;
  reconcileOrderId?: number;
  reconcileOrderCode?: string;
  reconcilePaymentSessionId?: number;
  reconcilePaymentLineId?: number;
  reconcileBankCode?: string;
  reconcileBankAccountNumber?: string;
  reconcileBankChannel?: string;
  reconcileBankingTransactionCode?: string;
  reconcileRemarkTemplate?: string;

  //Reconcile Accounting (reconcileShipper)
  reconcileAccountingType?: string;
  reconcileAccountingOrderId?: number;
  reconcileAccountingOrderCode?: string;
  reconcileAccountingSessionId?: number;
  reconcileAccountingLineId?: number;
  reconcileAccountingBankCode?: string;
  reconcileAccountingBankAccountNumber?: string;
  reconcileAccountingBankChannel?: string;
  reconcileAccountingBankingTransactionCode?: string;
  reconcileAccountingRemarkTemplate?: string;

  //Internal Tranfer
  internalTransferType?: string;
}


export interface CountryConfig {
  countryCode: 'VN' | 'TH' | 'KH';

  hosts: {
    order: string;
    internal: string;
    web: string;
    app?: string;
    sso_App?: string;
  };

  auth: {
    username: string;
    password: string;
    basicToken: string;
    loginEndpoint: string;
  };

  endpoints: {
    checkCart: string;
    getCartInfo: string;
    getCartInfoParams?: Record<string, string>;
    removeCart: string;
    addCart: string;
    updateCart: string;
    updatePaymentToCOD?: string;
    checkout: string;
    cancelOrder: string;
  };

  pack?: {
    warehouseCode: string;
    zoneCode: string;
    skipBinStep?: boolean; // TH: không có bước getBin/addBasket/packComplete riêng
    endpoints: {
      staffZoneSession: string;
      updateTicket: string;
      getBin: string;
      addBasket: string;
    };
  };

  qc?: {
    warehouseCode: string;
    zoneCode: string;
    host?: 'web' | 'internal';           // host cho checkInQcZone + scanTicketItem (VN: 'web', TH: 'internal')
    scanQrFieldStyle?: 'flat' | 'mongo'; // shape field trong qr.* của scanTicketItem
    generateQrLocally?: boolean;         // TH: không có API GET tra cứu QR — tự build qrData ở client
    endpoints: {
      staffZoneSession: string;
      pickTicket: string;
      getQrCode: string;
      scanTicketItem: string;
      doneQcMoveToPack?: string;  // VN: 1 API gộp done QC + move to pack
      doneQc?: string;            // TH: API riêng "done QC"
      moveToPack?: string;        // TH: API riêng "move to pack"
    };
  };

  pick?: {
    warehouseCode: string;
    employee: string;
    employeeId: number;
    checkPickTicketBy: 'ticketId' | 'so';
    minimalFlow?: boolean;
    confirmPayment: {
      bankCode: string;
      bankAccountNumber: string;
      bankChannel: string;
      bankingTransactionCode: string;
      remarkTemplate: string;  // placeholder: {orderId}
    };
    endpoints: {
      orderList: string;
      confirmOrder: string;
      saleOrders: string;
      subPickTicket?: string;
      checkPickTicket: string;
      activePickTicket: string;
      pickTicketItem: string;
      staffZoneSession: string;
      assignPickStaff: string;
      location: string;
      useBasket: string;
      pickItem: string;
      completePick: string;
      completePickSO: string;
      addNoteForOrder?: string;
      getCurrentTicket?: string;
    };
  };
  bookShipper?: {
    warehouseCode: string;
    hubCode: string;
    carrierCode: string;
    carrierId: number;
    carrierName: string;
    driverId?: number;
    driverName?: string;
    minimalFlow?: boolean;

    endpoints: {
      getDeliveryInfo: string;
      selectDelivery: string;
      updateDelivery: string;
      getDeliveryOrder: string;
      createDelivery: string;
      getDeliveryAfterCreate: string;
      getTransportInfo: string;
      assignDriver: string;
      getDeliveryStatus: string;

    };
  };

  delivery?: {
    warehouseCode: string;
    hubCode: string;
    carrierCode: string;
    carrierId: number;
    carrierName: string;
    clientId: string;
    clientSecret: string;
    driverName?: string;
    driverPwd?: string;
    id?: number;
    latitude?: number;
    longitude?: number;
    minimalFlow?: boolean;

    endpoints: {
      loginApp: string;
      auth: string;
      loginRider: string;
      acceptDelivery: string;
      confirmCurrentAddress: string;
      getUploadImageToken: string;
      uploadImage: string;
      getUploadSignatureToken: string;
      uploadSignature: string;
      completeDelivery: string;
      getDeliveryStatus: string;
    };
  };

  reconcileShipper?: {
    warehouseCode: string;
    hubCode: string;
    reconcileType: string;
    minimalFlow?: boolean;
    endpoints: {
      getPaymentSession: string;
      getPaymentLine: string;
      checkReconcileOrder: string;
      confirmPayment: string;
      getReconcileActivity: string;
      approveReconcile: string;
    };
  };

  reconcileAccounting?: {
    warehouseCode: string;
    hubCode: string;
    reconcileAccountingType: string;
    minimalFlow?: boolean;
    endpoints: {
      getReconcileSessionAccounting: string;
      getReconcileOrdersAccounting: string;
      selectReconcileOrdersAccounting: string;
      confirmReconcileAccounting: string;
      approveReconcileAccounting: string;
      getCompletedOrderAccounting: string;
      getAndUpdateBillInfo: string;
    };
  };

  internalTransfer?: {
    warehouseCode: string;
    endpoints: {
      getInternalTransferList: string;
    };
  };
  
}

