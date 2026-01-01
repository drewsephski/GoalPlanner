import { auth, currentUser } from '@clerk/nextjs/server';
import { Polar } from '@polar-sh/sdk';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    // Validate environment variables first
    const requiredEnvVars = [
      'POLAR_ACCESS_TOKEN',
      'POLAR_PRODUCT_ID_MONTHLY',
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      return new Response(JSON.stringify({ 
        error: `Server configuration error. Missing: ${missingVars.join(', ')}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    // Log configuration for debugging (remove sensitive data)
    console.log('Polar checkout config:', {
      server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      hasAccessToken: !!process.env.POLAR_ACCESS_TOKEN,
      productId: productId,
      userId: userId,
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
        name: error.name,
      });
      
      // Check for specific Polar API errors
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return new Response(
          JSON.stringify({ error: 'Polar API authentication failed - check POLAR_ACCESS_TOKEN' }), 
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (error.message.includes('404') || error.message.includes('not found')) {
        return new Response(
          JSON.stringify({ error: 'Polar product not found - check POLAR_PRODUCT_ID_MONTHLY' }), 
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
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
