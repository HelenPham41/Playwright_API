import { APIRequestContext } from '@playwright/test';
import { createClient } from '../clients/apiClient';
import config from '../configs';

export class AuthService {

    constructor(private request: APIRequestContext) { }

    async login(): Promise<string> {
        const client = await createClient(config.hostOrder);

        const response = await client.post(
            "/marketplace/customer/v1/authentication",
            {
                data: {
                    username: config.username,
                    password: config.password,
                    type: "CUSTOMER"
                }
            }
        );

        if (response.status() !== 200) {
            throw new Error("Login failed: " + response.status());
        }

        const json = await response.json();

        const token = json.data[0].bearerToken;

        return token;
    }

}