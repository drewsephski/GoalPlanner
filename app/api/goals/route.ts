import { db } from '@/lib/db';
import { goals, steps, users } from '@/lib/db/schema';
import { generateGoalPlan } from '@/lib/ai/goal-planner';
import { extractStepsFromPlan } from '@/lib/ai/step-extractor';
import { generateSlug } from '@/lib/utils/slug';
import { canCreateGoal } from '@/lib/polar/subscription';
import { eq } from 'drizzle-orm';

// Helper function to create or get anonymous user
async function getOrCreateAnonymousUser(): Promise<string> {
  // For now, create a new anonymous user each time
  // In a production environment, you'd want to use cookies or session storage
  const newUserId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const anonymousUsername = `user_${Date.now()}`;

  try {
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

    console.log('Created anonymous user:', newUserId);
    return newUserId;
  } catch (error) {
    console.error('Error creating anonymous user:', error);
    throw new Error('Failed to create anonymous user');
  }
}

export async function POST(req: Request) {
  try {
    console.log('Goal creation request received');
    
    // Check for authenticated user first
    let userId = null;
    let isAnonymous = false;
    
    try {
      const { auth } = await import('@clerk/nextjs/server');
      const authData = await auth();
      userId = authData.userId;
      console.log('Authenticated user ID:', userId);
    } catch (error) {
      console.log('Clerk auth not available, using anonymous flow:', error);
    }

    // If no authenticated user, create or get anonymous user
    if (!userId) {
      isAnonymous = true;
      try {
        const anonymousUserId = await getOrCreateAnonymousUser();
        userId = anonymousUserId;
        console.log('Created anonymous user:', userId);
      } catch (error) {
        console.error('Failed to create anonymous user:', error);
        return new Response(JSON.stringify({ error: 'Failed to create user session' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
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

    // Generate username if not set (only for authenticated users)
    if (!user.username && !isAnonymous) {
      try {
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
      } catch (error) {
        console.error('Error generating username for authenticated user:', error);
        // Continue without username - anonymous users already have one
      }
    }

    // Anonymous users should already have a username from creation
    if (!user?.username) {
      return new Response(JSON.stringify({ error: 'Failed to generate username' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // User is now guaranteed to have a username
    const userWithUsername = user!;

    // Generate AI plan with full context
    console.log('Generating AI plan for goal:', title);
    const aiPlan = await generateGoalPlan({
      title: title.trim(),
      why: why?.trim() || '',
      deadline: deadline || '',
      timeCommitment: timeCommitment?.trim() || '',
      biggestConcern: biggestConcern?.trim() || '',
    });

    // Generate unique slug for public URL
    console.log('Generating slug for goal');
    const slug = await generateSlug(title, userId);

    // Create goal in database
    console.log('Creating goal in database');
    let newGoal;
    try {
      [newGoal] = await db
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
    } catch (error) {
      console.error('Error creating goal in database:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save goal to database' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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