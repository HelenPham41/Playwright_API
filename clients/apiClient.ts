import { request } from '@playwright/test';

export async function createClient(
  baseURL: string,
  token?: string,
  authType: 'bearer' | 'basic' = 'bearer'
) {

  let headers: any = {
    'Content-Type': 'application/json'
  };

  if (token) {

    headers.Authorization =
      authType === 'basic'
        ? `Basic ${token}`
        : `Bearer ${token}`;

  }

  return request.newContext({
    baseURL,
    extraHTTPHeaders: headers
  });

}