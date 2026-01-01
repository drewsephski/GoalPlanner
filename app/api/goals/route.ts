import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { goals, steps, users } from '@/lib/db/schema';
import { generateGoalPlan } from '@/lib/ai/goal-planner';
import { extractStepsFromPlan } from '@/lib/ai/step-extractor';
import { generateSlug } from '@/lib/utils/slug';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { title, why, deadline, timeCommitment, biggestConcern } = body;

    // Validate required fields
    if (!title?.trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user info for username
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.username) {
      return new Response(JSON.stringify({ error: 'User not found or username not set' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate AI plan with full context
    const aiPlan = await generateGoalPlan({
      title: title.trim(),
      why: why?.trim() || '',
      deadline: deadline || '',
      timeCommitment: timeCommitment?.trim() || '',
      biggestConcern: biggestConcern?.trim() || '',
    });

    // Generate unique slug for public URL
    const slug = await generateSlug(title, userId);

    // Create goal in database
    const [newGoal] = await db
      .insert(goals)
      .values({
        userId,
        title: title.trim(),
        slug,
        why: why?.trim() || null,
        deadline: deadline || null,
        timeCommitment: timeCommitment?.trim() || null,
        biggestConcern: biggestConcern?.trim() || null,
        aiPlan,
        status: 'active',
        visibility: 'private',
      })
      .returning();

    // Extract and save steps from AI plan
    const extractedSteps = extractStepsFromPlan(aiPlan);
    
    if (extractedSteps.length > 0) {
      await db.insert(steps).values(
        extractedSteps.map((step, index) => ({
          goalId: newGoal.id,
          orderNum: index + 1,
          title: step.title,
          description: step.description || null,
          dueDate: step.dueDate || null,
          status: 'pending',
        }))
      );
    }

    return new Response(
      JSON.stringify({ 
        goalId: newGoal.id,
        slug: newGoal.slug,
        username: user.username,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating goal:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create goal' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userGoals = await db.query.goals.findMany({
      where: (goals, { eq }) => eq(goals.userId, userId),
      orderBy: (goals, { desc }) => [desc(goals.createdAt)],
      with: {
        steps: {
          orderBy: (steps, { asc }) => [asc(steps.orderNum)],
        },
      },
    });

    return new Response(JSON.stringify({ goals: userGoals }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch goals' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}