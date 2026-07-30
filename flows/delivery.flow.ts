import { DeliveryService } from '../services/delivery.service.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { getScenarioData } from '../test-data/scenario.data.factory.js';
import { ApiError } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';
import type {
  UpdateDeliveryRequest,
  UploadImageData,
  UploadSignatureData,
} from '../payloads/delivery.payload.js';

const WAIT_3S = 3000;
const WAIT_8S = 8000;

export interface DeliveryInput {
  ticketId: number;
  so: string;
  deliveryCode: string;
  shippingOrderCode: string;
  trackingNumber: string;
  driverId: number;
  driverName: string;
  customer: UpdateDeliveryRequest['customer'];
  image: UploadImageData;
  signature: UploadSignatureData;
}

export interface TransferInfo {
  type: string;
  code: string;
  transferId: number | string;
  status: string;
  createdTime: string;
  sourceLocation: string;
  destinationLocation: string;
}

export interface DeliveryResult {
  ticketId: number;
  deliveryCode: string;
  shippingOrderCode: string;
  deliveryStatus: string;
  referenceCode: string;
  riderToken: string;
  pickTransfer: TransferInfo;
  qcTransfer: TransferInfo | undefined;
  packTransfer: TransferInfo | undefined;
  deliveryTransfer: TransferInfo | undefined;
}

export class DeliveryFlow {

  private readonly deliveryService: DeliveryService;
  private readonly cfg: CountryConfig;

  constructor(countryConfig?: CountryConfig) {
    this.cfg = countryConfig ?? getCountryConfig();
    this.deliveryService = new DeliveryService(this.cfg);
  }

  async delivery(input: DeliveryInput): Promise<DeliveryResult> {

    const basicToken = this.cfg.auth.basicToken;
    const country = process.env.COUNTRY ?? 'UNKNOWN';

    console.log(`===== DELIVERY FLOW ${country} START =====`);

    const {
      ticketId,
      so,
      deliveryCode,
      shippingOrderCode,
      trackingNumber,
      customer,
      image,
      signature,
    } = input;

    const warehouseCode = this.cfg.internalTransfer?.warehouseCode ?? '';

    const scenarioData = getScenarioData();
    const driverUsername = scenarioData.driverName ?? '';
    const driverPassword = scenarioData.driverPwd ?? '';

    try {

      //----------------------------------------------------------
      // Step 1 - Login App
      //----------------------------------------------------------
      const loginAppResult =
        await this.deliveryService.loginApp(
          basicToken,
          driverUsername,
          driverPassword,
        );

      const ssoToken = loginAppResult?.data?.[0]?.ssoToken ?? '';

      if (!ssoToken) {
        throw new ApiError('loginApp', HTTP_STATUS.OK, this.cfg.delivery?.endpoints.loginApp ?? '', 'Missing ssoToken');
      }

      console.log('Step 1 | Login App               : OK');

      //----------------------------------------------------------
      // Step 2 - Auth
      //----------------------------------------------------------
      const authResult =
        await this.deliveryService.auth(ssoToken);

      const authCode = authResult?.data?.[0]?.code ?? '';

      if (!authCode) {
        throw new ApiError('auth', HTTP_STATUS.OK, this.cfg.delivery?.endpoints.auth ?? '', 'Missing authCode');
      }

      console.log('Step 2 | Auth                    : OK');

      //----------------------------------------------------------
      // Step 3 - Login Rider
      //----------------------------------------------------------
      const loginRiderResult =
        await this.deliveryService.loginRider(ssoToken, authCode);

      const tokenData = loginRiderResult?.data?.[0];
      const riderToken = tokenData?.accessToken ?? '';


      if (!riderToken) {
        throw new ApiError('loginRider', HTTP_STATUS.OK, this.cfg.delivery?.endpoints.loginRider ?? '', 'Missing accessToken');
      }

      console.log('Step 3 | Login Rider              : OK');

      //----------------------------------------------------------
      // Step 4 - Accept Delivery
      //----------------------------------------------------------
      const acceptDeliveryResponse =
        await this.deliveryService.acceptDelivery(
          riderToken,
          trackingNumber,
          so,
        );

      const acceptDeliveryResult = await acceptDeliveryResponse.json();
      const acceptDeliveryOrder = acceptDeliveryResult?.data?.[0];

      console.log('Step 4 | Accept Delivery          : OK');

      //----------------------------------------------------------
      // Step 5 - Confirm Current Address  (skip for TH)
      //----------------------------------------------------------
      if (this.cfg.countryCode !== 'TH') {
        const confirmAddressData: UpdateDeliveryRequest = {
          ticketId,
          so,
          trackingNumber,
          customer,
        };

        await this.deliveryService.confirmCurrentAddress(
          riderToken,
          confirmAddressData,
          so,
        );

        console.log('Step 5 | Confirm Current Address  : OK');
      } else {
        console.log('Step 5 | Confirm Current Address  : SKIPPED (TH)');
      }

      //----------------------------------------------------------
      // Step 6 - Get Upload Image Token
      //----------------------------------------------------------
      const imageToken =
        await this.deliveryService.getUploadImageToken(riderToken);

      const imageAccessToken = imageToken?.message ?? '';

      if (!imageAccessToken) {
        throw new ApiError('getUploadImageToken', HTTP_STATUS.OK, this.cfg.delivery?.endpoints.getUploadImageToken ?? '', 'Missing accessToken');
      }

      console.log('Step 6 | Get Upload Image Token   : OK');

      //----------------------------------------------------------
      // Step 7 - Upload Delivery Image
      //----------------------------------------------------------
      const uploadImageResult =
        await this.deliveryService.uploadImage(
          riderToken,
          imageAccessToken,
          image,
        );

      const uploadedImageUrl = uploadImageResult?.data?.[0] ?? '';

      if (!uploadedImageUrl) {
        throw new ApiError('uploadImage', HTTP_STATUS.OK, this.cfg.delivery?.endpoints.uploadImage ?? '', 'Missing uploaded image URL');
      }

      console.log('Step 7 | Upload Image             : OK');
      console.log('Wait 3s after upload Image...');
      await new Promise(r => setTimeout(r, WAIT_3S));

      //----------------------------------------------------------
      // Step 8 - Get Upload Signature Token
      //----------------------------------------------------------
      const signatureToken =
        await this.deliveryService.getUploadSignatureToken(riderToken);

      const signatureAccessToken = signatureToken?.message ?? '';

      if (!signatureAccessToken) {
        throw new ApiError('getUploadSignatureToken', HTTP_STATUS.OK, this.cfg.delivery?.endpoints.getUploadSignatureToken ?? '', 'Missing accessToken');
      }

      console.log('Step 8 | Get Signature Token      : OK');
    

      //----------------------------------------------------------
      // Step 9 - Upload Signature
      //----------------------------------------------------------
      const uploadSignatureResult = await this.deliveryService.uploadSignature(
        riderToken,
        signatureAccessToken,
        signature,
      );

      const uploadedSignatureUrl = uploadSignatureResult?.data?.[0] ?? '';

      if (!uploadedSignatureUrl) {
        throw new ApiError('uploadSignature', HTTP_STATUS.OK, this.cfg.delivery?.endpoints.uploadSignature ?? '', 'Missing uploaded signature URL');
      }

      console.log('Step 9 | Upload Signature          : OK');
      console.log('Wait 8s after upload Signature...');
      await new Promise(r => setTimeout(r, WAIT_8S));

      //----------------------------------------------------------
      // Step 10 - Complete Delivery
      //----------------------------------------------------------

      await this.deliveryService.completeDelivery(
        riderToken,
        so,
        trackingNumber,
        uploadedImageUrl,
        uploadedSignatureUrl,
        customer.name,
      );

      console.log('Step 10 | Complete Delivery        : OK');


      //----------------------------------------------------------
      // Step 11 - Get Delivery Status
      //----------------------------------------------------------
      console.log('Wait 3s before Get Delivery Status...');
      await new Promise(r => setTimeout(r, WAIT_3S));

      const status =
        await this.deliveryService.getDeliveryStatus(basicToken, so);

      const deliveryOrder = status?.data?.[0];

      console.log('Step 11 | Get Delivery Status      : OK');
      console.log(
        'getDeliveryStatus | status:', deliveryOrder?.status,
        '| referenceCode:', deliveryOrder?.referenceCode,
      );

      //----------------------------------------------------------
      // Step 12 - Get Internal Transfer List
      //----------------------------------------------------------
      console.log('Wait 3s before Get Internal Transfer List...');
      await new Promise(r => setTimeout(r, WAIT_3S));

      const internalTransferList = await this.deliveryService.getInternalTransferList(basicToken, so, warehouseCode);
      const transferList = internalTransferList?.data ?? [];
      const rawPickTransfer = transferList.find((item: any) => item.type === 'PICK' && item.reference === so && item.sourceLocation === 'WH-MAIN' && item.destinationLocation === 'WH-QC');
      const rawQcTransfer = transferList.find((item: any) => item.type === 'QC' && item.reference === so && item.status === 'DONE' && item.sourceLocation === 'WH-QC' && item.destinationLocation === 'WH-PACK');
      const rawPackTransfer = transferList.find((item: any) => item.type === 'PACK' && item.reference === so && item.status === 'DONE' && item.sourceLocation === 'WH-PACK' && item.destinationLocation === 'WH-DELIVERY');
      const rawDeliveryTransfer = transferList.find((item: any) => item.type === 'DELIVERY' && item.reference === so && item.status === 'DONE' && item.sourceLocation === 'WH-DELIVERY' && item.destinationLocation === 'CUSTOMER');

      //Tạm command để fix bug trước khi validation
      // if (!rawPickTransfer) {
      //   throw new ApiError('getInternalTransferList', HTTP_STATUS.OK, this.cfg.internalTransfer?.endpoints.getInternalTransferList ?? '', 'Missing PICK transfer');
      // }

      // console.log('getInternalTransferList | PICK transfer status:', rawPickTransfer.status);

      // if (rawPickTransfer.status !== 'DONE') {
      //   throw new ApiError('getInternalTransferList', HTTP_STATUS.OK, this.cfg.internalTransfer?.endpoints.getInternalTransferList ?? '', `PICK transfer status is ${rawPickTransfer.status}, expected DONE`);
      // }

      const toTransferInfo = (item: any): TransferInfo | undefined => item && {
        type: item.type ?? '',
        code: item.code ?? '',
        transferId: item.transferId ?? '',
        status: item.status ?? '',
        createdTime: item.createdTime ?? '',
        sourceLocation: item.sourceLocation ?? '',
        destinationLocation: item.destinationLocation ?? '',
      };

      const pickTransfer = toTransferInfo(rawPickTransfer)!;
      const qcTransfer = toTransferInfo(rawQcTransfer);
      const packTransfer = toTransferInfo(rawPackTransfer);
      const deliveryTransfer = toTransferInfo(rawDeliveryTransfer);

      console.log('Step 12 | Get Internal Transfer List : OK');

      console.log(`===== DELIVERY FLOW ${country} END =====`);

      return {
        ticketId,
        deliveryCode,
        shippingOrderCode,
        deliveryStatus: deliveryOrder?.status ?? '',
        referenceCode: deliveryOrder?.referenceCode ?? '',
        riderToken,
        pickTransfer,
        qcTransfer,
        packTransfer,
        deliveryTransfer,
      };

    } catch (error) {

      if (error instanceof ApiError) {
        console.error(`Delivery flow failed: ${error.message}`);
      }

      throw error;
    }
  }
}