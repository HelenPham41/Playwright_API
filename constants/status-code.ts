// ─── HTTP transport level ─────────────────────────────────────────────────────
export const HTTP_STATUS = {
  OK:           200,
  CREATED:      201,
  NO_CONTENT:   204,
  BAD_REQUEST:  400,
  UNAUTHORIZED: 401,
  FORBIDDEN:    403,
  NOT_FOUND:    404,
} as const;

// ─── Business response code (từ response body của API) ───────────────────────
export const RESPONSE_CODE = {
  SUCCESS: 'success',
  FAILED:  'failed',

  // Warehouse API (pick-ticket, delivery...) dùng convention khác: 'OK' / 'INVALID'
  OK:      'OK',
} as const;

// ─── Error description (dùng cho assertion message / ApiError) ────────────────
export const ERROR_MSG = {
  LOGIN_FAILED:      'Authentication failed',
  TOKEN_MISSING:     'bearerToken not found in response',
  CART_NO_MISSING:   'cartNo missing in response',
  ORDER_ID_MISSING:  'orderId missing in response',
} as const;
