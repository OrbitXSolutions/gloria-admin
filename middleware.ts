import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

// DEV ONLY: normalize mismatched localhost Origin vs forwarded host in Codespaces.
// Next.js Server Actions compares `origin` and `x-forwarded-host`. When you open
// the forwarded URL in a browser but a script (or extension) triggers requests
// with Origin localhost, the action is aborted. We reconcile by rewriting the
// Origin header to the forwarded host for non-production.
function normalizeOrigin(request: NextRequest): NextRequest {
  if (process.env.NODE_ENV === 'production') return request;
  const forwardedHost = request.headers.get('x-forwarded-host');
  const origin = request.headers.get('origin');
  if (!forwardedHost || !origin) return request;
  if (origin.includes('localhost') && !origin.includes(forwardedHost)) {
    const url = new URL(request.url);
    const newHeaders = new Headers(request.headers);
    newHeaders.set('origin', forwardedHost);
    // Reconstruct a new NextRequest with modified headers
    return new NextRequest(url, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      duplex: 'half',
    } as any);
  }
  return request;
}

export async function middleware(request: NextRequest) {
  const normalized = normalizeOrigin(request);
  let response = await updateSession(normalized);

  if (process.env.NODE_ENV !== 'production') {
    const hasDevCookie = normalized.cookies.get('dev-auth')?.value === '1' || response.cookies.get('dev-auth');
    if (!hasDevCookie) {
      response.cookies.set('dev-auth', '1', { path: '/', httpOnly: true });
    }
    if (normalized.nextUrl.pathname === '/login') {
      const url = normalized.nextUrl.clone();
      url.pathname = '/admin';
      const redirectResp = NextResponse.redirect(url);
      // preserve cookies (incl dev-auth)
      redirectResp.cookies.set('dev-auth', '1', { path: '/', httpOnly: true });
      return redirectResp;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
