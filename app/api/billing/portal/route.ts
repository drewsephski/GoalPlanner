import { auth } from '@clerk/nextjs/server';
import { getUserSubscription } from '@/lib/polar/subscription';

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

    const subscription = await getUserSubscription(userId);

    if (!subscription || !subscription.polarCustomerId) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Polar provides a portal URL for customers to manage their subscription
    const portalUrl = `https://polar.sh/customer/${subscription.polarCustomerId}`;

    return new Response(
      JSON.stringify({ portalUrl }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting portal URL:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get portal URL' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
