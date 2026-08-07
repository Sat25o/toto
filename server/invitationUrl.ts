export const PUBLIC_APP_ORIGIN = "https://tototalho.me";

export function buildInvitationUrl(email: string, token: string): string {
  return `${PUBLIC_APP_ORIGIN}/register?email=${encodeURIComponent(email.trim().toLowerCase())}&token=${token}`;
}
