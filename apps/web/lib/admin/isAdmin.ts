const SUPER_ADMIN_EMAILS: string[] = [
  'nick@contractoros.com',
  'nick.bodkins@gmail.com',
];

export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}
