import { ImageResponse } from '@vercel/og';
import { db } from '@/lib/db';
import { goals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get('goalId');
    const type = searchParams.get('type') || 'progress'; // progress, completion, milestone

    if (!goalId) {
      return new Response('Missing goalId', { status: 400 });
    }

    // Fetch goal data
    const goal = await db.query.goals.findFirst({
      where: eq(goals.id, goalId),
      with: {
        steps: true,
        user: {
          columns: {
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    if (!goal) {
      return new Response('Goal not found', { status: 404 });
    }

    const totalSteps = goal.steps.length;
    const completedSteps = goal.steps.filter(s => s.status === 'completed').length;
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    const userName = goal.user.firstName || goal.user.username || 'Someone';

    // Calculate days into journey
    const daysSinceStart = Math.floor(
      (new Date().getTime() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Generate image based on type
    let title = '';
    let subtitle = '';
    let emoji = '🎯';

    if (type === 'completion') {
      title = 'Goal Completed! 🎉';
      subtitle = goal.title;
      emoji = '🏆';
    } else if (type === 'milestone') {
      title = `${progressPercent}% Complete!`;
      subtitle = goal.title;
      emoji = '🚀';
    } else {
      title = goal.title;
      subtitle = `${completedSteps}/${totalSteps} steps completed • Day ${daysSinceStart}`;
      emoji = '🎯';
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#09090b',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #27272a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #27272a 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            padding: '60px',
          }}
        >
          {/* Main Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#18181b',
              borderRadius: '24px',
              padding: '60px',
              width: '1000px',
              border: '2px solid #27272a',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Emoji */}
            <div
              style={{
                fontSize: '120px',
                marginBottom: '20px',
              }}
            >
              {emoji}
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: '#fafafa',
                textAlign: 'center',
                marginBottom: '16px',
                maxWidth: '800px',
                lineHeight: '1.2',
              }}
            >
              {title}
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: '32px',
                color: '#a1a1aa',
                textAlign: 'center',
                marginBottom: '40px',
                maxWidth: '800px',
              }}
            >
              {subtitle}
            </div>

            {/* Progress Bar */}
            {type !== 'completion' && (
              <div
                style={{
                  width: '600px',
                  height: '16px',
                  backgroundColor: '#27272a',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  marginBottom: '40px',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)',
                    borderRadius: '999px',
                    display: 'flex',
                  }}
                />
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '24px',
                color: '#71717a',
              }}
            >
              <span>{userName}&apos;s journey</span>
              <span>•</span>
              <span>Goal Planner Pro</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating card:', error);
    return new Response('Error generating image', { status: 500 });
  }
}