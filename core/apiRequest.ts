import { request, APIRequestContext } from '@playwright/test';

export class ApiRequest {

    private context!: APIRequestContext;

    async init(baseURL: string, token?: string) {

        this.context = await request.newContext({

            baseURL,

            extraHTTPHeaders: {
                Authorization: token || "",
                "Content-Type": "application/json"
            }

        });

    }

    async get(url: string) {

        const response = await this.context.get(url);

        console.log("GET:", url, response.status());

        return response;

    }

    async post(url: string, body?: any) {

        const response = await this.context.post(url, {
            data: body
        });

        console.log("POST:", url, response.status());

        return response;

    }

    async put(url: string, body?: any) {

        const response = await this.context.put(url, {
            data: body
        });

        return response;

    }

    async delete(url: string) {

        const response = await this.context.delete(url);

        return response;

    }

}