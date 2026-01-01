import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { goals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { GoalDetail } from '@/components/goals/GoalDetail';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
}

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch goal with steps
  const goal = await db.query.goals.findFirst({
    where: and(
      eq(goals.id, id),
      eq(goals.userId, userId)
    ),
    with: {
      steps: {
        orderBy: (steps, { asc }) => [asc(steps.orderNum)],
      },
      user: true, // Add this
    },
  });

  if (!goal) {
    notFound();
  }

  return <GoalDetail goal={goal} user={goal.user} />;
}