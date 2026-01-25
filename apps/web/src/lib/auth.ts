import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    provider?: string;
  }
}

// Validate NEXTAUTH_SECRET at module load time
const secret = process.env.NEXTAUTH_SECRET;
const SECRET_HELP = "Generate one with: openssl rand -base64 32";

if (!secret) {
  throw new Error(`NEXTAUTH_SECRET environment variable is not set. ${SECRET_HELP}`);
}

if (secret.includes("your-secret-key-here")) {
  throw new Error(`NEXTAUTH_SECRET is still set to the placeholder value. ${SECRET_HELP}`);
}

if (secret.length < 32) {
  throw new Error(`NEXTAUTH_SECRET is too short. Must be at least 32 characters. ${SECRET_HELP}`);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in - add user info to token
      if (user) {
        token.id = user.id;
      }
      // Store OAuth provider
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
