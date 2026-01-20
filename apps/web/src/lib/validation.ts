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
            errors: error.issues.map((e) => ({
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
            errors: error.issues.map((e) => ({
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
