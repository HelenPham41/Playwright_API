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

};
