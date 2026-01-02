import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { goals, userStats, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { getUserSubscription } from '@/lib/polar/subscription';

// Define the goal type with steps
type GoalWithSteps = {
  id: string;
  userId: string;
  title: string;
  slug: string;
  why: string | null;
  deadline: string | null;
  timeCommitment: string | null;
  biggestConcern: string | null;
  aiPlan?: {
    overview: string;
    steps: Array<{
      title: string;
      description: string;
      order: number;
    }>;
    timeline: string;
    tips: string[];
  } | null;
  status: string;
  visibility: string;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  steps: {
    id: string;
    goalId: string;
    orderNum: number;
    title: string;
    description: string | null;
    dueDate: string | null;
    status: string;
    completedAt: Date | null;
    createdAt: Date;
  }[];
};

export const metadata = {
  title: 'Dashboard - Goal Planner Pro',
  description: 'Track your goals and progress',
};

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return null; // Protected by layout
  }

  // Fetch user info
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return null; // Should not happen if user is properly set up
  }

  // Use email as fallback username if username is not set
  // const username = user.username || user.email.split('@')[0] || 'user';

  // Fetch user's goals with steps (with error handling)
  let userGoals: GoalWithSteps[] = [];
  try {
    userGoals = await db.query.goals.findMany({
      where: eq(goals.userId, userId),
      orderBy: [desc(goals.createdAt)],
      with: {
        steps: {
          orderBy: (steps, { asc }) => [asc(steps.orderNum)],
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user goals:', error);
    // Continue with empty goals array
  }

  // Fetch user stats (with error handling)
  let stats = null;
  try {
    stats = await db.query.userStats.findFirst({
      where: eq(userStats.userId, userId),
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
  }

  // Initialize stats if they don't exist
  if (!stats) {
    try {
      [stats] = await db
        .insert(userStats)
        .values({ userId })
        .returning();
    } catch (error) {
      console.error('Error creating user stats:', error);
      // Create default stats object
      stats = {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalStepsCompleted: 0,
        totalGoalsCompleted: 0,
        lastActivityDate: null,
        updatedAt: new Date(),
      };
    }
  }

  // Get user subscription (with error handling)
  let subscription = null;
  try {
    subscription = await getUserSubscription(userId);
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    // Continue with null subscription
  }

  return (
    <DashboardContent 
      goals={userGoals} 
      stats={stats}
      subscription={subscription}
    />
  );
}