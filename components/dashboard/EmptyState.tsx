import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Target, Sparkles } from 'lucide-react';

export function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full">
          <Target className="h-12 w-12 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">No Goals Yet</h2>
          <p className="text-muted-foreground">
            Ready to turn your ambitions into achievements? Create your first goal and let AI help you build an action plan.
          </p>
        </div>

        <Link href="/planner">
          <Button size="lg" className="bg-gradient-to-r from-primary to-chart-2">
            <Sparkles className="mr-2 h-5 w-5" />
            Create Your First Goal
          </Button>
        </Link>
      </div>
    </Card>
  );
}