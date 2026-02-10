/**
 * Handles rate limit (429) and other error responses from API calls.
 * Throws an appropriate error with a user-friendly message.
 */
export async function handleFetchError(
  response: Response,
  defaultMessage: string
): Promise<never> {
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) {
      throw new Error(
        `Too many requests. Please try again in ${retryAfter} seconds.`
      );
    }
    throw new Error("Too many requests. Please try again later.");
  }

  const message = await response.text();
  throw new Error(message || `${defaultMessage} (${response.status})`);
}
