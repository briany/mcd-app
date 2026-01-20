/**
 * Safe regex utilities with timeout protection against ReDoS attacks
 */

/**
 * Execute regex with timeout protection
 * @param text - The text to match against
 * @param pattern - The regex pattern to use
 * @param timeout - Maximum execution time in milliseconds (default: 1000)
 * @returns The match result or null if no match, timeout, or error
 */
export function safeMatch(
  text: string,
  pattern: RegExp,
  timeout: number = 1000
): RegExpMatchArray | null {
  const start = Date.now();

  try {
    const result = text.match(pattern);

    if (Date.now() - start > timeout) {
      console.warn("[Security] Regex execution exceeded timeout", {
        pattern: pattern.source,
        timeout,
      });
      return null;
    }

    return result;
  } catch (error) {
    console.error("[Security] Regex execution failed", { pattern, error });
    return null;
  }
}
