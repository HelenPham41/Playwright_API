import type { OrderTestData } from '../configs/types.js';

export class OrderPayloadBuilder {

  constructor(private readonly data: OrderTestData) {}

  private customerInfo() {
    const d = this.data;
    return {
      customerName:            d.customerName,
      customerPhone:           d.customerPhone,
      customerEmail:           d.customerEmail,
      customerShippingAddress: d.customerShippingAddress,
      customerDistrictCode:    d.customerDistrictCode,
      customerProvinceCode:    d.customerProvinceCode,
      customerWardCode:        d.customerWardCode,
      customerAddressCode:     d.customerAddressCode,
      customerRegionCode:      d.customerRegionCode,
      customerWardName:        d.customerWardName,
      customerDistrictName:    d.customerDistrictName,
      customerProvinceName:    d.customerProvinceName,
    };
  }

  addCartBody(cartNo: string | null) {
    const d = this.data;
    return {
      sku:           d.sku,
      type:          d.type,
      isDeal:        d.isDeal,
      name:          d.productName,
      price:         d.price,
      quantity:      d.quantity,
      cartNo:        cartNo ?? null,
      page:          d.page,
      sellerID:      d.sellerID,
      sellerCode:    d.sellerCode,
      productId:     d.productId,
      eventSource:   d.eventSource,
      eventScreen:   d.eventScreen,
      host:          d.host,
      recommendSKUs: d.recommendSKUs,
      metadata:      { price_display: String(d.price) },
      source:        d.source,
    };
  }

  updateCartBody(cartNo: string) {
    const d = this.data;
    return {
      ...this.customerInfo(),
      paymentMethod:  d.paymentMethod,
      deliveryMethod: d.deliveryMethod,
      cartNo,
      ordersCount:    d.ordersCount,
      invoice: {
        code:                 d.invoiceCode,
        invoiceRequest:       true,
        companyName:          d.invoiceCompanyName,
        companyAddress:       d.invoiceCompanyAddress,
        taxCode:              d.invoiceTaxCode,
        isSaveInvoiceInfo:    false,
        isUseCustom:          false,
        email:                d.invoiceEmail,
        isValidated:          true,
        customerTaxGOVStatus: 'DIFF_INFO',
        isDefault:            true,
      },
      isRefuseSplitOrder:    false,
      acceptAdvancePolicies: false,
      source:                d.source,
    };
  }

  checkoutBody() {
    const d = this.data;
    return {
      ...this.customerInfo(),
      paymentMethods: [{
        cardList:     d.checkoutPaymentCardList,
        code:         d.checkoutPaymentCode,
        customerTags: d.checkoutPaymentCustomerTags,
        description:  '<p></p>',
      }],
    };
  }
}
