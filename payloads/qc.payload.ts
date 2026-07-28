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

  // TH: không có API GET tra cứu QR — tự build toàn bộ qrData ở client (theo pre-request script TH)
  private padTH(val: string | number): string {
    const str = String(val);
    return String(str.length).padStart(2, '0') + str;
  }

  private formatDateDDMMYYTH(date: string): string {
    const d = new Date(date);
    return String(d.getDate()).padStart(2, '0')
      + String(d.getMonth() + 1).padStart(2, '0')
      + String(d.getFullYear()).slice(-2);
  }

  generateQrDataTH(item: SkuQrItem, index: number): any {
    const lot             = 'HTCAM1221';
    const expiredDate     = '2031-05-09';
    const vat             = 8;
    const purchaseOrderId = 'POCAM2321';
    const computerCode    = '1';

    let link = '';
    link += `P${this.padTH(item.product_id)}`;
    link += `S${this.padTH(item.seller)}`;
    link += `L${this.padTH(lot)}`;
    link += `E${this.padTH(this.formatDateDDMMYYTH(expiredDate))}`;
    link += `V${this.padTH(vat)}`;
    link += `R${this.padTH(purchaseOrderId)}`;

    const timestamp       = Math.floor(Date.now() / 1000).toString();
    const uniqueIdLength  = `T${this.padTH(timestamp)}C${this.padTH(computerCode)}I${this.padTH(index)}`.length;
    link += `U${uniqueIdLength}`;
    link += `T${this.padTH(timestamp)}`;
    link += `C${this.padTH(computerCode)}`;
    link += `I${this.padTH(index)}`;

    const nowIso = new Date().toISOString();

    return {
      uniqueId:        link,
      versionNo:       '1',
      status:          'ACTIVE',
      lot,
      receiptCode:     purchaseOrderId,
      index,
      productId:       item.product_id,
      sellerCode:      item.seller,
      lastUpdatedTime: nowIso,
      expiredDate,
      createdTime:     nowIso,
      generatedTime:   Date.now().toString(),
      machineCode:     computerCode,
      sku:             item.sku,
      vat,
    };
  }

  scanQrBody(ticketId: string, so: string, item: SkuQrItem, qrData: any) {
    const mongo = this.qc.scanQrFieldStyle === 'mongo';
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
        ...(mongo ? { prid: qrData.productId } : { prdId: qrData.productId }),
        seller_code:       qrData.sellerCode,
        last_updated_time: mongo ? { $date: qrData.lastUpdatedTime } : qrData.lastUpdatedTime,
        ex_date:           qrData.expiredDate,
        logs:              null,
        created_time:      mongo ? { $date: qrData.createdTime } : qrData.createdTime,
        generated_time:    mongo ? { $numberLong: String(qrData.generatedTime) } : qrData.generatedTime,
        machine_code:      qrData.machineCode,
        sku:               qrData.sku,
        ...(mongo ? { v: qrData.vat } : { vat: qrData.vat }),
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

  // TH: done QC + move to pack tách thành 2 API riêng
  doneQcArrangeBody(so: string) {
    return { so, warehouseCode: this.qc.warehouseCode };
  }

  moveToPackBody(ticketId: string) {
    return { status: 'WAIT_TO_PACK', ticketId, warehouseCode: this.qc.warehouseCode };
  }

  checkoutQcBody(zoneCode: string) {
    return { status: 'CHECK_OUT_ZONE', jobType: 'QC', warehouseCode: this.qc.warehouseCode, zoneCode };
  }
}
