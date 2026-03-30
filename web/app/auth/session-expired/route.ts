import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/session";

export async function GET(request: Request) {
  await clearAuthCookies();
  return NextResponse.redirect(new URL("/sign-in", request.url));
}
