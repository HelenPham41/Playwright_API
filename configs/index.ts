import stg from "./stg.env";
import dev from "./dev.env";
import prod from "./prod.env";

const envName =
  process.env.TEST_ENV?.toLowerCase() || "stg";

console.log("=================================");
console.log("Running ENV:", envName);
console.log("=================================");

const configMap:any = {
  stg,
  dev,
  prod
};

const config = configMap[envName];

if (!config) {

  throw new Error(
    `ENV '${envName}' not found.
Available ENV:
- stg
- dev
- prod`
  );

}

export default config;