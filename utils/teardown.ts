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
  console.log("✓ Order cancelled: " + orderId, "OrderCode:", orderCode);
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 2s to ensure order is cancelled before proceeding with pack checkout

  await packService.packCheckout(ticketId);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2s to ensure pack checkout is processed before finishing teardown
  console.log("✓ Pack checkout completed: " + ticketId);

  console.log("Teardown completed");
}