import { createClient } from "./utils/supabase/middleware";

export async function proxy(request) {
  return await createClient(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - icon.png (favicon/icon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|icon.png|.*\\.(?:css|js|gif|svg|jpg|jpeg|png|webp|json|woff|woff2|ico)$).*)',
  ],
};
