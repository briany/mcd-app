import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("combines multiple class names", () => {
    expect(cn("class1", "class2", "class3")).toBe("class1 class2 class3");
  });

  it("filters out false values", () => {
    expect(cn("class1", false, "class2")).toBe("class1 class2");
  });

  it("filters out null values", () => {
    expect(cn("class1", null, "class2")).toBe("class1 class2");
  });

  it("filters out undefined values", () => {
    expect(cn("class1", undefined, "class2")).toBe("class1 class2");
  });

  it("handles all falsy values", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles single class name", () => {
    expect(cn("single-class")).toBe("single-class");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe("base active");
  });

  it("handles complex conditional logic", () => {
    const variant = "primary";
    const size = "large";
    expect(
      cn(
        "button",
        variant === "primary" && "button-primary",
        variant === "secondary" && "button-secondary",
        size === "large" && "button-large"
      )
    ).toBe("button button-primary button-large");
  });

  it("preserves whitespace in individual class names", () => {
    expect(cn("class with spaces")).toBe("class with spaces");
  });

  it("handles empty strings", () => {
    // Empty strings are falsy and get filtered out by Boolean
    expect(cn("", "class1", "", "class2")).toBe("class1 class2");
  });
});
