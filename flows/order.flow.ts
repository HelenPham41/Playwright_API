import type { APIRequestContext } from '@playwright/test';
import { AuthService } from '../services/auth.service.js';
import { OrderService } from '../services/order.service.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { ApiError } from '../errors/api.error.js';

export interface OrderResult {
  tokenWeb: string;
  orderId: string;
  cartNo: string;
}

export class OrderFlow {

  private readonly authService: AuthService;
  private readonly orderService: OrderService;

  constructor(request: APIRequestContext, countryConfig?: CountryConfig) {
    const cfg = countryConfig ?? getCountryConfig();
    this.authService  = new AuthService(request, cfg);
    this.orderService = new OrderService(request, cfg);
  }

  async placeOrder_TH(): Promise<{ tokenWeb: string; cartNo: string | null; skuCodes: string[] }> {
    console.log('===== ORDER FLOW TH START =====');

    const tokenWeb = await this.authService.login();
    console.log('Step 1 | Login         : OK');

    await this.orderService.checkCart(tokenWeb);
    console.log('Step 2 | Check Cart    : OK');

    const { cartNo, skuCodes } = await this.orderService.getCartInfo(tokenWeb);
    console.log(`Step 3 | Get Cart Info : cartNo=${cartNo ?? 'null'}, skus=${skuCodes.length}`);

    console.log('===== ORDER FLOW TH END =====');
    return { tokenWeb, cartNo, skuCodes };
  }

  async placeOrder_VN(): Promise<OrderResult> {
    console.log('===== ORDER FLOW START =====');

    try {
      // Step 1 — Login
      const tokenWeb = await this.authService.login();
      console.log('Step 1 | Login            : OK');

      // Step 2 — Check Cart
      await this.orderService.checkCart(tokenWeb);
      console.log('Step 2 | Check Cart        : OK');

      // Step 3 — Get Cart Info
      const { cartNo, skuCodes } = await this.orderService.getCartInfo(tokenWeb);
      console.log(`Step 3 | Get Cart Info     : cartNo=${cartNo ?? 'null'}, skus=${skuCodes.length}`);

      // Step 4 — Remove Cart (skip when empty)
      if (cartNo && skuCodes.length > 0) {
        await this.orderService.removeCart(tokenWeb, cartNo, skuCodes);
        console.log('Step 4 | Remove Cart       : OK');
      } else {
        console.log('Step 4 | Remove Cart       : SKIP (empty cart)');
      }

      // Step 5 — Add Cart
      const { cartNo: newCartNo } = await this.orderService.addCart(tokenWeb, cartNo);
      console.log(`Step 5 | Add Cart          : OK, cartNo=${newCartNo}`);

      // Step 6 — Update Cart
      await this.orderService.updateCart(tokenWeb, newCartNo);
      console.log('Step 6 | Update Cart       : OK');

      // Step 7 — Checkout
      const { orderId } = await this.orderService.checkout(tokenWeb);
      console.log(`Step 7 | Checkout          : OK, orderId=${orderId}`);

      console.log('===== ORDER FLOW END =====');

      return { tokenWeb, orderId, cartNo: newCartNo };

    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`Order flow failed at: ${error.message}`);
      }
      throw error;
    }
  }
}
