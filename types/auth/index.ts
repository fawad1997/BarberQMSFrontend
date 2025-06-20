import 'next-auth';

export enum UserRole {
  USER = "USER",
  SHOP_OWNER = "SHOP_OWNER",
  BARBER = "BARBER",
  ADMIN = "ADMIN"
}

declare module 'next-auth' {
  interface User {
    accessToken: string;
    role: string;
    isFirstLogin: boolean;
  }
  
  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    role: string;
    isFirstLogin: boolean;
  }
}
