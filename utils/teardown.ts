import { expect } from "@playwright/test";
import { OrderService } from "../services/order.service";
import { PackService } from "../services/pack.service";
import { QcService } from "../services/qc.service";
import { handleApiResponse } from './api-helper';

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
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3s to ensure order is cancelled before proceeding with pack checkout

  const response = await packService.packCheckout(ticketId);
  expect([200]).toContain(response.status());
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3s to ensure pack checkout is processed before finishing teardown
  console.log("✓ Pack checkout completed: " + ticketId);

  console.log("Teardown completed");
}

export async function teardownQC(
  orderService: OrderService,
  qcService: QcService,
  basicToken: string,
  orderId: string,
  ticketId: string,
  orderCode: string,
  location: string,
  zoneCode: string,
) {

  console.log("Running QC teardown...");

  await orderService.cancelOrder(basicToken, orderId, orderCode);
  console.log("✓ Order cancelled: " + orderId, "OrderCode:", orderCode);
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3s to ensure order is cancelled before proceeding with pack checkout

  const response = await qcService.checkoutQc(basicToken, location, zoneCode);
  await handleApiResponse(response, [200]);
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3s to ensure pack checkout is processed before finishing teardown
  console.log("✓ QC checkout completed: " + ticketId);

  console.log("Teardown QC completed");
}