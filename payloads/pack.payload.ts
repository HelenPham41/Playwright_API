import type { CountryConfig } from '../configs/types.js';

type PackCfg = NonNullable<CountryConfig['pack']>;

export class PackPayloadBuilder {

  constructor(private readonly pack: PackCfg) {}

  checkInPackBody() {
    return { zoneCode: this.pack.zoneCode, status: 'CHECK_IN_ZONE', jobType: 'PACK', warehouseCode: this.pack.warehouseCode };
  }

  packPackingBody(ticketId: string) {
    return { ticketId, status: 'PACKING', warehouseCode: this.pack.warehouseCode };
  }

  getBinParams() {
    return { q: JSON.stringify({ warehouseCode: this.pack.warehouseCode, type: 'BIN', isUsed: false }) };
  }

  addBasketBody(ticketId: string, bin: string) {
    return { warehouseCode: this.pack.warehouseCode, ticketId, basketType: 'DELIVERY', basketCode: bin };
  }

  updateTicketBody(ticketId: string, so: string) {
    return { status: 'WAIT_TO_DELIVERY', ticketId, so, packageNum: 1, packageImages: [], warehouseCode: this.pack.warehouseCode };
  }

  packCompleteBody(ticketId: string) {
    return { ticketId, status: 'WAIT_TO_DELIVERY', warehouseCode: this.pack.warehouseCode };
  }

  checkOutPackBody() {
    return { zoneCode: this.pack.zoneCode, status: 'CHECK_OUT_ZONE', jobType: 'PACK', warehouseCode: this.pack.warehouseCode };
  }
}
