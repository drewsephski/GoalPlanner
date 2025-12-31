'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  CheckCircle2, 
  Circle,
  ArrowRight 
} from 'lucide-react';

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    slug: string;
    status: string;
    createdAt: Date;
    deadline: string | null;
    steps: Array<{
      id: string;
      status: string;
    }>;
  };
}

export function GoalCard({ goal }: GoalCardProps) {
  const totalSteps = goal.steps.length;
  const completedSteps = goal.steps.filter(s => s.status === 'completed').length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  const nextStep = goal.steps.find(s => s.status === 'pending' || s.status === 'in_progress');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-chart-1';
      case 'completed': return 'bg-chart-2';
      case 'paused': return 'bg-chart-4';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'paused': return 'Paused';
      case 'abandoned': return 'Abandoned';
      default: return status;
    }
  };

  return (
    <Link href={`/goals/${goal.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <Badge variant="outline" className={getStatusColor(goal.status)}>
              {getStatusText(goal.status)}
            </Badge>
            {goal.deadline && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(goal.deadline).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            )}
          </div>
          <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
            {goal.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {completedSteps}/{totalSteps} steps
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round(progressPercent)}% complete
            </p>
          </div>

          {/* Next Step */}
          {nextStep && goal.status === 'active' && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Next step:</p>
              <div className="flex items-start gap-2">
                <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm line-clamp-2 flex-1">
                  Step {goal.steps.indexOf(nextStep) + 1}
                </p>
              </div>
            </div>
          )}

          {/* Completed Badge */}
          {goal.status === 'completed' && (
            <div className="pt-4 border-t flex items-center gap-2 text-chart-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Goal Completed! 🎉</span>
            </div>
          )}

          {/* View Details */}
          <div className="flex items-center text-sm text-primary group-hover:gap-2 transition-all">
            <span>View details</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}