import type { ScenarioData } from '../configs/types.js';

export const KH_SCENARIO_DATA: ScenarioData = {
  // Product
  sku:         'BUYMED.F7Q4FW96',
  productName: 'សុីរ៉ូក្អក Prospan សម្រាប់ទារក',
  price:       7052000,
  quantity:    2,
  type:        'NORMAL',
  isDeal:      null,
  page:        'products',
  sellerID:    1,
  sellerCode:  'BUYMED',
  productId:   50002,
  eventSource: 'product-list',
  eventScreen: 'product-list',
  source:      'thuocsi-web',

  // Customer & Shipping
  customerName:            '[TECH] Hanh Pham',
  customerPhone:           '0559948786',
  customerEmail:           'hanh.pham@buymed.com',
  customerShippingAddress: '12 Le Thanh Ton',
  customerDistrictCode:    '0604',
  customerProvinceCode:    '06',
  customerWardCode:        '060403',
  customerAddressCode:     'CBEUCUBP',
  customerRegionCode:      '',                                                     // TODO: confirm KH region code
  customerWardName:        '',
  customerDistrictName:    '',
  customerProvinceName:    '',
  ordersCount:             21,

  // Payment (updateCart)
  paymentMethod:  'PAYMENT_METHOD_NORMAL',
  deliveryMethod: 'Grab',
  totalWard:      7,

  paymentMethods: [
    {
      cardList:            '',
      code:                'PAYMENT_METHOD_QR_ABA',
      customerIdsApplied:  [],
      description:         '<p></p>\n',
      locationPercentage:  0.5,
      name:                'ABA KHQR',
      paymentLocations:    [{ feeDiscountPercentage: 0.5, locationCodes: ['00'] }],
      priority:            0,
      status:              'ON',
      subLabel:            '',
      subTitle:            'Scan to pay with any banking app',
      totalPaymentDynamic: -0.5,
      mapLocationFee:      { '00': '0.5' },
      additionFeeText:     '- 0.5%',
      defaultValue:        '0.5',
      isDisable:           false,
      errorMessage:        false,
    },
    {
      cardList:            '',
      code:                'PAYMENT_METHOD_BANK',
      customerIdsApplied:  [],
      description:         `<p style="text-align:justify;"><strong>លេខគណនី ABA លុយដុល្លា (USD):</strong>003 707 156</p>
<p style="text-align:justify;"><strong>លេខគណនី ABA លុយរៀល (KHR):</strong>006 116 353</p>
<p style="text-align:justify;"><strong>លេខគណនី Acleda លុយដុល្លា (USD):</strong>3873 0441 8319 99</p>
<p style="text-align:justify;"><strong>លេខគណនី Acleda លុយរៀល (KHR):</strong>3873 0441 8319 77</p>
<p style="text-align:justify;"><strong>ឈ្មោះគណនី:</strong>BUYMED (CAMBODIA) CO., LTD</p>
<p style="text-align:justify;">*សូមដាក់ឈ្មោះឱសថស្ថាន រឺ លេខវិក័យប័ត្រជាសំគាល់ពេលទូទាត់តាមគណនីធនាគារ។​ សូមអរគុណ។</p>`,
      locationPercentage:  5,
      name:                'បង់ប្រាក់ជាមុនតាមគណនីធនាគារ',
      paymentLocations:    [{ feeDiscountPercentage: 5, locationCodes: ['00'] }],
      priority:            1,
      status:              'ON',
      subLabel:            '-{percentage}%',
      subTitle:            'ទទួលបានការបញ្ចុះថ្លៃ 0.5%',
      totalPaymentDynamic: -5,
      mapLocationFee:      { '00': '5' },
      additionFeeText:     '- 5%',
      defaultValue:        '5',
      isDisable:           false,
      errorMessage:        false,
    },
    {
      cardList:           '',
      code:               'PAYMENT_METHOD_NORMAL',
      customerIdsApplied: [],
      description:        '<p></p>\n',
      locationPercentage: 0,
      name:               'គិតលុយពេលដឹកទៅដល់',
      paymentLocations: [
        { feeDiscountPercentage: 0, locationCodes: ['00'] },
        { feeDiscountPercentage: 0, locationCodes: ['25'] },
      ],
      priority:        2,
      status:          'ON',
      subTitle:        '',
      mapLocationFee:  { '00': '0', '25': '0' },
      additionFeeText: '',
      defaultValue:    '0',
      isDisable:       false,
      errorMessage:    false,
    },
  ],

  deliveryMethods: [
    {
      code:              'Grab',
      condition:         { minPrice: 9, timeToDeliver: 36 },
      deliveryLocations: [{ feeValue: 0, locationCodes: ['00'] }],
      description:       '<p>Shipping with cheap price</p>\n',
      name:              'ការដឹកជញ្ជូនសេដ្ឋកិច្ច',
      priority:          0,
      status:            'ON',
      subTitle:          '',
      mapLocationFee:    { '00': 0 },
    },
    {
      code:              '0909',
      condition:         {
        minPrice: 1000,
        notSupportYYYYMMDDs: ['20221116'],
        timeToDeliver: 24,
      },
      deliveryLocations: [{ feeValue: 12550, locationCodes: ['00'] }],
      description:       '<p>Shipping method within 24h</p>\n',
      name:              'Fast Delivery',
      priority:          0,
      status:            'ON',
      subTitle:          '',
      mapLocationFee:    { '00': 12550 },
    },
  ],

  // Invoice (updateCart)
  invoiceRequest:        false,
  invoiceCode:           '',
  invoiceCompanyName:    '',
  invoiceCompanyAddress: '',
  invoiceTaxCode:        '',
  invoiceEmail:          'hanh.pham@buymed.com',

  // Checkout payment
  checkoutPaymentCode:         '',
  checkoutPaymentCardList:     '',
  checkoutPaymentCustomerTags: [],

  // Delivery (bookShipper) — TODO: confirm KH delivery weight, bookShipper chưa có config cho KH
  deliveryWeight: 0.254,
};
