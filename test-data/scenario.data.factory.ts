import type { ScenarioData } from '../configs/types.js';
import { VN_SCENARIO_DATA } from './vn.scenario.data.js';
import { TH_SCENARIO_DATA } from './th.scenario.data.js';
import { KH_SCENARIO_DATA } from './kh.scenario.data.js';

const SCENARIO_DATA_MAP: Record<string, ScenarioData> = {
  VN: VN_SCENARIO_DATA,
  TH: TH_SCENARIO_DATA,
  KH: KH_SCENARIO_DATA,
};

export function getScenarioData(): ScenarioData {
  const country = (process.env.COUNTRY ?? 'VN').toUpperCase();
  const data    = SCENARIO_DATA_MAP[country];

  if (!data) {
    throw new Error(
      `Scenario data for country '${country}' not found. Available: ${Object.keys(SCENARIO_DATA_MAP).join(', ')}`
    );
  }

  return data;
}
