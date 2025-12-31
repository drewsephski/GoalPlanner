import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authData = await auth();
  const userId = authData.userId;

  if (!userId) {
    redirect('/sign-in');
  }

  // Ensure user exists in database (safety check)
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    // User might not be synced yet from webhook, create them manually
    try {
      const { currentUser } = await import('@clerk/nextjs/server');
      const clerkUser = await currentUser();
      
      if (clerkUser) {
        await db.insert(users).values({
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          username: clerkUser.username || null,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          imageUrl: clerkUser.imageUrl || null,
        });
        
        // Also create user stats
        const { userStats } = await import('@/lib/db/schema');
        await db.insert(userStats).values({ userId });
      }
    } catch (error) {
      console.error('Failed to create user record:', error);
      redirect('/sign-in');
    }
  }

  return <>{children}</>;
}