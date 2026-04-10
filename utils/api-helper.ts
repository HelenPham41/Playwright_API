import type { APIResponse } from '@playwright/test';

export class ApiError extends Error {
  status?: number;
  url?: string;
  body?: string;

  constructor(
    message: string,
    status?: number,
    url?: string,
    body?: string
  ) {
    super(message);
    this.name = 'ApiError';
    if (status !== undefined) this.status = status;
    if (url !== undefined) this.url = url;
    if (body !== undefined) this.body = body;
  }
}

export async function handleApiResponse(
  response: APIResponse,
  expectedStatus: number[] = [200]
): Promise<APIResponse> {

  const status = response.status();
  const url = response.url();

  if (!expectedStatus.includes(status)) {

    let body = "";

    // ✅ Try JSON first
    try {
      const json = await response.json();

      body =
        json?.message ||
        json?.error ||
        json?.errors?.[0]?.message || // 🔥 common API pattern
        JSON.stringify(json);

    } catch {
      // ✅ fallback to text
      try {
        body = await response.text();
      } catch {
        body = "Unable to read response body";
      }
    }

    // ✅ Clean message (avoid HTML / long dump)
    body = body?.toString().trim();

    throw new ApiError(
      `API request failed | Status: ${status} | URL: ${url}`, // 👈 useful for logs
      status,
      url,
      body
    );
  }

  return response;
}