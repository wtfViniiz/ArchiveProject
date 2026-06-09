// Auth configuration
// We use Prisma directly for auth operations
// Discord OAuth is handled separately

export const authConfig = {
  sessionExpiry: 60 * 60 * 24 * 7, // 7 days
};
