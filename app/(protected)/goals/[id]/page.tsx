import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { goals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { GoalDetail } from '@/components/goals/GoalDetail';
import { getFallbackGoal } from '@/lib/fallback-storage';

// Define goal type that includes fallback properties
type ExtendedGoal = {
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
  };
  status: string;
  visibility: string;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  steps: Array<{
    id: string;
    goalId: string;
    orderNum: number;
    title: string;
    description: string | null;
    dueDate: string | null;
    status: string;
    completedAt: Date | null;
    createdAt: Date;
  }>;
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  username?: string; // Add username for fallback goals
  isFallback?: boolean;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Check if it's a fallback goal
  if (id.startsWith('fallback_')) {
    return {
      title: 'Fallback Goal - Goal Planner Pro',
      description: 'Goal created offline due to connection issues',
    };
  }
  
  try {
    const goal = await db.query.goals.findFirst({
      where: eq(goals.id, id),
    });

    if (!goal) {
      return {
        title: 'Goal Not Found',
      };
    }

    return {
      title: `${goal.title} - Goal Planner Pro`,
      description: goal.why || 'Track your goal progress',
    };
  } catch (error) {
    console.error('Error fetching goal for metadata:', error);
    return {
      title: 'Goal - Goal Planner Pro',
      description: 'Track your goal progress',
    };
  }
}

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  let goal: ExtendedGoal | null = null;

  // Check if it's a fallback goal first
  if (id.startsWith('fallback_')) {
    const fallbackGoal = await getFallbackGoal(id, userId);
    if (fallbackGoal) {
      goal = {
        ...fallbackGoal,
        startedAt: new Date(fallbackGoal.createdAt),
        completedAt: null,
        updatedAt: new Date(fallbackGoal.createdAt),
        createdAt: new Date(fallbackGoal.createdAt), // Convert string to Date
        steps: fallbackGoal.steps?.map((step: {
          title: string;
          description?: string | null;
          dueDate?: string | null;
          orderNum: number;
          status: string;
        }) => ({
          id: `fallback_step_${step.orderNum}`,
          goalId: fallbackGoal.id,
          orderNum: step.orderNum,
          title: step.title,
          description: step.description || null,
          dueDate: step.dueDate || null,
          status: step.status,
          completedAt: null,
          createdAt: new Date(fallbackGoal.createdAt),
        })) || [],
        user: {
          id: userId,
          email: `${userId}@anonymous.local`,
          username: fallbackGoal.username || 'user',
          firstName: 'User',
          lastName: '',
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isFallback: true,
      } as unknown as ExtendedGoal;
    }
  } else {
    // Try to fetch from database
    try {
      const dbGoal = await db.query.goals.findFirst({
        where: and(
          eq(goals.id, id),
          eq(goals.userId, userId)
        ),
        with: {
          steps: {
            orderBy: (steps, { asc }) => [asc(steps.orderNum)],
          },
          user: true,
        },
      });
      if (dbGoal) {
        goal = dbGoal as unknown as ExtendedGoal;
      }
    } catch (error) {
      console.error('Error fetching goal from database:', error);
      // Don't throw error, just continue with null goal
    }
  }

  if (!goal) {
    notFound();
  }

  return <GoalDetail goal={goal as any} user={goal.user} />;
}