'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check,
  Loader2,
  Sparkles,
  Crown
} from 'lucide-react';

interface PricingCardsProps {
  currentSubscription?: {
    tier?: string;
    status?: string;
  } | null;
}

const FREE_FEATURES = [
  '3 active goals',
  'Basic AI planning',
  'Public goal pages',
  'Weekly check-ins',
  'Community features',
  'Basic progress tracking',
];

const PRO_FEATURES = [
  'Unlimited active goals',
  'Daily AI check-ins',
  'Advanced AI coach with deeper context',
  'Priority AI responses',
  'Custom goal templates',
  'Advanced analytics & insights',
  'Export data (PDF & CSV)',
  'Remove branding from shares',
  'Priority support',
  'Early access to new features',
];

export function PricingCards({ currentSubscription }: PricingCardsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const isPro = currentSubscription?.tier === 'pro' && currentSubscription?.status === 'active';

  const handleSubscribe = async () => {
    setIsLoading('subscribe');

    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType: 'monthly' }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Checkout API error:', data);
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Polar checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout. Please try again.';
      alert(errorMessage);
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading('manage');

    try {
      const response = await fetch('/api/billing/portal');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open portal');
      }

      window.location.href = data.portalUrl;
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Failed to open billing portal. Please try again.');
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Start free, upgrade when you&apos;re ready to supercharge your goals
          </p>

        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Free
              </CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {FREE_FEATURES.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-chart-1 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                disabled
              >
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-primary shadow-lg pt-8">
            <div className="absolute top-0 left-0 right-0 flex justify-center">
              <Badge className="bg-gradient-to-r from-primary to-chart-2 text-primary-foreground border-0 px-6 py-1">
                <Crown className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Crown className="w-6 h-6 text-primary" />
                Pro
              </CardTitle>
              <CardDescription>For serious goal achievers</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$9</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {PRO_FEATURES.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isPro ? (
                <Button
                  onClick={handleManageSubscription}
                  disabled={isLoading === 'manage'}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading === 'manage' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Manage Subscription'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSubscribe}
                  disabled={isLoading !== null}
                  className="w-full bg-gradient-to-r from-primary to-chart-2"
                >
                  {isLoading === 'subscribe' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can cancel your Pro subscription at any time. You&apos;ll continue to have Pro access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens to my goals if I downgrade?</h3>
              <p className="text-muted-foreground">
                Your goals are never deleted. If you have more than 3 active goals, you&apos;ll need to pause some to create new ones, but all your data remains accessible.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-muted-foreground">
                We offer a 14-day money-back guarantee. If you&apos;re not satisfied, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
