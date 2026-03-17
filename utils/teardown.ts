import { OrderService } from "../services/order.service";
import { PackService } from "../services/pack.service";

export async function teardownOrder(
  orderService: OrderService,
  packService: PackService,
  basicToken: string,
  orderId: string,
  ticketId: string,
  orderCode: string
) {

  console.log("Running teardown...");

  await orderService.cancelOrder(basicToken, orderId, orderCode);

  await packService.packCheckout(ticketId);

  console.log("Teardown completed");
}