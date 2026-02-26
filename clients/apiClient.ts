import { request } from '@playwright/test';

export async function createClient(
  baseURL: string,
  token?: string
) {

  return await request.newContext({

    baseURL,

    extraHTTPHeaders: {

      'Content-Type': 'application/json',

      Authorization: token
        ? `Bearer ${token}`
        : ''

    }

  });

}