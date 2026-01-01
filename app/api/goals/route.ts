import { db } from '@/lib/db';
import { goals, steps, users } from '@/lib/db/schema';
import { generateGoalPlan } from '@/lib/ai/goal-planner';
import { extractStepsFromPlan } from '@/lib/ai/step-extractor';
import { generateSlug } from '@/lib/utils/slug';
import { canCreateGoal } from '@/lib/polar/subscription';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

// Helper function to create or get anonymous user
async function getOrCreateAnonymousUser(): Promise<string> {
  const cookieStore = await cookies();
  const anonymousUserId = cookieStore.get('anonymous_user_id')?.value;

  if (anonymousUserId) {
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, anonymousUserId),
    });
    
    if (existingUser) {
      return anonymousUserId;
    }
  }

  // Create new anonymous user
  const newUserId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const anonymousUsername = `user_${Date.now()}`;

  await db.insert(users).values({
    id: newUserId,
    email: `${newUserId}@anonymous.local`,
    username: anonymousUsername,
    firstName: 'Anonymous',
    lastName: 'User',
  });

  // Also create user stats
  const { userStats } = await import('@/lib/db/schema');
  await db.insert(userStats).values({ userId: newUserId });

  return newUserId;
}

export async function POST(req: Request) {
  try {
    // Check for authenticated user first
    let userId = null;
    try {
      const { auth } = await import('@clerk/nextjs/server');
      const authData = await auth();
      userId = authData.userId;
    } catch {
      // Clerk auth failed, continue with anonymous flow
      console.log('Authentication not available, using anonymous flow');
    }

    // If no authenticated user, create or get anonymous user
    if (!userId) {
      const anonymousUserId = await getOrCreateAnonymousUser();
      userId = anonymousUserId;
    }

    // Check subscription limits
    const canCreate = await canCreateGoal(userId);

    if (!canCreate.allowed) {
      return new Response(
        JSON.stringify({ 
          error: canCreate.reason,
          upgrade: true,
          currentCount: canCreate.currentCount,
          limit: canCreate.limit,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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
    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate username if not set
    if (!user.username) {
      const { currentUser } = await import('@clerk/nextjs/server');
      const clerkUser = await currentUser();
      
      let generatedUsername = null;
      
      // Try to get username from Clerk first
      if (clerkUser?.username) {
        generatedUsername = clerkUser.username;
      } else {
        // Generate a username from email if no username exists
        const email = clerkUser?.emailAddresses[0]?.emailAddress || user.email;
        generatedUsername = email.split('@')[0] + '_' + userId.slice(-8);
      }

      // Update user with generated username
      await db
        .update(users)
        .set({ 
          username: generatedUsername,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Refetch user with updated username
      user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
    }

    if (!user?.username) {
      return new Response(JSON.stringify({ error: 'Failed to generate username' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // User is now guaranteed to have a username
    const userWithUsername = user!;

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
        username: userWithUsername.username,
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
    // Check for authenticated user first
    let userId = null;
    try {
      const { auth } = await import('@clerk/nextjs/server');
      const authData = await auth();
      userId = authData.userId;
    } catch {
      // Clerk auth failed, continue with anonymous flow
      console.log('Authentication not available, using anonymous flow');
    }

    // If no authenticated user, create or get anonymous user
    if (!userId) {
      const anonymousUserId = await getOrCreateAnonymousUser();
      userId = anonymousUserId;
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