import type { CountryConfig } from './types.js';
import { VN_CONFIG } from './countries/vn.js';
import { TH_CONFIG } from './countries/th.js';
import { KH_CONFIG } from './countries/kh.js';

const COUNTRY_MAP: Record<string, CountryConfig> = {
  VN: VN_CONFIG,
  TH: TH_CONFIG,
  KH: KH_CONFIG,
};

export function getCountryConfig(): CountryConfig {
  const country = (process.env.COUNTRY ?? 'VN').toUpperCase();
  const config = COUNTRY_MAP[country];

  if (!config) {
    throw new Error(
      `Country '${country}' not found. Available: ${Object.keys(COUNTRY_MAP).join(', ')}`
    );
  }

  return config;
}
