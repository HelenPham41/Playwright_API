import type { CountryConfig } from '../types.js';

export const TH_CONFIG: CountryConfig = {
  countryCode: 'TH',

  hosts: {
    order:    process.env.BASE_URL     || 'https://internal.stg.th.buymed.tech',
    internal: process.env.INTERNAL_URL || 'https://internal.stg.th.buymed.tech',
    web:      process.env.WEB_URL      || 'https://internal.stg.th.buymed.tech',
  },

  auth: {
    username:      process.env.API_USERNAME || '0559948786',
    password:      process.env.API_PASSWORD || 'A12345678a',
    basicToken:    process.env.BASIC_TOKEN  || '',                                  // TODO: provide TH basicToken
    loginEndpoint: '/backend/marketplace/customer/v1/authentication',
  },

  endpoints: {
    checkCart:   '/backend/marketplace/order/v2/cart/select',                       // TODO: confirm TH endpoint
    getCartInfo: '/backend/marketplace/order/v2/cart/v2',
    removeCart:  '/backend/marketplace/order/v2/cart/remove',                       // TODO: confirm TH endpoint
    addCart:     '/backend/marketplace/order/v2/cart/add',                          // TODO: confirm TH endpoint
    updateCart:  '/backend/marketplace/order/v2/cart',                              // TODO: confirm TH endpoint
    checkout:    '/backend/marketplace/order/v2/cart/checkout',                     // TODO: confirm TH endpoint
    cancelOrder: '/backend/marketplace/order/v2/order/status',                      // TODO: confirm TH endpoint
  },
};
