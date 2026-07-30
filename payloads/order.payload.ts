import type { ScenarioData } from '../configs/types.js';

export class OrderPayloadBuilder {

  constructor(private readonly data: ScenarioData) { }

  private customerInfo() {
    const d = this.data;
    return {
      customerName: d.customerName,
      customerPhone: d.customerPhone,
      customerEmail: d.customerEmail,
      customerShippingAddress: d.customerShippingAddress,
      customerDistrictCode: d.customerDistrictCode,
      customerProvinceCode: d.customerProvinceCode,
      customerWardCode: d.customerWardCode,
      customerAddressCode: d.customerAddressCode,
      customerRegionCode: d.customerRegionCode,
      customerWardName: d.customerWardName,
      customerDistrictName: d.customerDistrictName,
      customerProvinceName: d.customerProvinceName,
    };
  }

  checkCartBody() {
    return { isSelected: true, isAppliedAll: true };
  }

  removeCartBody(cartNo: string, skus: string[]) {
    return {
      cartNo,
      skus,
      source: this.data.source,
    };
  }

  addCartBody(cartNo: string | null) {
    const d = this.data;
    return {
      sku: d.sku,
      type: d.type,
      isDeal: d.isDeal,
      name: d.productName,
      price: d.price,
      quantity: d.quantity,
      cartNo: cartNo ?? d.cartNo ?? null,
      page: d.page,
      sellerID: d.sellerID,
      sellerCode: d.sellerCode,
      productId: d.productId,
      eventSource: d.eventSource,
      eventScreen: d.eventScreen,
      source: d.source,
      ...(d.host !== undefined ? { host: d.host } : {}),
      ...(d.recommendSKUs !== undefined ? { recommendSKUs: d.recommendSKUs } : {}),
      ...(d.host !== undefined ? { metadata: { price_display: String(d.price) } } : {}),
    };
  }

  updateCartBody(cartNo: string) {
    const d = this.data;
    const invoiceRequest = d.invoiceRequest ?? true;

    const invoice = invoiceRequest
      ? {
        code: d.invoiceCode,
        invoiceRequest: true,
        companyName: d.invoiceCompanyName,
        companyAddress: d.invoiceCompanyAddress,
        taxCode: d.invoiceTaxCode,
        isSaveInvoiceInfo: false,
        isUseCustom: false,
        email: d.invoiceEmail,
        isValidated: true,
        customerTaxGOVStatus: 'DIFF_INFO',
        isDefault: true,
      }
      : {
        invoiceRequest: false,
        companyName: d.invoiceCompanyName,
        companyAddress: d.invoiceCompanyAddress,
        taxCode: d.invoiceTaxCode,
        isSaveInvoiceInfo: false,
        isUseCustom: false,
        email: d.invoiceEmail,
        postCode: 0,
        code: '',
        province: '',
        district: '',
        ward: '',
        streetAddress: '',
      };

    return {
      ...this.customerInfo(),
      ...(d.paymentMethods !== undefined ? { paymentMethods: d.paymentMethods } : {}),
      paymentMethod: d.paymentMethod,
      ...(d.deliveryMethods !== undefined ? { deliveryMethods: d.deliveryMethods } : {}),
      deliveryMethod: d.deliveryMethod,
      ...(d.totalWard !== undefined ? { totalWard: d.totalWard } : {}),
      ordersCount: d.ordersCount,
      invoice,
      cartNo,
      ...(invoiceRequest ? { isRefuseSplitOrder: false, acceptAdvancePolicies: false } : {}),
      source: d.source,
    };
  }

  private findPaymentMethod(code: string) {
    return this.data.paymentMethods?.find(pm => pm.code === code);
  }

  private paymentMethodBody(code: string, cartNo: string, fallback: { cardList: string; description: string; name: string }) {
    const d = this.data;
    const pm = this.findPaymentMethod(code);
    return {
      paymentMethod: code,
      customerDistrictCode: d.customerDistrictCode,
      customerProvinceCode: d.customerProvinceCode,
      customerWardCode: d.customerWardCode,
      cardList: (pm?.cardList as string | undefined) ?? fallback.cardList,
      code,
      description: (pm?.description as string | undefined) ?? fallback.description,
      name: (pm?.name as string | undefined) ?? fallback.name,
      isDisable: (pm?.isDisable as boolean | undefined) ?? false,
      defaultValue: (pm?.defaultValue as string | undefined) ?? null,
      errorMessage: (pm?.errorMessage as boolean | undefined) ?? false,
      cartNo,
      source: d.source,
    };
  }

  updatePaymentToCODBody(cartNo: string) {
    return this.paymentMethodBody('PAYMENT_METHOD_NORMAL', cartNo, {
      cardList: '',
      description: '<p></p>\n',
      name: 'Thanh toán tiền mặt',
    });
  };
  updatePaymentToBankTransferBody(cartNo: string) {
    return this.paymentMethodBody('PAYMENT_METHOD_BANK', cartNo, {
      cardList: '',
      description: '<p></p>\n',
      name: 'Chuyển khoản (Giảm 0.5%)',
    });
  };


  checkoutBody(cartNo: string) {
    const d = this.data;

    // TH, KH: checkout body is structurally identical to updateCart body
    if ((d.invoiceRequest ?? true) === false) {
      return this.updateCartBody(cartNo);
    }

    // VN: minimal checkout body
    return {
      ...this.customerInfo(),
      paymentMethods: [{
        cardList: d.checkoutPaymentCardList,
        code: d.checkoutPaymentCode,
        customerTags: d.checkoutPaymentCustomerTags,
        description: '<p></p>',
      }],
    };
  }

  cancelOrderBody(orderId: string, orderCode: string) {
    return {
      orderCode,
      orderId: Number(orderId),
      status: 'CANCEL',
      note: 'Cancel order for testing purpose',
    };
  }
}
