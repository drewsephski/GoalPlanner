import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { goals, userStats } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export const metadata = {
  title: 'Dashboard - Goal Planner Pro',
  description: 'Track your goals and progress',
};

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return null; // Protected by layout
  }

  // Fetch user's goals with steps
  const userGoals = await db.query.goals.findMany({
    where: eq(goals.userId, userId),
    orderBy: [desc(goals.createdAt)],
    with: {
      steps: {
        orderBy: (steps, { asc }) => [asc(steps.orderNum)],
      },
    },
  });

  // Fetch user stats
  let stats = await db.query.userStats.findFirst({
    where: eq(userStats.userId, userId),
  });

  // Initialize stats if they don't exist
  if (!stats) {
    [stats] = await db
      .insert(userStats)
      .values({ userId })
      .returning();
  }

  return (
    <DashboardContent 
      goals={userGoals} 
      stats={stats}
    />
  );
}