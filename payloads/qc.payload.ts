import type { CountryConfig } from '../configs/types.js';

type QcCfg = NonNullable<CountryConfig['qc']>;

export interface SkuQrItem {
  sku: string;
  sellerCodeLength: number;
  seller: string;
  product_id: string;
  reservedQuantity: number;
}

export class QcPayloadBuilder {

  constructor(private readonly qc: QcCfg) {}

  checkInQcBody(zoneCode: string) {
    return { status: 'CHECK_IN_ZONE', jobType: 'QC', warehouseCode: this.qc.warehouseCode, zoneCode };
  }

  pickTicketParams(so: string) {
    return {
      q: JSON.stringify({
        statuses:      ['WAIT_QC_CONFIRM', 'QC_PROCESSING', 'WAIT_TO_PACK'],
        so,
        warehouseCode: this.qc.warehouseCode,
      }),
    };
  }

  generateQrCode(item: SkuQrItem): string {
    const sellerLength = item.sellerCodeLength || 0;
    const random       = Math.floor(Math.random() * 9) + 1;
    const sellerPart   = sellerLength < 10 ? `S0${sellerLength}${item.seller}` : `S${sellerLength}${item.seller}`;
    return `P07${item.product_id}${sellerPart}L01AE06010130V01${random}R06PO8998U21T101770212989C01AI01${random}`;
  }

  getQrCodeParams(qr: string) {
    return { code: qr, warehouseCode: this.qc.warehouseCode };
  }

  scanQrBody(ticketId: string, so: string, item: SkuQrItem, qrData: any) {
    return {
      ticketId,
      so,
      scannedQuantity: item.reservedQuantity,
      isCheckUniqueId: true,
      qr: {
        uniqueId:          qrData.uniqueId,
        version_no:        qrData.versionNo,
        status:            qrData.status,
        lot:               qrData.lot,
        poCode:            qrData.receiptCode,
        index:             qrData.index,
        prdId:             qrData.productId,
        seller_code:       qrData.sellerCode,
        last_updated_time: qrData.lastUpdatedTime,
        ex_date:           qrData.expiredDate,
        logs:              null,
        created_time:      qrData.createdTime,
        generated_time:    qrData.generatedTime,
        machine_code:      qrData.machineCode,
        sku:               qrData.sku,
        vat:               qrData.vat,
      },
      lot:           qrData.lot,
      ex_date:       qrData.expiredDate,
      sku:           qrData.sku,
      isExpired:     false,
      warehouseCode: this.qc.warehouseCode,
    };
  }

  doneQcBody(ticketId: string, so: string) {
    return { status: 'WAIT_TO_PACK', ticketId, so, warehouseCode: this.qc.warehouseCode };
  }

  checkoutQcBody(zoneCode: string) {
    return { status: 'CHECK_OUT_ZONE', jobType: 'QC', warehouseCode: this.qc.warehouseCode, zoneCode };
  }
}
