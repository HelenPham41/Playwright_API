export default {

  hostOrder: process.env.BASE_URL || "https://api.v2-stg.thuocsi.vn",
  hostInternal: process.env.INTERNAL_URL || "https://internal.v2-stg.thuocsi.vn",
  hostWeb: process.env.WEB_URL || "https://web.v2-stg.thuocsi.vn",

  username: process.env.API_USERNAME || "0559948786",
  password: process.env.API_PASSWORD || "A12345678a",
  basicToken: process.env.basicToken || "UEFSVE5FUi9zZWxsZXIuY29yZTpJT2tuTWdaaU1Ka2JSUEU=",
  location: process.env.LOCATION || "BD",
  zoneCode: process.env.ZONE_CODE || "QC-01",
}