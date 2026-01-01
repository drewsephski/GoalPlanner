import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { POLAR_CONFIG } from '@/lib/polar/client';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    
    // Validate webhook signature using Polar SDK (optional for now)
    try {
      if (POLAR_CONFIG.webhookSecret) {
        const event = validateEvent(
          body,
          Object.fromEntries(req.headers.entries()),
          POLAR_CONFIG.webhookSecret
        );
        
        console.log('Polar webhook event:', event.type);

        switch (event.type) {
          case 'subscription.created':
          case 'subscription.updated':
            await handleSubscriptionUpdate(event.data);
            break;

          case 'subscription.canceled':
            await handleSubscriptionCancellation(event.data);
            break;

          case 'subscription.revoked':
            await handleSubscriptionRevoked(event.data);
            break;

          default:
            console.log('Unhandled event type:', event.type);
        }
      } else {
        // Skip webhook verification for now
        const event = JSON.parse(body);
        console.log('Polar webhook event (no verification):', event.type);

        switch (event.type) {
          case 'subscription.created':
          case 'subscription.updated':
            await handleSubscriptionUpdate(event.data);
            break;

          case 'subscription.canceled':
            await handleSubscriptionCancellation(event.data);
            break;

          case 'subscription.revoked':
            await handleSubscriptionRevoked(event.data);
            break;

          default:
            console.log('Unhandled event type:', event.type);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        console.error('Webhook signature verification failed:', error);
        return new Response('Invalid signature', { status: 403 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

interface SubscriptionData {
  id: string;
  status: string;
  customer_id?: string;
  product_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  metadata?: {
    userId?: string;
  };
  customer_metadata?: {
    userId?: string;
  };
}

async function handleSubscriptionUpdate(data: SubscriptionData) {
  const userId = data.metadata?.userId || data.customer_metadata?.userId;

  if (!userId) {
    console.error('No userId in subscription data');
    return;
  }

  const subscriptionData = {
    id: data.id,
    userId: userId,
    status: data.status,
    tier: 'pro',
    polarCustomerId: data.customer_id,
    polarSubscriptionId: data.id,
    polarProductId: data.product_id,
    currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : null,
    currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
    cancelAtPeriodEnd: data.cancel_at_period_end || false,
    updatedAt: new Date(),
  };

  // Upsert subscription
  await db
    .insert(subscriptions)
    .values(subscriptionData)
    .onConflictDoUpdate({
      target: subscriptions.id,
      set: subscriptionData,
    });

  console.log(`Subscription updated for user ${userId}`);
}

async function handleSubscriptionCancellation(data: SubscriptionData) {
  await db
    .update(subscriptions)
    .set({
      cancelAtPeriodEnd: true,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, data.id));

  console.log(`Subscription canceled: ${data.id}`);
}

async function handleSubscriptionRevoked(data: SubscriptionData) {
  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, data.id));

  console.log(`Subscription revoked: ${data.id}`);
}
