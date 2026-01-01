import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserSubscription } from '@/lib/polar/subscription';
import { PricingCards } from '@/components/pricing/PricingCards';

export const metadata = {
  title: 'Pricing - Goal Planner Pro',
  description: 'Choose the plan that works for you',
};

export default async function PricingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const subscription = await getUserSubscription(userId);

  return <PricingCards currentSubscription={subscription} />;
}
