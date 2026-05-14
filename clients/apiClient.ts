import { request } from '@playwright/test';

export interface RequestLogEntry {
  step:           string;
  method:         string;
  url:            string;
  requestBody:    unknown;
  responseStatus: number;
  responseBody:   unknown;
}

export const requestLog: RequestLogEntry[] = [];
export function clearRequestLog() { requestLog.length = 0; }

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