import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { goals, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { CheckInForm } from '@/components/check-ins/CheckInForm';

export const metadata = {
  title: 'Check In - Goal Planner Pro',
  description: 'How are you doing with your goals?',
};

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ goalId?: string; mood?: string }>;
}) {
  const { userId } = await auth();
  const resolvedSearchParams = await searchParams;

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user info
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !user.username) {
    redirect('/sign-in');
  }

  // Fetch user's active goals
  const activeGoals = await db.query.goals.findMany({
    where: eq(goals.userId, userId),
    orderBy: (goals, { desc }) => [desc(goals.createdAt)],
  });

  const selectedGoalId = resolvedSearchParams.goalId || activeGoals[0]?.id;
  const initialMood = resolvedSearchParams.mood;

  return (
    <CheckInForm
      goals={activeGoals}
      selectedGoalId={selectedGoalId}
      initialMood={initialMood}
    />
  );
}