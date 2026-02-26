import { APIRequestContext, expect } from '@playwright/test';
import { AuthService } from '../services/auth.service';
import { OrderService } from '../services/order.service';

export class OrderFlow {

  private authService: AuthService;
  private orderService: OrderService;

  constructor(private request: APIRequestContext) {
    this.authService = new AuthService(request);
    this.orderService = new OrderService(request);
  }

  async run() {

    console.log("===== ORDER FLOW START =====");

    /**
     * Step 1 — Login
     */
    const tokenWeb = await this.authService.login();

    console.log("Login success");


    /**
     * Step 2 — Check Cart
     */
    const checkCartResponse =
      await this.orderService.checkCart(tokenWeb);

    expect([200, 404])
      .toContain(checkCartResponse.status());

    console.log(
      "Check Cart PASS:",
      checkCartResponse.status()
    );


    /**
     * Step 3 — Get Cart Info
     */
    const cartResult =
      await this.orderService.getCartInfo(tokenWeb);

    expect([200, 404])
      .toContain(cartResult.response.status());

    console.log(
      "Get Cart Info PASS:",
      cartResult.response.status()
    );

    console.log("===== EXTRACTED DATA =====");

    console.log("CartNo =", cartResult.cartNo);
    console.log("skuCodes =", cartResult.skuCodes);
    console.log("selectedSkuCodes =", cartResult.selectedSkuCodes);


    const cartNo =
      cartResult?.cartNo ?? null;

    const selectedSkuCodes =
      Array.isArray(cartResult?.selectedSkuCodes)
        ? cartResult.selectedSkuCodes
        : [];


    /**
     * Step 4 — Remove Cart
     */

    if (cartNo && selectedSkuCodes.length > 0) {

      console.log("Cart NOT empty → Removing cart...");

      const removeCartResponse =
        await this.orderService.removeCart(
          tokenWeb,
          cartNo,
          selectedSkuCodes
        );

      expect([200, 404])
        .toContain(removeCartResponse.status());

      console.log(
        "Remove Cart PASS:",
        removeCartResponse.status()
      );

    } else {

      console.log(
        "Cart EMPTY → Skip Remove Cart"
      );

    }


    /**
     * Step 5 — Add Cart
     */

    const addCartResult =
      await this.orderService.addCart(
        tokenWeb,
        cartNo   // FIXED
      );

    expect([200, 201])
      .toContain(
        addCartResult.response.status()
      );

    console.log(
      "Add Cart PASS:",
      addCartResult.response.status()
    );

    console.log(
      "New CartNo =",
      addCartResult.cartNo
    );


    console.log("===== ORDER FLOW END =====");


    /**
     * Return result
     */

    return {

      tokenWeb,

      cartNo:
        addCartResult.cartNo ?? cartNo,

      skuCodes:
        cartResult?.skuCodes ?? [],

      selectedSkuCodes,

      cartInfo:
        cartResult?.response
          ? await cartResult.response.json()
          : null
    };

  }
}