import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, userStats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;

    // Create user in database
    await db.insert(users).values({
      id,
      email: email_addresses[0]?.email_address || '',
      username: username || null,
      firstName: first_name || null,
      lastName: last_name || null,
      imageUrl: image_url || null,
    });

    // Initialize user stats
    await db.insert(userStats).values({
      userId: id,
    });

    console.log(`✅ User created: ${id}`);
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;

    await db
      .update(users)
      .set({
        email: email_addresses[0]?.email_address || '',
        username: username || null,
        firstName: first_name || null,
        lastName: last_name || null,
        imageUrl: image_url || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    console.log(`✅ User updated: ${id}`);
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    if (id) {
      await db.delete(users).where(eq(users.id, id));
      console.log(`✅ User deleted: ${id}`);
    }
  }

  return new Response('Webhook processed', { status: 200 });
}