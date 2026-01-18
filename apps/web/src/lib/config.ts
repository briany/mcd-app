const isServer = typeof window === "undefined";

const optionalEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return value?.trim() ? value : undefined;
};

const requiredEnv = (key: string, opts?: { allowClient?: boolean }): string => {
  if (!opts?.allowClient && !isServer) {
    throw new Error(`[config] Attempted to read server env ${key} from the client.`);
  }

  const value = optionalEnv(key);
  if (!value) {
    throw new Error(`[config] Missing required environment variable ${key}. Check web/.env.example.`);
  }
  return value;
};

export const getMcpBaseUrl = (): string =>
  requiredEnv("NEXT_PUBLIC_MCP_BASE_URL", { allowClient: true });

export const getMcpToken = (): string => requiredEnv("MCD_MCP_TOKEN");

export const mcpConfig = {
  baseUrl: getMcpBaseUrl(),
  endpoints: {
    coupons: () => `${getMcpBaseUrl()}/coupons`,
    campaigns: () => `${getMcpBaseUrl()}/campaigns`,
    availableCoupons: () => `${getMcpBaseUrl()}/available-coupons`,
    claimCoupon: (couponId: string) => `${getMcpBaseUrl()}/coupons/${couponId}/claim`,
  },
  authHeaders: () => ({
    Authorization: `Bearer ${getMcpToken()}`,
  }),
};
