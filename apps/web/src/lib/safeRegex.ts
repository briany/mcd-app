/**
 * Safe regex utilities with input size limiting and execution time monitoring
 * for defense against ReDoS attacks.
 */

/**
 * Maximum input size for regex matching (50KB)
 * Limits potential ReDoS attack surface by capping input length
 */
const MAX_INPUT_SIZE = 50 * 1024;

/**
 * Execute regex with input size limiting and execution time monitoring.
 *
 * Note: This provides defense-in-depth by:
 * 1. Limiting input size to prevent large inputs that could trigger ReDoS
 * 2. Monitoring execution time and logging warnings for slow patterns
 *
 * This does NOT provide true timeout-based cancellation since JavaScript
 * regex runs synchronously on the main thread. For truly untrusted input,
 * consider using the 're2' library which guarantees linear-time matching.
 *
 * @param text - Input text to match against (max 50KB)
 * @param pattern - Regular expression pattern
 * @param timeout - Time threshold for logging warnings (ms, default 1000)
 * @param maxInputSize - Maximum allowed input size (bytes, default 50KB)
 * @returns Match result array or null if no match, input too large, or error
 */
export function safeMatch(
  text: string,
  pattern: RegExp,
  timeout: number = 1000,
  maxInputSize: number = MAX_INPUT_SIZE
): RegExpMatchArray | null {
  // Input size check - prevents large inputs from triggering ReDoS
  if (text.length > maxInputSize) {
    console.warn("[Security] Input too large for regex matching", {
      inputSize: text.length,
      maxSize: maxInputSize,
      pattern: pattern.source,
    });
    return null;
  }

  const start = Date.now();

  try {
    const result = text.match(pattern);
    const elapsed = Date.now() - start;

    if (elapsed > timeout) {
      console.warn("[Security] Regex execution exceeded timeout threshold", {
        pattern: pattern.source,
        elapsed,
        timeout,
      });
      // Still return result - this is monitoring, not cancellation
    }

    return result;
  } catch (error) {
    console.error("[Security] Regex execution failed", {
      pattern: pattern.source,
      error,
    });
    return null;
  }
}
