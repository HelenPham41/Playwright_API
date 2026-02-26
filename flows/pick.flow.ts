import config from "../configs/stg.env";
import { createClient } from "../clients/apiClient";

export async function pickFlow(orderId: string) {

 const client = await createClient(config.hostPick);

 await client.post("/pick/start", { data: { orderId } });

 await client.post("/pick/complete", { data: { orderId } });

}