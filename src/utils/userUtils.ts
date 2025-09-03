/**
 * Safely extracts user ID from either a user object or a string ID
 */
export const getUserId = (user: string | { id: string } | null | undefined): string | null => {
  if (!user) return null;
  return typeof user === 'string' ? user : user.id;
};
