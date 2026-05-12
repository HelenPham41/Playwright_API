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
    password:      process.env.API_PASSWORD || 'H12345678h*',
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

  orderData: {
    // Product
    sku:          'MEDX.Y4XP61PG',
    productName:  'Tinh dầu đuổi muỗi và côn trùng, khử khuẩn Thảo Nguyên hương sả chanh – Nhà Thuốc Helios',
    price:        1084400,
    quantity:     2,
    type:         'NORMAL',
    isDeal:       false,
    page:         'product/[slug]',
    sellerID:     1,
    sellerCode:   'MEDX',
    productId:    2431073,
    eventSource:  'product-detail',
    eventScreen:  'product-detail',
    host:         'web.v2-stg.thuocsi.vn',
    recommendSKUs: '',
    source:       'thuocsi-web',

    // Customer & Shipping
    customerName:             '[Tech] Hanh Pham',
    customerPhone:            '0559948786',
    customerEmail:            'hanh.pham@buymed.com',
    customerShippingAddress:  '72 Le Thanh Ton',
    customerDistrictCode:     '765',
    customerProvinceCode:     '79',
    customerWardCode:         '26947',
    customerAddressCode:      'YFFPHGG3',
    customerRegionCode:       '107TQTAR1Y7G',
    customerWardName:         'Phường 03',
    customerDistrictName:     'Quận Bình Thạnh',
    customerProvinceName:     'Thành phố Hồ Chí Minh',
    ordersCount:              151,

    // Payment (updateCart)
    paymentMethod:   'PAYMENT_METHOD_BANK',
    deliveryMethod:  'DELIVERY_PLATFORM_NORMAL',

    // Invoice (updateCart)
    invoiceCode:           'RHGARL8C',
    invoiceCompanyName:    'Công Ty TNHH CIRCA PHARMACY',
    invoiceCompanyAddress: '207 Lê Đại Hành, Phường 13, Q11, TP. HCM',
    invoiceTaxCode:        '0317045088',
    invoiceEmail:          'lam.nguyen@buymed.com',

    // Checkout payment
    checkoutPaymentCode:         'MOMO',
    checkoutPaymentCardList:     'MOMO',
    checkoutPaymentCustomerTags: ['13384', 'TESTCREDIT'],
  },
};
