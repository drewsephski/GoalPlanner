import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Sparkles } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  description: string;
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-chart-2/10 border-primary/20">
      <CardContent className="pt-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mb-4">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{feature}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
        <Link href="/pricing">
          <Button className="bg-gradient-to-r from-primary to-chart-2">
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
