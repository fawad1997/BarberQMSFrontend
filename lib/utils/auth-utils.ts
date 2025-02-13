import { signOut } from "next-auth/react";

export async function handleUnauthorizedResponse() {
  await signOut({ redirect: true, callbackUrl: "/" });
  return null;
} 