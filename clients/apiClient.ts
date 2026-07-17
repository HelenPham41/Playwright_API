import { request } from '@playwright/test';

export interface RequestLogEntry {
  step:           string;
  method:         string;
  url:            string;
  requestHeaders?: Record<string, string>;
  requestBody:    unknown;
  responseStatus: number;
  responseBody:   unknown;
  orderId?:       string | undefined;
}

export const requestLog: RequestLogEntry[] = [];
export function clearRequestLog() { requestLog.length = 0; }

export async function createClient(
  baseURL: string,
  token?: string,
  authType: 'bearer' | 'basic' = 'bearer',
  userAgent?: string,
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

  if (userAgent) {
    headers['User-Agent'] = userAgent;
  }

  return request.newContext({
    baseURL,
    extraHTTPHeaders: headers
  });

}