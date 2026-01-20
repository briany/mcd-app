import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { safeMatch } from "@/lib/safeRegex";

describe("safeRegex", () => {
  describe("safeMatch", () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("returns match array for successful regex match", () => {
      const text = "共 10 张优惠券 第 1/5 页";
      const pattern = /共\s*(\d+)\s*张.*第\s*(\d+)\/\d+\s*页/;

      const result = safeMatch(text, pattern);

      expect(result).not.toBeNull();
      expect(result![0]).toContain("共");
      expect(result![1]).toBe("10");
      expect(result![2]).toBe("1");
    });

    it("returns null when regex does not match", () => {
      const text = "no match here";
      const pattern = /共\s*(\d+)\s*张/;

      const result = safeMatch(text, pattern);

      expect(result).toBeNull();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("handles empty string input", () => {
      const result = safeMatch("", /test/);

      expect(result).toBeNull();
    });

    it("handles complex regex patterns", () => {
      const text = '<img src="https://example.com/image.jpg" alt="test">';
      const pattern = /<img\s+src="([^"]+)"/;

      const result = safeMatch(text, pattern);

      expect(result).not.toBeNull();
      expect(result![1]).toBe("https://example.com/image.jpg");
    });

    it("handles global flag regex", () => {
      const text = "abc 123 def 456";
      const pattern = /\d+/g;

      const result = safeMatch(text, pattern);

      expect(result).not.toBeNull();
      expect(result).toEqual(["123", "456"]);
    });

    it("uses default timeout of 1000ms", () => {
      const text = "test string";
      const pattern = /test/;

      // Should complete without warning for fast regex
      const result = safeMatch(text, pattern);

      expect(result).not.toBeNull();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("accepts custom timeout parameter", () => {
      const text = "test string";
      const pattern = /test/;

      const result = safeMatch(text, pattern, 5000);

      expect(result).not.toBeNull();
    });

    it("logs warning but still returns result when regex execution exceeds timeout threshold", () => {
      // Create a mock that simulates slow regex by manipulating Date.now
      const originalDateNow = Date.now;
      let callCount = 0;

      // First call returns start time, second call returns start + timeout + 1
      Date.now = vi.fn(() => {
        callCount++;
        return callCount === 1 ? 0 : 1001;
      });

      const text = "test string";
      const pattern = /test/;

      const result = safeMatch(text, pattern, 1000);

      // Should still return result - monitoring only, not cancellation
      expect(result).not.toBeNull();
      expect(result![0]).toBe("test");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Security] Regex execution exceeded timeout threshold",
        expect.objectContaining({
          pattern: pattern.source,
          elapsed: 1001,
          timeout: 1000,
        })
      );

      Date.now = originalDateNow;
    });

    it("logs error and returns null when regex throws exception", () => {
      // Create a pattern that will cause an error when match is called
      const text = "test";
      const pattern = /test/;

      // Mock String.prototype.match to throw
      const originalMatch = String.prototype.match;
      String.prototype.match = function () {
        throw new Error("Regex execution failed");
      };

      const result = safeMatch(text, pattern);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Security] Regex execution failed",
        expect.objectContaining({
          pattern: pattern.source,
          error: expect.any(Error),
        })
      );

      String.prototype.match = originalMatch;
    });

    describe("input size limiting", () => {
      it("returns null and warns when input exceeds default max size (50KB)", () => {
        const largeInput = "a".repeat(60 * 1024); // 60KB > 50KB limit
        const result = safeMatch(largeInput, /pattern/);

        expect(result).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "[Security] Input too large for regex matching",
          expect.objectContaining({
            inputSize: 60 * 1024,
            maxSize: 50 * 1024,
            pattern: "pattern",
          })
        );
      });

      it("allows input at exactly the max size limit", () => {
        const exactLimitInput = "a".repeat(50 * 1024); // Exactly 50KB
        const result = safeMatch(exactLimitInput, /a+/);

        expect(result).not.toBeNull();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it("allows custom max input size parameter", () => {
        const input = "a".repeat(1000);
        const result = safeMatch(input, /a+/, 1000, 500); // 500 byte limit

        expect(result).toBeNull(); // Should reject 1000 bytes when limit is 500
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "[Security] Input too large for regex matching",
          expect.objectContaining({
            inputSize: 1000,
            maxSize: 500,
          })
        );
      });

      it("allows larger custom max input size", () => {
        const input = "a".repeat(100 * 1024); // 100KB
        const result = safeMatch(input, /a+/, 1000, 200 * 1024); // 200KB limit

        expect(result).not.toBeNull();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it("checks input size before executing regex", () => {
        // This test verifies that size check happens BEFORE regex execution
        // by using a potentially slow regex that should never run
        const largeInput = "a".repeat(60 * 1024);
        const potentiallySlowPattern = /(a+)+$/; // ReDoS-vulnerable pattern

        const start = Date.now();
        const result = safeMatch(largeInput, potentiallySlowPattern);
        const elapsed = Date.now() - start;

        expect(result).toBeNull();
        // Should return almost immediately since regex never executed
        expect(elapsed).toBeLessThan(100);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "[Security] Input too large for regex matching",
          expect.any(Object)
        );
      });
    });

    it("handles unicode text correctly", () => {
      const text = "有效期至: 2026-01-20";
      const pattern = /有效期[^:]*:\s*(\d{4}-\d{2}-\d{2})/;

      const result = safeMatch(text, pattern);

      expect(result).not.toBeNull();
      expect(result![1]).toBe("2026-01-20");
    });

    it("handles multiline text", () => {
      const text = `## Coupon 1
Some description
## Coupon 2
Another description`;
      const pattern = /##\s+Coupon\s+\d+/;

      const result = safeMatch(text, pattern);

      expect(result).not.toBeNull();
      expect(result![0]).toBe("## Coupon 1");
    });
  });
});
