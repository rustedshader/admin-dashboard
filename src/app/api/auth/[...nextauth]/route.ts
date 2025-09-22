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

async function refreshAccessToken(token: any): Promise<any> {
  try {
    if (!token.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: token.refreshToken,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const refreshedTokens = await response.json();

    // Decode the new JWT to get expiration time
    try {
      const tokenPayload: JWTPayload = JSON.parse(
        atob(refreshedTokens.access_token.split(".")[1])
      );

      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: tokenPayload.exp * 1000,
        error: undefined,
      };
    } catch (decodeError) {
      console.error("Failed to decode refreshed JWT:", decodeError);
      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + 60 * 60 * 1000, // Default 1 hour
        error: undefined,
      };
    }
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
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
            `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/login`,
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
            `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/me`,
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
      // Initial sign in
      if (user && user.accessToken) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.role = user.role;
        token.userInfo = user.userInfo;

        // Decode JWT to get expiration time
        try {
          const tokenPayload: JWTPayload = JSON.parse(
            atob(user.accessToken.split(".")[1])
          );
          token.accessTokenExpires = tokenPayload.exp * 1000; // Convert to milliseconds
        } catch (error) {
          console.error("Failed to decode JWT:", error);
          // Set a default expiration time (1 hour from now)
          token.accessTokenExpires = Date.now() + 60 * 60 * 1000;
        }

        return token;
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to refresh it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.role = token.role;
      session.userInfo = token.userInfo;
      session.error = token.error;
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
