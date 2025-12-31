'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  Heart,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Share2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StepItem } from './StepItem';

interface Goal {
  id: string;
  title: string;
  slug: string;
  why: string | null;
  deadline: string | null;
  timeCommitment: string | null;
  biggestConcern: string | null;
  aiPlan: any;
  status: string;
  createdAt: Date;
  steps: Array<{
    id: string;
    orderNum: number;
    title: string;
    description: string | null;
    dueDate: string | null;
    status: string;
    completedAt: Date | null;
  }>;
}

interface GoalDetailProps {
  goal: Goal;
}

export function GoalDetail({ goal }: GoalDetailProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const totalSteps = goal.steps.length;
  const completedSteps = goal.steps.filter(s => s.status === 'completed').length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const handleStepToggle = async (stepId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update step');

      router.refresh();
    } catch (error) {
      console.error('Error updating step:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update goal');

      router.refresh();
    } catch (error) {
      console.error('Error updating goal:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this goal? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete goal');

      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Back Button */}
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">
                    {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                  </Badge>
                  {goal.deadline && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <CardTitle className="text-3xl mb-2">{goal.title}</CardTitle>
                {goal.why && (
                  <CardDescription className="text-base flex items-start gap-2 mt-3">
                    <Heart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{goal.why}</span>
                  </CardDescription>
                )}
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/${goal.slug}`)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    View Public Page
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {goal.status === 'active' && (
                    <DropdownMenuItem onClick={() => handleStatusChange('paused')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Goal
                    </DropdownMenuItem>
                  )}
                  {goal.status === 'paused' && (
                    <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                      <Play className="h-4 w-4 mr-2" />
                      Resume Goal
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Goal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Progress */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">
                  {completedSteps}/{totalSteps} steps completed
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
              {goal.timeCommitment && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time Commitment</p>
                    <p className="text-sm font-medium">{goal.timeCommitment}</p>
                  </div>
                </div>
              )}
              {goal.biggestConcern && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Main Concern</p>
                    <p className="text-sm font-medium line-clamp-2">{goal.biggestConcern}</p>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Steps Checklist */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Action Steps</CardTitle>
            <CardDescription>
              Check off steps as you complete them
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isUpdating && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <div className="space-y-3">
              {goal.steps.map((step, index) => (
                <StepItem
                  key={step.id}
                  step={step}
                  stepNumber={index + 1}
                  onToggle={() => handleStepToggle(step.id, step.status)}
                  disabled={isUpdating}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Plan */}
        {goal.aiPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Your Personalized Plan</CardTitle>
              <CardDescription>
                Generated based on your context and goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Overview */}
              {goal.aiPlan.overview && (
                <div className="mb-6 p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm leading-relaxed">{goal.aiPlan.overview}</p>
                </div>
              )}

              {/* Timeline */}
              {goal.aiPlan.timeline && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </h3>
                  <p className="text-sm text-muted-foreground">{goal.aiPlan.timeline}</p>
                </div>
              )}

              {/* Tips */}
              {goal.aiPlan.tips && goal.aiPlan.tips.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Tips for Success</h3>
                  <ul className="space-y-2">
                    {goal.aiPlan.tips.map((tip: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}