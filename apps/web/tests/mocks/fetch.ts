/**
 * Mock fetch utilities for testing
 */

/**
 * Creates a mock Response object
 */
export const createMockResponse = <T>(
  data: T,
  options?: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
  }
): Response => {
  const status = options?.status ?? 200;
  const statusText = options?.statusText ?? "OK";
  const headers = new Headers(options?.headers ?? {});

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers,
    json: async () => data,
    text: async () => JSON.stringify(data),
    clone: function () {
      return this;
    },
  } as Response;
};

/**
 * Creates a mock successful fetch response
 */
export const mockFetchSuccess = <T>(data: T, status = 200): Response => {
  return createMockResponse(data, { status });
};

/**
 * Creates a mock error fetch response
 */
export const mockFetchError = (
  status: number,
  message: string,
  errorPayload?: unknown
): Response => {
  return {
    ok: false,
    status,
    statusText: message,
    headers: new Headers(),
    json: async () => errorPayload ?? { code: status, message },
    text: async () => (errorPayload ? JSON.stringify(errorPayload) : message),
    clone: function () {
      return this;
    },
  } as Response;
};

/**
 * Creates a mock 204 No Content response
 */
export const mockFetchNoContent = (): Response => {
  return {
    ok: true,
    status: 204,
    statusText: "No Content",
    headers: new Headers(),
    json: async () => {
      throw new Error("No content");
    },
    text: async () => "",
    clone: function () {
      return this;
    },
  } as Response;
};
