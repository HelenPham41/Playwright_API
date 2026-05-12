import type { OrderTestData } from '../configs/types.js';
import { VN_ORDER_DATA } from './vn/order.data.js';
import { TH_ORDER_DATA } from './th/order.data.js';

const ORDER_DATA_MAP: Record<string, OrderTestData> = {
  VN: VN_ORDER_DATA,
  TH: TH_ORDER_DATA,
  // KH: KH_ORDER_DATA,
};

export function getOrderData(): OrderTestData {
  const country = (process.env.COUNTRY ?? 'VN').toUpperCase();
  const data = ORDER_DATA_MAP[country];

  if (!data) {
    throw new Error(
      `Order data for country '${country}' not found. Available: ${Object.keys(ORDER_DATA_MAP).join(', ')}`
    );
  }

  return data;
}
