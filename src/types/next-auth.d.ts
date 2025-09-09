import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    userInfo?: any;
    error?: string;
  }

  interface User extends DefaultUser {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    userInfo?: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    userInfo?: any;
    accessTokenExpires?: number;
    error?: string;
  }
}
