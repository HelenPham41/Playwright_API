import stg from "./stg.env";
// import dev from "./dev.env";
// import prod from "./prod.env";

const env = process.env.TEST_ENV || "stg";

const configMap:any = {
 stg,
//  dev,
//  prod
};

export default configMap[env];