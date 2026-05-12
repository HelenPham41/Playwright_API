export interface OrderTestData {
  // Product
  sku: string;
  productName: string;
  price: number;
  quantity: number;
  type: string;
  isDeal: boolean;
  page: string;
  sellerID: number;
  sellerCode: string;
  productId: number;
  eventSource: string;
  eventScreen: string;
  host: string;
  recommendSKUs: string;
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
    getCartInfoParams: Record<string, string>;
    removeCart: string;
    addCart: string;
    updateCart: string;
    checkout: string;
    cancelOrder: string;
  };

  orderData: OrderTestData;
}
