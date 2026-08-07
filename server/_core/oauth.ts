import type { Express } from "express";

/**
 * OAuth is intentionally disabled. The platform uses local email/password
 * accounts with signed server-side sessions.
 */
export function registerOAuthRoutes(_app: Express) {
  // Compatibility placeholder: no OAuth endpoint is registered.
}
