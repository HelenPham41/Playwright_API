import type { ScenarioData } from '../configs/types.js';

export const VN_SCENARIO_DATA: ScenarioData = {
  // Product
  sku:           'MEDX.Y4XP61PG',
  productName:   'Tinh dầu đuổi muỗi và côn trùng, khử khuẩn Thảo Nguyên hương sả chanh – Nhà Thuốc Helios',
  price:         1084400,
  quantity:      2,
  type:          'NORMAL',
  isDeal:        false,
  page:          'product/[slug]',
  sellerID:      1,
  sellerCode:    'MEDX',
  productId:     2431073,
  eventSource:   'product-detail',
  eventScreen:   'product-detail',
  host:          'web.v2-stg.thuocsi.vn',
  recommendSKUs: '',
  source:        'thuocsi-web',

  // Customer & Shipping
  customerName:            '[Tech] Hanh Pham',
  customerPhone:           '0559948786',
  customerEmail:           'hanh.pham@buymed.com',
  customerShippingAddress: '72 Le Thanh Ton',
  customerDistrictCode:    '765',
  customerProvinceCode:    '79',
  customerWardCode:        '26947',
  customerAddressCode:     'YFFPHGG3',
  customerRegionCode:      '107TQTAR1Y7G',
  customerWardName:        'Phường 03',
  customerDistrictName:    'Quận Bình Thạnh',
  customerProvinceName:    'Thành phố Hồ Chí Minh',
  ordersCount:             151,

  //business
  businessName: 'Quầy thuốc',
  businessCode: '29870',

  // Payment (updateCart)
  paymentMethod:  'PAYMENT_METHOD_BANK',
  deliveryMethod: 'DELIVERY_PLATFORM_NORMAL',

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

  // Delivery (bookShipper)
  deliveryWeight: 0.254,

  //Driver Info
  driverName: 'lam.delivery.malo',
  driverId: 11140,
};
