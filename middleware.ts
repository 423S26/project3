export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /login, /register (auth pages)
     * - /api/auth/* (NextAuth API routes)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, /images/* (static assets)
     */
    "/((?!login|register|api/auth|_next|favicon\\.ico|images).*)",
  ],
};
