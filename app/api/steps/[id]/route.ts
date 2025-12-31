import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { steps, goals, userStats } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateUserStats } from '@/lib/stats/update-stats';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { status } = await req.json();

    if (!['pending', 'in_progress', 'completed', 'skipped'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the step and verify ownership
    const step = await db.query.steps.findFirst({
      where: eq(steps.id, params.id),
      with: {
        goal: true,
      },
    });

    if (!step || step.goal.userId !== userId) {
      return new Response(JSON.stringify({ error: 'Step not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update step
    const [updatedStep] = await db
      .update(steps)
      .set({
        status,
        completedAt: status === 'completed' ? new Date() : null,
      })
      .where(eq(steps.id, params.id))
      .returning();

    // Update user stats if step was just completed
    if (status === 'completed' && step.status !== 'completed') {
      await updateUserStats(userId, 'step_completed');
    }

    // Check if all steps are completed and update goal status
    if (status === 'completed') {
      const allSteps = await db.query.steps.findMany({
        where: eq(steps.goalId, step.goalId),
      });

      const allCompleted = allSteps.every(s => 
        s.id === params.id ? status === 'completed' : s.status === 'completed'
      );

      if (allCompleted) {
        await db
          .update(goals)
          .set({ 
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(goals.id, step.goalId));

        await updateUserStats(userId, 'goal_completed');
      }
    }

    return new Response(JSON.stringify({ step: updatedStep }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating step:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update step' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}