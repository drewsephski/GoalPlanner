import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { steps, goals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateUserStats } from '@/lib/stats/update-stats';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { status, title, description, dueDate } = await req.json();

    // Validate status if provided
    if (status && !['pending', 'in_progress', 'paused', 'completed', 'skipped'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate title if provided
    if (title && (typeof title !== 'string' || title.trim().length === 0)) {
      return new Response(JSON.stringify({ error: 'Title must be a non-empty string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate dueDate if provided
    if (dueDate && dueDate !== null) {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        return new Response(JSON.stringify({ error: 'Invalid dueDate format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Get the step and verify ownership
    const step = await db.query.steps.findFirst({
      where: eq(steps.id, id),
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
    const updateData: {
      status?: string;
      completedAt?: Date | null;
      title?: string;
      description?: string | null;
      dueDate?: string | null;
    } = {};
    
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      } else if (step.status === 'completed' && status !== 'completed') {
        updateData.completedAt = null;
      }
    }
    
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }
    
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate;
    }

    const [updatedStep] = await db
      .update(steps)
      .set(updateData)
      .where(eq(steps.id, id))
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
        s.id === id ? status === 'completed' : s.status === 'completed'
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the step and verify ownership
    const step = await db.query.steps.findFirst({
      where: eq(steps.id, id),
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

    // Delete the step
    await db.delete(steps).where(eq(steps.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting step:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete step' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}