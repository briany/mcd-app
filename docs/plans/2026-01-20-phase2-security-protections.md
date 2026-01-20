# Phase 2 Security Protections Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement high-priority security protections including rate limiting and input validation to prevent abuse and injection attacks.

**Architecture:** Add defense-in-depth layers with rate limiting (using Upstash Redis), comprehensive input validation (using Zod), and enhanced error handling. Security headers already implemented in Phase 1.

**Tech Stack:** Upstash Redis, Zod validation library, Next.js middleware

---

## Overview

Phase 2 focuses on three high-priority security improvements:

1. **Rate Limiting** - Prevent abuse and DoS attacks
2. **Input Validation** - Prevent injection attacks and invalid data
3. **Enhanced Error Handling** - Prevent information disclosure

**Prerequisites:**
- Phase 1 (authentication & CSRF) must be complete
- Security headers already in place from Phase 1

**Estimated Time:** 2-3 days

---

## Task 1: Implement Rate Limiting Infrastructure

**Files:**
- Create: `apps/web/src/lib/ratelimit.ts`
- Create: `apps/web/src/lib/withRateLimit.ts`
- Modify: `apps/web/.env.example`
- Create: `apps/web/tests/lib/ratelimit.test.ts`

### Step 1: Install rate limiting dependencies

**Action:** Install Upstash libraries

```bash
cd apps/web
npm install @upstash/ratelimit @upstash/redis
```

**Expected:** Dependencies added to package.json

### Step 2: Update environment variables template

**Action:** Add rate limiting configuration to `.env.example`

```bash
# Add to apps/web/.env.example after existing vars
cat >> .env.example << 'EOF'

# Rate Limiting (Optional - uses in-memory fallback if not configured)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
EOF
```

### Step 3: Write test for rate limiter creation

**File:** `apps/web/tests/lib/ratelimit.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getRateLimitIdentifier } from "@/lib/ratelimit";

describe("ratelimit", () => {
  describe("getRateLimitIdentifier", () => {
    it("returns user ID when provided", () => {
      const mockRequest = new Request("http://localhost", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });

      const identifier = getRateLimitIdentifier(mockRequest, "user-123");

      expect(identifier).toBe("user:user-123");
    });

    it("returns IP from x-forwarded-for when no user ID", () => {
      const mockRequest = new Request("http://localhost", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });

      const identifier = getRateLimitIdentifier(mockRequest);

      expect(identifier).toBe("ip:192.168.1.1");
    });

    it("returns IP from x-real-ip when x-forwarded-for not present", () => {
      const mockRequest = new Request("http://localhost", {
        headers: { "x-real-ip": "192.168.1.2" },
      });

      const identifier = getRateLimitIdentifier(mockRequest);

      expect(identifier).toBe("ip:192.168.1.2");
    });

    it("returns unknown when no IP headers present", () => {
      const mockRequest = new Request("http://localhost");

      const identifier = getRateLimitIdentifier(mockRequest);

      expect(identifier).toBe("ip:unknown");
    });
  });
});
```

### Step 4: Run test to verify it fails

```bash
npm test tests/lib/ratelimit.test.ts
```

**Expected:** FAIL - Module not found

### Step 5: Create rate limiting utilities

**File:** `apps/web/src/lib/ratelimit.ts`

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client (with fallback for development)
let redis: Redis | undefined;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// In-memory fallback for development/testing
const inMemoryLimiter = {
  limit: async (identifier: string) => ({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60000,
  }),
};

/**
 * Rate limiters for different operations
 * Falls back to in-memory (always allows) if Redis not configured
 */
export const rateLimiters = redis
  ? {
      // General API calls: 100 requests per minute
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        analytics: true,
        prefix: "ratelimit:api",
      }),

      // Write operations: 10 requests per minute
      write: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        analytics: true,
        prefix: "ratelimit:write",
      }),

      // Auto-claim: 5 requests per hour (very restrictive)
      autoClaim: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        analytics: true,
        prefix: "ratelimit:autoclaim",
      }),
    }
  : {
      api: inMemoryLimiter,
      write: inMemoryLimiter,
      autoClaim: inMemoryLimiter,
    };

/**
 * Get identifier for rate limiting (IP or user ID)
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID if available (more accurate for authenticated users)
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return `ip:${ip}`;
}
```

### Step 6: Run test to verify it passes

```bash
npm test tests/lib/ratelimit.test.ts
```

**Expected:** 4 tests passing

### Step 7: Write test for rate limit wrapper

**File:** `apps/web/tests/lib/withRateLimit.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock the ratelimit module
vi.mock("@/lib/ratelimit", () => ({
  rateLimiters: {
    api: {
      limit: vi.fn(async () => ({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      })),
    },
    write: {
      limit: vi.fn(async () => ({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 60000,
      })),
    },
  },
  getRateLimitIdentifier: vi.fn(() => "ip:127.0.0.1"),
}));

import { withRateLimit } from "@/lib/withRateLimit";
import { rateLimiters } from "@/lib/ratelimit";

describe("withRateLimit", () => {
  it("allows request when rate limit not exceeded", async () => {
    const handler = vi.fn(async () =>
      NextResponse.json({ message: "success" })
    );
    const wrappedHandler = withRateLimit(handler, "api");

    const request = new NextRequest("http://localhost/api/test");
    const response = await wrappedHandler(request);

    expect(handler).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
  });

  it("blocks request when rate limit exceeded", async () => {
    const handler = vi.fn(async () =>
      NextResponse.json({ message: "success" })
    );
    const wrappedHandler = withRateLimit(handler, "write");

    const request = new NextRequest("http://localhost/api/test");
    const response = await wrappedHandler(request);

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.message).toContain("Too many requests");
  });

  it("includes rate limit headers in response", async () => {
    const handler = vi.fn(async () =>
      NextResponse.json({ message: "success" })
    );
    const wrappedHandler = withRateLimit(handler, "api");

    const request = new NextRequest("http://localhost/api/test");
    const response = await wrappedHandler(request);

    expect(response.headers.has("X-RateLimit-Limit")).toBe(true);
    expect(response.headers.has("X-RateLimit-Remaining")).toBe(true);
    expect(response.headers.has("X-RateLimit-Reset")).toBe(true);
  });
});
```

### Step 8: Run test to verify it fails

```bash
npm test tests/lib/withRateLimit.test.ts
```

**Expected:** FAIL - Module not found

### Step 9: Create rate limit wrapper

**File:** `apps/web/src/lib/withRateLimit.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { rateLimiters, getRateLimitIdentifier } from "./ratelimit";

type RateLimitType = keyof typeof rateLimiters;

/**
 * Higher-order function to add rate limiting to API routes
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limitType: RateLimitType = "api"
) {
  return async (request: NextRequest) => {
    const limiter = rateLimiters[limitType];
    const identifier = getRateLimitIdentifier(request);

    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      return NextResponse.json(
        {
          message: "Too many requests. Please try again later.",
          limit,
          remaining: 0,
          reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const response = await handler(request);

    // Add rate limit headers to successful responses
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());

    return response;
  };
}
```

### Step 10: Run test to verify it passes

```bash
npm test tests/lib/withRateLimit.test.ts
```

**Expected:** 3 tests passing

### Step 11: Run all tests

```bash
npm test
```

**Expected:** All tests passing (215 + 7 new = 222 total)

### Step 12: Commit rate limiting infrastructure

```bash
git add apps/web/src/lib/ratelimit.ts apps/web/src/lib/withRateLimit.ts apps/web/tests/lib/ratelimit.test.ts apps/web/tests/lib/withRateLimit.test.ts apps/web/.env.example apps/web/package.json apps/web/package-lock.json
git commit -m "feat: add rate limiting infrastructure with Upstash Redis

- Add rate limiting utilities with Redis and in-memory fallback
- Create withRateLimit wrapper for API routes
- Configure three rate limit tiers: api, write, autoClaim
- Add comprehensive test coverage

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Apply Rate Limiting to API Routes

**Files:**
- Modify: `apps/web/src/app/api/coupons/route.ts`
- Modify: `apps/web/src/app/api/available-coupons/route.ts`
- Modify: `apps/web/src/app/api/campaigns/route.ts`
- Modify: `apps/web/src/app/api/coupons/claim/route.ts`
- Modify: `apps/web/src/app/api/available-coupons/auto-claim/route.ts`

### Step 1: Apply rate limiting to coupons GET endpoint

**File:** `apps/web/src/app/api/coupons/route.ts`

Add import:
```typescript
import { withRateLimit } from "@/lib/withRateLimit";
```

Wrap GET handler:
```typescript
export const GET = withRateLimit(async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await mcpClient.getCoupons();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}, "api");
```

### Step 2: Apply rate limiting to available-coupons GET endpoint

**File:** `apps/web/src/app/api/available-coupons/route.ts`

Add import:
```typescript
import { withRateLimit } from "@/lib/withRateLimit";
```

Wrap GET handler:
```typescript
export const GET = withRateLimit(async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await mcpClient.getAvailableCoupons();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}, "api");
```

### Step 3: Apply rate limiting to campaigns GET endpoint

**File:** `apps/web/src/app/api/campaigns/route.ts`

Add import:
```typescript
import { withRateLimit } from "@/lib/withRateLimit";
```

Wrap GET handler:
```typescript
export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;

    const data = await mcpClient.getCampaigns(date);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}, "api");
```

### Step 4: Apply rate limiting to claim coupon POST endpoint

**File:** `apps/web/src/app/api/coupons/claim/route.ts`

Add import:
```typescript
import { withRateLimit } from "@/lib/withRateLimit";
```

Wrap POST handler:
```typescript
export const POST = withRateLimit(
  withCsrf(async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const { couponId } = await request.json();
      if (!couponId || typeof couponId !== "string") {
        return NextResponse.json({ message: "couponId is required" }, { status: 400 });
      }

      const result = await mcpClient.autoClaimCoupons();
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  }),
  "write"
);
```

### Step 5: Apply rate limiting to auto-claim POST endpoint

**File:** `apps/web/src/app/api/available-coupons/auto-claim/route.ts`

Add import:
```typescript
import { withRateLimit } from "@/lib/withRateLimit";
```

Wrap POST handler:
```typescript
export const POST = withRateLimit(
  withCsrf(async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const result = await mcpClient.autoClaimCoupons();
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  }),
  "autoClaim"
);
```

### Step 6: Run all tests

```bash
npm test
```

**Expected:** All tests passing (222 total)

### Step 7: Commit rate limiting application

```bash
git add apps/web/src/app/api/
git commit -m "feat: apply rate limiting to all API endpoints

- Add rate limiting to GET endpoints (api tier: 100/min)
- Add rate limiting to write endpoints (write tier: 10/min)
- Add strict rate limiting to auto-claim (autoClaim tier: 5/hour)
- Rate limit headers included in all responses

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Implement Input Validation

**Files:**
- Create: `apps/web/src/lib/validation.ts`
- Create: `apps/web/tests/lib/validation.test.ts`

### Step 1: Install Zod validation library

```bash
npm install zod
```

**Expected:** Zod added to package.json

### Step 2: Write tests for validation schemas

**File:** `apps/web/tests/lib/validation.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import {
  dateSchema,
  couponIdSchema,
  campaignQuerySchema,
  claimCouponSchema,
  paginationSchema,
  validateBody,
  validateQuery,
} from "@/lib/validation";

describe("validation schemas", () => {
  describe("dateSchema", () => {
    it("accepts valid date format yyyy-MM-dd", () => {
      expect(() => dateSchema.parse("2026-01-20")).not.toThrow();
    });

    it("rejects invalid date format", () => {
      expect(() => dateSchema.parse("01-20-2026")).toThrow();
      expect(() => dateSchema.parse("2026/01/20")).toThrow();
    });

    it("rejects invalid date values", () => {
      expect(() => dateSchema.parse("2026-13-01")).toThrow();
      expect(() => dateSchema.parse("2026-01-32")).toThrow();
    });
  });

  describe("couponIdSchema", () => {
    it("accepts valid coupon ID", () => {
      expect(() => couponIdSchema.parse("coupon-123")).not.toThrow();
      expect(() => couponIdSchema.parse("COUPON_ABC_456")).not.toThrow();
    });

    it("rejects empty coupon ID", () => {
      expect(() => couponIdSchema.parse("")).toThrow();
    });

    it("rejects coupon ID with invalid characters", () => {
      expect(() => couponIdSchema.parse("coupon@123")).toThrow();
      expect(() => couponIdSchema.parse("coupon 123")).toThrow();
    });

    it("rejects too long coupon ID", () => {
      expect(() => couponIdSchema.parse("a".repeat(101))).toThrow();
    });
  });

  describe("paginationSchema", () => {
    it("parses valid pagination params", () => {
      const result = paginationSchema.parse({ page: "2", pageSize: "50" });
      expect(result).toEqual({ page: 2, pageSize: 50 });
    });

    it("uses defaults when not provided", () => {
      const result = paginationSchema.parse({});
      expect(result).toEqual({ page: 1, pageSize: 20 });
    });

    it("rejects invalid page numbers", () => {
      expect(() => paginationSchema.parse({ page: "0" })).toThrow();
      expect(() => paginationSchema.parse({ page: "101" })).toThrow();
    });

    it("rejects invalid page size", () => {
      expect(() => paginationSchema.parse({ pageSize: "0" })).toThrow();
      expect(() => paginationSchema.parse({ pageSize: "201" })).toThrow();
    });
  });

  describe("validateBody", () => {
    it("returns data when body is valid", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ couponId: "test-123" }),
      });

      const result = await validateBody(request, claimCouponSchema);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({ couponId: "test-123" });
    });

    it("returns error when body is invalid", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ couponId: "" }),
      });

      const result = await validateBody(request, claimCouponSchema);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });
  });

  describe("validateQuery", () => {
    it("returns data when query params are valid", () => {
      const params = new URLSearchParams("date=2026-01-20");

      const result = validateQuery(params, campaignQuerySchema);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({ date: "2026-01-20" });
    });

    it("returns error when query params are invalid", () => {
      const params = new URLSearchParams("date=invalid");

      const result = validateQuery(params, campaignQuerySchema);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });
  });
});
```

### Step 3: Run test to verify it fails

```bash
npm test tests/lib/validation.test.ts
```

**Expected:** FAIL - Module not found

### Step 4: Create validation schemas and helpers

**File:** `apps/web/src/lib/validation.ts`

```typescript
import { z } from "zod";

// Date format: yyyy-MM-dd
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use yyyy-MM-dd")
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, "Invalid date");

// Coupon ID format
export const couponIdSchema = z
  .string()
  .min(1, "Coupon ID is required")
  .max(100, "Coupon ID too long")
  .regex(/^[a-zA-Z0-9-_]+$/, "Invalid coupon ID format");

// Campaign query params
export const campaignQuerySchema = z.object({
  date: dateSchema.optional(),
});

// Claim coupon request
export const claimCouponSchema = z.object({
  couponId: couponIdSchema,
});

// Generic pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

/**
 * Helper to validate request body
 */
export async function validateBody<T>(
  request: Request,
  schema: z.Schema<T>
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: Response.json(
          {
            message: "Validation failed",
            errors: error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    return {
      data: null,
      error: Response.json(
        { message: "Invalid request body" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Helper to validate query params
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.Schema<T>
): { data: T; error: null } | { data: null; error: Response } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const data = schema.parse(params);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: Response.json(
          {
            message: "Validation failed",
            errors: error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    return {
      data: null,
      error: Response.json(
        { message: "Invalid query parameters" },
        { status: 400 }
      ),
    };
  }
}
```

### Step 5: Run test to verify it passes

```bash
npm test tests/lib/validation.test.ts
```

**Expected:** 14 tests passing

### Step 6: Run all tests

```bash
npm test
```

**Expected:** All tests passing (222 + 14 = 236 total)

### Step 7: Commit validation infrastructure

```bash
git add apps/web/src/lib/validation.ts apps/web/tests/lib/validation.test.ts apps/web/package.json apps/web/package-lock.json
git commit -m "feat: add comprehensive input validation with Zod

- Create validation schemas for dates, coupon IDs, pagination
- Add validateBody and validateQuery helpers
- Comprehensive test coverage for all validation scenarios
- Prevent injection attacks and invalid data

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Apply Input Validation to API Routes

**Files:**
- Modify: `apps/web/src/app/api/campaigns/route.ts`
- Modify: `apps/web/src/app/api/coupons/claim/route.ts`

### Step 1: Add validation to campaigns endpoint

**File:** `apps/web/src/app/api/campaigns/route.ts`

Add imports:
```typescript
import { validateQuery, campaignQuerySchema } from "@/lib/validation";
```

Update GET handler:
```typescript
export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { data, error } = validateQuery(searchParams, campaignQuerySchema);
    if (error) return error;

    const campaigns = await mcpClient.getCampaigns(data.date);
    return NextResponse.json(campaigns);
  } catch (error) {
    return handleApiError(error);
  }
}, "api");
```

### Step 2: Add validation to claim coupon endpoint

**File:** `apps/web/src/app/api/coupons/claim/route.ts`

Add imports:
```typescript
import { validateBody, claimCouponSchema } from "@/lib/validation";
```

Update POST handler:
```typescript
export const POST = withRateLimit(
  withCsrf(async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const { data, error } = await validateBody(request, claimCouponSchema);
      if (error) return error;

      const result = await mcpClient.autoClaimCoupons();
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  }),
  "write"
);
```

### Step 3: Run all tests

```bash
npm test
```

**Expected:** All tests passing (236 total)

### Step 4: Commit validation application

```bash
git add apps/web/src/app/api/
git commit -m "feat: apply input validation to API endpoints

- Validate campaign query parameters (date format)
- Validate claim coupon request body (couponId format)
- Return 400 with detailed error messages for invalid input
- Prevent injection attacks and malformed requests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add Rate Limit Feedback to Frontend

**Files:**
- Modify: `apps/web/src/hooks/useAvailableCoupons.ts`
- Modify: `apps/web/src/hooks/useCoupons.ts`

### Step 1: Update available coupons hook to handle rate limits

**File:** `apps/web/src/hooks/useAvailableCoupons.ts`

Update autoClaimMutation:
```typescript
const autoClaimMutation = useMutation({
  mutationKey: ["auto-claim"],
  mutationFn: async () => {
    const response = await fetch("/api/available-coupons/auto-claim", {
      method: "POST",
      headers: getCsrfHeaders(),
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new Error(
        `Too many requests. Please try again in ${retryAfter} seconds.`
      );
    }

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Failed to auto-claim coupons (${response.status})`);
    }

    return (await response.json()) as AutoClaimResponse;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["available-coupons"] });
    queryClient.invalidateQueries({ queryKey: ["coupons"] });
  },
});
```

### Step 2: Update coupons hook to handle rate limits

**File:** `apps/web/src/hooks/useCoupons.ts`

Update claimMutation:
```typescript
const claimMutation = useMutation({
  mutationKey: ["claim-coupon"],
  mutationFn: async (couponId: string) => {
    const response = await fetch("/api/coupons/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getCsrfHeaders(),
      },
      body: JSON.stringify({ couponId }),
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new Error(
        `Too many requests. Please try again in ${retryAfter} seconds.`
      );
    }

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Failed to claim coupon (${response.status})`);
    }

    return (await response.json()) as AutoClaimResponse;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["coupons"] });
    queryClient.invalidateQueries({ queryKey: ["available-coupons"] });
  },
});
```

### Step 3: Run all tests

```bash
npm test
```

**Expected:** All tests passing (236 total)

### Step 4: Commit rate limit feedback

```bash
git add apps/web/src/hooks/
git commit -m "feat: add rate limit feedback to frontend hooks

- Display rate limit errors with retry-after information
- Handle 429 responses gracefully in UI
- Improve user experience during rate limit scenarios

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Final Verification

### Step 1: Run full test suite

```bash
npm test
```

**Expected:** All 236 tests passing

### Step 2: Run type checking

```bash
npm run type-check
```

**Expected:** No type errors

### Step 3: Run linter

```bash
npm run lint
```

**Expected:** No linting errors

### Step 4: Manual testing checklist

1. Start dev server: `npm run dev`
2. Test rate limiting:
   - Make multiple rapid API calls
   - Verify rate limit headers in response
   - Verify 429 response when limit exceeded
3. Test input validation:
   - Try invalid date format in campaigns
   - Try invalid coupon ID in claim
   - Verify 400 response with error details
4. Test error messages:
   - Verify user-friendly messages shown
   - Check browser console for errors

### Step 5: Create final commit if needed

If any manual fixes were made:

```bash
git add .
git commit -m "fix: address final issues from manual testing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

Phase 2 is complete when:

- ✅ Rate limiting active on all API endpoints
- ✅ Rate limit headers present in all responses
- ✅ 429 responses when limits exceeded
- ✅ Input validation on all user inputs
- ✅ 400 responses with detailed errors for invalid input
- ✅ Frontend handles rate limits gracefully
- ✅ All 236 tests passing
- ✅ No type errors
- ✅ No linting errors
- ✅ Manual testing successful

---

## Next Steps

After Phase 2 completion:

1. Push branch and create/update pull request
2. Request code review
3. Merge to main after approval
4. Start Phase 3: Medium Priority Improvements
   - Enhanced error handling
   - Request size limits
   - CORS configuration

---

## Notes

- **Redis Configuration:** If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not set, rate limiting falls back to in-memory mode (always allows requests). This is acceptable for development but **must** be configured for production.

- **Testing Rate Limits:** The in-memory fallback makes testing easier but doesn't test actual Redis integration. For comprehensive testing, configure a test Redis instance.

- **Rate Limit Tuning:** The current limits (100/min for API, 10/min for writes, 5/hour for auto-claim) are conservative. Monitor actual usage and adjust as needed.

- **Validation Extensibility:** The validation schemas are modular and can be easily extended for new endpoints or stricter requirements.
