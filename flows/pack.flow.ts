
import config from "../configs/stg.env";
import { createClient } from "../clients/apiClient";

export async function packFlow(orderId:string){

 const client=await createClient(config.hostInternal);

 await client.post("/pack/start",{data:{orderId}});

 await client.post("/pack/complete",{data:{orderId}});

}
