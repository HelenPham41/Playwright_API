import type { OrderTestData } from '../../configs/types.js';

export const TH_ORDER_DATA: OrderTestData = {
  // TODO: provide TH product info
  sku:           '',
  productName:   '',
  price:         0,
  quantity:      1,
  type:          'NORMAL',
  isDeal:        false,
  page:          'product/[slug]',
  sellerID:      0,                     // TODO: TH sellerID
  sellerCode:    '',                    // TODO: TH sellerCode
  productId:     0,                     // TODO: TH productId
  eventSource:   'product-detail',
  eventScreen:   'product-detail',
  host:          'web.stg.th.buymed.tech',  // TODO: confirm TH web host
  recommendSKUs: '',
  source:        'thuocsi-web',         // TODO: confirm TH source value

  // TODO: provide TH customer & shipping info
  customerName:            '',
  customerPhone:           '',
  customerEmail:           '',
  customerShippingAddress: '',
  customerDistrictCode:    '',
  customerProvinceCode:    '',
  customerWardCode:        '',
  customerAddressCode:     '',
  customerRegionCode:      '',
  customerWardName:        '',
  customerDistrictName:    '',
  customerProvinceName:    '',
  ordersCount:             0,

  // TODO: confirm TH payment method
  paymentMethod:  '',
  deliveryMethod: '',

  // TODO: provide TH invoice info
  invoiceCode:           '',
  invoiceCompanyName:    '',
  invoiceCompanyAddress: '',
  invoiceTaxCode:        '',
  invoiceEmail:          '',

  // TODO: confirm TH checkout payment
  checkoutPaymentCode:         '',
  checkoutPaymentCardList:     '',
  checkoutPaymentCustomerTags: [],
};
