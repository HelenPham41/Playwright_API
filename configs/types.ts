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
}

export interface CountryConfig {
  countryCode: 'VN' | 'TH' | 'KH';

  hosts: {
    order: string;
    internal: string;
    web: string;
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
    checkout: string;
    cancelOrder: string;
  };

  pack?: {
    warehouseCode: string;
    zoneCode: string;
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
    endpoints: {
      staffZoneSession: string;
      pickTicket: string;
      getQrCode: string;
      scanTicketItem: string;
      doneQcMoveToPack: string;
    };
  };

  pick?: {
    warehouseCode: string;
    employee: string;
    employeeId: number;
    confirmPayment: {
      bankCode: string;
      bankAccountNumber: string;
      bankChannel: string;
      bankingTransactionCode: string;
      remarkTemplate: string;  // placeholder: {orderId}
    };
    endpoints: {
      orderList:        string;
      confirmOrder:     string;
      saleOrders:       string;
      checkPickTicket:  string;
      activePickTicket: string;
      pickTicketItem:   string;
      staffZoneSession: string;
      assignPickStaff:  string;
      location:         string;
      useBasket:        string;
      pickItem:         string;
      completePick:     string;
      completePickSO:   string;
    };
  };
}
