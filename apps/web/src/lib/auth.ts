import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Validate NEXTAUTH_SECRET at module load time
const secret = process.env.NEXTAUTH_SECRET;

if (!secret) {
  throw new Error(
    "NEXTAUTH_SECRET environment variable is not set. " +
    "Generate one with: openssl rand -base64 32"
  );
}

if (secret.includes("your-secret-key-here")) {
  throw new Error(
    "NEXTAUTH_SECRET is still set to the placeholder value. " +
    "Generate a secure secret with: openssl rand -base64 32"
  );
}

if (secret.length < 32) {
  throw new Error(
    "NEXTAUTH_SECRET is too short. Must be at least 32 characters. " +
    "Generate one with: openssl rand -base64 32"
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        // TODO: Integrate with actual authentication provider
        // (database lookup, LDAP, external API, etc.)
        return null;
      },
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
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
