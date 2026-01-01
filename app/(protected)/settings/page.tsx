import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SettingsForm } from '@/components/settings/SettingsForm';

export const metadata = {
  title: 'Settings - Goal Planner Pro',
  description: 'Manage your account settings',
};

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    redirect('/sign-in');
  }

  return <SettingsForm user={user} />;
}