import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "./lib/i18n";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return;
  }

  // Check if locale is already in the pathname
  const pathnameHasLocale = locales.some(
    (locale) =>
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Detect preferred locale from Accept-Language header
  const acceptLang = request.headers.get("accept-language") ?? "";
  let detectedLocale = defaultLocale;
  for (const locale of locales) {
    if (acceptLang.toLowerCase().includes(locale)) {
      detectedLocale = locale;
      break;
    }
  }

  request.nextUrl.pathname = `/${detectedLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
