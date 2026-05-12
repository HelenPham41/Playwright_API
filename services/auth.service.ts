import type { APIRequestContext } from '@playwright/test';
import { createClient } from '../clients/apiClient.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { ApiError, assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS, ERROR_MSG } from '../constants/status-code.js';

export class AuthService {

  private readonly cfg: CountryConfig;

  constructor(_request: APIRequestContext, countryConfig?: CountryConfig) {
    this.cfg = countryConfig ?? getCountryConfig();
  }

  async login(): Promise<string> {
    const client = await createClient(this.cfg.hosts.order);

    const response = await client.post(this.cfg.auth.loginEndpoint, {
      data: {
        username: this.cfg.auth.username,
        password: this.cfg.auth.password,
        type: 'CUSTOMER',
      },
    });

    await assertStatus(response, [HTTP_STATUS.OK], 'login');

    const json = await response.json();
    const token: string | undefined = json?.data?.[0]?.bearerToken;

    if (!token) {
      throw new ApiError('login', HTTP_STATUS.OK, this.cfg.auth.loginEndpoint, ERROR_MSG.TOKEN_MISSING);
    }

    return token;
  }
}
