import { auth } from '@clerk/nextjs/server';
import { isProUser } from '@/lib/polar/subscription';
import { db } from '@/lib/db';
import { goals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    const { userId } = session;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isPro = await isProUser(userId);

    if (!isPro) {
      return new Response(
        JSON.stringify({ error: 'This feature requires Pro subscription' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch all user goals with steps and check-ins
    const userGoals = await db.query.goals.findMany({
      where: eq(goals.userId, userId),
      with: {
        steps: true,
        checkIns: true,
      },
    });

    // Convert to CSV
    const csvRows = [];
    csvRows.push('Goal Title,Status,Created,Deadline,Steps Total,Steps Completed,Progress %');

    userGoals.forEach(goal => {
      const totalSteps = goal.steps.length;
      const completedSteps = goal.steps.filter(s => s.status === 'completed').length;
      const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      csvRows.push([
        `"${goal.title.replace(/"/g, '""')}"`,
        goal.status,
        new Date(goal.createdAt).toLocaleDateString(),
        goal.deadline || 'None',
        totalSteps,
        completedSteps,
        progress,
      ].join(','));
    });

    const csv = csvRows.join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="goal-planner-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to export data' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
