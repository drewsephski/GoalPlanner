import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isProUser } from '@/lib/polar/subscription';
import { db } from '@/lib/db';
import { goals, checkIns } from '@/lib/db/schema';
import { eq, desc, gte, and } from 'drizzle-orm';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { UpgradePrompt } from '@/components/pro/UpgradePrompt';

export const metadata = {
  title: 'Analytics - Goal Planner Pro',
  description: 'Advanced insights into your goal progress',
};

export default async function AnalyticsPage() {
  const session = await auth();
  const { userId } = session;

  if (!userId) {
    redirect('/sign-in');
  }

  const isPro = await isProUser(userId);

  if (!isPro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50 flex items-center justify-center p-4">
        <div className="max-w-md">
          <UpgradePrompt
            feature="Advanced Analytics"
            description="Get detailed insights into your progress, trends, and patterns. Understand what's working and optimize your goal achievement strategy."
          />
        </div>
      </div>
    );
  }

  // Fetch analytics data
  const userGoals = await db.query.goals.findMany({
    where: eq(goals.userId, userId),
    with: {
      steps: true,
    },
  });

  // Get check-ins from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCheckIns = await db.query.checkIns.findMany({
    where: and(
      eq(checkIns.userId, userId),
      gte(checkIns.createdAt, thirtyDaysAgo)
    ),
    orderBy: [desc(checkIns.createdAt)],
  });

  return <AnalyticsDashboard goals={userGoals} checkIns={recentCheckIns} />;
}
