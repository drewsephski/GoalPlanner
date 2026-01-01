import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, goals, checkIns } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { PublicGoalView } from '@/components/public/PublicGoalView';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ username: string; slug: string }> 
}) {
  const { username, slug } = await params;
  
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) return { title: 'User Not Found' };

  const goal = await db.query.goals.findFirst({
    where: and(
      eq(goals.userId, user.id),
      eq(goals.slug, slug)
    ),
    with: {
      steps: {
        orderBy: (steps, { asc }) => [asc(steps.orderNum)],
      },
    },
  });

  if (!goal) return { title: 'Goal Not Found' };

  const totalSteps = goal.steps?.length || 0;
  const completedSteps = goal.steps?.filter((s) => s.status === 'completed').length || 0;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return {
    title: `${goal.title} - ${user.firstName || username}'s Goal`,
    description: goal.why || `Follow ${user.firstName || username}'s journey towards: ${goal.title}`,
    openGraph: {
      title: goal.title,
      description: `${progressPercent}% complete • ${completedSteps}/${totalSteps} steps`,
      images: [
        {
          url: `/api/share/generate-card?goalId=${goal.id}&type=progress`,
          width: 1200,
          height: 630,
          alt: goal.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: goal.title,
      description: `${progressPercent}% complete • ${completedSteps}/${totalSteps} steps`,
      images: [`/api/share/generate-card?goalId=${goal.id}&type=progress`],
    },
  };
}

export default async function PublicGoalPage({
  params
}: {
  params: Promise<{ username: string; slug: string }>
}) {
  const { username, slug } = await params;
  
  // Get current authenticated user
  const { userId } = await auth();
  
  // Find user by username
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    notFound();
  }

  // Find goal by slug
  const goal = await db.query.goals.findFirst({
    where: and(
      eq(goals.userId, user.id),
      eq(goals.slug, slug)
    ),
    with: {
      steps: {
        orderBy: (steps, { asc }) => [asc(steps.orderNum)],
      },
      user: true,
    },
  });

  if (!goal) {
    notFound();
  }

  // If the goal is private and the viewer is the owner, redirect to private page
  if (goal.visibility === 'private') {
    if (userId === goal.userId) {
      // Owner is viewing their own private goal - redirect to private page
      redirect(`/goals/${goal.id}`);
    }
    // Non-owner trying to view private goal - show blocked message
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Private Goal</h1>
          <p className="text-muted-foreground">This goal is not publicly visible</p>
        </div>
      </div>
    );
  }
  
  // If goal is public and viewer is the owner, show public view with option to edit
  const isOwner = userId === goal.userId;
  
  // Fetch public check-ins
  const publicCheckIns = await db.query.checkIns.findMany({
    where: and(
      eq(checkIns.goalId, goal.id),
      eq(checkIns.isPublic, true)
    ),
    orderBy: [desc(checkIns.createdAt)],
    limit: 10,
  });

  return (
    <PublicGoalView
      goal={goal}
      user={user}
      checkIns={publicCheckIns}
      isOwner={isOwner}
    />
  );
}