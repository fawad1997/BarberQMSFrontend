import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getApiEndpoint } from "@/lib/utils/api-config";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [    CredentialsProvider({
      name: 'Credentials',      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        accessToken: { label: "Access Token", type: "text" },
      },async authorize(credentials) {
        try {
          // Prepare the request body with login data
          const loginData = {
            username: credentials?.username,
            password: credentials?.password,
          };
          
          const response = await fetch(getApiEndpoint("auth/login"), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
          })

          // Check content type before parsing
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.error("Non-JSON response from API");
            return null;
          }          
          
          const data = await response.json()          
          if (response.ok && data) {            
            console.log('Auth login data:', { 
              user_id: data.user_id, 
              full_name: data.full_name, 
              is_first_login: data.is_first_login,
              is_first_login_type: typeof data.is_first_login,
              role: data.role
            })
            
            return {
              id: data.user_id.toString(),
              name: data.full_name,
              email: data.email,
              role: data.role,
              accessToken: data.access_token,
              isFirstLogin: Boolean(data.is_first_login) // Ensure boolean conversion
            }
          }
          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    }),
    // Add SSO provider for handling Google SSO tokens
    CredentialsProvider({
      id: "sso",
      name: "SSO Login",
      credentials: {
        accessToken: { label: "Access Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.accessToken) {
            return null;
          }

          // Validate the token with the backend
          const response = await fetch(getApiEndpoint("auth/validate-token"), {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${credentials.accessToken}`
            }
          });

          if (!response.ok) {
            throw new Error("Failed to validate SSO token");
          }          const data = await response.json();            console.log('SSO validate-token data:', { 
              user_id: data.user_id, 
              full_name: data.full_name, 
              is_first_login: data.is_first_login,
              is_first_login_type: typeof data.is_first_login 
            })
            return {
            id: data.user_id.toString(),
            name: data.full_name,
            email: data.email,
            role: data.role,
            accessToken: credentials.accessToken,
            isFirstLogin: Boolean(data.is_first_login) // Ensure boolean conversion
          };
        } catch (error) {
          console.error("SSO auth error:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },  callbacks: {    async jwt({ token, user }) {
      if (user) {
        console.log('JWT callback - storing user data:', {
          role: user.role,
          isFirstLogin: user.isFirstLogin,
          isFirstLoginType: typeof user.isFirstLogin
        })
        token.role = user.role
        token.accessToken = user.accessToken
        token.isFirstLogin = Boolean(user.isFirstLogin) // Ensure boolean
      }
      console.log('JWT token after processing:', {
        isFirstLogin: token.isFirstLogin,
        isFirstLoginType: typeof token.isFirstLogin
      })
      return token
    },    async session({ session, token }) {
      if (session?.user) {
        console.log('Session callback - setting session data:', {
          role: token.role,
          isFirstLogin: token.isFirstLogin,
          isFirstLoginType: typeof token.isFirstLogin
        })
        session.user.role = token.role as string
        session.user.accessToken = token.accessToken as string
        session.user.isFirstLogin = Boolean(token.isFirstLogin) // Ensure boolean
      }
      console.log('Final session user:', {
        isFirstLogin: session?.user?.isFirstLogin,
        isFirstLoginType: typeof session?.user?.isFirstLogin
      })
      return session
    },    async redirect({ url, baseUrl }) {
      // The token isn't available directly in the redirect callback
      // We'll handle redirects based on role in the middleware instead
      
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allow callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 