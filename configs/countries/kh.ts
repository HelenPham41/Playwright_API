import type { CountryConfig } from '../types.js';

export const KH_CONFIG: CountryConfig = {
  countryCode: 'KH',

  hosts: {
    order:    process.env.BASE_URL     || 'https://internal.stg.kh.buymed.tech',
    internal: process.env.INTERNAL_URL || 'https://internal.stg.kh.buymed.tech',
    web:      process.env.WEB_URL      || 'https://stg.kh.buymed.tech',
  },

  auth: {
    username:      process.env.API_USERNAME || '0559958786',
    password:      process.env.API_PASSWORD || 'A12345678a',
    basicToken:    process.env.BASIC_TOKEN  || '',                                  // TODO: provide KH basicToken
    loginEndpoint: '/backend/marketplace/customer/v1/authentication',
  },

  endpoints: {
    checkCart:   '/backend/marketplace/order/v2/cart/select',                       // TODO: confirm KH endpoint
    getCartInfo: '/backend/marketplace/order/v2/cart/v2',
    removeCart:  '/backend/marketplace/order/v2/cart/remove',                       // TODO: confirm KH endpoint
    addCart:     '/backend/marketplace/order/v2/cart/add',                          // TODO: confirm KH endpoint
    updateCart:  '/backend/marketplace/order/v2/cart',                              // TODO: confirm KH endpoint
    checkout:    '/backend/marketplace/order/v2/cart/checkout',                     // TODO: confirm KH endpoint
    cancelOrder: '/backend/marketplace/order/v2/order/status',                      // TODO: confirm KH endpoint
  },
};
