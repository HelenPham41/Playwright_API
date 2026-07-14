import type { APIResponse } from '@playwright/test';

export class ApiError extends Error {
  constructor(
    public readonly step: string,
    public readonly status: number,
    public readonly url: string,
    public readonly body: string,
  ) {
    super(`[${step}] HTTP ${status} — ${url}\nBody: ${body}`);
    this.name = 'ApiError';
  }
}

/**
 * Throws ApiError if response status is not in the expected list.
 * Call this in every service method right after the HTTP call.
 */
export async function assertStatus(
  response: APIResponse,
  expected: number[],
  step: string,
): Promise<void> {
  if (!expected.includes(response.status())) {
    throw new ApiError(step, response.status(), response.url(), await response.text());
  }
}
