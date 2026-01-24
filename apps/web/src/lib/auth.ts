import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
