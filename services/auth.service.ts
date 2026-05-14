import { createClient, requestLog } from '../clients/apiClient.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { ApiError, assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS, ERROR_MSG } from '../constants/status-code.js';

export class AuthService {

  private readonly cfg: CountryConfig;

  constructor(countryConfig?: CountryConfig) {
    this.cfg = countryConfig ?? getCountryConfig();
  }

  async login(): Promise<string> {
    const client    = await createClient(this.cfg.hosts.order);
    const body      = { username: this.cfg.auth.username, password: '***', type: 'CUSTOMER' };
    const response  = await client.post(this.cfg.auth.loginEndpoint, {
      data: { ...body, password: this.cfg.auth.password },
    });

    await assertStatus(response, [HTTP_STATUS.OK], 'login');

    const json  = await response.json();
    const token: string | undefined = json?.data?.[0]?.bearerToken;
    requestLog.push({ step: 'login', method: 'POST', url: response.url(), requestBody: body, responseStatus: response.status(), responseBody: { bearerToken: token ? '[token]' : null } });

    if (!token) {
      throw new ApiError('login', HTTP_STATUS.OK, this.cfg.auth.loginEndpoint, ERROR_MSG.TOKEN_MISSING);
    }

    return token;
  }
}
