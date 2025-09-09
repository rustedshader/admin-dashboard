import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface UserInfo {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_kyc_verified: boolean;
  is_email_verified: boolean;
  blockchain_address: string | null;
  tourist_id_token: string | null;
  tourist_id_transaction_hash: string | null;
}

interface JWTPayload {
  sub: string;
  role: string;
  exp: number;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Login to backend API
          const loginResponse = await fetch(
            "https://api.rustedshader.com/auth/login",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                username: credentials.username,
                password: credentials.password,
              }),
            }
          );

          if (!loginResponse.ok) {
            return null;
          }

          const loginData: LoginResponse = await loginResponse.json();

          // Decode JWT token to check role
          const tokenPayload: JWTPayload = JSON.parse(
            atob(loginData.access_token.split(".")[1])
          );

          if (tokenPayload.role.toLowerCase() !== "admin") {
            return null;
          }

          // Get user information
          const meResponse = await fetch(
            "https://api.rustedshader.com/auth/me",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${loginData.access_token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!meResponse.ok) {
            return null;
          }

          const userInfo: UserInfo = await meResponse.json();

          return {
            id: userInfo.id.toString(),
            email: userInfo.email,
            name: `${userInfo.first_name} ${userInfo.last_name}`,
            role: userInfo.role,
            accessToken: loginData.access_token,
            refreshToken: loginData.refresh_token,
            userInfo: userInfo,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.role = user.role;
        token.userInfo = user.userInfo;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.role = token.role;
      session.userInfo = token.userInfo;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
