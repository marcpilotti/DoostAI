import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/ai/(.*)",
  "/api/ad/(.*)",
  "/api/brand/(.*)",
  "/api/campaigns(.*)",
  "/api/credits/(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  "/api/inngest",
  "/api/webhooks/(.*)",
  "/api/platforms/(.*)/callback",
  "/api/sync/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Public routes — no auth required
  if (isPublicRoute(req)) {
    const response = NextResponse.next();
    response.headers.set("X-Request-Id", crypto.randomUUID());
    return response;
  }

  // Protected routes — require authentication
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      // API routes get 401, pages get redirected
      if (req.nextUrl.pathname.startsWith("/api/")) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", "X-Request-Id": crypto.randomUUID() },
        });
      }
      const redirect = NextResponse.redirect(new URL("/sign-in", req.url));
      redirect.headers.set("X-Request-Id", crypto.randomUUID());
      return redirect;
    }
  }

  // Default: add X-Request-Id to all responses
  const response = NextResponse.next();
  response.headers.set("X-Request-Id", crypto.randomUUID());
  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
