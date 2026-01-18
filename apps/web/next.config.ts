import type { NextConfig } from "next";

const validateEnv = () => {
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return;
  }

  const requiredServerEnv = ["MCD_MCP_TOKEN"] as const;
  const requiredPublicEnv = ["NEXT_PUBLIC_MCP_BASE_URL"] as const;

  const missingKey = [...requiredServerEnv, ...requiredPublicEnv].find((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });

  if (missingKey) {
    throw new Error(
      `[next.config] Missing ${missingKey}. Copy web/.env.example -> web/.env.local and fill in the values.`
    );
  }
};

validateEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
