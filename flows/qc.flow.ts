
import config from "../configs/stg.env";
import { createClient } from "../clients/apiClient";

export async function qcFlow(orderId:string){

 const client=await createClient(config.hostPick);

 await client.post("/qc/start",{data:{orderId}});

 await client.post("/qc/complete",{data:{orderId}});

}
