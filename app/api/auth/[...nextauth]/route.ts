import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 123456,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        accessToken: { label: "Access Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          });

          if (!response.ok) {
            console.error(`Failed to login: ${response.statusText}`);
            throw new Error("Invalid credentials");
          }

          const data = await response.json();

          if (data && data.access_token) {
            return {
              id: data.user_id.toString(),
              name: data.full_name,
              email: data.email,
              role: data.role,
              accessToken: data.access_token
            };
          }

          throw new Error("Invalid credentials");
        } catch (error) {
          console.error("Error in authorize:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("User authenticated:", user);
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      console.log("JWT Token:", token);
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.accessToken = token.accessToken as string;
      }
      console.log("Session Data:", session);
      return session;
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 