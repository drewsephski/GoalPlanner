import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function findUserByIdentifier(identifier: string) {
  // Try to find by username first
  let user = await db.query.users.findFirst({
    where: eq(users.username, identifier),
  });

  // If not found by username, try by email
  if (!user && identifier.includes('@')) {
    user = await db.query.users.findFirst({
      where: eq(users.email, identifier),
    });
  }

  // If still not found, try by ID (for anonymous users or direct ID access)
  if (!user) {
    user = await db.query.users.findFirst({
      where: eq(users.id, identifier),
    });
  }

  return user;
}

export async function ensureUserHasUsername(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || user.username) {
    return user; // User doesn't exist or already has username
  }

  // Generate username from email
  const emailPrefix = user.email.split('@')[0];
  const timestamp = Date.now().toString(36);
  const generatedUsername = `${emailPrefix}_${timestamp}`;

  // Update user with generated username
  const [updatedUser] = await db
    .update(users)
    .set({ 
      username: generatedUsername,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return updatedUser;
}
