import type { CountryConfig } from '../configs/types.js';

type PickCfg = NonNullable<CountryConfig['pick']>;

export class PickPayloadBuilder {

  constructor(private readonly pick: PickCfg) {}

  getOrderInfoParams(orderId: string) {
    return { q: JSON.stringify({ orderId: Number(orderId) }) };
  }

  getSOParams(orderId: string) {
    return { q: JSON.stringify({ orderId }) };
  }

  getSaleOrdersParams(so: string) {
    return { saleOrderCode: so, warehouseCode: this.pick.warehouseCode };
  }

  confirmOrderBody(orderId: string, price: number) {
    const p = this.pick.confirmPayment;
    return {
      BankCode:               p.bankCode,
      BankAccountNumber:      p.bankAccountNumber,
      Remark:                 p.remarkTemplate.replace('{orderId}', orderId),
      Amount:                 price,
      BankChannel:            p.bankChannel,
      BankingTransactionCode: p.bankingTransactionCode,
    };
  }

  checkPickTicketBody(ticketId: string) {
    return { ticketIdList: [Number(ticketId)], warehouseCode: this.pick.warehouseCode };
  }

  activePickTicketBody(ticketId: string) {
    return { ticketId: Number(ticketId), isManualActive: true, warehouseCode: this.pick.warehouseCode };
  }

  getZoneLocationParams(so: string) {
    return { saleOrderCode: so, warehouseCode: this.pick.warehouseCode };
  }

  // Endpoint yêu cầu custom headers — Referer phải khớp với internalHost
  getZoneLocationHeaders(basicToken: string, internalHost: string) {
    return {
      Authorization: `Basic ${basicToken}`,
      Referer:       `${internalHost}/wms/`,
      'User-Agent':  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
      'Content-Type':'text/plain;charset=UTF-8',
    };
  }

  // Lưu ý: field key là wareHouseCode (capital H) — API yêu cầu casing này
  checkInPickBody(zone: string) {
    return { zoneCode: zone, status: 'CHECK_IN_ZONE', jobType: 'PICK', wareHouseCode: this.pick.warehouseCode };
  }

  // Lưu ý: field key là wareHouseCode (capital H) — API yêu cầu casing này
  assignPickStaffBody(ticketId: string, so: string) {
    return {
      ticketId,
      wareHouseCode: this.pick.warehouseCode,
      so,
      employee:      this.pick.employee,
      employeeId:    this.pick.employeeId,
    };
  }

  getOTLParams() {
    return { q: JSON.stringify({ warehouseCode: this.pick.warehouseCode, type: 'OTL', isUsed: false }) };
  }

  useBasketBody(subTicketId: number, otlCode: string) {
    return { basketCode: otlCode, ticketId: subTicketId, warehouseCode: this.pick.warehouseCode };
  }

  pickItemBody(subTicketId: string, sku: string, quantity: number, locationCode: string) {
    return {
      warehouseCode:  this.pick.warehouseCode,
      name:           '',
      ticketId:       Number(subTicketId),
      sku,
      pickedQuantity: quantity,
      location:       locationCode,
    };
  }

  completePickBody(subTicketId: number) {
    return { warehouseCode: this.pick.warehouseCode, ticketId: subTicketId };
  }

  completePickSOBody(so: string, ticketId: string) {
    return { warehouseCode: this.pick.warehouseCode, so, ticketId };
  }

  // Lưu ý: field key là warehouseCode (lowercase) — khác với checkInPickBody/assignPickStaffBody
  checkoutPickBody(zone: string) {
    return { zoneCode: zone, status: 'CHECK_OUT_ZONE', jobType: 'PICK', warehouseCode: this.pick.warehouseCode };
  }
}
