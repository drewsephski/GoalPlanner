import { auth, currentUser } from '@clerk/nextjs/server';
import { Polar } from '@polar-sh/sdk';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { userId } = session;
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { priceType } = body; // Only 'monthly' now

    if (!priceType || priceType !== 'monthly') {
      return new Response(JSON.stringify({ error: 'Invalid price type - only monthly available' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Product ID for monthly subscription
    const productId = process.env.POLAR_PRODUCT_ID_MONTHLY;

    if (!productId) {
      return new Response(JSON.stringify({ error: 'Monthly product ID not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user from database
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!dbUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Polar SDK
    const polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
      server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    });

    // Create Polar checkout session - ONLY these parameters
    const checkout = await polar.checkouts.create({
      customerName: dbUser.username || clerkUser.fullName || dbUser.email || 'Customer',
      customerBillingAddress: {
        country: 'US', // Required - adjust based on your needs
      },
      products: [productId],
      // Optional: add metadata
      customerMetadata: {
        userId: userId,
        email: dbUser.email,
      },
    });

    return new Response(
      JSON.stringify({ 
        checkoutUrl: checkout.url, 
        checkoutId: checkout.id 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating checkout:', error);
    
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      
      return new Response(
        JSON.stringify({ error: error.message }), 
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
